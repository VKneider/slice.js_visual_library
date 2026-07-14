import * as THREE from 'three';
import { WEAPONS, createWeaponModel, cleanupModel, createMuzzleFlash, addTracer, updateTracers, createParticleBurst, updateParticles } from './kit/weapons.js';
import { initAudio, playHitSound, playHeadshotSound, playMissSound, playShootSound, playReloadSound } from './kit/audio.js';

const DIFF = {
   easy:   { label:'Easy',   r:[0.4,0.6],  si:[600,1000], ms:0.15, time:35, mag:8 },
   medium: { label:'Medium', r:[0.25,0.4], si:[350,700],  ms:0.35, time:30, mag:6 },
   hard:   { label:'Hard',   r:[0.13,0.22],si:[200,450],  ms:0.7,  time:25, mag:4 },
};

export default class ThreeAimTrainer extends HTMLElement {
   constructor(props) {
      super();
      if (!document.getElementById('tat-css')) {
         const l = document.createElement('link');
         l.id = 'tat-css'; l.rel = 'stylesheet';
         l.href = new URL('./ThreeAimTrainer.css', import.meta.url).href;
         document.head.appendChild(l);
      }
      this.innerHTML = `
<div class="tat">
<div class="tat-wrap">

<div class="tat-canvas"></div>

<div class="tat-hud">
  <div class="tat-hud-row">
    <div class="tat-hud-timer-wrap">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--tat-gold)" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
      <span class="tat-timer">30</span>
    </div>
    <div class="tat-timer-bar-track">
      <div class="tat-timer-bar"></div>
    </div>
    <span class="tat-score">0</span>
  </div>
  <div class="tat-hud-row">
    <div class="tat-hud-item">
      <span>ACC</span>
      <span class="tat-stat-value tat-acc">100%</span>
    </div>
    <div class="tat-hud-item">
      <span>STREAK</span>
      <span class="tat-stat-value tat-streak">0x</span>
    </div>
    <div class="tat-hud-item tat-hud-right">
      <span>HITS</span>
      <span class="tat-stat-value tat-hits-count">0</span>
    </div>
  </div>
  <div class="tat-ammo-bar">
    <div class="tat-ammo-fill"></div>
  </div>
</div>

<div class="tat-mid">
  <div class="tat-xhair">
    <div class="tat-xhair-h"></div>
    <div class="tat-xhair-v"></div>
    <div class="tat-xhair-dot"></div>
    <div class="tat-xhair-ring"></div>
  </div>
  <div class="tat-dmg">+0</div>
</div>

<div class="tat-hit-flash"></div>

<div class="tat-weapon-bar">
  ${['pistol','rifle','shotgun'].map(k => {
    const w = WEAPONS[k];
    return `<div class="tat-wslot" data-w="${k}">
      <span class="tat-wslot-key">${w.key}</span>
      <span class="tat-wslot-name">${w.name.toUpperCase()}</span>
      <span class="tat-wslot-ammo" data-wa="${k}">${w.maxAmmo}</span>
    </div>`;
  }).join('')}
</div>

<div class="tat-scanlines"></div>

<div class="tat-menu">
  <div class="tat-menu-icon">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--tat-accent)" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10" stroke-dasharray="4 4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>
    <h2 class="tat-menu-title">Aim Trainer</h2>
    <p class="tat-menu-sub">Move mouse · Click to shoot · R to reload · ESC to pause · 1-2-3 weapons</p>
  </div>
  <div class="tat-diffs">
    ${['easy','medium','hard'].map(d => {
      const f = DIFF[d];
      return `<button class="tat-db" data-d="${d}">${f.label}</button>`;
    }).join('')}
  </div>
  <button class="tat-go">START</button>
</div>

<div class="tat-over">
  <h2 class="tat-over-title">Time</h2>
  <p class="tat-over-sub">Round complete</p>
  <div class="tat-stats">
    <span class="tat-stats-label">Score</span><span class="tat-stats-value tat-v-score">0</span>
    <span class="tat-stats-label">Hits</span><span class="tat-stats-value tat-v-hits">0</span>
    <span class="tat-stats-label">Accuracy</span><span class="tat-stats-value tat-v-acc">0%</span>
    <span class="tat-stats-label">Best streak</span><span class="tat-stats-value tat-v-streak">0</span>
    <span class="tat-stats-label">Shots</span><span class="tat-stats-value tat-v-shots">0</span>
    <span class="tat-stats-label">Difficulty</span><span class="tat-stats-value tat-v-diff">Medium</span>
  </div>
  <div class="tat-over-actions">
    <button class="tat-retry">PLAY AGAIN</button>
    <button class="tat-menu-btn">MENU</button>
  </div>
</div>

<div class="tat-pause">
  <svg class="tat-pause-icon" width="40" height="40" viewBox="0 0 24 24" fill="var(--tat-text)"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
  <h2 class="tat-pause-title">Paused</h2>
  <div class="tat-pause-actions">
    <button class="tat-resume">RESUME</button>
    <button class="tat-quit">QUIT</button>
  </div>
</div>

</div></div>`;
      slice.controller.setComponentProps(this, props);
   }

