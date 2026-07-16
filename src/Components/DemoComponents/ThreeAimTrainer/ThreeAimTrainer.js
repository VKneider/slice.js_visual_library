import * as THREE from 'three';
import {
   WEAPONS, createWeaponModel, cleanupModel, disposeWeaponMaterials,
   createMuzzleFlash, addTracer, updateTracers, createParticleBurst, updateParticles,
} from './kit/weapons.js';
import { resumeAudio, playHitSound, playHeadshotSound, playMissSound, playShootSound, playReloadSound } from './kit/audio.js';
import { buildArena } from './kit/arena.js';
import { TargetField } from './kit/targets.js';

// `scoreMult` pays out more for the harder presets. The field it replaces (`mag`,
// 8/6/4 for easy/medium/hard) was fed straight into the score, so Easy paid 12 a
// headshot and Hard paid 6 — the easiest preset scored double. It was also named
// for a magazine size it never set; magazines come from WEAPONS[].maxAmmo.
const DIFF = {
   easy:   { label: 'Easy',   r: [0.4, 0.6],   si: [600, 1000], ms: 0.15, time: 35, scoreMult: 0.8 },
   medium: { label: 'Medium', r: [0.25, 0.4],  si: [350, 700],  ms: 0.35, time: 30, scoreMult: 1.2 },
   hard:   { label: 'Hard',   r: [0.13, 0.22], si: [200, 450],  ms: 0.7,  time: 25, scoreMult: 1.8 },
};

const BODY_POINTS = 10;
const HEAD_POINTS = 15;
const WEAPON_KEYS = ['pistol', 'rifle', 'shotgun'];

// A frame longer than this is a stall (tab switch, GC pause, devtools). Clamped
// so the round can't jump seconds ahead and teleport every target at once.
const MAX_DT = 0.05;

// Scratch vectors, reused every frame. The fire path allocated three Vector3 per
// pellet — 24 per shotgun blast, at up to 10 blasts a second — and the loop
// allocated two more per frame. All of it was garbage for the collector to sweep
// mid-aim, which is exactly when a hitch is most felt.
const _dir = new THREE.Vector3();
const _muzzle = new THREE.Vector3();
const _end = new THREE.Vector3();
const _offset = new THREE.Vector3();

// The muzzle is no longer a constant here: each model carries its own barrel-tip
// marker (weapons.js markMuzzle), so it follows the weapon through bob, sway and
// the aim-down-sights re-centre instead of being a second, drifting source of truth.
const WEAPON_HOLD = [0.30, -0.24, -0.50];
// Aiming down sights pulls the weapon to the centre line and just below the eye.
const WEAPON_ADS = [0.0, -0.105, -0.34];

const FOV_HIP = 65;
// Per-weapon zoom. The rifle is the marksman's tool so it gets the tightest
// glass; the shotgun barely zooms because a spread weapon gains nothing from it.
const ADS = {
   pistol:  { fov: 42, spread: 0.35, sens: 0.55 },
   rifle:   { fov: 30, spread: 0.25, sens: 0.40 },
   shotgun: { fov: 55, spread: 0.85, sens: 0.75 },
};

