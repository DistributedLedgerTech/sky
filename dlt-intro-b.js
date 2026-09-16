/* DLT intro, variant B: "Assembly".
   Thousands of lime particles start as screen-wide noise and converge into a
   rotating sphere of land points (world-atlas land-10m). While the terminal
   verifies, lime blocks orbit on a ring and dock onto the globe one by one.
   The last block docks on "System ready", the screen flashes white for two
   frames and the whole thing dissolves into the page.

   Boot hooks driven here: [data-boot-line], [data-boot-progress],
   [data-boot-percent], [data-boot-skip], Enter/Escape, 10 s cap, is-done exit,
   prefers-reduced-motion (static frame, fast finish), WebGL fallback (the 2D
   globe that dlt-site.js draws on [data-globe="intro"]). */
(() => {
  'use strict';

  const boot = document.querySelector('[data-boot-b]');
  if (!boot) return;

  const LAND_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-10m.json';
  const LIME = 0xc7ff2e;
  const INK = 0x0b0b0b;
  const WHITE = 0xffffff;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 720;
  /* ?intro-t=<seconds> freezes the clock at that moment (design review / render proof) */
  const scrub = parseFloat(new URLSearchParams(window.location.search).get('intro-t'));
  const scrubbing = Number.isFinite(scrub);
  const MAP_AT = 1.55;

  /* dlt-site.js found no [data-boot] on this page and released the lock; take it back */
  document.body.classList.add('boot-locked');
  boot.classList.add('is-live');

  const lines = [...boot.querySelectorAll('[data-boot-line]')];
  const progressEl = boot.querySelector('[data-boot-progress]');
  const percentEl = boot.querySelector('[data-boot-percent]');
  const skipEl = boot.querySelector('[data-boot-skip]');
  const flashEl = boot.querySelector('[data-boot-flash]');
  const countEl = boot.querySelector('[data-boot-count]');
  const labelEl = boot.querySelector('[data-boot-label]');
  const glCanvas = boot.querySelector('[data-boot-gl]');
  const flatCanvas = boot.querySelector('[data-globe]');
  const visual = boot.querySelector('.boot-visual');

  const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  };
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const pad2 = (value) => String(value).padStart(2, '0');

  /* docking slots (lat, lon) and the arcs that join them once both ends are docked */
  const SLOTS = [
    [40.7, -74], [37.8, -122.4], [51.5, -0.1], [50.1, 8.7], [35.7, 139.7], [1.3, 103.8],
    [22.3, 114.2], [-23.5, -46.6], [-33.9, 18.4], [25.3, 55.3], [-33.9, 151.2], [19.4, -99.1],
    [6.5, 3.4], [19.1, 72.9], [43.7, -79.4], [-34.6, -58.4]
  ];
  const LINKS = [
    [0, 2], [0, 7], [0, 1], [2, 3], [2, 9], [3, 4], [4, 6], [5, 6], [5, 10], [7, 8],
    [9, 5], [1, 4], [11, 0], [12, 8], [13, 9], [14, 2], [15, 7]
  ];
  const N_BLOCKS = small ? 10 : 16;
  const N_POINTS = small ? 4200 : 10500;
  const RING_R = 1.42;
  const BLOCK = 0.078;
  const SPIN_END = -0.87;
  const ORBIT_SPEED = 0.55;
  const ARC_SEGS = 48;
  const FLIGHT = 0.42;

  const latLonToVec = (lat, lon) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return new THREE.Vector3(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
  };

  /* ---------------------------------------------------------------- scene */
  const createScene = () => {
    if (!glCanvas || !window.THREE) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (error) {
      return null;
    }
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const FOV = 38;
    const DIST = 10;
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
    camera.position.set(0, 0, DIST);
    const halfH = DIST * Math.tan(FOV * Math.PI / 360);

    const center = new THREE.Vector3();
    let radius = 1;

    const tilt = new THREE.Group();
    tilt.rotation.set(0.3, 0, -0.16);
    const spin = new THREE.Group();
    tilt.add(spin);
    scene.add(tilt);
    const ring = new THREE.Group();
    ring.rotation.set(1.12, 0, 0.32);
    scene.add(ring);

    /* particles: position = screen-space noise start, aTargetA = uniform sphere, aTargetB = land */
    const golden = Math.PI * (3 - Math.sqrt(5));
    const start = new Float32Array(N_POINTS * 3);
    const targetA = new Float32Array(N_POINTS * 3);
    const targetB = new Float32Array(N_POINTS * 3);
    const seed = new Float32Array(N_POINTS * 4);
    for (let i = 0; i < N_POINTS; i += 1) {
      start[i * 3] = (Math.random() * 2 - 1) * 1.25;
      start[i * 3 + 1] = (Math.random() * 2 - 1) * 1.25;
      start[i * 3 + 2] = (Math.random() * 2 - 1) * 2.4;
      const y = 1 - (i / (N_POINTS - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      targetA[i * 3] = targetB[i * 3] = Math.cos(theta) * r;
      targetA[i * 3 + 1] = targetB[i * 3 + 1] = y;
      targetA[i * 3 + 2] = targetB[i * 3 + 2] = Math.sin(theta) * r;
      seed[i * 4] = Math.random();
      seed[i * 4 + 1] = Math.random();
      seed[i * 4 + 2] = 1;
      seed[i * 4 + 3] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(start, 3));
    geometry.setAttribute('aTargetA', new THREE.BufferAttribute(targetA, 3));
    geometry.setAttribute('aTargetB', new THREE.BufferAttribute(targetB, 3));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

    const uniforms = {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMapMix: { value: 0 },
      uSpread: { value: 0.55 },
      uHalfW: { value: 1 },
      uHalfH: { value: 1 },
      uRadius: { value: 1 },
      uCenter: { value: new THREE.Vector3() },
      uGlobe: { value: new THREE.Matrix4() },
      uPixelRatio: { value: dpr },
      uSize: { value: small ? 1.15 : 1.35 },
      uDist: { value: DIST },
      uExplode: { value: 0 },
      uFade: { value: 1 },
      uColor: { value: new THREE.Color(LIME) }
    };
    const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
      uniforms,
      vertexShader: `
        attribute vec3 aTargetA;
        attribute vec3 aTargetB;
        attribute vec4 aSeed;
        uniform mat4 uGlobe;
        uniform vec3 uCenter;
        uniform float uTime, uProgress, uMapMix, uSpread, uHalfW, uHalfH, uRadius, uPixelRatio, uSize, uDist, uExplode, uFade;
        varying float vAlpha;
        void main() {
          float delay = aSeed.y * uSpread;
          float raw = (uProgress - delay) / (1.0 - uSpread);
          float e = clamp(raw, 0.0, 1.0);
          e = 1.0 - pow(1.0 - e, 3.0);
          vec3 local = normalize(mix(aTargetA, aTargetB, uMapMix));
          local *= 1.0 + uExplode * (0.5 + aSeed.w * 1.5);
          vec3 target = (uGlobe * vec4(local, 1.0)).xyz;
          float tt = uTime * 0.7 + aSeed.x * 6.2831;
          vec3 origin = vec3(position.x * uHalfW, position.y * uHalfH, position.z);
          origin += vec3(sin(tt * 1.3 + aSeed.w * 9.0), cos(tt * 1.1 + aSeed.x * 7.0), sin(tt * 0.9 + aSeed.w * 3.0)) * 0.14;
          vec3 p = mix(origin, target, e);
          vec3 rel = p - uCenter;
          float ang = sin(e * 3.14159) * 1.35 * (aSeed.x < 0.5 ? -1.0 : 1.0);
          float ca = cos(ang);
          float sa = sin(ang);
          rel = vec3(rel.x * ca - rel.z * sa, rel.y, rel.x * sa + rel.z * ca);
          p = uCenter + rel;
          vec4 mv = viewMatrix * vec4(p, 1.0);
          vec4 mvc = viewMatrix * vec4(uCenter, 1.0);
          float depth = clamp((mv.z - mvc.z) / uRadius, -1.0, 1.0);
          float shade = smoothstep(-0.35, 0.95, depth);
          float sphereA = 0.22 + 0.78 * shade;
          float twinkle = 0.5 + 0.5 * sin(uTime * 2.6 + aSeed.x * 43.0);
          float noiseA = 0.32 + 0.58 * twinkle;
          float land = max(0.0, 1.0 - abs(raw - 1.0) * 5.0);
          float alive = mix(1.0, aSeed.z, uMapMix);
          vAlpha = (mix(noiseA, sphereA, e) + land * 0.9) * alive * uFade;
          float size = mix(1.5 + aSeed.w * 1.8, 1.5 + 1.2 * shade, e) * (1.0 + land * 1.3) * uSize;
          gl_PointSize = size * uPixelRatio * (uDist / -mv.z);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          vec2 d = gl_PointCoord - 0.5;
          float m = 1.0 - smoothstep(0.34, 0.5, max(abs(d.x), abs(d.y)));
          gl_FragColor = vec4(uColor, vAlpha * m);
        }`,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    points.frustumCulled = false;
    scene.add(points);

    /* ink body so the far hemisphere reads as a solid planet once assembled */
    const occluder = new THREE.Mesh(new THREE.SphereGeometry(0.972, 48, 32), new THREE.MeshBasicMaterial({ color: INK }));
    occluder.scale.setScalar(0.001);
    spin.add(occluder);

    /* orbit ring with ticks */
    const ringPts = [];
    for (let i = 0; i <= 128; i += 1) {
      const a = (i / 128) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * RING_R, 0, Math.sin(a) * RING_R));
    }
    const ringLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.55 }));
    ringLine.geometry.setDrawRange(0, 0);
    ring.add(ringLine);
    const tickPts = [];
    for (let i = 0; i < 48; i += 1) {
      const a = (i / 48) * Math.PI * 2;
      const long = i % 4 === 0 ? 0.07 : 0.035;
      tickPts.push(Math.cos(a) * (RING_R - long), 0, Math.sin(a) * (RING_R - long), Math.cos(a) * (RING_R + 0.02), 0, Math.sin(a) * (RING_R + 0.02));
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute('position', new THREE.Float32BufferAttribute(tickPts, 3));
    const tickMat = new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0 });
    ring.add(new THREE.LineSegments(tickGeo, tickMat));

    /* blocks */
    const blockGeo = new THREE.BoxGeometry(1, 1, 1);
    const edgeGeo = new THREE.EdgesGeometry(blockGeo);
    const blockMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(LIME) } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uColor; varying vec3 vN; void main(){ vec3 L = normalize(vec3(0.35, 0.75, 1.0)); float l = 0.42 + 0.58 * max(dot(vN, L), 0.0); gl_FragColor = vec4(uColor * l, 1.0); }',
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1
    });
    const edgeMat = new THREE.LineBasicMaterial({ color: WHITE, transparent: true, opacity: 0.85 });
    const pingGeo = new THREE.RingGeometry(0.84, 1, 32);
    const up = new THREE.Vector3(0, 1, 0);
    const forward = new THREE.Vector3(0, 0, 1);
    const blocks = SLOTS.slice(0, N_BLOCKS).map((slot, i) => {
      const mesh = new THREE.Mesh(blockGeo, blockMat);
      mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
      mesh.visible = false;
      scene.add(mesh);
      const normal = latLonToVec(slot[0], slot[1]);
      const ping = new THREE.Mesh(pingGeo, new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      ping.position.copy(normal).multiplyScalar(1.012);
      ping.quaternion.setFromUnitVectors(forward, normal);
      ping.visible = false;
      spin.add(ping);
      return {
        mesh,
        ping,
        normal,
        slotQ: new THREE.Quaternion().setFromUnitVectors(up, normal),
        angle: (i / N_BLOCKS) * Math.PI * 2,
        axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        from: new THREE.Vector3(),
        fromQ: new THREE.Quaternion(),
        dockAt: 0
      };
    });

    /* arcs between docked slots, carrying a white pulse once drawn */
    const arcs = LINKS.filter(([a, b]) => a < N_BLOCKS && b < N_BLOCKS).map(([a, b], k) => {
      const A = blocks[a].normal.clone().multiplyScalar(1.02);
      const B = blocks[b].normal.clone().multiplyScalar(1.02);
      const mid = A.clone().add(B).multiplyScalar(0.5).normalize().multiplyScalar(1.1 + A.distanceTo(B) * 0.2);
      const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(ARC_SEGS));
      geo.setDrawRange(0, 0);
      spin.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: LIME, transparent: true, opacity: 0.6 })));
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 6, 6), new THREE.MeshBasicMaterial({ color: WHITE, transparent: true, opacity: 0, depthWrite: false }));
      dot.visible = false;
      spin.add(dot);
      return { i: a, j: b, curve, geo, dot, speed: 0.35 + (k % 5) * 0.06, off: (k * 0.37) % 1 };
    });

    const tmp = new THREE.Vector3();
    const tmp2 = new THREE.Vector3();
    const tmpQ = new THREE.Quaternion();
    const spinQ = new THREE.Quaternion();

    const layout = () => {
      const w = boot.clientWidth || window.innerWidth;
      const h = boot.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const rect = visual.getBoundingClientRect();
      const brect = boot.getBoundingClientRect();
      const cx = rect.left - brect.left + rect.width / 2;
      const cy = rect.top - brect.top + rect.height / 2;
      const halfW = halfH * camera.aspect;
      const worldPerPx = (2 * halfH) / h;
      center.set((cx / w * 2 - 1) * halfW, (1 - cy / h * 2) * halfH, 0);
      radius = Math.max(0.2, rect.width * 0.33 * worldPerPx);
      tilt.position.copy(center);
      ring.position.copy(center);
      ring.scale.setScalar(radius);
      uniforms.uHalfW.value = halfW * 1.1;
      uniforms.uHalfH.value = halfH * 1.1;
      uniforms.uCenter.value.copy(center);
      uniforms.uRadius.value = radius;
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(boot);
    observer.observe(visual);

    let spinBase = null;
    let mapReadyAt = null;
    let torn = false;

    /* land-10m -> equirectangular mask -> fibonacci samples that fall on land */
    const applyLand = (topo) => {
      if (torn || !window.topojson) return;
      const feature = topojson.feature(topo, topo.objects.land);
      const polys = [];
      const collect = (g) => {
        if (!g) return;
        if (g.type === 'Polygon') polys.push(g.coordinates);
        else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => polys.push(p));
      };
      if (feature.type === 'FeatureCollection') feature.features.forEach((f) => collect(f.geometry));
      else if (feature.type === 'Feature') collect(feature.geometry);
      else collect(feature);
      const W = 1800;
      const H = 900;
      const mask = document.createElement('canvas');
      mask.width = W;
      mask.height = H;
      const ctx = mask.getContext('2d', { willReadFrequently: true });
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      polys.forEach((poly) => poly.forEach((ringCoords) => {
        ringCoords.forEach((c, i) => {
          const x = (c[0] + 180) / 360 * W;
          const y = (90 - c[1]) / 180 * H;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        });
        ctx.closePath();
      }));
      ctx.fill('evenodd');
      const data = ctx.getImageData(0, 0, W, H).data;
      const isLand = (lat, lon) => {
        if (lat < -84.5) return true;
        const x = clamp(Math.floor((lon + 180) / 360 * W), 0, W - 1);
        const y = clamp(Math.floor((90 - lat) / 180 * H), 0, H - 1);
        return data[(y * W + x) * 4] > 127;
      };
      const M = Math.round(N_POINTS / 0.29 * 1.12);
      const land = [];
      for (let i = 0; i < M; i += 1) {
        const y = 1 - (i / (M - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = golden * i;
        const x = Math.cos(theta) * r;
        const z = Math.sin(theta) * r;
        const lat = 90 - Math.acos(y) * 180 / Math.PI;
        const lon = Math.atan2(z, -x) * 180 / Math.PI - 180;
        if (isLand(lat, lon)) land.push(x, y, z);
      }
      const L = land.length / 3;
      if (L < 50) return;
      const tb = geometry.attributes.aTargetB.array;
      const sd = geometry.attributes.aSeed.array;
      for (let i = 0; i < N_POINTS; i += 1) {
        let j;
        let alive = 1;
        if (L >= N_POINTS) j = Math.floor(i * L / N_POINTS);
        else if (i < L) j = i;
        else { j = Math.floor(Math.random() * L); alive = 0; }
        tb[i * 3] = land[j * 3];
        tb[i * 3 + 1] = land[j * 3 + 1];
        tb[i * 3 + 2] = land[j * 3 + 2];
        sd[i * 4 + 2] = alive;
      }
      geometry.attributes.aTargetB.needsUpdate = true;
      geometry.attributes.aSeed.needsUpdate = true;
      /* continents resolve once the sphere has formed (MAP_AT), or on arrival if the data is late */
      mapReadyAt = scrubbing || reduceMotion ? 0 : -1;
    };
    fetch(LAND_URL).then((r) => r.json()).then(applyLand).catch(() => {});

    /* spin angle is a closed-form function of t: fast while the globe forms, then a steady turn,
       so the frame at any moment is deterministic (skip, reduced motion, scrub) */
    const spinAt = (t, c0, c1, end) => {
      const swept = (x) => {
        if (x <= c0) return x;
        if (x < c1) return c0 + (x - c0) - (x - c0) * (x - c0) / (2 * (c1 - c0));
        return c0 + (c1 - c0) / 2;
      };
      if (spinBase === null) spinBase = SPIN_END - (0.26 * end + 0.5 * swept(end));
      return spinBase + 0.26 * t + 0.5 * swept(t);
    };

    const orbitPose = (b, i, t, position, quaternion) => {
      const a = b.angle + t * ORBIT_SPEED;
      position.copy(ring.localToWorld(tmp.set(Math.cos(a), 0, Math.sin(a)).multiplyScalar(RING_R)));
      quaternion.setFromAxisAngle(b.axis, t * 1.4 + i);
    };

    const update = (t, T, doneAt) => {
      const [c0, c1] = T.converge;
      const rawP = (t - c0) / (c1 - c0);
      const P = clamp(rawP, 0, 1);
      uniforms.uProgress.value = Math.max(0, rawP);
      uniforms.uTime.value = t;
      if (mapReadyAt === -1) mapReadyAt = t;
      if (mapReadyAt !== null) uniforms.uMapMix.value = clamp((t - Math.max(mapReadyAt, MAP_AT)) / 0.7, 0, 1);

      spin.rotation.y = spinAt(reduceMotion ? T.end : t, c0, c1, T.end);
      tilt.scale.setScalar(radius * (1 + 0.14 * (1 - P)));
      occluder.scale.setScalar(Math.max(0.001, smoothstep(0.25, 0.9, P)));
      tilt.updateMatrixWorld(true);
      ring.updateMatrixWorld(true);
      uniforms.uGlobe.value.copy(spin.matrixWorld);
      spin.getWorldQuaternion(spinQ);

      const [ringIn, ringOut] = T.ring;
      ringLine.geometry.setDrawRange(0, Math.round(129 * clamp((t - ringIn) / (ringOut - ringIn), 0, 1)));
      tickMat.opacity = 0.4 * clamp((t - ringOut + 0.2) / 0.4, 0, 1);

      let dockedCount = 0;
      blocks.forEach((b, i) => {
        const appear = clamp((t - ringIn - i * 0.03) / 0.35, 0, 1);
        if (appear <= 0) { b.mesh.visible = false; b.ping.visible = false; return; }
        b.mesh.visible = true;
        let scale = appear;
        const departAt = b.dockAt - FLIGHT;
        if (t < departAt) {
          orbitPose(b, i, t, b.mesh.position, b.mesh.quaternion);
          b.ping.visible = false;
        } else {
          const slotW = spin.localToWorld(tmp2.copy(b.normal).multiplyScalar(1.05));
          const q = tmpQ.copy(spinQ).multiply(b.slotQ);
          const u = clamp((t - departAt) / FLIGHT, 0, 1);
          if (u < 0.999) {
            orbitPose(b, i, departAt, b.from, b.fromQ);
            const k = easeInOut(u);
            const nW = tmp.copy(slotW).sub(center).normalize();
            b.mesh.position.lerpVectors(b.from, slotW, k).addScaledVector(nW, Math.sin(u * Math.PI) * 0.45 * radius);
            b.mesh.quaternion.copy(b.fromQ).slerp(q, k);
            b.ping.visible = false;
          } else {
            b.mesh.position.copy(slotW);
            b.mesh.quaternion.copy(q);
            dockedCount += 1;
            const age = t - b.dockAt;
            if (!reduceMotion) scale *= 1 + 0.7 * Math.max(0, 1 - age / 0.28);
            if (age < 0.9 && !reduceMotion) {
              b.ping.visible = true;
              const s = 0.06 + age * 0.3;
              b.ping.scale.set(s, s, 1);
              b.ping.material.opacity = 0.9 * (1 - age / 0.9);
            } else {
              b.ping.visible = false;
            }
          }
        }
        b.mesh.scale.setScalar(BLOCK * radius * scale);
      });

      arcs.forEach((a) => {
        const born = Math.max(blocks[a.i].dockAt, blocks[a.j].dockAt) + 0.05;
        const life = t - born;
        if (life <= 0) { a.geo.setDrawRange(0, 0); a.dot.visible = false; return; }
        const seg = Math.min(ARC_SEGS, Math.floor(life / 0.55 * ARC_SEGS));
        a.geo.setDrawRange(0, seg + 1);
        if (seg >= ARC_SEGS) {
          const u = (t * a.speed + a.off) % 1;
          a.curve.getPoint(u, a.dot.position);
          a.dot.material.opacity = Math.sin(u * Math.PI);
          a.dot.visible = true;
        } else {
          a.dot.visible = false;
        }
      });

      if (doneAt !== null) {
        const k = clamp((t - doneAt) / 0.62, 0, 1);
        uniforms.uExplode.value = k * k * 1.4;
        uniforms.uFade.value = 1 - k;
      }
      renderer.render(scene, camera);
      return dockedCount;
    };

    const dispose = () => {
      torn = true;
      observer.disconnect();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (error) { /* context already gone */ }
    };

    return { update, dispose, blocks };
  };

  const scene3 = createScene();

  if (scene3) {
    if (flatCanvas) flatCanvas.hidden = true;
  } else {
    if (glCanvas) glCanvas.hidden = true;
    if (labelEl) labelEl.textContent = 'GLOBAL / BOOT';
  }

  /* ------------------------------------------------------------- timeline */
  const T = scene3
    ? { converge: [0.08, 2.4], line: [0, 1.0, 2.4, 5.0], ring: [1.55, 2.3], dock: [2.6, 5.0], end: 5.0 }
    : { converge: [0, 1], line: [0, 0.8, 1.7, 2.9], ring: [0, 1], dock: [1, 3.1], end: 3.1 };
  if (scene3) {
    scene3.blocks.forEach((b, i) => {
      b.dockAt = T.dock[0] + (T.dock[1] - T.dock[0]) * Math.pow(i / (N_BLOCKS - 1), 0.8);
    });
  }
  const progressAt = (t, docked) => {
    if (t >= T.end) return 100;
    if (t < T.converge[1]) {
      const keys = [[0, 0], [T.converge[0], 5], [T.line[1], 17], [T.converge[1], 36]];
      for (let i = 1; i < keys.length; i += 1) {
        if (t <= keys[i][0]) {
          const [t0, v0] = keys[i - 1];
          const [t1, v1] = keys[i];
          return Math.round(v0 + (v1 - v0) * ((t - t0) / (t1 - t0)));
        }
      }
      return 36;
    }
    return Math.min(99, Math.round(36 + 63 * (docked / N_BLOCKS)));
  };

  let started = null;
  let raf = 0;
  let phase = 'run';
  let flashFrames = 0;
  let doneAt = null;
  let capTimer = 0;
  let teardownTimer = 0;
  const holdUntil = reduceMotion ? 0.45 : 0;

  const setHooks = (t, docked) => {
    lines.forEach((line, index) => line.classList.toggle('is-visible', t >= T.line[index]));
    const value = progressAt(t, docked);
    progressEl.style.width = `${value}%`;
    percentEl.textContent = `${value}%`;
    if (countEl) countEl.textContent = scene3 && t >= T.line[2] ? `${pad2(docked)}/${pad2(N_BLOCKS)}` : '';
    if (labelEl && scene3) labelEl.textContent = `BLOCKS ${pad2(docked)}/${pad2(N_BLOCKS)}`;
  };

  const teardown = () => {
    boot.setAttribute('hidden', '');
    cancelAnimationFrame(raf);
    if (scene3) scene3.dispose();
  };

  const done = (t) => {
    if (phase === 'done') return;
    phase = 'done';
    doneAt = t;
    boot.classList.add('is-done');
    document.body.classList.remove('boot-locked');
    document.removeEventListener('keydown', onKeydown);
    teardownTimer = window.setTimeout(teardown, reduceMotion ? 0 : 680);
  };

  const ready = (t) => {
    if (phase !== 'run') return;
    phase = 'ready';
    window.clearTimeout(capTimer);
    lines.forEach((line) => line.classList.add('is-visible'));
    progressEl.style.width = '100%';
    percentEl.textContent = '100%';
    if (countEl) countEl.textContent = scene3 ? `${pad2(N_BLOCKS)}/${pad2(N_BLOCKS)}` : '';
    if (labelEl) labelEl.textContent = 'GLOBAL / READY';
    if (!scene3 || reduceMotion) { done(t); return; }
    flashEl.style.opacity = '1';
    flashFrames = 2;
  };

  /* skip: jump the clock to the end so every block snaps into its slot, then run the normal exit */
  const finish = () => {
    if (phase !== 'run' || scrubbing) return;
    started = performance.now() - T.end * 1000;
  };

  const onKeydown = (event) => {
    if (event.key === 'Enter' || event.key === 'Escape') finish();
  };

  const frame = () => {
    const now = performance.now();
    if (started === null) started = reduceMotion ? now - T.end * 1000 : now;
    const t = scrubbing ? scrub : (now - started) / 1000;

    let docked = phase === 'run' ? 0 : N_BLOCKS;
    if (scene3) docked = scene3.update(t, T, doneAt);
    else if (phase === 'run') docked = Math.round(N_BLOCKS * clamp((t - T.dock[0]) / (T.dock[1] - T.dock[0]), 0, 1));

    if (phase === 'run') {
      setHooks(t, docked);
      const heldLongEnough = reduceMotion ? (now - (started + T.end * 1000)) / 1000 >= holdUntil : true;
      if (t >= T.end && heldLongEnough && !scrubbing) ready(t);
    } else if (phase === 'ready' && flashFrames > 0) {
      flashFrames -= 1;
      if (flashFrames === 0) { flashEl.style.opacity = '0'; done(t); }
    }
    raf = requestAnimationFrame(frame);
  };

  skipEl.addEventListener('click', finish);
  document.addEventListener('keydown', onKeydown);
  capTimer = window.setTimeout(finish, 10000);
  raf = requestAnimationFrame(frame);
})();