   init() {
      const S = sel => this.querySelector(sel);
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
      const weaponBar = S('.tat-weapon-bar');
      const wSlots = weaponBar.querySelectorAll('.tat-wslot');
      const wAmmoEls = weaponBar.querySelectorAll('.tat-wslot-ammo');
      const scanlines = S('.tat-scanlines');
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

      // ── Weapon model ──
      const weaponModels = {};
      let currentWeaponModel = null;
      const MUZZLE_OFFSETS = {
         pistol:  new THREE.Vector3(0.30, -0.235, -0.72),
         rifle:   new THREE.Vector3(0.28, -0.22,  -0.92),
         shotgun: new THREE.Vector3(0.32, -0.21,  -0.80),
      };

      function switchWeaponModel(type) {
         if (currentWeaponModel) {
            scene.remove(currentWeaponModel);
         }
         if (!weaponModels[type]) {
            weaponModels[type] = createWeaponModel(type);
         }
         currentWeaponModel = weaponModels[type];
         scene.add(currentWeaponModel);
      }

      // ── Muzzle flash (added to scene, updated every frame to follow camera) ──
      const mf = createMuzzleFlash();
      scene.add(mf.sprite);



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

      // ── State ──
      const self = this;
      let diff = DIFF.medium;
      let time = 0, rafId;
      let playing = false, paused = false, locked = false;
      let yaw = 0, pitch = 0;
      let score = 0, shots = 0, hits = 0, streak = 0, maxStreak = 0;
      let timeLeft = 30;
      let currentWeaponKey = 'pistol';
      let ammo = WEAPONS.pistol.maxAmmo, maxAmmo = WEAPONS.pistol.maxAmmo;
      let reloading = false, reloadStart = 0;
      let lastSpawn = 0, spawnGap = 600;
      let nextDmgHide = 0;
      let lastFireTime = 0;
      let mouseDown = false;
      let weaponBob = 0;
      let fullscreenSupported = typeof document.documentElement.requestFullscreen === 'function';

      const targets = [];
      const particles = [];
      const tracers = [];
      const raycaster = new THREE.Raycaster();
      const center = new THREE.Vector2(0, 0);

      function wDef() { return WEAPONS[currentWeaponKey]; }

      function switchWeapon(key) {
         if (!playing || paused) return;
         if (key === currentWeaponKey) return;
         if (reloading) return;
         currentWeaponKey = key;
         const w = WEAPONS[key];
         ammo = w.maxAmmo;
         maxAmmo = w.maxAmmo;
         reloading = false;
         switchWeaponModel(key);
         for (const s of wSlots) {
            s.classList.toggle('tat-wslot-active', s.dataset.w === key);
         }
         updateHUD();
      }

      // ── Events: weapon slots click ──
      for (const s of wSlots) {
         s.addEventListener('click', () => switchWeapon(s.dataset.w));
      }

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
            const pcs = createParticleBurst(scene, mesh.position.clone(), col, 12 + Math.floor(Math.random() * 8));
            particles.push(...pcs);
         };
         targets.push(t);
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
         dmgEl.style.color = isHeadshot ? 'var(--tat-gold)' : 'var(--tat-text)';

