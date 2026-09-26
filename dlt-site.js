(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 600 evenly spaced points on land (lat, lon pairs), sampled from Natural Earth 1:110m: they draw the continents.
  const LAND = [82.4,-64.9,81.3,-12.4,79.8,-44.9,78.4,-77.3,77.7,-24.8,76.5,-57.3,75.5,-89.7,74.9,-37.2,74.7,100.3,72.5,-49.6,72.4,87.9,71.9,140.4,71.7,-82.1,71.6,55.5,71.2,-29.5,71.1,108,70.9,-114.5,70.3,75.5,70.2,-147,69.9,128,69.7,-94.5,69.3,-41.9,69,-126.9,68.9,10.6,68.6,-74.4,68.3,-159.4,68.2,-21.9,67.9,-106.9,67.5,-54.3,67.2,-139.3,67.1,-1.8,66.8,-86.8,66.5,-34.3,66.2,-119.3,65.8,-66.7,65.6,-151.7,65.5,-14.2,65.2,-99.2,65.1,38.3,64.9,-46.7,64.7,90.8,64.6,-131.7,64.4,143.4,64.2,58.4,63.8,110.9,63.7,-111.6,63.6,25.9,63.5,163.4,63.2,78.4,63.1,-144.1,62.9,131,62.7,46,62.3,98.5,62.2,-124,62.1,13.5,62,151,61.8,66,61.7,-156.5,61.5,118.6,61.4,-103.9,61.3,33.6,61.2,171.1,61,86.1,60.9,-136.4,60.6,138.6,60.4,53.6,60.1,106.2,60,-116.3,59.6,73.7,59.3,126.2,59.2,-96.3,59.1,41.2,58.8,93.8,58.7,-128.7,58.6,8.8,58.4,-76.2,58.3,61.3,58.1,113.8,58,-108.7,57.9,28.8,57.6,81.4,57.4,-3.6,57.3,133.9,57.1,48.9,56.8,101.4,56.7,-121.1,56.5,-68.5,56.4,69,56.1,121.5,56,-101,55.9,36.5,55.6,89,55.2,56.6,54.9,109.1,54.8,-113.4,54.8,24.1,54.6,-60.9,54.5,76.6,54.3,-8.4,54.2,129.2,54.1,-93.3,54.1,44.2,53.8,96.7,53.7,-125.8,53.6,11.7,53.5,-73.3,53.4,64.2,53.1,116.8,53,-105.7,53,31.8,52.7,84.3,52.5,-0.7,52.5,136.8,52.4,-85.7,52.3,51.8,52,104.4,52,-118.1,51.9,19.4,51.8,156.9,51.7,-65.6,51.6,71.9,51.4,124.4,51.3,-98.1,51.2,39.4,51,92,50.8,7,50.7,-78,50.6,59.5,50.3,112,50.3,-110.5,50.2,27,49.9,79.6,49.7,132.1,49.6,-90.4,49.5,47.1,49.3,99.6,49.2,-122.9,49.2,14.6,49,-70.3,48.9,67.2,48.7,119.7,48.6,-102.8,48.5,34.7,48.3,87.2,48.2,2.2,48,-82.7,47.9,54.8,47.7,107.3,47.6,-115.2,47.6,22.3,47.3,74.8,47.1,127.3,47,-95.1,47,42.4,46.7,94.9,46.6,9.9,46.4,-75.1,46.4,62.4,46.1,114.9,46.1,-107.5,46,30,45.8,82.5,45.6,135,45.5,-87.5,45.2,102.5,45.1,-119.9,45.1,17.6,44.9,-67.4,44.8,70.1,44.6,122.6,44.6,-99.9,44.3,90.1,44.1,5.2,44.1,142.7,44,-79.8,43.9,57.7,43.7,110.2,43.6,-112.3,43.6,25.2,43.4,77.7,43.2,-7.2,43.2,130.3,43.1,-92.2,43,45.3,42.8,97.8,42.7,12.8,42.5,-72.2,42.5,65.3,42.3,117.9,42.2,-104.6,41.9,85.4,41.8,0.4,41.6,-84.6,41.4,105.5,41.3,-117,41.2,20.5,41,73,40.8,125.5,40.8,-97,40.7,40.6,40.5,93.1,40.2,-76.9,40.2,60.6,40,113.1,39.9,-109.4,39.8,28.2,39.6,80.7,39.5,-4.3,39.4,-89.3,39.3,48.2,39.1,100.7,39,-121.8,38.8,68.3,38.5,-101.7,38.5,35.8,38.3,88.3,38.1,140.9,38,-81.6,37.9,55.9,37.8,108.4,37.7,-114.1,37.4,75.9,37.2,128.5,37.2,-94,37.1,43.5,36.9,96,36.6,63.5,36.4,116.1,36.4,-106.4,36.1,83.6,35.9,136.1,35.8,-86.4,35.8,51.1,35.6,103.7,35.5,-118.8,35.3,71.2,35,-98.8,35,38.7,34.8,91.3,34.7,6.3,34.5,-78.7,34.5,58.8,34.3,111.3,34.2,-111.2,34,78.9,33.9,-6.1,33.7,-91.1,33.7,46.4,33.5,98.9,33.2,66.5,33,119,33,-103.5,32.7,86.5,32.6,1.5,32.5,-83.4,32.4,54.1,32.2,106.6,32.2,-115.9,32.1,21.6,31.9,74.1,31.7,-95.8,31.6,41.7,31.5,94.2,31.3,9.2,31.2,61.7,31,114.3,30.9,-108.2,30.9,29.3,30.7,81.8,30.6,-3.2,30.5,-88.2,30.4,49.3,30.2,101.9,30.1,16.9,29.9,69.4,29.8,121.9,29.7,-100.6,29.6,36.9,29.5,89.5,29.3,4.5,29.2,57,29,109.5,28.9,24.5,28.7,77.1,28.6,-7.9,28.4,44.6,28.2,97.1,28.1,12.1,28,64.7,27.8,117.2,27.7,-105.3,27.7,32.2,27.5,84.7,27.4,-0.3,27,104.8,26.9,19.8,26.8,72.3,26.6,-12.7,26.5,-97.6,26.5,39.9,26.3,92.4,26.2,7.4,26,59.9,25.9,112.4,25.7,27.5,25.6,80,25.5,-5,25.3,47.5,25.1,100,25,15.1,24.8,67.6,24.6,-102.4,24.6,35.1,24.4,87.6,24.3,2.7,24.1,55.2,23.9,107.7,23.8,22.7,23.7,75.2,23.6,-9.7,23.4,42.8,23.2,95.3,23.1,10.3,22.8,115.4,22.7,30.4,22.5,82.9,22.4,-2.1,22.2,50.5,22.1,103,22,18,21.8,70.5,21.7,-14.5,21.6,-99.5,21.3,5.6,21.1,58.1,20.8,25.7,20.7,78.2,20.6,-6.8,20.4,45.7,20.2,98.2,20.1,13.3,19.7,-104.2,19.7,33.3,19.4,0.9,19.3,53.4,19,20.9,18.8,73.4,18.7,-11.5,18.6,-96.5,18.3,8.5,18.2,-76.5,17.9,28.6,17.7,81.1,17.6,-3.9,17.5,-88.9,17.4,48.6,17.3,101.2,17.2,16.2,16.9,-16.3,16.9,121.2,16.7,36.2,16.5,3.8,16.1,23.8,15.9,76.4,15.8,-8.6,15.6,43.9,15.4,11.4,15,31.5,14.7,-1,14.6,-85.9,14.4,104.1,14.3,19.1,14,-13.4,13.9,39.2,13.6,6.7,13.2,26.8,13,79.3,12.9,-5.7,12.6,99.4,12.5,14.4,12.1,34.4,11.8,2,11.5,107,11.4,22,11.2,-10.4,11,42.1,10.7,9.6,10.6,-75.3,10.3,29.7,10.1,-2.8,9.9,49.8,9.7,17.3,9.6,-67.7,9.2,37.4,9,4.9,8.9,-80.1,8.6,25,8.5,-60,8.4,77.5,8.3,-7.5,8.2,45,7.9,12.6,7.8,-72.4,7.5,32.6,7.2,0.2,6.8,20.2,6.7,-64.8,6.5,125.3,6.4,40.3,6.2,7.8,6.1,-77.2,5.8,27.9,5.7,-57.1,5.5,-4.6,5.4,48,5.2,100.5,5.1,15.5,5,-69.5,4.7,35.6,4,23.2,3.9,-61.8,3.6,43.2,3.4,10.8,3.3,-74.2,3.1,115.8,3,30.8,2.9,-54.2,2.4,103.4,2.3,18.4,2.2,-66.6,1.9,38.5,1.3,111.1,1.2,26.1,1.1,-58.9,0.6,13.7,0.5,-71.3,0.2,33.7,0.1,-51.2,-0.5,21.3,-0.6,-63.6,-0.9,41.4,-1.1,8.9,-1.2,-76,-1.4,114,-1.5,29,-1.6,-56,-1.9,134.1,-2.1,101.6,-2.2,16.6,-2.3,-68.4,-2.5,121.7,-2.6,36.7,-2.7,-48.3,-2.9,141.7,-3.3,24.3,-3.4,-60.7,-3.8,-40.7,-3.9,11.9,-4,-73.1,-4.3,31.9,-4.4,-53.1,-4.6,137,-4.9,104.5,-5,19.5,-5.1,-65.5,-5.5,-45.4,-5.7,144.6,-5.8,-77.8,-6.1,27.2,-6.2,-57.8,-6.6,-37.7,-6.7,14.8,-6.8,-70.2,-7.1,34.9,-7.2,-50.1,-7.5,139.9,-7.8,22.5,-7.9,-62.5,-8.3,-42.5,-8.5,147.6,-8.6,-74.9,-8.9,30.1,-9,-54.9,-9.6,17.7,-9.7,-67.3,-10,37.8,-10.1,-47.2,-10.6,25.4,-10.7,-59.6,-11.2,-39.5,-11.4,-72,-11.7,33.1,-11.8,-51.9,-12.4,20.7,-12.5,-64.3,-12.9,-44.3,-13.5,28.3,-13.6,-56.7,-13.8,133.4,-13.9,48.4,-14.2,15.9,-14.3,-69.1,-14.6,36,-14.7,-49,-15.3,23.6,-15.4,-61.4,-15.6,128.6,-15.8,-41.3,-16.1,-73.8,-16.2,-158.8,-16.2,-21.3,-16.3,-106.3,-16.4,31.2,-16.4,168.8,-16.5,-53.7,-16.5,83.8,-16.6,-1.2,-16.7,136.3,-17.1,18.8,-17.2,-66.1,-17.4,123.9,-17.6,-46.1,-17.8,144,-18.2,26.5,-18.3,-58.5,-18.5,131.6,-18.6,46.6,-18.9,14.1,-19.3,34.2,-19.4,-50.8,-19.6,139.2,-20,21.8,-20.1,-63.2,-20.3,126.8,-20.6,-43.2,-20.8,146.9,-21.1,29.4,-21.3,-55.6,-21.5,134.5,-21.9,17,-22,-68,-22.2,122.1,-22.4,-47.9,-22.6,142.1,-23,24.7,-23.1,-60.3,-23.3,129.7,-23.5,44.8,-23.8,149.8,-24.1,117.3,-24.2,32.4,-24.3,-52.6,-24.5,137.4,-24.9,20,-25,-65,-25.2,125,-25.7,145.1,-26.1,27.6,-26.2,-57.4,-26.4,132.7,-26.8,15.2,-26.9,152.7,-26.9,-69.8,-27.2,120.3,-27.4,-49.7,-27.6,140.3,-28,22.9,-28.1,-62.1,-28.4,127.9,-28.8,148,-29.1,115.5,-29.2,30.6,-29.3,-54.4,-29.6,135.6,-30,18.2,-30.1,-66.8,-30.3,123.2,-30.8,143.3,-31.2,25.8,-31.3,-59.2,-32.1,150.9,-32.4,118.5,-32.8,138.5,-33.3,21.1,-33.4,-63.9,-34.1,146.2,-34.7,-56.2,-35.5,-68.6,-35.9,173.9,-36.2,141.5,-36.8,-61,-37.6,149.1,-37.6,-73.4,-39,-65.7,-39.4,176.8,-41.2,-70.5,-41.7,172.1,-45.1,-67.5,-47.6,-72.3,-51.9,-69.3];

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
        [37.6, 127], [14.6, 121], [-36.8, 174.8],
        [34.05, -118.24], [47.6, -122.3], [49.28, -123.12], [32.78, -96.8], [29.76, -95.37], [25.76, -80.19], [33.75, -84.39], [38.9, -77.04],
        [42.36, -71.06], [45.5, -73.57], [39.74, -104.99], [33.45, -112.07], [23.11, -82.37], [8.98, -79.52], [10.48, -66.9], [-0.18, -78.47],
        [-22.9, -43.17], [-15.8, -47.88], [-34.9, -56.16], [64.15, -21.94], [53.35, -6.26], [38.72, -9.14], [52.37, 4.9], [50.85, 4.35],
        [47.38, 8.54], [45.46, 9.19], [41.9, 12.5], [52.52, 13.4], [48.21, 16.37], [52.23, 21.01], [50.08, 14.44], [37.98, 23.73],
        [50.45, 30.52], [60.17, 24.94], [59.91, 10.75], [55.68, 12.57], [33.57, -7.59], [36.75, 3.06], [36.8, 10.18], [5.6, -0.19],
        [14.72, -17.47], [9.03, 38.74], [-4.44, 15.27], [-8.84, 13.23], [-33.92, 18.42], [-6.79, 39.21], [24.71, 46.68], [32.09, 34.78],
        [35.69, 51.39], [24.86, 67.0], [31.55, 74.34], [12.97, 77.59], [13.08, 80.27], [22.57, 88.36], [23.81, 90.41], [3.14, 101.69],
        [10.82, 106.63], [21.03, 105.85], [31.23, 121.47], [39.9, 116.4], [22.54, 114.06], [25.03, 121.57], [34.69, 135.5], [-37.81, 144.96],
        [-31.95, 115.86], [21.31, -157.86], [61.22, -149.9]
      ].forEach(([lat, lon]) => {
        const phi = (90 - lat) * Math.PI / 180;
        const theta = (lon + 180) * Math.PI / 180;
        this.nodes.push({ x: -Math.sin(phi) * Math.cos(theta), y: -Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) });   // north up (canvas y grows downward)
      });
      this.land = [];
      for (let i = 0; i < LAND.length; i += 2) {
        const phi = (90 - LAND[i]) * Math.PI / 180, theta = (LAND[i + 1] + 180) * Math.PI / 180;
        this.land.push({ x: -Math.sin(phi) * Math.cos(theta), y: -Math.cos(phi), z: Math.sin(phi) * Math.sin(theta) });
      }
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
      const u = (k * 45 + p * 22.5) * D + (reduceMotion ? 0 : now * Math.abs(this.speed) * 5);
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
      const bow = (a, b) => {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = mx - cx, dy = my - cy, d = Math.hypot(dx, dy) || 1;
        const lift = Math.hypot(a.x - b.x, a.y - b.y) * .22;
        return { x: mx + dx / d * lift, y: my + dy / d * lift };
      };
      const edge = (a, b, alpha) => {
        if (alpha <= 0 || a.occ || b.occ) return;
        const w = a.back || b.back ? alpha * .3 : alpha;
        links.push([a, b]);
        ctx.strokeStyle = `rgba(${W},${w * .34})`; ctx.lineWidth = 1;
        const q = bow(a.sp, b.sp);
        ctx.beginPath(); ctx.moveTo(a.sp.x, a.sp.y); ctx.quadraticCurveTo(q.x, q.y, b.sp.x, b.sp.y); ctx.stroke();
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
        if (g.z < .02 || s.occ || drawn >= 30) return;
        drawn += 1;
        ctx.strokeStyle = `rgba(${L},.6)`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(s.sp.x, s.sp.y); ctx.stroke();
      });

      // 4. a relay pulse every ~56 s: city -> satellite -> hops across the mesh -> satellite -> city
      const slot = Math.floor(now / 56000), phase = (now % 56000) / 56000;
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
          const last = pts.length - 1, ctrl = (i) => (i === 0 || i === last - 1 ? null : bow(pts[i], pts[i + 1]));
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 0; i < last; i += 1) { const c = ctrl(i); if (c) ctx.quadraticCurveTo(c.x, c.y, pts[i + 1].x, pts[i + 1].y); else ctx.lineTo(pts[i + 1].x, pts[i + 1].y); }
          ctx.stroke();
          const f = Math.min(.999, phase / .55) * last, i = Math.floor(f), t = f - i, c = ctrl(i), A = pts[i], B = pts[i + 1];
          const hx = c ? (1 - t) ** 2 * A.x + 2 * (1 - t) * t * c.x + t * t * B.x : A.x + (B.x - A.x) * t;
          const hy = c ? (1 - t) ** 2 * A.y + 2 * (1 - t) * t * c.y + t * t * B.y : A.y + (B.y - A.y) * t;
          ctx.fillStyle = '#ffffff'; ctx.fillRect(hx - 2.5, hy - 2.5, 5, 5);
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
            this.cam = now * .00000875 + Math.sin(now * .000011) * .35;   // circling, with a gentle swing: a curved path, not a flat circle
            this.camPitch = Math.sin(now * .00001375) * .34 + Math.sin(now * .0000063) * .08;
            radius *= 1 + Math.sin(now * .000015) * .03;
            this.tilt = this.baseTilt + this.camPitch;
          }
          this.stars.forEach((st) => {
            const a = reduceMotion ? .35 : .18 + (Math.sin(now * .0001875 + st.tw) + 1) * .22;
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
          ctx.fillStyle = `rgba(199,255,46,${this.land.length ? .04 + depth * .16 : .12 + depth * .78})`;   // with a land layer, the ocean recedes
          const size = .65 + depth * 1.4;
          ctx.fillRect(p.x, p.y, size, size);
        });

        // the continents: land points, brighter toward the viewer
        this.land.forEach((pt) => {
          const q = this.project(pt, this.rotation, radius * 1.005);
          if (q.z < 0) return;
          ctx.fillStyle = `rgba(199,255,46,${.45 + q.z * .55})`;
          ctx.fillRect(q.x - 1.3, q.y - 1.3, 2.6, 2.6);
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
      speed: canvas.dataset.globe === 'intro' ? .0003 : canvas.dataset.globe === 'identity' ? -.00005625 : .00018,
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
