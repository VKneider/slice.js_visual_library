import * as THREE from 'three';

const DIFF = {
   easy:   { label:'Easy',   r:[0.4,0.6],  si:[600,1000], ms:0.15, time:35, mag:8 },
   medium: { label:'Medium', r:[0.25,0.4], si:[350,700],  ms:0.35, time:30, mag:6 },
   hard:   { label:'Hard',   r:[0.13,0.22],si:[200,450],  ms:0.7,  time:25, mag:4 },
};

const PALE = {
   background: '#080816',
   surface: 'rgba(255,255,255,0.04)',
   border: 'rgba(255,255,255,0.08)',
   text: '#fff',
   textDim: 'rgba(255,255,255,0.45)',
   accent: '#6c5ce7',
   accentGlow: 'rgba(108,92,231,0.3)',
   green: '#10b981',
   red: '#ef4444',
   gold: '#f59e0b',
   blue: '#3b82f6',
};

export default class ThreeAimTrainer extends HTMLElement {
   constructor(props) {
      super();
      this.innerHTML = `
<div class="tat" style="font-family:system-ui,sans-serif;background:${PALE.background};color:${PALE.text};width:100%;height:100%;position:relative">
<div class="tat-wrap" style="position:relative;width:100%;height:100%;overflow:hidden;background:${PALE.background};cursor:default">
<div class="tat-canvas" style="width:100%;height:100%"></div>

<div class="tat-hud" style="position:absolute;top:0;left:0;right:0;display:none;padding:10px 16px;pointer-events:none;z-index:4">
  <div style="display:flex;gap:16px;align-items:center">
    <div style="display:flex;align-items:center;gap:8px">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${PALE.gold}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span class="tat-timer" style="font-size:22px;font-weight:700;font-variant-numeric:tabular-nums;color:${PALE.text};min-width:32px">30</span>
    </div>
    <div style="flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden;max-width:200px">
      <div class="tat-timer-bar" style="width:100%;height:100%;background:linear-gradient(90deg,${PALE.accent},${PALE.gold});transition:width .3s;border-radius:2px"></div>
    </div>
    <span class="tat-score" style="font-size:26px;font-weight:800;font-variant-numeric:tabular-nums;color:${PALE.text};text-shadow:0 0 20px ${PALE.accentGlow};min-width:60px;text-align:right">0</span>
  </div>
  <div style="display:flex;gap:16px;align-items:center;margin-top:4px">
    <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:${PALE.textDim}">
      <span>ACC</span>
      <span class="tat-acc" style="font-weight:600;font-variant-numeric:tabular-nums;color:${PALE.blue};min-width:36px">100%</span>
    </div>
    <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:${PALE.textDim}">
      <span>STREAK</span>
      <span class="tat-streak" style="font-weight:600;font-variant-numeric:tabular-nums;color:${PALE.gold};min-width:28px">0x</span>
    </div>
    <div style="display:flex;align-items:center;gap:5px;font-size:12px;color:${PALE.textDim};margin-left:auto">
      <span>HITS</span>
      <span class="tat-hits-count" style="font-weight:600;font-variant-numeric:tabular-nums;color:${PALE.green};min-width:28px">0</span>
    </div>
  </div>
  <div class="tat-ammo-bar" style="margin-top:6px;height:3px;border-radius:2px;background:rgba(255,255,255,0.06);overflow:hidden">
    <div class="tat-ammo-fill" style="width:100%;height:100%;background:linear-gradient(90deg,${PALE.green},${PALE.accent});transition:width .1s"></div>
  </div>
</div>

<div class="tat-mid" style="position:absolute;top:50%;left:50%;pointer-events:none;z-index:5">
  <div class="tat-xhair" style="position:relative;width:28px;height:28px;margin:-14px 0 0 -14px;opacity:0">
    <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,0.4)"></div>
    <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.4)"></div>
    <div style="position:absolute;top:4px;left:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:rgba(255,255,255,0.2)"></div>
    <div style="position:absolute;top:-4px;left:-4px;width:36px;height:36px;border:1px solid rgba(255,255,255,0.08);border-radius:50%"></div>
  </div>
  <div class="tat-dmg" style="position:absolute;top:-30px;left:50%;font-size:20px;font-weight:800;color:${PALE.text};opacity:0;pointer-events:none;text-shadow:0 0 16px ${PALE.accentGlow};transition:all .25s">+0</div>
</div>

<div class="tat-hit-flash" style="position:absolute;inset:0;pointer-events:none;z-index:3;border:4px solid rgba(255,255,255,0);transition:border-color .08s"></div>

<div class="tat-menu" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;background:radial-gradient(ellipse at center, rgba(108,92,231,0.08) 0%, rgba(0,0,0,0.85) 70%);backdrop-filter:blur(4px);cursor:default">
  <div style="display:flex;flex-direction:column;align-items:center;gap:4px;margin-bottom:24px">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${PALE.accent}" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10" stroke-dasharray="4 4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
    <h2 style="font-size:28px;font-weight:800;color:${PALE.text};margin:8px 0 2px;letter-spacing:4px;text-transform:uppercase">Aim Trainer</h2>
    <p style="font-size:13px;color:${PALE.textDim};margin:0">Move mouse · Click to shoot · R to reload · ESC to pause</p>
  </div>
  <div class="tat-diffs" style="display:flex;gap:8px;margin-bottom:20px">
    ${['easy','medium','hard'].map(d => {
       const f = DIFF[d];
       return `<button class="tat-db" data-d="${d}" style="font:inherit;font-size:13px;padding:8px 20px;border-radius:8px;cursor:pointer;border:1px solid ${d==='medium' ? PALE.accent : PALE.border};background:${d==='medium' ? 'rgba(108,92,231,0.15)' : PALE.surface};color:${PALE.text};transition:all .2s">${f.label}</button>`;
    }).join('')}
  </div>
  <button class="tat-go" style="font:inherit;font-size:15px;font-weight:700;padding:12px 44px;border-radius:10px;cursor:pointer;border:none;background:linear-gradient(135deg,${PALE.accent},#a18cd1);color:${PALE.text};box-shadow:0 4px 24px ${PALE.accentGlow};transition:transform .15s,box-shadow .15s">START</button>
</div>

<div class="tat-over" style="position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;z-index:10;background:radial-gradient(ellipse at center, rgba(108,92,231,0.06) 0%, rgba(0,0,0,0.9) 70%);backdrop-filter:blur(6px);cursor:default">
  <h2 style="font-size:28px;font-weight:800;color:${PALE.text};margin:0 0 4px;letter-spacing:3px;text-transform:uppercase">Time</h2>
  <p style="font-size:13px;color:${PALE.textDim};margin:0 0 18px">Round complete</p>
  <div class="tat-stats" style="display:grid;grid-template-columns:auto 1fr;gap:6px 20px;margin-bottom:22px;font-size:14px;min-width:220px">
    <span style="color:${PALE.textDim}">Score</span><span class="tat-v-score" style="color:${PALE.text};font-weight:700;font-size:22px;text-align:right">0</span>
    <span style="color:${PALE.textDim}">Hits</span><span class="tat-v-hits" style="color:${PALE.green};font-weight:600;text-align:right">0</span>
    <span style="color:${PALE.textDim}">Accuracy</span><span class="tat-v-acc" style="color:${PALE.blue};font-weight:600;text-align:right">0%</span>
    <span style="color:${PALE.textDim}">Best streak</span><span class="tat-v-streak" style="color:${PALE.gold};font-weight:600;text-align:right">0</span>
    <span style="color:${PALE.textDim}">Shots</span><span class="tat-v-shots" style="color:${PALE.textDim};text-align:right">0</span>
    <span style="color:${PALE.textDim}">Difficulty</span><span class="tat-v-diff" style="color:${PALE.textDim};text-align:right">Medium</span>
  </div>
  <div style="display:flex;gap:10px">
    <button class="tat-retry" style="font:inherit;font-size:15px;font-weight:700;padding:11px 36px;border-radius:10px;cursor:pointer;border:none;background:linear-gradient(135deg,${PALE.accent},#a18cd1);color:${PALE.text};box-shadow:0 4px 24px ${PALE.accentGlow}">PLAY AGAIN</button>
    <button class="tat-menu-btn" style="font:inherit;font-size:13px;font-weight:600;padding:11px 24px;border-radius:10px;cursor:pointer;border:1px solid ${PALE.border};background:${PALE.surface};color:${PALE.textDim};transition:all .2s">MENU</button>
  </div>
</div>

<div class="tat-pause" style="position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;z-index:9;background:rgba(0,0,0,0.55);backdrop-filter:blur(5px);cursor:default">
  <svg width="40" height="40" viewBox="0 0 24 24" fill="${PALE.text}" style="margin-bottom:12px"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
  <h2 style="font-size:24px;font-weight:800;color:${PALE.text};margin:0 0 18px;letter-spacing:6px;text-transform:uppercase">Paused</h2>
  <div style="display:flex;gap:10px">
    <button class="tat-resume" style="font:inherit;font-size:15px;font-weight:700;padding:11px 36px;border-radius:10px;cursor:pointer;border:none;background:linear-gradient(135deg,${PALE.accent},#a18cd1);color:${PALE.text};box-shadow:0 4px 24px ${PALE.accentGlow}">RESUME</button>
    <button class="tat-quit" style="font:inherit;font-size:13px;font-weight:600;padding:11px 24px;border-radius:10px;cursor:pointer;border:1px solid ${PALE.border};background:${PALE.surface};color:${PALE.textDim}">QUIT</button>
  </div>
</div>

</div></div>`;
      slice.controller.setComponentProps(this, props);
   }