         hitFlash.style.borderColor = isHeadshot ? 'rgba(245,158,11,0.5)' : 'rgba(100,255,100,0.25)';
         setTimeout(() => { hitFlash.style.borderColor = 'rgba(255,255,255,0)'; }, 80);

         cam.position.x += (Math.random() - 0.5) * 0.04;
         cam.position.y += (Math.random() - 0.5) * 0.04;

         if (isHeadshot) playHeadshotSound();
         else playHitSound();
         updateHUD();
      }

      function tryFire() {
         if (!playing || paused || reloading) return;
         const w = wDef();
         const now = performance.now();
         if (now - lastFireTime < w.fireRate) return;
         lastFireTime = now;

         if (ammo <= 0) { startReload(); return; }
         ammo--;
         shots++;

         playShootSound(currentWeaponKey);

         // Position muzzle flash at current weapon's barrel tip
         const muzzlePos = MUZZLE_OFFSETS[currentWeaponKey];
         if (muzzlePos) mf.sprite.position.copy(muzzlePos);
         mf.mat.opacity = 1;

         // Weapon bob on fire
         weaponBob = -0.03;

         // Spread: multiple pellets for shotgun
         const pellets = w.pellets;
         let hitAny = false;

         for (let i = 0; i < pellets; i++) {
            const spreadX = (Math.random() - 0.5) * w.spread;
            const spreadY = (Math.random() - 0.5) * w.spread;
            const dir = new THREE.Vector3(spreadX, spreadY, -1).normalize();
            dir.applyQuaternion(cam.quaternion);
            raycaster.set(cam.position, dir);
            raycaster.far = 30;

            const meshes = targets.filter(t => t.alive).map(t => t.mesh);
            const hits2 = raycaster.intersectObjects(meshes);

            if (hits2.length > 0) {
               const hit = hits2[0];
               const t = targets.find(t => t.mesh === hit.object);
               if (t && t.alive) {
                  t.hit(hit.point);
                  hitAny = true;
                  // Tracer to hit point
                  const muzzleWorld = new THREE.Vector3();
                  mf.sprite.getWorldPosition(muzzleWorld);
                  const tracerColor = w.color;
                  tracers.push(addTracer(scene, muzzleWorld, hit.point, tracerColor));
               }
            } else {
               // Tracer to far point
               const muzzleWorld = new THREE.Vector3();
               mf.sprite.getWorldPosition(muzzleWorld);
               const end = new THREE.Vector3(0, 0, -15);
               end.applyQuaternion(cam.quaternion);
               end.add(cam.position);
               const tracerColor = w.color;
               tracers.push(addTracer(scene, muzzleWorld, end, tracerColor));
            }
         }

         if (!hitAny) {
            streak = 0;
            playMissSound();
            hitFlash.style.borderColor = 'rgba(255,60,60,0.2)';
            setTimeout(() => { hitFlash.style.borderColor = 'rgba(255,255,255,0)'; }, 80);
         }

         updateHUD();
      }

      function startReload() {
         if (reloading) return;
         reloading = true;
         reloadStart = performance.now();
         playReloadSound();
      }

      function updateHUD() {
         scoreEl.textContent = score;
         timerEl.textContent = String(Math.ceil(timeLeft));
         const pct = Math.max(0, timeLeft / diff.time * 100);
         timerBar.style.width = `${pct}%`;
         const a = shots > 0 ? Math.round((hits / shots) * 100) : 100;
         accEl.textContent = `${a}%`;
         streakEl.textContent = `${streak}x`;
         streakEl.style.color = streak >= 3 ? 'rgba(245,158,11,0.9)' : 'var(--tat-gold)';
         hitsCount.textContent = hits;
         const ap = ammo / maxAmmo * 100;
         ammoFill.style.width = `${ap}%`;
         ammoFill.classList.toggle('tat-ammo-fill-low', ammo <= 3);
         // Update weapon bar ammo
         for (const el of wAmmoEls) {
            const k = el.dataset.wa;
            if (k === currentWeaponKey) {
               el.textContent = `${ammo}/${maxAmmo}`;
            } else {
               el.textContent = WEAPONS[k].maxAmmo;
            }
         }
         // Highlight active weapon slot
         for (const s of wSlots) {
            s.classList.toggle('tat-wslot-active', s.dataset.w === currentWeaponKey);
         }
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

      function lockPointer() {
         try { wrap.requestPointerLock?.(); } catch (_) {}
      }
      function unlockPointer() {
         try { document.exitPointerLock?.(); } catch (_) {}
      }

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

      // ── Events ──
      const onLockChange = () => {
         locked = document.pointerLockElement === wrap;
         if (!locked && playing && !paused) {
            pauseGame();
         }
      };
      document.addEventListener('pointerlockchange', onLockChange);

      const onFsChange = () => {
         if (!document.fullscreenElement && playing && !paused) {
            pauseGame();
         }
      };
      document.addEventListener('fullscreenchange', onFsChange);

      document.addEventListener('keydown', (e) => {
         if (e.key === 'Escape' && playing) {
            e.preventDefault();
            if (paused) resumeGame();
         }
         if ((e.key === 'r' || e.key === 'R') && playing && !paused) {
            startReload();
         }
         if (playing && !paused) {
            if (e.key === '1') switchWeapon('pistol');
            if (e.key === '2') switchWeapon('rifle');
            if (e.key === '3') switchWeapon('shotgun');
         }
      });

      document.addEventListener('mousemove', (e) => {
         if (!locked || paused) return;
         yaw -= e.movementX * 0.003;
         pitch -= e.movementY * 0.003;
         pitch = Math.max(-1.3, Math.min(1.3, pitch));
      });

      document.addEventListener('mousedown', (e) => {
         if (e.button === 0) {
            mouseDown = true;
            if (locked && !paused) tryFire();
         }
      });
      document.addEventListener('mouseup', (e) => {
         if (e.button === 0) mouseDown = false;
      });

      document.addEventListener('wheel', (e) => {
         if (!playing || paused) return;
         const keys = Object.keys(WEAPONS);
         const idx = keys.indexOf(currentWeaponKey);
         if (e.deltaY > 0) switchWeapon(keys[(idx + 1) % keys.length]);
         else switchWeapon(keys[(idx - 1 + keys.length) % keys.length]);
      }, { passive: true });

      // ── Game flow ──
      function startGame(diffKey) {
         self._difficulty = diffKey;
         diff = DIFF[diffKey];
         timeLeft = diff.time;
         score = 0; shots = 0; hits = 0; streak = 0; maxStreak = 0;
         currentWeaponKey = 'pistol';
         const w = WEAPONS.pistol;
         ammo = w.maxAmmo; maxAmmo = w.maxAmmo;
         reloading = false; paused = false;
         yaw = 0; pitch = 0;
         lastFireTime = 0;
         mouseDown = false;
         cam.position.set(0, 0.8, 0);
         cam.rotation.set(0, 0, 0);
         switchWeaponModel('pistol');

         for (const t of targets) { scene.remove(t.mesh); scene.remove(t.ring); t.g.dispose(); t.m.dispose(); t.rg.dispose(); t.rm.dispose(); }
         targets.length = 0;
         for (const p of particles) { p.mat.dispose(); p.geo.dispose(); p.mesh.parent?.remove(p.mesh); }
         particles.length = 0;
         for (const t of tracers) { t.mat.dispose(); t.geo.dispose(); t.line.parent?.remove(t.line); }
         tracers.length = 0;

         playing = true;
         lastSpawn = performance.now();
         spawnGap = 300;
         menu.style.display = 'none';
         over.style.display = 'none';
         pause.style.display = 'none';
         hud.style.display = 'block';
         weaponBar.style.display = 'flex';
         scanlines.style.opacity = '0.15';
         xhair.style.opacity = '1';
         for (const s of wSlots) {
            s.classList.toggle('tat-wslot-active', s.dataset.w === 'pistol');
         }
         updateHUD();
         (async () => {
            await enterFullscreen();
            lockPointer();
         })();
      }

      function endGame() {
         playing = false;
         paused = false;
         mouseDown = false;
         unlockPointer();
         exitFullscreen();
         hud.style.display = 'none';
         weaponBar.style.display = 'none';
         scanlines.style.opacity = '0';
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
         mouseDown = false;
         unlockPointer();
         exitFullscreen();
         hud.style.display = 'none';
         weaponBar.style.display = 'none';
         scanlines.style.opacity = '0';
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
            for (const bb of diffBtns) { bb.classList.remove('tat-db-active'); }
            b.classList.add('tat-db-active');
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

          // Weapon follow camera + bob
          if (playing && !paused && currentWeaponModel) {
             const offset = new THREE.Vector3(0.30, -0.24, -0.50);
             offset.applyQuaternion(cam.quaternion);
             currentWeaponModel.position.copy(cam.position).add(offset);

             currentWeaponModel.rotation.order = 'YXZ';
             currentWeaponModel.rotation.y = cam.rotation.y;
             currentWeaponModel.rotation.x = cam.rotation.x - 0.05 + Math.sin(time * 4) * 0.003;
             currentWeaponModel.rotation.z = cam.rotation.z + Math.sin(time * 2.5) * 0.005;

             const bobTarget = Math.sin(time * 3) * 0.002;
             weaponBob += (bobTarget - weaponBob) * 0.1;
             currentWeaponModel.position.y += weaponBob;

             // Muzzle flash follows camera
             const mPos = new THREE.Vector3(0.30, -0.235, -0.72);
             mPos.applyQuaternion(cam.quaternion).add(cam.position);
             mf.sprite.position.copy(mPos);
          }

         // Reload
         if (reloading && now - reloadStart > wDef().reloadTime) {
            ammo = maxAmmo;
            reloading = false;
            updateHUD();
         }

         // Muzzle flash decay
         if (mf.mat.opacity > 0) mf.mat.opacity = Math.max(0, mf.mat.opacity - 0.06);
         // Hit flash sprite decay
         if (flashMat.opacity > 0) flashMat.opacity = Math.max(0, flashMat.opacity - 0.02);

         // Damage text
         if (nextDmgHide > 0 && now > nextDmgHide) {
            dmgEl.style.opacity = '0';
            dmgEl.style.transform = 'translateY(-12px) scale(1)';
            nextDmgHide = 0;
         }

         // Camera recenter
         cam.position.x += (0 - cam.position.x) * 0.06;
         cam.position.y += (0.8 - cam.position.y) * 0.06;

         // Auto-fire (rifle)
         if (mouseDown && locked && !paused && playing && wDef().auto) {
            tryFire();
         }

         // Game logic
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

         // Update particles (from kit)
         updateParticles(particles, now);
         // Update tracers (from kit)
         updateTracers(tracers, now);

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
         document.removeEventListener('mouseup');
         document.removeEventListener('keydown');
         document.removeEventListener('wheel');
         window.removeEventListener('resize', onResize);
         ro.disconnect();
         mf.mat.dispose(); mf.tex.dispose();
         flashMat.dispose(); flashTex.dispose();
          if (currentWeaponModel) scene.remove(currentWeaponModel);
         for (const k in weaponModels) cleanupModel(weaponModels[k]);
         for (const t of targets) { scene.remove(t.mesh); scene.remove(t.ring); t.g.dispose(); t.m.dispose(); t.rg.dispose(); t.rm.dispose(); }
         for (const p of particles) { p.mat.dispose(); p.geo.dispose(); p.mesh.parent?.remove(p.mesh); }
         for (const t of tracers) { t.mat.dispose(); t.geo.dispose(); t.line.parent?.remove(t.line); }
         renderer.dispose(); canvasEl.innerHTML = '';
      };

      loop();
   }

   beforeDestroy() { if (this._dispose) this._dispose(); }
}

customElements.define('slice-three-aim-trainer', ThreeAimTrainer);
