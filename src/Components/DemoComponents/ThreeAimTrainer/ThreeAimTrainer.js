import * as THREE from 'three';

const DIFF = {
   easy:   { label:'Easy',   r:[0.4,0.6],  si:[600,1000], ms:0.15, time:35, mag:8 },
   medium: { label:'Medium', r:[0.25,0.4], si:[350,700],  ms:0.35, time:30, mag:6 },
   hard:   { label:'Hard',   r:[0.13,0.22],si:[200,450],  ms:0.7,  time:25, mag:4 },
};

export default class ThreeAimTrainer extends HTMLElement {
   constructor(props) {
      super();
      this.innerHTML = `
<div class="tat" style="font-family:system-ui,sans-serif">
<div class="tat-wrap" style="position:relative;width:100%;height:530px;border-radius:12px;overflow:hidden;background:#080816;cursor:default">
<div class="tat-canvas" style="width:100%;height:100%"></div>

<div class="tat-hud" style="position:absolute;top:0;left:0;right:0;display:none;padding:10px 14px;pointer-events:none;z-index:4">
  <div style="display:flex;gap:14px;align-items:center">
    <span class="tat-score" style="font-size:28px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums;text-shadow:0 0 24px rgba(108,92,231,0.5);min-width:60px">0</span>
    <span class="tat-timer" style="font-size:19px;font-weight:600;color:rgba(255,255,255,0.6);font-variant-numeric:tabular-nums;margin-left:auto">30</span>
    <span class="tat-acc" style="font-size:12px;color:rgba(255,255,255,0.4);font-variant-numeric:tabular-nums;min-width:44px">100%</span>
    <span class="tat-streak" style="font-size:12px;color:rgba(255,200,0,0.6);font-variant-numeric:tabular-nums;min-width:44px">0x</span>
  </div>
  <div class="tat-ammo-bar" style="margin-top:5px;height:3px;border-radius:2px;background:rgba(255,255,255,0.08);overflow:hidden">
    <div class="tat-ammo-fill" style="width:100%;height:100%;background:linear-gradient(90deg,#10b981,#6c5ce7);transition:width .1s"></div>
  </div>
</div>

<div class="tat-mid" style="position:absolute;top:50%;left:50%;pointer-events:none;z-index:5">
  <div class="tat-xhair" style="position:relative;width:28px;height:28px;margin:-14px 0 0 -14px;opacity:0">
    <div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,0.5)"></div>
    <div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.5)"></div>
    <div style="position:absolute;top:4px;left:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:rgba(255,255,255,0.3)"></div>
  </div>
  <div class="tat-dmg" style="position:absolute;top:-30px;left:50%;font-size:18px;font-weight:800;color:#fff;opacity:0;pointer-events:none;text-shadow:0 0 12px rgba(108,92,231,0.6);transition:all .25s">+0</div>
</div>

<div class="tat-hit-flash" style="position:absolute;inset:0;pointer-events:none;z-index:3;border-radius:12px;border:4px solid rgba(255,255,255,0);transition:border-color .08s"></div>

<div class="tat-menu" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;background:rgba(0,0,0,0.6);backdrop-filter:blur(5px);cursor:default">
  <h2 style="font-size:30px;font-weight:800;color:#fff;margin:0 0 3px;letter-spacing:3px">POV AIM TRAINER</h2>
  <p style="font-size:13px;color:rgba(255,255,255,0.45);margin:0 0 20px">Move mouse to look around · Click to shoot · R to reload</p>
  <div class="tat-diffs" style="display:flex;gap:8px;margin-bottom:18px">
    ${['easy','medium','hard'].map(d => {
       const f = DIFF[d];
       return `<button class="tat-db" data-d="${d}" style="font:inherit;font-size:13px;padding:7px 16px;border-radius:8px;cursor:pointer;border:1px solid rgba(255,255,255,0.12);background:${d==='medium'?'rgba(108,92,231,0.25)':'rgba(255,255,255,0.05)'};color:rgba(255,255,255,0.85)">${f.label}</button>`;
    }).join('')}
  </div>
  <button class="tat-go" style="font:inherit;font-size:16px;font-weight:700;padding:11px 36px;border-radius:10px;cursor:pointer;border:none;background:linear-gradient(135deg,#6c5ce7,#a18cd1);color:#fff;box-shadow:0 4px 24px rgba(108,92,231,0.3)">START</button>
</div>

<div class="tat-over" style="position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;z-index:10;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);cursor:default">
  <h2 style="font-size:26px;font-weight:800;color:#fff;margin:0 0 14px">TIME</h2>
  <div class="tat-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:8px 22px;margin-bottom:18px;font-size:14px">
    <span style="color:rgba(255,255,255,0.35)">Score</span><span class="tat-v-score" style="color:#fff;font-weight:700;font-size:20px;text-align:right">0</span>
    <span style="color:rgba(255,255,255,0.35)">Hits</span><span class="tat-v-hits" style="color:#10b981;font-weight:600;text-align:right">0</span>
    <span style="color:rgba(255,255,255,0.35)">Accuracy</span><span class="tat-v-acc" style="color:#3b82f6;font-weight:600;text-align:right">0%</span>
    <span style="color:rgba(255,255,255,0.35)">Best streak</span><span class="tat-v-streak" style="color:#f59e0b;font-weight:600;text-align:right">0</span>
    <span style="color:rgba(255,255,255,0.35)">Shots</span><span class="tat-v-shots" style="color:rgba(255,255,255,0.7);text-align:right">0</span>
    <span style="color:rgba(255,255,255,0.35)">Difficulty</span><span class="tat-v-diff" style="color:rgba(255,255,255,0.7);text-align:right">Medium</span>
  </div>
  <button class="tat-retry" style="font:inherit;font-size:16px;font-weight:700;padding:11px 36px;border-radius:10px;cursor:pointer;border:none;background:linear-gradient(135deg,#6c5ce7,#a18cd1);color:#fff;box-shadow:0 4px 24px rgba(108,92,231,0.3)">PLAY AGAIN</button>
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
      const hud = S('.tat-hud');
      const xhair = S('.tat-xhair');
      const dmgEl = S('.tat-dmg');
      const hitFlash = S('.tat-hit-flash');
      const scoreEl = S('.tat-score');
      const timerEl = S('.tat-timer');
      const accEl = S('.tat-acc');
      const streakEl = S('.tat-streak');
      const ammoFill = S('.tat-ammo-fill');
      const diffBtns = this.querySelectorAll('.tat-db');

      const getSz = () => ({ w: canvasEl.clientWidth || 780, h: canvasEl.clientHeight || 530 });
      let { w, h } = getSz();

      // ── Scene ──
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

      // Floor grid
      const grid = new THREE.GridHelper(12, 24, 0x222255, 0x181844);
      grid.position.y = -3.25;
      scene.add(grid);

      // Neon strips on walls
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

      // ── Lights ──
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

      // ── State ──
      const self = this;
      let diff = DIFF.medium;
      let time = 0, rafId;
      let playing = false, locked = false;
      let yaw = 0, pitch = 0;
      let score = 0, shots = 0, hits = 0, streak = 0, maxStreak = 0;
      let timeLeft = 30;
      let ammo = 12, maxAmmo = 12, reloading = false, reloadStart = 0;
      let lastSpawn = 0, spawnGap = 600;
      let nextDmgHide = 0;
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
         dmgEl.style.transform = 'translateY(0)';
         nextDmgHide = performance.now() + 300;
         dmgEl.style.color = isHeadshot ? '#f59e0b' : '#fff';

         hitFlash.style.borderColor = isHeadshot ? 'rgba(245,158,11,0.5)' : 'rgba(100,255,100,0.25)';
         setTimeout(() => { hitFlash.style.borderColor = 'rgba(255,255,255,0)'; }, 80);

         // Screen shake
         cam.position.x += (Math.random() - 0.5) * 0.04;
         cam.position.y += (Math.random() - 0.5) * 0.04;

         updateHUD();
      }

      function shoot() {
         if (!playing || reloading) return;
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

         // Miss
         streak = 0;
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
         const a = shots > 0 ? Math.round((hits / shots) * 100) : 100;
         accEl.textContent = `${a}%`;
         streakEl.textContent = `${streak}x`;
         streakEl.style.color = streak >= 3 ? 'rgba(245,158,11,0.9)' : 'rgba(255,200,0,0.6)';
         const ap = ammo / maxAmmo * 100;
         ammoFill.style.width = `${ap}%`;
         ammoFill.style.background = ammo <= 3 ? 'linear-gradient(90deg,#ef4444,#f59e0b)' : 'linear-gradient(90deg,#10b981,#6c5ce7)';
      }

      // ── Pointer lock ──
      function lockPointer() {
         try { wrap.requestPointerLock?.(); } catch (_) {}
      }
      function unlockPointer() {
         try { document.exitPointerLock?.(); } catch (_) {}
      }

      const onLockChange = () => {
         locked = document.pointerLockElement === wrap;
         if (!locked && playing) {
            // Lost lock during game — pause or end
         }
      };
      document.addEventListener('pointerlockchange', onLockChange);

      // ── Game flow ──
      function startGame(diffKey) {
         self._difficulty = diffKey;
         diff = DIFF[diffKey];
         timeLeft = diff.time;
         score = 0; shots = 0; hits = 0; streak = 0; maxStreak = 0;
         ammo = maxAmmo; reloading = false;
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
         hud.style.display = 'block';
         xhair.style.opacity = '1';
         updateHUD();
         lockPointer();
      }

      function endGame() {
         playing = false;
         unlockPointer();
         hud.style.display = 'none';
         xhair.style.opacity = '0';
         over.style.display = 'flex';
         S('.tat-v-score').textContent = score;
         S('.tat-v-hits').textContent = hits;
         S('.tat-v-acc').textContent = `${shots > 0 ? Math.round((hits / shots) * 100) : 0}%`;
         S('.tat-v-streak').textContent = maxStreak;
         S('.tat-v-shots').textContent = shots;
         S('.tat-v-diff').textContent = DIFF[self._difficulty].label;
      }

      // ── Events ──
      document.addEventListener('mousemove', (e) => {
         if (!locked) return;
         yaw -= e.movementX * 0.003;
         pitch -= e.movementY * 0.003;
         pitch = Math.max(-1.3, Math.min(1.3, pitch));
      });

      document.addEventListener('mousedown', (e) => {
         if (e.button === 0 && locked) shoot();
      });

      document.addEventListener('keydown', (e) => {
         if (e.key === 'r' || e.key === 'R') { if (playing) startReload(); }
      });

      S('.tat-go').addEventListener('click', () => startGame(self._difficulty));
      S('.tat-retry').addEventListener('click', () => startGame(self._difficulty));

      for (const b of diffBtns) {
         b.addEventListener('click', (e) => {
            e.stopPropagation();
            self._difficulty = b.dataset.d;
            for (const bb of diffBtns) { bb.style.background = 'rgba(255,255,255,0.05)'; }
            b.style.background = 'rgba(108,92,231,0.25)';
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

         // Camera
         cam.rotation.order = 'YXZ';
         cam.rotation.y = yaw;
         cam.rotation.x = pitch;

         // Reload
         if (reloading && now - reloadStart > 800) {
            ammo = maxAmmo;
            reloading = false;
            updateHUD();
         }

         // Flash fade
         if (flashMat.opacity > 0) flashMat.opacity = Math.max(0, flashMat.opacity - 0.02);

         // Damage text fade
         if (nextDmgHide > 0 && now > nextDmgHide) {
            dmgEl.style.opacity = '0';
            dmgEl.style.transform = 'translateY(-12px)';
            nextDmgHide = 0;
         }

         // Camera recovery from shake
         cam.position.x += (0 - cam.position.x) * 0.06;
         cam.position.y += (0.8 - cam.position.y) * 0.06;

         // Game logic
         if (playing) {
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
                     // Miss
                  }
               }
               updateHUD();
            }
         }

         // Particles
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
         document.removeEventListener('pointerlockchange', onLockChange);
         document.removeEventListener('mousemove');
         document.removeEventListener('mousedown');
         document.removeEventListener('keydown');
         window.removeEventListener('resize', onResize);
         ro.disconnect(); unlockPointer();
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
