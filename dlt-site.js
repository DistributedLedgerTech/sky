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
      this.cam = 0;       // camera orbit angle around the scene (cinematic mode)
      this.camPitch = 0;  // the camera's rise and dip along its curved path
      this.cinematic = !!options.satellites;
      this.stars = this.cinematic ? Array.from({ length: 140 }, (_, i) => ({ x: ((i * 7919) % 997) / 997, y: ((i * 104729) % 991) / 991, r: .4 + ((i * 31) % 10) / 12, tw: (i * 2.39) % 6.28 })) : [];
      this.points = [];
      this.nodes = [];
      this.frame = 0;
      this.last = performance.now();
      this.visible = true;
      this.createPoints(options.points || 900);
      this.satellites = options.satellites ? [true] : [];   // Polar Star 48 + GEO (see drawSatellites)
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
      const cos = Math.cos(angle + this.cam);
      const sin = Math.sin(angle + this.cam);
      const x = point.x * cos - point.z * sin;
      const z0 = point.x * sin + point.z * cos;
      const ct = Math.cos(this.tilt), st = Math.sin(this.tilt);
      const y = point.y * ct - z0 * st, z = point.y * st + z0 * ct;
      return { x: this.width / 2 + x * radius, y: this.height / 2 + y * radius, z };
    }

    // ── Polar Star 48 + GEO: an Iridium-pattern Walker star (6 near-polar planes x 8, 86.4 deg,
    // RAAN 31.6 deg apart, Walker F=3) in inertial space with the Earth spinning beneath it, plus
    // three geostationary satellites locked to the Earth. Altitudes compressed on a log scale
    // (LEO 780 km -> 1.16 R, GEO 35,786 km -> 1.45 R); motion sped up (LEO laps 5x the spin).
    leoPosition(p, k, now) {
      const D = Math.PI / 180, inc = 86.4 * D, raan = p * 31.6 * D;
      const u = (k * 45 + p * 22.5) * D + (reduceMotion ? 0 : now * this.speed * 5);
      const x0 = Math.cos(u), y0 = Math.sin(u) * Math.sin(inc), z0 = Math.sin(u) * Math.cos(inc);
      const v = { x: x0 * Math.cos(raan) - z0 * Math.sin(raan), y: y0, z: x0 * Math.sin(raan) + z0 * Math.cos(raan) };
      return { unit: v, lat: Math.asin(y0) / D, pos: { x: v.x * 1.16, y: v.y * 1.16, z: v.z * 1.16 } };
    }

    drawSatellites(ctx, now, radius) {
      const W = '255,255,255', L = '199,255,46', D = Math.PI / 180;
      const cx = this.width / 2, cy = this.height / 2;
      const spin = (n) => { const c = Math.cos(this.rotation), s = Math.sin(this.rotation); return { x: n.x * c - n.z * s, y: n.y, z: n.x * s + n.z * c }; };
      const inert = (v) => this.project(v, 0, radius);            // sky-fixed things
      const earth = (v) => this.project(v, this.rotation, radius);  // Earth-fixed things
      const occluded = (p) => p.z < 0 && Math.hypot(p.x - cx, p.y - cy) < radius;
      const central = (a, b) => Math.acos(Math.max(-1, Math.min(1, a.x * b.x + a.y * b.y + a.z * b.z))) / D;

      // satellites
      const sats = [];
      for (let p = 0; p < 6; p += 1) for (let k = 0; k < 8; k += 1) {
        const s = this.leoPosition(p, k, now); const sp = inert(s.pos);
        sats.push({ p, k, ...s, sp, occ: occluded(sp), back: sp.z < 0 });
      }
      const at = (p, k) => sats[p * 8 + ((k % 8) + 8) % 8];

      // 1. the six orbital planes, faint, so the polar star reads (the seam shows where 0 and 5 run antiparallel)
      ctx.lineWidth = 1;
      for (let p = 0; p < 6; p += 1) {
        let prev = null;
        for (let n = 0; n <= 72; n += 1) {
          const D2 = Math.PI / 180, inc = 86.4 * D2, raan = p * 31.6 * D2, u = n / 72 * Math.PI * 2;
          const x0 = Math.cos(u), y0 = Math.sin(u) * Math.sin(inc), z0 = Math.sin(u) * Math.cos(inc);
          const q = inert({ x: (x0 * Math.cos(raan) - z0 * Math.sin(raan)) * 1.16, y: y0 * 1.16, z: (x0 * Math.sin(raan) + z0 * Math.cos(raan)) * 1.16 });
          if (prev && !occluded(q)) { ctx.strokeStyle = `rgba(${W},${q.z >= 0 ? .08 : .03})`; ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          prev = q;
        }
      }

      // 2. the laser mesh: in-plane fore/aft (permanent) and cross-plane left/right (0-1 ... 4-5; never
      //    across the seam 5-0), cross links fading out between 68 and 72 deg latitude at the poles
      const links = [];
      const edge = (a, b, alpha) => {
        if (alpha <= 0 || a.occ || b.occ) return;
        const w = a.back || b.back ? alpha * .3 : alpha;
        links.push([a, b]);
        ctx.strokeStyle = `rgba(${W},${w * .34})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.sp.x, a.sp.y); ctx.lineTo(b.sp.x, b.sp.y); ctx.stroke();
      };
      const polar = (lat) => Math.max(0, Math.min(1, (72 - Math.abs(lat)) / 4));
      for (const s of sats) {
        edge(s, at(s.p, s.k + 1), 1);
        if (s.p < 5) { const t = at(s.p + 1, s.k); edge(s, t, Math.min(polar(s.lat), polar(t.lat))); }
      }

      // 3. ground links: each city holds one link to the highest satellite in its sky (real geometry:
      //    780 km with an 8.2 deg mask sees 18.5 deg of Earth-central angle), with handover hysteresis
      this.linkOf = this.linkOf || new Map();
      let drawn = 0;
      const cityLinks = new Map();
      this.nodes.forEach((node, ci) => {
        const cu = spin(node);
        let best = -1, bestA = 99;
        sats.forEach((s, si) => { const a = central(cu, s.unit); if (a < bestA) { bestA = a; best = si; } });
        let cur = this.linkOf.get(ci);
        const curA = cur !== undefined ? central(cu, sats[cur].unit) : 99;
        if (cur === undefined || curA > 18.5 || bestA < curA - 5) { cur = bestA <= 18.5 ? best : undefined; if (cur === undefined) this.linkOf.delete(ci); else this.linkOf.set(ci, cur); }
        if (cur === undefined) return;
        cityLinks.set(ci, cur);
        const g = earth({ x: node.x * 1.01, y: node.y * 1.01, z: node.z * 1.01 }), s = sats[cur];
        if (g.z < .02 || s.occ || drawn >= 20) return;
        drawn += 1;
        ctx.strokeStyle = `rgba(${L},.6)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(s.sp.x, s.sp.y); ctx.stroke();
      });

      // 4. a relay pulse every ~28 s: city -> satellite -> hops across the mesh -> satellite -> city
      const slot = Math.floor(now / 28000), phase = (now % 28000) / 28000;
      if (!reduceMotion && phase < .55 && cityLinks.size > 1) {
        if (this.route?.slot !== slot) {
          const cities = [...cityLinks.keys()], a = cities[(slot * 7) % cities.length], b = cities[(slot * 13 + 5) % cities.length];
          const adj = new Map(); links.forEach(([x, y]) => { const i = sats.indexOf(x), j = sats.indexOf(y); (adj.get(i) || adj.set(i, []).get(i)).push(j); (adj.get(j) || adj.set(j, []).get(j)).push(i); });
          const start = cityLinks.get(a), goal = cityLinks.get(b), prev = new Map([[start, -1]]), queue = [start];
          while (queue.length && !prev.has(goal)) { const n = queue.shift(); for (const m of adj.get(n) || []) if (!prev.has(m)) { prev.set(m, n); queue.push(m); } }
          const path = []; if (prev.has(goal)) for (let n = goal; n !== -1; n = prev.get(n)) path.unshift(n);
          this.route = { slot, a, b, path };
        }
        const r = this.route;
        if (r.path.length && r.a !== r.b) {
          const pts = [earth(this.nodes[r.a]), ...r.path.map((i) => sats[i].sp), earth(this.nodes[r.b])];
          ctx.save(); ctx.shadowColor = 'rgba(199,255,46,.9)'; ctx.shadowBlur = 8; ctx.strokeStyle = `rgba(${L},.85)`; ctx.lineWidth = 1.6;
          ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.stroke();
          const f = Math.min(.999, phase / .55) * (pts.length - 1), i = Math.floor(f), t = f - i;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(pts[i].x + (pts[i + 1].x - pts[i].x) * t - 2.5, pts[i].y + (pts[i + 1].y - pts[i].y) * t - 2.5, 5, 5);
          ctx.restore();
        }
      }

      // 5. the geostationary ring: three satellites locked to the Earth's spin over 100 W, 20 E and 140 E
      let prevG = null;
      ctx.lineWidth = .6;
      for (let n = 0; n <= 96; n += 1) {
        const a = n / 96 * Math.PI * 2, q = earth({ x: -Math.cos(a) * 1.45, y: 0, z: Math.sin(a) * 1.45 });
        if (prevG && !occluded(q)) { ctx.strokeStyle = `rgba(${W},${q.z >= 0 ? .1 : .04})`; ctx.beginPath(); ctx.moveTo(prevG.x, prevG.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        prevG = q;
      }
      const geo = [-100, 20, 140].map((lon) => { const th = (lon + 180) * D; return earth({ x: -Math.cos(th) * 1.45, y: 0, z: Math.sin(th) * 1.45 }); });

      // 6. the satellites: white body and panels; far-side ones smaller and dimmer; hidden behind the planet
      const craft = (q, big) => {
        if (occluded(q)) return;
        const back = q.z < 0, a = back ? .4 : 1, s = back ? .65 : 1, b = (big ? 5 : 3) * s, w = (big ? 7 : 5) * s;
        ctx.save(); ctx.shadowColor = 'rgba(255,255,255,.95)'; ctx.shadowBlur = back ? 0 : big ? 12 : 6;
        ctx.fillStyle = `rgba(${W},${a})`; ctx.fillRect(q.x - b / 2, q.y - b / 2, b, b); ctx.restore();
        ctx.fillStyle = `rgba(${W},${a * .7})`; ctx.fillRect(q.x - b / 2 - w - 1, q.y - s, w, 2 * s); ctx.fillRect(q.x + b / 2 + 1, q.y - s, w, 2 * s);
      };
      sats.forEach((s) => craft(s.sp, false));
      geo.forEach((q) => craft(q, true));
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
          if (!reduceMotion) {
            // a camera that orbits the scene on a curved path: it circles slowly while rising and dipping
            this.cam = now * .0000175;
            this.camPitch = Math.sin(now * .0000275) * .22;
            radius *= 1 + Math.sin(now * .00003) * .03;
            this.tilt = this.baseTilt + this.camPitch;
          }
          this.stars.forEach((st) => {
            const a = reduceMotion ? .35 : .18 + (Math.sin(now * .000375 + st.tw) + 1) * .22;
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
      speed: canvas.dataset.globe === 'intro' ? .0003 : canvas.dataset.globe === 'identity' ? .0001125 : .00018,
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
