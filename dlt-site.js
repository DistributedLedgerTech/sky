(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  class AcidGlobe {
    constructor(canvas, options = {}) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.speed = options.speed || 0.00022;
      this.rotation = options.rotation || 0;
      this.points = [];
      this.nodes = [];
      this.frame = 0;
      this.last = performance.now();
      this.visible = true;
      this.createPoints(options.points || 900);
      this.satellites = options.satellites ? [
        // seven satellites on higher orbits, out in the dark space: inclination, ascending node, phase, speed (rad/ms), altitude
        { inc: .92, node: .2, phase: 0, w: .00084, alt: 1.34 },
        { inc: -.55, node: 1.4, phase: 2.1, w: .00072, alt: 1.4 },
        { inc: 1.25, node: 2.6, phase: 4.0, w: .00064, alt: 1.3 },
        { inc: .3, node: 4.1, phase: 1.2, w: .00078, alt: 1.37 },
        { inc: -1.1, node: 3.3, phase: 5.2, w: .0007, alt: 1.33 },
        { inc: .6, node: 5.4, phase: 3.3, w: .00088, alt: 1.42 },
        { inc: -.2, node: .9, phase: .6, w: .00068, alt: 1.28 },
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
        [1.3, 103.8], [22.3, 114.2], [-23.5, -46.6], [-33.9, 151.2]
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
      const z = point.x * sin + point.z * cos;
      return { x: this.width / 2 + x * radius, y: this.height / 2 + point.y * radius, z };
    }

    // A satellite's position on its orbit, in the fixed sky frame (the globe spins beneath it).
    satPosition(sat, now, alt = sat.alt) {
      const u = sat.phase + (reduceMotion ? 0 : now * sat.w);
      const ox = Math.cos(u), oz = Math.sin(u);
      const y = oz * Math.sin(sat.inc), zi = oz * Math.cos(sat.inc);
      return { x: (ox * Math.cos(sat.node) - zi * Math.sin(sat.node)) * alt, y, z: (ox * Math.sin(sat.node) + zi * Math.cos(sat.node)) * alt, u };
    }

    drawSatellites(ctx, now, radius) {
      const W = '255,255,255', L = '199,255,46';
      const cx = this.width / 2, cy = this.height / 2;
      const proj = (v) => this.project(v, 0, radius);
      const rot = (n) => { const c = Math.cos(this.rotation), s = Math.sin(this.rotation); return { x: n.x * c - n.z * s, y: n.y, z: n.x * s + n.z * c }; };
      const len = (v) => Math.hypot(v.x, v.y, v.z);
      const cosAngle = (a, b) => (a.x * b.x + a.y * b.y + a.z * b.z) / (len(a) * len(b));
      const hidden = (v, p) => v.z < 0 && Math.hypot(p.x - cx, p.y - cy) < radius;   // behind the planet
      const sats = this.satellites.map((sat, i) => { const w = this.satPosition(sat, now); const p = proj(w); return { sat, i, w, p, hidden: hidden(w, p) }; });

      // 1. trajectory: a curved dashed trail behind each satellite, fading along its orbit
      ctx.save(); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2;
      sats.forEach(({ sat, w }) => {
        const steps = 26, sweep = 1.5;   // radians of orbit shown behind the satellite
        let prev = null;
        for (let k = 0; k <= steps; k += 1) {
          const v = this.satPosition({ ...sat, phase: w.u - (k / steps) * sweep, w: 0 }, 0);
          const p = proj(v);
          if (prev && !hidden(v, p)) {
            ctx.strokeStyle = `rgba(${W},${(1 - k / steps) * .55})`;
            ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); ctx.stroke();
          }
          prev = p;
        }
      });
      ctx.restore();

      // 2. inter-satellite links: fast, intermittent bursts on arcs that bow outward around the planet
      const burst = (i, j) => { const period = 900 + ((i * 7 + j * 13) % 5) * 260; const t = (now + i * 311 + j * 173) % period; return reduceMotion ? .6 : t < period * .42 ? 1 - t / (period * .42) : 0; };
      for (let i = 0; i < sats.length; i += 1) for (let j = i + 1; j < sats.length; j += 1) {
        const a = sats[i], b = sats[j];
        if (a.hidden || b.hidden || cosAngle(a.w, b.w) < .05) continue;
        const on = burst(i, j);
        if (!on) continue;
        const mx = (a.p.x + b.p.x) / 2, my = (a.p.y + b.p.y) / 2;
        const dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const lift = radius * .55 + Math.hypot(a.p.x - b.p.x, a.p.y - b.p.y) * .18;   // push the arc out, around the globe
        const qx = cx + dx / d * (d + lift), qy = cy + dy / d * (d + lift);
        ctx.save(); ctx.setLineDash([2, 3]); ctx.lineWidth = 1.1; ctx.strokeStyle = `rgba(${W},${.2 + on * .6})`;
        ctx.beginPath(); ctx.moveTo(a.p.x, a.p.y); ctx.quadraticCurveTo(qx, qy, b.p.x, b.p.y); ctx.stroke(); ctx.restore();
        for (let n = 0; n < 3; n += 1) {   // packets racing along the arc
          const t = reduceMotion ? .3 + n * .2 : ((now * .0022) + n / 3 + i * .13 + j * .07) % 1;
          const x = (1 - t) * (1 - t) * a.p.x + 2 * (1 - t) * t * qx + t * t * b.p.x;
          const y = (1 - t) * (1 - t) * a.p.y + 2 * (1 - t) * t * qy + t * t * b.p.y;
          ctx.fillStyle = `rgba(${W},${.5 + on * .5})`; ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
      }

      // 3. ground links, a different pattern: a straight dotted beam straight down, a slow packet, a lime ping on the node
      sats.forEach(({ w, p, hidden: h }, si) => {
        if (h) return;
        this.nodes.forEach((node, ni) => {
          const n = rot(node);
          if (n.z < .05 || cosAngle(n, w) < .7) return;
          const g = this.project(node, this.rotation, radius * 1.01);
          ctx.save(); ctx.setLineDash([1, 5]); ctx.lineCap = 'round'; ctx.lineWidth = 1.6; ctx.strokeStyle = `rgba(${W},.6)`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(g.x, g.y); ctx.stroke(); ctx.restore();
          const t = reduceMotion ? .5 : ((now * .0006) + si * .21 + ni * .37) % 1;
          ctx.fillStyle = `rgb(${W})`; ctx.fillRect(p.x + (g.x - p.x) * t - 1.5, p.y + (g.y - p.y) * t - 1.5, 3, 3);
          const ping = reduceMotion ? .5 : ((now * .0012) + ni * .3) % 1;
          ctx.strokeStyle = `rgba(${L},${1 - ping})`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(g.x, g.y, 3 + ping * 12, 0, Math.PI * 2); ctx.stroke();
        });
      });

      // 4. the satellites: a white body with two solar panels
      sats.forEach(({ p, w, hidden: h }) => {
        if (h) return;
        const a = w.z < 0 ? .5 : 1;
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
      speed: canvas.dataset.globe === 'intro' ? .0003 : .00018,
      rotation: canvas.dataset.globe === 'identity' ? 1.1 : 0,
      satellites: canvas.dataset.globe === 'identity'
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
