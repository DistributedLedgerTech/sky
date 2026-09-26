(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class AcidGlobe {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.speed = options.speed || 0.00022;
      this.rotation = options.rotation || 0;
      this.tilt = options.tilt || 0;
      this.points = [];
      this.nodes = [];
      this.frame = 0;
      this.last = performance.now();
      this.visible = true;
      this.createPoints(options.points || 900);
      this.satellites = options.satellites ? [
        // seven geostationary satellites, evenly spaced over the equator (longitude in radians, altitude)
        { lon: 0.35, alt: 1.36 },
        { lon: 1.248, alt: 1.36 },
        { lon: 2.145, alt: 1.36 },
        { lon: 3.043, alt: 1.36 },
        { lon: 3.94, alt: 1.36 },
        { lon: 4.838, alt: 1.36 },
        { lon: 5.736, alt: 1.36 },
      ] : [];
      this.resize = this.resize.bind(this);
      this.draw = this.draw.bind(this);
      this.observer = new ResizeObserver(this.resize);
      this.observer.observe(canvas);
      this.visibilityObserver = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
      });
      this.visibilityObserver.observe(canvas);
      this.resize();
      this.frame = requestAnimationFrame(this.draw);
    }

    createPoints(count) {
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let index = 0; index < count; index += 1) {
        const y = 1 - (index / (count - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = golden * index;
        this.points.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
      }
      [
        [40.7, -74], [37.8, -122.4], [51.5, -.1], [35.7, 139.7],
        [1.3, 103.8], [22.3, 114.2], [-23.5, -46.6], [-33.9, 151.2],
        [41.9, -87.6], [43.7, -79.4], [19.4, -99.1], [4.7, -74.1], [-12, -77], [-34.6, -58.4], [-33.4, -70.6],
        [6.5, 3.4], [-1.3, 36.8], [-26.2, 28], [30, 31.2], [41, 29], [50.1, 8.7], [48.9, 2.35], [40.4, -3.7],
        [59.3, 18.1], [55.8, 37.6], [25.2, 55.3], [19.1, 72.9], [28.6, 77.2], [13.8, 100.5], [-6.2, 106.8],
        [37.6, 127], [14.6, 121], [-36.8, 174.8]
      ].forEach(([lat, lon]) => {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        this.nodes.push({ x: -Math.sin(phi) * Math.cos(theta), y: Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) });
      });
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.width = Math.max(1, rect.width);
      this.height = Math.max(1, rect.height);
      this.canvas.width = Math.round(this.width * ratio);
      this.canvas.height = Math.round(this.height * ratio);
      this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    project(point, angle, radius) {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = point.x * cos - point.z * sin;
      const z0 = point.x * sin + point.z * cos;
      const ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
      const y = point.y * ct - z0 * st, z = point.y * st + z0 * ct;
      return { x: this.width / 2 + x * radius, y: this.height / 2 + y * radius, z };
    }

    // A geostationary satellite: parked above the equator at a fixed longitude, so it turns
    // with the planet and always serves the same region (globe frame, rotated when drawn).
    satPosition(sat) {
      return { x: Math.cos(sat.lon) * sat.alt, y: 0, z: Math.sin(sat.lon) * sat.alt };
    }

    drawSatellites(ctx, now, radius) {
      const W = '255,255,255', L = '199,255,46';
      const cx = this.width / 2, cy = this.height / 2;
      const rot = (n) => this.project(n, this.rotation, 1);   // z > 0: facing the viewer
      const proj = (v) => this.project(v, this.rotation, radius);
      const len = (v) => Math.hypot(v.x, v.y, v.z);
      const cosAngle = (a, b) => (a.x * b.x + a.y * b.y + a.z * b.z) / (len(a) * len(b));
      const hiddenAt = (v, p) => rot(v).z < 0 && Math.hypot(p.x - cx, p.y - cy) < radius;   // behind the planet
      const sats = this.satellites.map((sat, i) => { const g = this.satPosition(sat); const p = proj(g); return { sat, i, g, p, front: rot(g).z >= 0, hidden: hiddenAt(g, p) }; });

      // 1. the geostationary belt: a dashed ring over the equator, bright in front, faded behind
      const alt = this.satellites[0]?.alt || 1.36;
      ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.1;
      let prev = null;
      for (let k = 0; k <= 96; k += 1) {
        const v = { x: Math.cos(k / 96 * Math.PI * 2) * alt, y: 0, z: Math.sin(k / 96 * Math.PI * 2) * alt };
        const p = proj(v);
        if (prev && !hiddenAt(v, p)) {
          ctx.strokeStyle = `rgba(${W},${rot(v).z >= 0 ? .38 : .1})`;
          ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        prev = p;
      }
      ctx.restore();

      // 2. crosslinks between neighbouring satellites: fast, intermittent bursts on arcs bowed out around the planet
      const burst = (i, j) => { const period = 700 + ((i * 7 + j * 13) % 5) * 220; const t = (now + i * 311 + j * 173) % period; return reduceMotion ? .6 : t < period * .45 ? 1 - t / (period * .45) : 0; };
      for (let i = 0; i < sats.length; i += 1) {
        for (const j of [(i + 1) % sats.length, (i + 2) % sats.length]) {
          const a = sats[i], b = sats[j];
          if (a.hidden || b.hidden || (!a.front && !b.front)) continue;
          const on = burst(i, j);
          if (!on) continue;
          const mx = (a.p.x + b.p.x) / 2, my = (a.p.y + b.p.y) / 2;
          const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
          const lift = radius * .35 + Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) * .22;
          const qx = cx + dx / d * (d + lift), qy = cy + dy / d * (d + lift) - radius * .12;
          ctx.save(); ctx.setLineDash([2, 3]); ctx.lineWidth = 1.1; ctx.strokeStyle = `rgba(${W},${.2 + on * .6})`;
          ctx.beginPath(); ctx.moveTo(a.p.x, a.p.y); ctx.quadraticCurveTo(qx, qy, b.p.x, b.p.y); ctx.stroke(); ctx.restore();
          for (let n = 0; n < 3; n += 1) {
            const t = reduceMotion ? .3 + n * .2 : ((now * .0024) + n / 3 + i * .13 + j * .07) % 1;
            const x = (1 - t) * (1 - t) * a.p.x + 2 * (1 - t) * t * qx + t * t * b.p.x;
            const y = (1 - t) * (1 - t) * a.p.y + 2 * (1 - t) * t * qy + t * t * b.p.y;
            ctx.fillStyle = `rgba(${W},${.5 + on * .5})`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
          }
        }
      }

      // 3. ground links to the cities in each satellite's footprint: dotted beam, slow packet, lime ping
      sats.forEach(({ g, p, front }, si) => {
        if (!front) return;
        this.nodes.forEach((node, ni) => {
          if (rot(node).z < .05 || cosAngle(node, g) < .8) return;
          const s = this.project(node, this.rotation, radius * 1.01);
          ctx.save(); ctx.setLineDash([1, 5]); ctx.lineCap = 'round'; ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(${W},.6)`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.restore();
          const t = reduceMotion ? .5 : ((now * .0006) + si * .21 + ni * .37) % 1;
          ctx.fillStyle = `rgb(${W})`; ctx.fillRect(p.x + (s.x - p.x) * t - 1.5, p.y + (s.y - p.y) * t - 1.5, 3, 3);
          const ping = reduceMotion ? .5 : ((now * .0012) + ni * .3) % 1;
          ctx.strokeStyle = `rgba(${L},${1 - ping})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(s.x, s.y, 3 + ping * 12, 0, Math.PI * 2); ctx.stroke();
        });
      });

      // 4. the satellites: white body and two solar panels, dim on the far side
      sats.forEach(({ p, front, hidden }) => {
        if (hidden) return;
        const a = front ? 1 : .45;
        ctx.fillStyle = `rgba(${W},${a})`; ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
        ctx.fillStyle = `rgba(${W},${a * .75})`; ctx.fillRect(p.x - 11, p.y - 1.5, 6, 3); ctx.fillRect(p.x + 5, p.y - 1.5, 6, 3);
      });
    }

    draw(now) {
      if (this.visible) {
        const elapsed = Math.min(40, now - this.last);
        if (!reduceMotion) this.rotation += elapsed * this.speed;
        const ctx = this.context;
        const radius = Math.min(this.width, this.height) * .36;
        ctx.clearRect(0, 0, this.width, this.height);

        ctx.strokeStyle = 'rgba(199,255,46,.18)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        ctx.stroke();

        this.points.forEach((point) => {
          const p = this.project(point, this.rotation, radius);
          const depth = (p.z + 1) / 2;
          ctx.fillStyle = `rgba(199,255,46,${.12 + depth * .78})`;
          const size = .65 + depth * 1.4;
          ctx.fillRect(p.x, p.y, size, size);
        });

        this.nodes.forEach((node, index) => {
          const p = this.project(node, this.rotation, radius * 1.01);
          if (p.z < -.05) return;
          const pulse = reduceMotion ? 1 : 1 + Math.sin(now * .004 + index) * .35;
          ctx.strokeStyle = 'rgba(199,255,46,.75)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = '#c7ff2e';
          ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
        });
        if (this.satellites.length) this.drawSatellites(ctx, now, radius);
      }
      this.last = now;
      this.frame = requestAnimationFrame(this.draw);
    }
  }

  document.querySelectorAll('[data-globe]').forEach((canvas) => {
    new AcidGlobe(canvas, {
      points: canvas.dataset.globe === 'intro' ? 1150 : 1500,
      speed: canvas.dataset.globe === 'intro' ? .0003 : canvas.dataset.globe === 'identity' ? .00045 : .00018,
      rotation: canvas.dataset.globe === 'identity' ? 1.1 : 0,
      satellites: canvas.dataset.globe === 'identity',
      tilt: canvas.dataset.globe === 'identity' ? -.38 : 0
    });
  });

  const boot = document.querySelector('[data-boot]');
  if (boot) {
    const lines = [...boot.querySelectorAll('[data-boot-line]')];
    const progress = boot.querySelector('[data-boot-progress]');
    const percent = boot.querySelector('[data-boot-percent]');
    const skip = boot.querySelector('[data-boot-skip]');
    const duration = reduceMotion ? 350 : 2850;
    let finished = false;
    let animationFrame;
    const started = performance.now();

    const onKeydown = (event) => {
      if (event.key === 'Enter' || event.key === 'Escape') finish();
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      document.removeEventListener('keydown', onKeydown);
      cancelAnimationFrame(animationFrame);
      lines.forEach((line) => line.classList.add('is-visible'));
      progress.style.width = '100%';
      percent.textContent = '100%';
      boot.classList.add('is-done');
      document.body.classList.remove('boot-locked');
      window.setTimeout(() => boot.setAttribute('hidden', ''), reduceMotion ? 0 : 560);
    };

    const tick = (now) => {
      const ratio = Math.min(1, (now - started) / duration);
      const value = Math.round(ratio * 100);
      progress.style.width = `${value}%`;
      percent.textContent = `${value}%`;
      lines.forEach((line, index) => line.classList.toggle('is-visible', ratio >= index / lines.length));
      if (ratio >= 1) window.setTimeout(finish, reduceMotion ? 0 : 260);
      else animationFrame = requestAnimationFrame(tick);
    };

    skip.addEventListener('click', finish);
    document.addEventListener('keydown', onKeydown);
    animationFrame = requestAnimationFrame(tick);
  } else {
    document.body.classList.remove('boot-locked');
  }

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  const menu = document.querySelector('[data-mobile-menu]');
  if (menu) {
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => menu.removeAttribute('open')));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') menu.removeAttribute('open');
    });
    document.addEventListener('click', (event) => {
      if (menu.open && !menu.contains(event.target)) menu.removeAttribute('open');
    });
  }

  const navLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        if (link.getAttribute('href') === `#${visible.target.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-24% 0px -62% 0px', threshold: [0, .2, .5] });
    sections.forEach((section) => observer.observe(section));
  }
})();