export default class ThreeAimTrainer extends HTMLElement {
   constructor(props) {
      super();
      // No stylesheet wiring here: this is a Visual component, so Slice fetches
      // ThreeAimTrainer.css itself, and the bundler inlines it in production.
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
  ${WEAPON_KEYS.map(k => {
    const w = WEAPONS[k];
    return `<div class="tat-wslot" data-w="${k}" role="button" tabindex="-1" aria-label="${w.name}">
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
    <p class="tat-menu-sub">Move mouse · Left click to shoot · <strong>Right click to aim</strong> · R to reload · ESC to pause · 1-2-3 weapons</p>
  </div>
  <div class="tat-diffs" role="radiogroup" aria-label="Difficulty">
    ${['easy','medium','hard'].map(d => `<button class="tat-db" data-d="${d}" role="radio" aria-checked="false">${DIFF[d].label}</button>`).join('')}
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

<div class="tat-mctrl">
  <button class="tat-mctrl-btn tat-mctrl-fire" data-action="fire" aria-label="Fire"></button>
  <button class="tat-mctrl-btn tat-mctrl-ads" data-action="ads" aria-label="Aim Down Sights">ADS</button>
  <button class="tat-mctrl-btn tat-mctrl-reload" data-action="reload" aria-label="Reload"></button>
  <button class="tat-mctrl-btn tat-mctrl-pause" data-action="pause" aria-label="Pause"></button>
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

      // Every listener, timer and observer registers its own undo here. The old
      // teardown called removeEventListener('mousemove') with no handler
      // reference, which is a silent no-op: five document-level listeners
      // outlived the component and every revisit to the route stacked another
      // set on top, all still driving the previous scene.
      const teardown = [];
      const on = (target, type, handler, opts) => {
         target.addEventListener(type, handler, opts);
         teardown.push(() => target.removeEventListener(type, handler, opts));
      };

      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      const getSz = () => ({ w: canvasEl.clientWidth || 780, h: canvasEl.clientHeight || 530 });
      let { w, h } = getSz();

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070714);
      scene.fog = new THREE.Fog(0x070714, 10, 25);

      const cam = new THREE.PerspectiveCamera(65, w / h, 0.1, 50);
      cam.position.set(0, 0.8, 0);
      cam.rotation.order = 'YXZ';

      const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      canvasEl.appendChild(renderer.domElement);

      const arena = buildArena(scene, renderer);
      const field = new TargetField(scene);

      // ── Weapon models ──
      const weaponModels = {};
      let currentWeaponModel = null;

      function switchWeaponModel(type) {
         if (currentWeaponModel) scene.remove(currentWeaponModel);
         if (!weaponModels[type]) weaponModels[type] = createWeaponModel(type);
         currentWeaponModel = weaponModels[type];
         scene.add(currentWeaponModel);
      }

      const mf = createMuzzleFlash();
      scene.add(mf.sprite);

      // ── Hit flash sprite ──
      const fc = document.createElement('canvas');
      fc.width = 64; fc.height = 64;
      const fcx = fc.getContext('2d');
      const fg = fcx.createRadialGradient(32, 32, 0, 32, 32, 32);
      fg.addColorStop(0, 'rgba(255,255,255,1)'); fg.addColorStop(0.2, 'rgba(255,200,100,0.6)'); fg.addColorStop(1, 'rgba(255,255,255,0)');
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
      let time = 0, rafId = 0;
      let playing = false, paused = false, locked = false;
      let yaw = 0, pitch = 0;
      let score = 0, shots = 0, hits = 0, streak = 0, maxStreak = 0;
      let timeLeft = 30;
      let currentWeaponKey = 'pistol';
      let reloading = false, reloadStart = 0;
      let lastSpawn = 0, spawnGap = 600;
      let nextDmgHide = 0;
      let lastFireTime = 0;
      let mouseDown = false;
      let weaponBob = 0;
      // `ads` is the intent (right button held); `adsT` is the eased 0→1 the
      // camera, weapon and sensitivity all read from, so the transition is one
      // value instead of three that could disagree mid-zoom.
      let ads = false;
      let adsT = 0;
      const isTouchDevice = 'ontouchstart' in window;
      let firePressed = false;
      let touchAiming = false;
      let touchStartX = 0, touchStartY = 0;
      let touchFingers = 0;
      const fullscreenSupported = typeof document.documentElement.requestFullscreen === 'function';

      // Each weapon keeps its own magazine. Switching used to hand back a full
      // one (`ammo = w.maxAmmo`), which made every weapon swap a free instant
      // reload and left the reload mechanic decorative.
      const mags = {};
      const resetMags = () => { for (const k of WEAPON_KEYS) mags[k] = WEAPONS[k].maxAmmo; };
      resetMags();

      const particles = [];
      const tracers = [];
      const raycaster = new THREE.Raycaster();
      raycaster.far = 30;

      const wDef = () => WEAPONS[currentWeaponKey];
      const ammo = () => mags[currentWeaponKey];
      const maxAmmo = () => wDef().maxAmmo;

      function switchWeapon(key) {
         if (!playing || paused || reloading) return;
         if (key === currentWeaponKey) return;
         currentWeaponKey = key;
         switchWeaponModel(key);
         updateHUD();
      }

      /**
       * Places the weapon from the current camera and zoom. Called from the loop
       * and again from tryFire, so a shot leaves the barrel where it is at that
       * instant rather than where it happened to be on the previous frame.
       * @param {number} dt seconds; pass 0 to place without advancing the bob.
       */
      function placeWeapon(dt) {
         if (!currentWeaponModel) return;

         _offset.set(
            THREE.MathUtils.lerp(WEAPON_HOLD[0], WEAPON_ADS[0], adsT),
            THREE.MathUtils.lerp(WEAPON_HOLD[1], WEAPON_ADS[1], adsT),
            THREE.MathUtils.lerp(WEAPON_HOLD[2], WEAPON_ADS[2], adsT),
         ).applyQuaternion(cam.quaternion);
         currentWeaponModel.position.copy(cam.position).add(_offset);

         currentWeaponModel.rotation.order = 'YXZ';
         currentWeaponModel.rotation.y = cam.rotation.y;
         // Idle sway is damped out while aiming — a steadied weapon is the visual
         // half of the accuracy the zoom promises.
         const sway = 1 - adsT * 0.85;
         currentWeaponModel.rotation.x = cam.rotation.x - 0.05 * (1 - adsT) + Math.sin(time * 4) * 0.003 * sway;
         currentWeaponModel.rotation.z = cam.rotation.z + Math.sin(time * 2.5) * 0.005 * sway;

         if (dt > 0) weaponBob = THREE.MathUtils.damp(weaponBob, Math.sin(time * 3) * 0.002 * sway, 6, dt);
         currentWeaponModel.position.y += weaponBob;
      }

      /** World position of the barrel tip, straight from the model's own marker. */
      function muzzleWorld(out) {
         const marker = currentWeaponModel?.userData?.muzzle;
         return marker ? marker.getWorldPosition(out) : out.copy(cam.position);
      }

      function spawnTarget(now) {
         field.spawn(diff, now, cam);
      }

      function killTarget(target, point) {
         field.retire(target);

         const isHeadshot = !!point && Math.abs(point.y - target.mesh.position.y) < target.r * 0.4;
         const base = (target.headshot || isHeadshot) ? HEAD_POINTS : BODY_POINTS;
         const pts = Math.round(base * diff.scoreMult);

         hits++; streak++;
         if (streak > maxStreak) maxStreak = streak;

         const bonusMult = streak >= 3 ? 1 + streak * 0.1 : 1;
         const total = Math.round(pts * bonusMult);
         score += total;

         flashMat.opacity = 1;
         flashSpr.position.copy(target.mesh.position);

         dmgEl.textContent = `+${total}${isHeadshot ? ' ✦' : ''}`;
         dmgEl.style.opacity = '1';
         dmgEl.style.transform = 'translateY(0) scale(1.2)';
         dmgEl.style.color = isHeadshot ? 'var(--tat-gold)' : 'var(--tat-text)';
         nextDmgHide = performance.now() + 300;

         flashBorder(isHeadshot ? 'rgba(245,158,11,0.5)' : 'rgba(100,255,100,0.25)');

         if (!reducedMotion) {
            cam.position.x += (Math.random() - 0.5) * 0.04;
            cam.position.y += (Math.random() - 0.5) * 0.04;
         }

         particles.push(...createParticleBurst(scene, target.mesh.position.clone(), target.mat.color, 12 + Math.floor(Math.random() * 8)));
         if (isHeadshot) playHeadshotSound(); else playHitSound();
         updateHUD();
      }

      // Border pulses are driven by one timer that is always cancellable, so a
      // pending restore can never fire after teardown.
      let flashTimer = 0;
      function flashBorder(color) {
         clearTimeout(flashTimer);
         hitFlash.style.borderColor = color;
         flashTimer = setTimeout(() => { hitFlash.style.borderColor = 'rgba(255,255,255,0)'; }, 80);
      }
      teardown.push(() => clearTimeout(flashTimer));

      function tryFire() {
         if (!playing || paused || reloading) return;
         const w = wDef();
         const now = performance.now();
         if (now - lastFireTime < w.fireRate) return;
         lastFireTime = now;

         if (ammo() <= 0) { startReload(); return; }
         mags[currentWeaponKey]--;
         shots++;

         playShootSound(currentWeaponKey);

         // Re-place the weapon, then take the muzzle from its own barrel marker.
         // The old code copied a camera-relative offset onto a scene-parented
         // sprite and read the world position back, so every tracer left from a
         // fixed point near the world origin — bottom-right of the view — instead
         // of from the gun.
         placeWeapon(0);
         muzzleWorld(_muzzle);
         mf.sprite.position.copy(_muzzle);
         mf.mat.opacity = 1;
         weaponBob = -0.03;

         let hitAny = false;

         // Aiming down sights tightens the cone — that, plus the zoom, is the
         // whole reward for giving up turn speed.
         const spread = w.spread * THREE.MathUtils.lerp(1, ADS[currentWeaponKey].spread, adsT);

         for (let i = 0; i < w.pellets; i++) {
            _dir.set((Math.random() - 0.5) * spread, (Math.random() - 0.5) * spread, -1)
               .normalize()
               .applyQuaternion(cam.quaternion);
            raycaster.set(cam.position, _dir);

            // `field.meshes` is maintained by the pool, so the shotgun's 8 pellets
            // no longer rebuild a mesh list each.
            const found = raycaster.intersectObjects(field.meshes, false);
            const target = found.length > 0 ? found[0].object.userData.target : null;

            if (target?.alive) {
               killTarget(target, found[0].point);
               hitAny = true;
               tracers.push(addTracer(scene, _muzzle, found[0].point, w.color));
            } else {
               _end.set(0, 0, -15).applyQuaternion(cam.quaternion).add(cam.position);
               tracers.push(addTracer(scene, _muzzle, _end, w.color));
            }
         }

         if (!hitAny) {
            streak = 0;
            playMissSound();
            flashBorder('rgba(255,60,60,0.2)');
         }

         updateHUD();
      }

      function startReload() {
         if (reloading || ammo() === maxAmmo()) return;
         reloading = true;
         reloadStart = performance.now();
         playReloadSound();
      }

      // updateHUD runs every frame, so each write is guarded: assigning
      // textContent/style invalidates layout even when the value is identical,
      // and the timer is the only field that actually changes most frames.
      const setText = (el, value) => { if (el.textContent !== value) el.textContent = value; };
      const setStyle = (el, prop, value) => { if (el.style[prop] !== value) el.style[prop] = value; };

      function updateHUD() {
         setText(scoreEl, String(score));
         setText(timerEl, String(Math.ceil(timeLeft)));
         timerEl.classList.toggle('tat-timer-low', playing && timeLeft <= 6);
         setStyle(timerBar, 'width', `${Math.max(0, timeLeft / diff.time * 100).toFixed(2)}%`);
         setText(accEl, `${shots > 0 ? Math.round((hits / shots) * 100) : 100}%`);
         setText(streakEl, `${streak}x`);
         setStyle(streakEl, 'color', streak >= 3 ? 'rgba(245,158,11,0.9)' : 'var(--tat-gold)');
         setText(hitsCount, String(hits));
         setStyle(ammoFill, 'width', `${(ammo() / maxAmmo() * 100).toFixed(2)}%`);
         ammoFill.classList.toggle('tat-ammo-fill-low', ammo() <= 3 && !reloading);
         ammoFill.classList.toggle('tat-ammo-fill-reloading', reloading);

         for (const el of wAmmoEls) {
            const key = el.dataset.wa;
            setText(el, `${mags[key]}/${WEAPONS[key].maxAmmo}`);
         }
         for (const s of wSlots) {
            s.classList.toggle('tat-wslot-active', s.dataset.w === currentWeaponKey);
         }
      }

      // ── Fullscreen / pointer lock ──
      async function enterFullscreen() {
         if (!fullscreenSupported) return;
         try { await wrap.requestFullscreen(); } catch (_) {}
      }
      function exitFullscreen() {
         if (!fullscreenSupported) return;
         try { if (document.fullscreenElement) document.exitFullscreen(); } catch (_) {}
      }
      function lockPointer() { try { wrap.requestPointerLock?.(); } catch (_) {} }
      function unlockPointer() { try { document.exitPointerLock?.(); } catch (_) {} }

      function pauseGame() {
         if (!playing || paused) return;
         paused = true;
         mouseDown = false;
         // The mouseup that ends the zoom lands outside the game once the pointer
         // unlocks, so the intent has to be dropped here or the round resumes
         // still zoomed with no button held.
         ads = false;
         pause.style.display = 'flex';
         xhair.style.opacity = '0';
         unlockPointer();
      }

      async function resumeGame() {
         if (!playing || !paused) return;
         paused = false;
         pause.style.display = 'none';
         xhair.style.opacity = '1';
         if (!isTouchDevice) {
            if (!document.fullscreenElement) await enterFullscreen();
            lockPointer();
         }
      }

      // ── Events ──
      on(document, 'pointerlockchange', () => {
         locked = document.pointerLockElement === wrap;
         if (!locked && playing && !paused) pauseGame();
      });

      on(document, 'fullscreenchange', () => {
         if (!document.fullscreenElement && playing && !paused) pauseGame();
      });

      // A backgrounded tab keeps firing rAF in some browsers and always resumes
      // with a huge dt; pausing is both fairer and cheaper than clamping alone.
      on(document, 'visibilitychange', () => {
         if (document.hidden) pauseGame();
      });

      on(document, 'keydown', (e) => {
         if (!playing) return;
         if (e.key === 'Escape') { e.preventDefault(); if (paused) resumeGame(); return; }
         if (paused) return;
         if (e.key === 'r' || e.key === 'R') startReload();
         const idx = ['1', '2', '3'].indexOf(e.key);
         if (idx !== -1) switchWeapon(WEAPON_KEYS[idx]);
      });

      on(document, 'mousemove', (e) => {
         if (!locked || paused) return;
         // Zoomed in, the same mouse travel covers a much narrower field of view,
         // so sensitivity scales down with the zoom or aiming turns twitchy.
         const sens = 0.003 * THREE.MathUtils.lerp(1, ADS[currentWeaponKey].sens, adsT);
         yaw -= e.movementX * sens;
         pitch -= e.movementY * sens;
         pitch = Math.max(-1.3, Math.min(1.3, pitch));
      });

      on(document, 'mousedown', (e) => {
         if (e.button === 0) {
            mouseDown = true;
            if (locked && !paused) tryFire();
         }
         if (e.button === 2 && locked && !paused && playing) {
            e.preventDefault();
            ads = true;
         }
      });
      on(document, 'mouseup', (e) => {
         if (e.button === 0) mouseDown = false;
         if (e.button === 2) ads = false;
      });

      // Without this the right button opens the browser menu the moment pointer
      // lock drops, which both breaks the zoom and pauses the round.
      on(wrap, 'contextmenu', (e) => e.preventDefault());

      on(document, 'wheel', (e) => {
         if (!playing || paused) return;
         const idx = WEAPON_KEYS.indexOf(currentWeaponKey);
         const step = e.deltaY > 0 ? 1 : -1;
         switchWeapon(WEAPON_KEYS[(idx + step + WEAPON_KEYS.length) % WEAPON_KEYS.length]);
      }, { passive: true });

      for (const s of wSlots) on(s, 'click', () => switchWeapon(s.dataset.w));

      // ── Touch / mobile ──
      if (isTouchDevice) {
         on(wrap, 'touchstart', (e) => {
            if (!playing || paused) return;
            touchFingers = e.touches.length;
            if (touchFingers === 1) {
               const overBtn = e.target.closest('.tat-mctrl-btn, .tat-wslot, .tat-menu, .tat-over, .tat-pause');
               if (overBtn) return;
               touchAiming = true;
               touchStartX = e.touches[0].clientX;
               touchStartY = e.touches[0].clientY;
            }
         }, { passive: true });

         on(wrap, 'touchmove', (e) => {
            if (!touchAiming || paused || !playing) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const sens = 0.008 * THREE.MathUtils.lerp(1, ADS[currentWeaponKey].sens, adsT);
            yaw -= dx * sens;
            pitch -= dy * sens;
            pitch = Math.max(-1.3, Math.min(1.3, pitch));
            touchStartX = t.clientX;
            touchStartY = t.clientY;
         }, { passive: true });

         on(document, 'touchend', (e) => {
            if (!playing) return;
            touchFingers = e.touches.length;
            if (touchFingers === 0) touchAiming = false;
         }, { passive: true });
      }

      // ── Game flow ──
      function startGame(diffKey) {
         self._difficulty = diffKey;
         diff = DIFF[diffKey];
         timeLeft = diff.time;
         score = 0; shots = 0; hits = 0; streak = 0; maxStreak = 0;
         currentWeaponKey = 'pistol';
         resetMags();
         reloading = false;
         paused = false;
         yaw = 0; pitch = 0;
         lastFireTime = 0;
         mouseDown = false;
         ads = false;
         adsT = 0;
         cam.position.set(0, 0.8, 0);
         cam.rotation.set(0, 0, 0);
         cam.fov = FOV_HIP;
         cam.updateProjectionMatrix();
         switchWeaponModel('pistol');

         field.clear();
         clearEffects();

         playing = true;
         lastSpawn = performance.now();
         spawnGap = 300;
         menu.style.display = 'none';
         over.style.display = 'none';
         pause.style.display = 'none';
         hud.style.display = 'block';
         weaponBar.style.display = 'flex';
         scanlines.style.opacity = reducedMotion ? '0' : '0.15';
         xhair.style.opacity = '1';
         updateHUD();

         // Both need a user gesture, and the AudioContext may be suspended until
         // one arrives — this runs from the START click, which is that gesture.
          resumeAudio();
          if (!isTouchDevice) (async () => { await enterFullscreen(); lockPointer(); })();
      }

      function clearEffects() {
         for (const p of particles) { p.mat.dispose(); p.geo.dispose(); p.mesh.parent?.remove(p.mesh); }
         particles.length = 0;
         for (const t of tracers) { t.mat.dispose(); t.geo.dispose(); t.line.parent?.remove(t.line); }
         tracers.length = 0;
      }

      function leaveRound() {
         playing = false;
         paused = false;
         mouseDown = false;
         ads = false;
         touchAiming = false;
         firePressed = false;
         unlockPointer();
         exitFullscreen();
         hud.style.display = 'none';
         weaponBar.style.display = 'none';
         scanlines.style.opacity = '0';
         xhair.style.opacity = '0';
         pause.style.display = 'none';
      }

      function endGame() {
         leaveRound();
         over.style.display = 'flex';
         S('.tat-v-score').textContent = score;
         S('.tat-v-hits').textContent = hits;
         S('.tat-v-acc').textContent = `${shots > 0 ? Math.round((hits / shots) * 100) : 0}%`;
         S('.tat-v-streak').textContent = maxStreak;
         S('.tat-v-shots').textContent = shots;
         S('.tat-v-diff').textContent = DIFF[self._difficulty || 'medium'].label;
      }

      function goToMenu() {
         leaveRound();
         over.style.display = 'none';
         menu.style.display = 'flex';
      }

      on(S('.tat-go'), 'click', () => startGame(self._difficulty || 'medium'));
      on(S('.tat-retry'), 'click', () => startGame(self._difficulty || 'medium'));
      on(S('.tat-menu-btn'), 'click', goToMenu);
      on(S('.tat-resume'), 'click', resumeGame);
      on(S('.tat-quit'), 'click', goToMenu);

      for (const b of diffBtns) {
         on(b, 'click', (e) => {
            e.stopPropagation();
            self._difficulty = b.dataset.d;
            for (const other of diffBtns) {
               const active = other === b;
               other.classList.toggle('tat-db-active', active);
               other.setAttribute('aria-checked', String(active));
            }
         });
      }

      // ── Mobile control buttons ──
      const mctrlFire = S('.tat-mctrl-fire');
      const mctrlAds = S('.tat-mctrl-ads');
      const mctrlReload = S('.tat-mctrl-reload');
      const mctrlPause = S('.tat-mctrl-pause');

      if (isTouchDevice && mctrlFire) {
         on(mctrlFire, 'pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            firePressed = true;
            if (playing && !paused) tryFire();
         });
         on(mctrlFire, 'pointerup', () => { firePressed = false; });
         on(mctrlFire, 'pointercancel', () => { firePressed = false; });
      }
      if (isTouchDevice && mctrlAds) {
         on(mctrlAds, 'pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            ads = !ads;
            mctrlAds.classList.toggle('tat-mctrl-ads-active', ads);
         });
      }
      if (isTouchDevice && mctrlReload) {
         on(mctrlReload, 'pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (playing && !paused) startReload();
         });
      }
      if (isTouchDevice && mctrlPause) {
         on(mctrlPause, 'pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            if (!playing) return;
            if (paused) resumeGame(); else pauseGame();
         });
      }

      // ── Resize ──
      const onResize = () => {
         const s = getSz(); w = s.w; h = s.h;
         cam.aspect = w / h;
         cam.updateProjectionMatrix();
         renderer.setSize(w, h);
      };
      on(window, 'resize', onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(canvasEl);
      teardown.push(() => ro.disconnect());

      // ── Loop ──
      // Everything below is time-based. The old loop advanced the round by a
      // hard-coded 0.016s per frame, so on a 144Hz screen a 30s round ran out in
      // about 12s and every target moved at 2.4x speed.
      let lastFrame = performance.now();

      const loop = (nowMs) => {
         if (self._disposed) return;
         rafId = requestAnimationFrame(loop);

         const now = nowMs ?? performance.now();
         const dt = Math.min((now - lastFrame) / 1000, MAX_DT);
         lastFrame = now;
         // Frame-rate scale: keeps the original per-frame tuning readable while
         // making it independent of how often we actually render.
         const k = dt * 60;

         time += 0.008 * k;

         cam.rotation.y = yaw;
         cam.rotation.x = pitch;

         // One eased value drives the zoom; FOV, weapon offset, sway and the
         // crosshair all read from it, so they can never disagree mid-transition.
         const wantAds = ads && playing && !paused && !reloading;
         adsT = THREE.MathUtils.damp(adsT, wantAds ? 1 : 0, 14, dt);
         const zoom = ADS[currentWeaponKey];
         const fov = THREE.MathUtils.lerp(FOV_HIP, zoom.fov, adsT);
         if (Math.abs(cam.fov - fov) > 0.01) {
            cam.fov = fov;
            cam.updateProjectionMatrix();
         }
         xhair.classList.toggle('tat-xhair-ads', adsT > 0.5);

         if (playing && !paused && currentWeaponModel) {
            placeWeapon(dt);
            muzzleWorld(_muzzle);
            mf.sprite.position.copy(_muzzle);
         }

         if (reloading && now - reloadStart > wDef().reloadTime) {
            mags[currentWeaponKey] = maxAmmo();
            reloading = false;
            updateHUD();
         }

         if (mf.mat.opacity > 0) mf.mat.opacity = Math.max(0, mf.mat.opacity - 0.06 * k);
         if (flashMat.opacity > 0) flashMat.opacity = Math.max(0, flashMat.opacity - 0.02 * k);

         if (nextDmgHide > 0 && now > nextDmgHide) {
            dmgEl.style.opacity = '0';
            dmgEl.style.transform = 'translateY(-12px) scale(1)';
            nextDmgHide = 0;
         }

         // Exponential recentre, framed as damping so it settles at the same rate
         // regardless of frame time.
         cam.position.x = THREE.MathUtils.damp(cam.position.x, 0, 3.7, dt);
         cam.position.y = THREE.MathUtils.damp(cam.position.y, 0.8, 3.7, dt);

          if ((isTouchDevice ? firePressed : mouseDown && locked) && !paused && playing && wDef().auto) tryFire();

         if (playing && !paused) {
            timeLeft -= dt;
            if (timeLeft <= 0) {
               timeLeft = 0;
               endGame();
            } else {
               if (now - lastSpawn > spawnGap) {
                  spawnTarget(now);
                  lastSpawn = now;
                  const urgency = 1 - timeLeft / diff.time;
                  spawnGap = (diff.si[0] + Math.random() * (diff.si[1] - diff.si[0])) * (1 - urgency * 0.35);
               }
               field.update(k, now, cam);
               updateHUD();
            }
         }

         updateParticles(particles, now, k);
         updateTracers(tracers, now);
         renderer.render(scene, cam);
      };

      this._dispose = () => {
         this._disposed = true;
         if (rafId) cancelAnimationFrame(rafId);
         if (playing || paused) { unlockPointer(); exitFullscreen(); }

         for (const undo of teardown) undo();
         teardown.length = 0;

         clearEffects();
         field.dispose();
         arena.dispose();

         mf.mat.dispose(); mf.tex.dispose();
         flashMat.dispose(); flashTex.dispose();
         if (currentWeaponModel) scene.remove(currentWeaponModel);
         for (const k of Object.keys(weaponModels)) cleanupModel(weaponModels[k]);
         disposeWeaponMaterials();

         renderer.dispose();
         canvasEl.innerHTML = '';
      };

      loop();
   }

   beforeDestroy() { if (this._dispose) this._dispose(); }
}

customElements.define('slice-three-aim-trainer', ThreeAimTrainer);