   init() {
      const S = (sel) => this.querySelector(sel);
      const wrap = S('.tat-wrap');
      const canvasEl = S('.tat-canvas');
      const menu = S('.tat-menu');
      const over = S('.tat-over');
      const pause = S('.tat-pause');
      const hud = S('.tat-hud');
      const xhair = S('.tat-xhair');
      const dmgEl = S('.tat-dmg');
      const hitFlash = S('.tat-hit-flash');
      const scoreEl = S('.tat-score');
      const timerEl = S('.tat-timer');
      const timerBar = S('.tat-timer-bar');
      const accEl = S('.tat-acc');
      const streakEl = S('.tat-streak');
      const hitsCount = S('.tat-hits-count');
      const ammoFill = S('.tat-ammo-fill');
      const diffBtns = this.querySelectorAll('.tat-db');
      const goBtn = S('.tat-go');
      const retryBtn = S('.tat-retry');
      const menuBtn = S('.tat-menu-btn');
      const resumeBtn = S('.tat-resume');
      const quitBtn = S('.tat-quit');

      const getSz = () => ({ w: canvasEl.clientWidth || 780, h: canvasEl.clientHeight || 530 });
      let { w, h } = getSz();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070714);
      scene.fog = new THREE.Fog(0x070714, 10, 25);

