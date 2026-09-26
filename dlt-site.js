(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class AcidGlobe {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.speed = options.speed || 0.00022;
      this.rotation = options.rotation || 0;
      this.tilt = options.tilt || 0;
      this.baseTilt = this.tilt;
      this.cinematic = !!options.satellites;
      this.stars = this.cinematic ? Array.from({ length: 140 }, (_, i) => ({ x: ((i * 7919) % 997) / 997, y: ((i * 104729) % 991) / 991, r: .4 + ((i * 31) % 10) / 12, tw: (i * 2.39) % 6.28 })) : [];
      this.points = [];
      this.nodes = [];
      this.frame = 0;
      this.last = performance.now();
      this.visible = true;
      this.createPoints(options.points || 900);
      this.satellites = options.satellites ? [
        // seven stationary satellites on two rings that cross like an X (ring, angle on the ring in radians)
        { ring: 0, u: .35 }, { ring: 0, u: 1.3 }, { ring: 0, u: 2.4 }, { ring: 0, u: 4.3 },
        { ring: 1, u: .9 }, { ring: 1, u: 2.0 }, { ring: 1, u: 3.6 },
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

    // Two stationary rings crossing like an X in front of the viewer; the planet spins beneath.
    // A point on ring `k` at angle `u`, in view space (x right, y down, z toward the viewer).
    ringPoint(k, u, alt = 1.36) {
      const a = k ? -.62 : .62;                       // each ring's slant, as seen on screen
      const x = Math.cos(u) * alt, z = Math.sin(u) * alt;
      const open = k ? -.34 : .34;                    // tip each ring toward the viewer so it curves into an ellipse
      return { x: x * Math.cos(a) - z * open * Math.sin(a), y: x * Math.sin(a) + z * open * Math.cos(a), z: z * Math.sqrt(1 - open * open) };
    }

    drawSatellites(ctx, now, radius) {
      const W = '255,255,255', L = '199,255,46';
      const cx = this.width / 2, cy = this.height / 2;
      const scr = (v) => ({ x: cx + v.x * radius, y: cy + v.y * radius, z: v.z });
      const hidden = (v) => v.z < 0 && Math.hypot(v.x, v.y) < 1;          // behind the planet
      const view = (node) => { const p = this.project(node, this.rotation, 1); return { x: p.x - cx, y: p.y - cy, z: p.z }; };
      const len = (v) => Math.hypot(v.x, v.y, v.z);
      const cosAngle = (a, b) => (a.x * b.x + a.y * b.y + a.z * b.z) / (len(a) * len(b));
      const sats = this.satellites.map((sat, i) => { const v = this.ringPoint(sat.ring, sat.u); return { sat, i, v, p: scr(v), hidden: hidden(v), front: v.z >= 0 }; });

      // 1. the two rings: dashed, bright in front, faded behind, forming the X
      ctx.save(); ctx.setLineDash([5, 5]); ctx.lineWidth = 1.1;
      for (const k of [0, 1]) {
        let prev = null;
        for (let n = 0; n <= 120; n += 1) {
          const v = this.ringPoint(k, n / 120 * Math.PI * 2), p = scr(v);
          if (prev && !hidden(v)) { ctx.strokeStyle = `rgba(${W},${v.z >= 0 ? .4 : .1})`; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke(); }
          prev = p;
        }
      }
      ctx.restore();

      // 2. crosslinks: along each ring to the next satellite, and across the X where the rings meet;
      //    fast intermittent bursts on arcs bowed outward, packets racing along them
      const links = [];
      for (const a of sats) for (const b of sats) {
        if (b.i <= a.i || a.hidden || b.hidden) continue;
        const sameRing = a.sat.ring === b.sat.ring;
        const d = Math.abs(a.sat.u - b.sat.u) % (Math.PI * 2);
        if ((sameRing && Math.min(d, Math.PI * 2 - d) < 1.8) || (!sameRing && Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) < radius * .9)) links.push([a, b]);
      }
      links.forEach(([a, b]) => {
        const period = 650 + ((a.i * 7 + b.i * 13) % 5) * 210, t0 = (now + a.i * 311 + b.i * 173) % period;
        const on = reduceMotion ? .6 : t0 < period * .45 ? 1 - t0 / (period * .45) : 0;
        if (!on) return;
        const mx = (a.p.x + b.p.x) / 2, my = (a.p.y + b.p.y) / 2, dx = mx - cx, dy = my - cy, dd = Math.hypot(dx, dy) || 1;
        const lift = radius * .18 + Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) * .2;
        const qx = cx + dx / dd * (dd + lift), qy = cy + dy / dd * (dd + lift);
        ctx.save(); ctx.setLineDash([2, 3]); ctx.lineWidth = 1.1; ctx.strokeStyle = `rgba(${W},${.2 + on * .6})`;
        ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 6 * on;
        ctx.beginPath(); ctx.moveTo(a.p.x, a.p.y); ctx.quadraticCurveTo(qx, qy, b.p.x, b.p.y); ctx.stroke(); ctx.restore();
        const at = (t) => ({ x: (1 - t) ** 2 * a.p.x + 2 * (1 - t) * t * qx + t * t * b.p.x, y: (1 - t) ** 2 * a.p.y + 2 * (1 - t) * t * qy + t * t * b.p.y });
        for (let n = 0; n < 3; n += 1) {   // comets: a bright head and a fading tail
          const t = reduceMotion ? .3 + n * .2 : ((now * .0026) + n / 3 + a.i * .13 + b.i * .07) % 1;
          for (let k = 5; k >= 0; k -= 1) {
            const q = at(Math.max(0, t - k * .018)), size = k ? 2.2 - k * .3 : 3.2;
            ctx.fillStyle = `rgba(${W},${(.5 + on * .5) * (1 - k / 6)})`; ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
          }
        }
      });

      // 3. ground links to the cities passing beneath each satellite: dotted beam, slow packet, lime ping
      sats.forEach(({ v, p, front }, si) => {
        if (!front) return;
        this.nodes.forEach((node, ni) => {
          const n = view(node);
          if (n.z < .05 || cosAngle(n, v) < .82) return;
          const s = this.project(node, this.rotation, radius * 1.01);
          ctx.save(); ctx.setLineDash([1, 5]); ctx.lineCap = 'round'; ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(${W},.6)`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.restore();
          const t = reduceMotion ? .5 : ((now * .0006) + si * .21 + ni * .37) % 1;
          ctx.fillStyle = `rgb(${W})`; ctx.fillRect(p.x + (s.x - p.x) * t - 1.5, p.y + (s.y - p.y) * t - 1.5, 3, 3);
          const ping = reduceMotion ? .5 : ((now * .0012) + ni * .3) % 1;
          ctx.save(); ctx.shadowColor = 'rgba(199,255,46,.9)'; ctx.shadowBlur = 8;
          ctx.strokeStyle = `rgba(${L},${1 - ping})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(s.x, s.y, 3 + ping * 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        });
      });

      // 4. the satellites: white body and two solar panels, dim on the far side
      sats.forEach(({ p, front, hidden: h }) => {
        if (h) return;
        const a = front ? 1 : .45;
        ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.95)'; ctx.shadowBlur = front ? 12 : 4;
        ctx.fillStyle = `rgba(${W},${a})`; ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5); ctx.restore();
        ctx.fillStyle = `rgba(${W},${a * .75})`; ctx.fillRect(p.x - 11, p.y - 1.5, 6, 3); ctx.fillRect(p.x + 5, p.y - 1.5, 6, 3);
      });
    }

    draw(now) {
      if (this.visible) {
        const elapsed = Math.min(40, now - this.last);
        if (!reduceMotion) this.rotation += elapsed * this.speed;
        const ctx = this.context;
        let radius = Math.min(this.width, this.height) * .36;
        ctx.clearRect(0, 0, this.width, this.height);
        if (this.cinematic) {
          // a slow camera: the view breathes in and out and the tilt sways
          if (!reduceMotion) { radius *= 1 + Math.sin(now * .00012) * .03; this.tilt = this.baseTilt + Math.sin(now * .00009) * .08; }
          this.stars.forEach((st) => {
            const a = reduceMotion ? .35 : .18 + (Math.sin(now * .0015 + st.tw) + 1) * .22;
            ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fillRect(st.x * this.width, st.y * this.height, st.r, st.r);
          });
          // atmosphere: a soft lime glow hugging the planet's edge
          const cxg = this.width / 2, cyg = this.height / 2;
          const glow = ctx.createRadialGradient(cxg, cyg, radius * .92, cxg, cyg, radius * 1.22);
          glow.addColorStop(0, 'rgba(199,255,46,.16)'); glow.addColorStop(1, 'rgba(199,255,46,0)');
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cxg, cyg, radius * 1.22, 0, Math.PI * 2); ctx.fill();
        }

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