      const cam = new THREE.PerspectiveCamera(65, w / h, 0.1, 50);
      cam.position.set(0, 0.8, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      canvasEl.appendChild(renderer.domElement);

      // ── Room ──
      const wallMat = (color, emissive) => new THREE.MeshStandardMaterial({
         color, emissive, emissiveIntensity: 0.15, metalness: 0.3, roughness: 0.7, side: THREE.DoubleSide,
      });

      function plane(w_, h_, pos, rot, mat) {
         const g = new THREE.PlaneGeometry(w_, h_);
         const m = new THREE.Mesh(g, mat); m.position.copy(pos); if (rot) m.rotation.copy(rot);
         scene.add(m); return m;
      }

      plane(14, 6.5, new THREE.Vector3(0, 0, -11.5), new THREE.Euler(0, 0, 0), wallMat(0x0a0a20, 0x111133));
      plane(14, 7, new THREE.Vector3(0, -3.25, -5), new THREE.Euler(-Math.PI / 2, 0, 0), wallMat(0x0a0a18, 0x0a0a22));
      plane(14, 7, new THREE.Vector3(0, 3.25, -5), new THREE.Euler(Math.PI / 2, 0, 0), wallMat(0x080810, 0x080818));
      plane(7, 7, new THREE.Vector3(-6.25, 0, -5), new THREE.Euler(0, Math.PI / 2, 0), wallMat(0x0c0c1e, 0x0c0c22));
      plane(7, 7, new THREE.Vector3(6.25, 0, -5), new THREE.Euler(0, -Math.PI / 2, 0), wallMat(0x0c0c1e, 0x0c0c22));

      const grid = new THREE.GridHelper(12, 24, 0x222255, 0x181844);
      grid.position.y = -3.25;
      scene.add(grid);

      const stripMat = new THREE.MeshBasicMaterial({ color: 0x6c5ce7, transparent: true, opacity: 0.3 });
      const stripGeo = new THREE.BoxGeometry(6, 0.04, 0.04);
      for (let z = -3; z >= -10; z -= 2) {
         const s = new THREE.Mesh(stripGeo, stripMat);
         s.position.set(-5.9, -1.5, z);
         scene.add(s);
         const s2 = new THREE.Mesh(stripGeo, stripMat);
         s2.position.set(5.9, -1.5, z);
         scene.add(s2);
      }

      scene.add(new THREE.AmbientLight(0x222244, 0.4));
      const dl = new THREE.DirectionalLight(0x8888ff, 0.6);
      dl.position.set(2, 5, 3);
      scene.add(dl);
      const pl = new THREE.PointLight(0x6c5ce7, 0.5, 10);
      pl.position.set(0, 0, -4);
      scene.add(pl);

      // ── Hit flash sprite ──
      const fc = document.createElement('canvas');
      fc.width = 64; fc.height = 64;
      const fcx = fc.getContext('2d');
      const fg = fcx.createRadialGradient(32, 32, 0, 32, 32, 32);
      fg.addColorStop(0,'rgba(255,255,255,1)'); fg.addColorStop(0.2,'rgba(255,200,100,0.6)'); fg.addColorStop(1,'rgba(255,255,255,0)');
      fcx.fillStyle = fg; fcx.fillRect(0, 0, 64, 64);
      const flashTex = new THREE.CanvasTexture(fc);
      const flashMat = new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false });
      const flashSpr = new THREE.Sprite(flashMat);
      flashSpr.scale.set(2.5, 2.5, 1);
      flashSpr.position.set(0, 0, -5);
      scene.add(flashSpr);

      // ── Audio ──
      let audioCtx = null;
      function initAudio() {
         if (audioCtx) return;
         try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
      }
      function playTone(freq, duration, type, volume, ramp) {
         if (!audioCtx) return;
         try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            if (ramp) osc.frequency.linearRampToValueAtTime(ramp, audioCtx.currentTime + duration);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
         } catch (_) {}
      }
      function playHitSound() {
         initAudio();
         playTone(880, 0.12, 'sine', 0.25, 1200);
      }
      function playHeadshotSound() {
         initAudio();
         playTone(1100, 0.15, 'sine', 0.3, 1600);
         setTimeout(() => playTone(1400, 0.1, 'sine', 0.2, 1800), 50);
      }
      function playMissSound() {
         initAudio();
         playTone(180, 0.1, 'square', 0.08, 80);
      }

      // ── State ──
      const self = this;
      let diff = DIFF.medium;
      let time = 0, rafId;
      let playing = false, paused = false, locked = false;
      let yaw = 0, pitch = 0;
      let score = 0, shots = 0, hits = 0, streak = 0, maxStreak = 0;
      let timeLeft = 30;
      let ammo = 12, maxAmmo = 12, reloading = false, reloadStart = 0;
      let lastSpawn = 0, spawnGap = 600;
      let nextDmgHide = 0;
      let fullscreenSupported = typeof document.documentElement.requestFullscreen === 'function';
      const targets = [];
      const particles = [];
      const raycaster = new THREE.Raycaster();
      const center = new THREE.Vector2(0, 0);

      // ── Target spawning ──
      function spawn() {
         const r = diff.r[0] + Math.random() * (diff.r[1] - diff.r[0]);
         const x = (Math.random() - 0.5) * 9;
         const y = -1.8 + Math.random() * 4;
         const z = -2.5 - Math.random() * 6;
         const hue = 200 + Math.random() * 160;
         const col = new THREE.Color(`hsl(${hue}, 85%, 55%)`);

         const g = new THREE.SphereGeometry(r, 20, 20);
         const m = new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.4 });
         const mesh = new THREE.Mesh(g, m);
         mesh.position.set(x, y, z);
         scene.add(mesh);

         const rg = new THREE.RingGeometry(r * 1.1, r * 1.4, 24);
         const rm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.15, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
         const ring = new THREE.Mesh(rg, rm);
         ring.position.copy(mesh.position);
         ring.lookAt(cam.position);
         scene.add(ring);

         const t = {
            mesh, ring, g, m, rg, rm, x, y, z, r, col,
            spawn: performance.now(), life: 1800 + Math.random() * 1800,
            vx: (Math.random() - 0.5) * diff.ms * 0.6,
            vy: (Math.random() - 0.5) * diff.ms * 0.4,
            alive: true, headshot: r < 0.25,
         };
         t.hit = (point) => {
            if (!t.alive) return;
            t.alive = false;
            scene.remove(mesh); scene.remove(ring);
            g.dispose(); m.dispose(); rg.dispose(); rm.dispose();
            const isHeadshot = point && Math.abs(point.y - t.mesh.position.y) < t.r * 0.4;
            const pts = t.headshot || isHeadshot ? Math.round(15 * diff.mag / 10) : Math.round(10 * diff.mag / 10);
            hitTarget(t, pts, isHeadshot);
            burstParticles(mesh.position.clone(), col, 12 + Math.floor(Math.random() * 8));
         };
         targets.push(t);
      }

      function burstParticles(pos, col, count) {
         for (let i = 0; i < count; i++) {
            const sz = 0.02 + Math.random() * 0.06;
            const pg = new THREE.SphereGeometry(sz, 6, 6);
            const pm = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1 });
            const p = new THREE.Mesh(pg, pm);
            p.position.copy(pos);
            const d = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize().multiplyScalar(0.4 + Math.random() * 0.8);
            scene.add(p);
            particles.push({ mesh: p, geo: pg, mat: pm, dir: d, birth: performance.now(), life: 400 + Math.random() * 300 });
         }
      }

      function hitTarget(t, pts, isHeadshot) {
         hits++; streak++; if (streak > maxStreak) maxStreak = streak;
         score += pts;

         flashMat.opacity = 1;
         flashSpr.position.copy(t.mesh.position);

         const bonusMult = streak >= 3 ? 1 + streak * 0.1 : 1;
         const total = Math.round(pts * bonusMult);
         score += total - pts;

         dmgEl.textContent = `+${total}${isHeadshot ? ' ✦' : ''}`;
         dmgEl.style.opacity = '1';
         dmgEl.style.transform = 'translateY(0) scale(1.2)';
         nextDmgHide = performance.now() + 300;
         dmgEl.style.color = isHeadshot ? PALE.gold : PALE.text;

         hitFlash.style.borderColor = isHeadshot ? 'rgba(245,158,11,0.5)' : 'rgba(100,255,100,0.25)';
         setTimeout(() => { hitFlash.style.borderColor = 'rgba(255,255,255,0)'; }, 80);

         cam.position.x += (Math.random() - 0.5) * 0.04;
         cam.position.y += (Math.random() - 0.5) * 0.04;

         if (isHeadshot) playHeadshotSound();
         else playHitSound();
         updateHUD();
      }

      function shoot() {
         if (!playing || paused || reloading) return;
         if (ammo <= 0) { startReload(); return; }
         ammo--;
         shots++;

         raycaster.setFromCamera(center, cam);
         const meshes = targets.filter(t => t.alive).map(t => t.mesh);
         const hits2 = raycaster.intersectObjects(meshes);

         if (hits2.length > 0) {
            const hit = hits2[0];
            const t = targets.find(t => t.mesh === hit.object);
            if (t && t.alive) {
               t.hit(hit.point);
               updateHUD();
               return;
            }
         }

         streak = 0;
         playMissSound();
         hitFlash.style.borderColor = 'rgba(255,60,60,0.2)';
         setTimeout(() => { hitFlash.style.borderColor = 'rgba(255,255,255,0)'; }, 80);
         updateHUD();
      }

      function startReload() {
         if (reloading) return;
         reloading = true;
         reloadStart = performance.now();
      }

      function updateHUD() {
         scoreEl.textContent = score;
         timerEl.textContent = String(Math.ceil(timeLeft));
         const pct = Math.max(0, timeLeft / diff.time * 100);
         timerBar.style.width = `${pct}%`;
         const a = shots > 0 ? Math.round((hits / shots) * 100) : 100;
         accEl.textContent = `${a}%`;
         streakEl.textContent = `${streak}x`;
         streakEl.style.color = streak >= 3 ? 'rgba(245,158,11,0.9)' : PALE.gold;
         hitsCount.textContent = hits;
         const ap = ammo / maxAmmo * 100;
         ammoFill.style.width = `${ap}%`;
         ammoFill.style.background = ammo <= 3 ? 'linear-gradient(90deg,#ef4444,#f59e0b)' : `linear-gradient(90deg,${PALE.green},${PALE.accent})`;
      }

      // ── Fullscreen ──
      async function enterFullscreen() {
         if (!fullscreenSupported) return;
         try { await wrap.requestFullscreen(); } catch (_) {}
      }
      function exitFullscreen() {
         if (!fullscreenSupported) return;
         try { if (document.fullscreenElement) document.exitFullscreen(); } catch (_) {}
      }

      // ── Pointer lock ──
      function lockPointer() {
         try { wrap.requestPointerLock?.(); } catch (_) {}
      }
      function unlockPointer() {
         try { document.exitPointerLock?.(); } catch (_) {}
      }

      // ── Pause ──
      function pauseGame() {
         if (!playing || paused) return;
         paused = true;
         pause.style.display = 'flex';
         xhair.style.opacity = '0';
         unlockPointer();
      }

      async function resumeGame() {
         if (!playing || !paused) return;
         paused = false;
         pause.style.display = 'none';
         xhair.style.opacity = '1';
         if (!document.fullscreenElement) {
            await enterFullscreen();
         }
         lockPointer();
      }

      // ── Events: pointer lock change ──
      const onLockChange = () => {
         locked = document.pointerLockElement === wrap;
         if (!locked && playing && !paused) {
            pauseGame();
         }
      };
      document.addEventListener('pointerlockchange', onLockChange);

      // ── Events: fullscreen change ──
      const onFsChange = () => {
         if (!document.fullscreenElement && playing && !paused) {
            pauseGame();
         }
      };
      document.addEventListener('fullscreenchange', onFsChange);

      // ── Events: keyboard ──
      document.addEventListener('keydown', (e) => {
         if (e.key === 'Escape' && playing) {
            e.preventDefault();
            if (paused) {
               resumeGame();
            }
         }
         if ((e.key === 'r' || e.key === 'R') && playing && !paused) {
            startReload();
         }
      });

      // ── Events: mouse ──
      document.addEventListener('mousemove', (e) => {
         if (!locked || paused) return;
         yaw -= e.movementX * 0.003;
         pitch -= e.movementY * 0.003;
         pitch = Math.max(-1.3, Math.min(1.3, pitch));
      });

      document.addEventListener('mousedown', (e) => {
         if (e.button === 0 && locked && !paused) shoot();
      });

      // ── Game flow ──
      function startGame(diffKey) {
         self._difficulty = diffKey;
         diff = DIFF[diffKey];
         timeLeft = diff.time;
         score = 0; shots = 0; hits = 0; streak = 0; maxStreak = 0;
         ammo = maxAmmo; reloading = false; paused = false;
         yaw = 0; pitch = 0;
         cam.position.set(0, 0.8, 0);
         cam.rotation.set(0, 0, 0);

         for (const t of targets) { scene.remove(t.mesh); scene.remove(t.ring); t.g.dispose(); t.m.dispose(); t.rg.dispose(); t.rm.dispose(); }
         targets.length = 0;
         for (const p of particles) { scene.remove(p.mesh); p.geo.dispose(); p.mat.dispose(); }
         particles.length = 0;

         playing = true;
         lastSpawn = performance.now();
         spawnGap = 300;
         menu.style.display = 'none';
         over.style.display = 'none';
         pause.style.display = 'none';
         hud.style.display = 'block';
         xhair.style.opacity = '1';
         updateHUD();
         (async () => {
            await enterFullscreen();
            lockPointer();
         })();
      }

      function endGame() {
         playing = false;
         paused = false;
         unlockPointer();
         exitFullscreen();
         hud.style.display = 'none';
         xhair.style.opacity = '0';
         pause.style.display = 'none';
         over.style.display = 'flex';
         S('.tat-v-score').textContent = score;
         S('.tat-v-hits').textContent = hits;
         S('.tat-v-acc').textContent = `${shots > 0 ? Math.round((hits / shots) * 100) : 0}%`;
         S('.tat-v-streak').textContent = maxStreak;
         S('.tat-v-shots').textContent = shots;
         S('.tat-v-diff').textContent = DIFF[self._difficulty].label;
      }

      function goToMenu() {
         playing = false;
         paused = false;
         unlockPointer();
         exitFullscreen();
         hud.style.display = 'none';
         xhair.style.opacity = '0';
         pause.style.display = 'none';
         over.style.display = 'none';
         menu.style.display = 'flex';
      }

      // ── Button events ──
      goBtn.addEventListener('click', () => startGame(self._difficulty || 'medium'));
      retryBtn.addEventListener('click', () => startGame(self._difficulty));
      menuBtn.addEventListener('click', goToMenu);
      resumeBtn.addEventListener('click', resumeGame);
      quitBtn.addEventListener('click', goToMenu);

      for (const b of diffBtns) {
         b.addEventListener('click', (e) => {
            e.stopPropagation();
            self._difficulty = b.dataset.d;
            for (const bb of diffBtns) { bb.style.background = PALE.surface; bb.style.borderColor = PALE.border; }
            b.style.background = 'rgba(108,92,231,0.15)';
            b.style.borderColor = PALE.accent;
         });
      }

      // ── Resize ──
      const onResize = () => {
         const s = getSz(); w = s.w; h = s.h;
         cam.aspect = w / h; cam.updateProjectionMatrix();
         renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(canvasEl);

      // ── Loop ──
      const loop = () => {
         rafId = requestAnimationFrame(loop);
         if (self._disposed) return;

         time += 0.008;
         const now = performance.now();

         cam.rotation.order = 'YXZ';
         cam.rotation.y = yaw;
         cam.rotation.x = pitch;

         if (reloading && now - reloadStart > 800) {
            ammo = maxAmmo;
            reloading = false;
            updateHUD();
         }

         if (flashMat.opacity > 0) flashMat.opacity = Math.max(0, flashMat.opacity - 0.02);

         if (nextDmgHide > 0 && now > nextDmgHide) {
            dmgEl.style.opacity = '0';
            dmgEl.style.transform = 'translateY(-12px) scale(1)';
            nextDmgHide = 0;
         }

         cam.position.x += (0 - cam.position.x) * 0.06;
         cam.position.y += (0.8 - cam.position.y) * 0.06;

         if (playing && !paused) {
            timeLeft -= 0.016;
            if (timeLeft <= 0) { timeLeft = 0; endGame(); }
            else {
               if (now - lastSpawn > spawnGap) {
                  spawn();
                  lastSpawn = now;
                  spawnGap = diff.si[0] + Math.random() * (diff.si[1] - diff.si[0]);
                  const urg = 1 - timeLeft / diff.time;
                  spawnGap *= (1 - urg * 0.35);
               }
               for (const t of targets) {
                  if (!t.alive) continue;
                  t.mesh.position.x += t.vx * 0.008;
                  t.mesh.position.y += t.vy * 0.008;
                  t.ring.position.copy(t.mesh.position);
                  t.ring.lookAt(cam.position);
                  if (Math.abs(t.mesh.position.x) > 4.5) t.vx *= -1;
                  if (Math.abs(t.mesh.position.y) > 2.5) t.vy *= -1;
                  const bob = Math.sin(now * 0.002 + t.x) * 0.003;
                  t.mesh.position.y += bob;
                  t.ring.position.y = t.mesh.position.y;
                  if (now - t.spawn > t.life) {
                     t.alive = false;
                     scene.remove(t.mesh); scene.remove(t.ring);
                     t.g.dispose(); t.m.dispose(); t.rg.dispose(); t.rm.dispose();
                  }
               }
               updateHUD();
            }
         }

         for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const age = now - p.birth;
            if (age > p.life) { scene.remove(p.mesh); p.geo.dispose(); p.mat.dispose(); particles.splice(i, 1); }
            else { p.mesh.position.add(p.dir.clone().multiplyScalar(0.015)); p.mesh.scale.multiplyScalar(0.985); p.mat.opacity = 1 - age / p.life; }
         }

         renderer.render(scene, cam);
      };

      this._dispose = () => {
         this._disposed = true;
         if (rafId) cancelAnimationFrame(rafId);
         if (playing || paused) {
            unlockPointer();
            exitFullscreen();
         }
         document.removeEventListener('pointerlockchange', onLockChange);
         document.removeEventListener('fullscreenchange', onFsChange);
         document.removeEventListener('mousemove');
         document.removeEventListener('mousedown');
         document.removeEventListener('keydown');
         window.removeEventListener('resize', onResize);
         ro.disconnect();
         flashMat.dispose(); flashTex.dispose();
         for (const t of targets) { scene.remove(t.mesh); scene.remove(t.ring); t.g.dispose(); t.m.dispose(); t.rg.dispose(); t.rm.dispose(); }
         for (const p of particles) { scene.remove(p.mesh); p.geo.dispose(); p.mat.dispose(); }
         renderer.dispose(); canvasEl.innerHTML = '';
      };

      loop();
   }

   beforeDestroy() { if (this._dispose) this._dispose(); }
}

customElements.define('slice-three-aim-trainer', ThreeAimTrainer);
