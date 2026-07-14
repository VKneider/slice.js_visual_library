import * as THREE from 'three';

const BTN = `
font:inherit;font-size:12px;padding:5px 12px;border-radius:6px;cursor:pointer;
border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.07);
color:rgba(255,255,255,0.85);backdrop-filter:blur(6px);transition:all .15s;
pointer-events:auto;user-select:none`.replace(/\n/g, '');

const THEMES = [
   {
      name: 'cosmic', label: 'Cosmic',
      inner: '#4facfe', mid: '#a18cd1', outer: '#f093fb',
      core: 0x6c5ce7, emissive: 0x4facfe,
      ambient: 0x222244, light1: 0x4facfe, light2: 0xf093fb, point: 0x6c5ce7,
      bg: 0x0a0a1a, glow: 0x6c5ce7,
   },
   {
      name: 'fire', label: 'Fire',
      inner: '#f97316', mid: '#ef4444', outer: '#7c2d12',
      core: 0xf97316, emissive: 0xf97316,
      ambient: 0x331100, light1: 0xf97316, light2: 0xef4444, point: 0xf97316,
      bg: 0x0d0a05, glow: 0xf97316,
   },
   {
      name: 'ice', label: 'Ice',
      inner: '#e0f2fe', mid: '#38bdf8', outer: '#1e3a5f',
      core: 0x38bdf8, emissive: 0x7dd3fc,
      ambient: 0x0a1628, light1: 0x7dd3fc, light2: 0x38bdf8, point: 0x38bdf8,
      bg: 0x050d1a, glow: 0x38bdf8,
   },
   {
      name: 'neon', label: 'Neon',
      inner: '#22d3ee', mid: '#a855f7', outer: '#ec4899',
      core: 0xa855f7, emissive: 0x22d3ee,
      ambient: 0x1a0a2e, light1: 0x22d3ee, light2: 0xec4899, point: 0xa855f7,
      bg: 0x080012, glow: 0xa855f7,
   },
];

export default class ThreeGalaxy extends HTMLElement {
   constructor(props) {
      super();
      this.innerHTML = `
<div class="tgx" style="font-family:system-ui,sans-serif">
  <div class="tgx-wrap" style="width:100%;height:520px;border-radius:12px;overflow:hidden;background:#0a0a1a;position:relative;cursor:grab">
    <div class="tgx-canvas" style="width:100%;height:100%"></div>

    <div class="tgx-controls" style="position:absolute;top:0;left:0;right:0;display:flex;flex-wrap:wrap;gap:6px;padding:10px;pointer-events:none;z-index:10">
      <button class="tgx-btn tgx-rotate-btn" type="button" data-rotating="true" style="${BTN}">⟳ Rotate</button>
      <button class="tgx-btn tgx-theme-btn" type="button" data-theme="0" style="${BTN}">🎨 Cosmic</button>
      <button class="tgx-btn tgx-burst-btn" type="button" style="${BTN}">💥 Burst</button>
      <span class="tgx-zoom-display" style="font:inherit;font-size:12px;padding:5px 10px;border-radius:6px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.6);pointer-events:none">🔍 1.0×</span>
      <span class="tgx-fps" style="font:inherit;font-size:11px;padding:5px 8px;border-radius:6px;background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.35);margin-left:auto;pointer-events:none;font-variant-numeric:tabular-nums">60 fps</span>
    </div>

    <div class="tgx-overlay" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:14px;align-items:center;pointer-events:none;opacity:0.5;font-size:11px;color:rgba(255,255,255,0.6);white-space:nowrap">
      <span>✦ 4000 stars</span>
      <span>·</span>
      <span>scroll to zoom</span>
      <span>·</span>
      <span>click burst</span>
    </div>

    <div class="tgx-shockwave" style="position:absolute;top:50%;left:50%;pointer-events:none;display:none"></div>
  </div>
</div>`;
      slice.controller.setComponentProps(this, props);
   }

   init() {
      const canvasEl = this.querySelector('.tgx-canvas');
      const wrap = this.querySelector('.tgx-wrap');
      const rotateBtn = this.querySelector('.tgx-rotate-btn');
      const themeBtn = this.querySelector('.tgx-theme-btn');
      const burstBtn = this.querySelector('.tgx-burst-btn');
      const zoomDisplay = this.querySelector('.tgx-zoom-display');
      const fpsEl = this.querySelector('.tgx-fps');

      const getSize = () => ({
         w: canvasEl.clientWidth || 780,
         h: canvasEl.clientHeight || 520,
      });

      let { w, h } = getSize();

      // ── Procedural texture assets ──
      const starTexture = this._createGlowTexture(64, [
         [0, 'rgba(255,255,255,1)'],
         [0.15, 'rgba(255,255,255,0.9)'],
         [0.5, 'rgba(255,220,255,0.3)'],
         [1, 'rgba(255,255,255,0)'],
      ]);
      const glowTexture = this._createGlowTexture(128, [
         [0, 'rgba(200,180,255,1)'],
         [0.1, 'rgba(160,120,255,0.8)'],
         [0.3, 'rgba(100,60,200,0.4)'],
         [0.6, 'rgba(50,20,120,0.15)'],
         [1, 'rgba(0,0,0,0)'],
      ]);

      // ── Scene ──
      const scene = new THREE.Scene();

      // ── Camera ──
      const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
      camera.position.set(0, 3, 12);

      // ── Renderer ──
      const renderer = new THREE.WebGLRenderer({
         antialias: true, alpha: false, powerPreference: 'high-performance',
      });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      canvasEl.appendChild(renderer.domElement);

      // ── State ──
      let currentTheme = 0;
      let rotating = true;
      let burstTime = 0;
      let shockwaveTime = 0;
      let time = 0;
      let zoomTarget = 12;
      let zoomCurrent = 12;
      let mouseX = 0, mouseY = 0;
      let targetRotX = 0, targetRotY = 0;
      let autoRotateSpeed = 0.0015;
      let isDragging = false;
      let lastDragX = 0, lastDragY = 0;
      let dragRotX = 0, dragRotY = 0;
      let frameCount = 0;
      let lastFpsTime = 0;

      // ── Build scene ──
      function applyTheme(ti) {
         const t = THEMES[ti];
         scene.background = new THREE.Color(t.bg);
         if (ambient) { ambient.color.set(t.ambient); }
         if (light1) { light1.color.set(t.light1); }
         if (light2) { light2.color.set(t.light2); }
         if (pointLight) { pointLight.color.set(t.point); }
         if (coreMat) { coreMat.color.set(t.core); coreMat.emissive.set(t.emissive); }
         if (glowMat) { glowMat.color.set(t.glow); }
         themeBtn.textContent = `🎨 ${t.label}`;
         themeBtn.dataset.theme = String(ti);
      }

      const ambient = new THREE.AmbientLight(THEMES[0].ambient, 0.4);
      scene.add(ambient);
      const light1 = new THREE.DirectionalLight(THEMES[0].light1, 1.5);
      light1.position.set(4, 6, 8);
      scene.add(light1);
      const light2 = new THREE.DirectionalLight(THEMES[0].light2, 0.8);
      light2.position.set(-5, -2, 4);
      scene.add(light2);
      const pointLight = new THREE.PointLight(THEMES[0].point, 2, 8);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);

      // ── Star particles ──
      const STAR_COUNT = 4000;
      const basePositions = new Float32Array(STAR_COUNT * 3);
      const colors = new Float32Array(STAR_COUNT * 3);
      const sizes = new Float32Array(STAR_COUNT);
      const randoms = new Float32Array(STAR_COUNT);
      const burstDirs = new Float32Array(STAR_COUNT * 3);

      for (let i = 0; i < STAR_COUNT; i++) {
         const radius = Math.pow(Math.random(), 1.8) * 6;
         const angle = radius * 4.5 + Math.random() * 0.4;
         const spread = (1 - radius / 6) * 0.35 + 0.03;
         basePositions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
         basePositions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.6;
         basePositions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
         const t = radius / 6;
         const tc = t < 0.5
            ? new THREE.Color(THEMES[0].inner).lerp(new THREE.Color(THEMES[0].mid), t * 2)
            : new THREE.Color(THEMES[0].mid).lerp(new THREE.Color(THEMES[0].outer), (t - 0.5) * 2);
         colors[i * 3] = tc.r; colors[i * 3 + 1] = tc.g; colors[i * 3 + 2] = tc.b;
         sizes[i] = (0.08 + Math.random() * 0.2) * (1 - t * 0.4);
         randoms[i] = Math.random() * Math.PI * 2;
         const dir = new THREE.Vector3(
            basePositions[i * 3] + (Math.random() - 0.5) * 0.5,
            basePositions[i * 3 + 1] + (Math.random() - 0.5) * 0.5,
            basePositions[i * 3 + 2] + (Math.random() - 0.5) * 0.5,
         ).normalize();
         burstDirs[i * 3] = dir.x; burstDirs[i * 3 + 1] = dir.y; burstDirs[i * 3 + 2] = dir.z;
      }

      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(basePositions.slice(), 3));
      starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

      const starMat = new THREE.PointsMaterial({
         size: 0.15, map: starTexture, blending: THREE.AdditiveBlending,
         depthWrite: false, transparent: true, vertexColors: true,
         opacity: 0.95, sizeAttenuation: true,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      // ── Central glow sprite ──
      const glowMat = new THREE.SpriteMaterial({
         map: glowTexture, blending: THREE.AdditiveBlending,
         transparent: true, opacity: 0.6, color: THEMES[0].glow,
      });
      const glowSprite = new THREE.Sprite(glowMat);
      glowSprite.scale.set(5, 5, 1);
      scene.add(glowSprite);

      // ── Core ──
      const coreGeo = new THREE.TorusKnotGeometry(0.5, 0.18, 100, 16);
      const coreMat = new THREE.MeshStandardMaterial({
         color: THEMES[0].core, emissive: THEMES[0].emissive,
         emissiveIntensity: 0.8, metalness: 0.9, roughness: 0.2,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 0.2;
      scene.add(core);

      // ── Shockwave ring ──
      const ringGeo = new THREE.RingGeometry(0.1, 0.25, 64);
      const ringMat = new THREE.MeshBasicMaterial({
         color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide,
         blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.5;
      ring.visible = false;
      scene.add(ring);

      // ── Orbiters ──
      const orbiters = [];
      const orbiterCount = 10;
      for (let i = 0; i < orbiterCount; i++) {
         const sz = 0.06 + Math.random() * 0.08;
         const g = new THREE.OctahedronGeometry(sz);
         const m = new THREE.MeshStandardMaterial({
            color: new THREE.Color(`hsl(${260 + Math.random() * 60}, 80%, 60%)`),
            emissive: new THREE.Color(`hsl(${260 + Math.random() * 60}, 80%, 30%)`),
            emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.3,
         });
         const mesh = new THREE.Mesh(g, m);
         const angle = (i / orbiterCount) * Math.PI * 2 + Math.random() * 0.5;
         const dist = 1.6 + Math.random() * 0.6;
         mesh.position.set(Math.cos(angle) * dist, (Math.random() - 0.5) * 0.4, Math.sin(angle) * dist);
         scene.add(mesh);
         orbiters.push({ mesh, angle, dist, speed: 0.3 + Math.random() * 0.2 });
      }

      applyTheme(0);

      // ── Interactions ──

      let dragDist = 0;
      const onMouseMove = (e) => {
         const rect = wrap.getBoundingClientRect();
         const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
         const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
         if (isDragging) {
            const dx = e.clientX - lastDragX;
            const dy = e.clientY - lastDragY;
            dragDist += Math.abs(dx) + Math.abs(dy);
            dragRotY += dx * 0.005;
            dragRotX -= dy * 0.005;
            lastDragX = e.clientX;
            lastDragY = e.clientY;
         } else {
            mouseX = nx; mouseY = ny;
         }
      };
      const onMouseDown = (e) => {
         if (e.target !== wrap && !e.target.closest?.('.tgx-wrap')) return;
         isDragging = true;
         dragDist = 0;
         lastDragX = e.clientX; lastDragY = e.clientY;
         wrap.style.cursor = 'grabbing';
      };
      const onMouseUp = () => {
         isDragging = false;
         wrap.style.cursor = 'grab';
      };
      const onMouseLeave = () => { mouseX = 0; mouseY = 0; isDragging = false; wrap.style.cursor = 'grab'; };
      const onWheel = (e) => {
         e.preventDefault();
         zoomTarget += e.deltaY * 0.008;
         zoomTarget = Math.max(4, Math.min(30, zoomTarget));
      };

      const triggerBurst = () => {
         burstTime = performance.now();
         shockwaveTime = performance.now();
         // Scatter stars outward
         const pos = starGeo.attributes.position.array;
         for (let i = 0; i < STAR_COUNT; i++) {
            const intensity = 0.3 + Math.random() * 0.7;
            pos[i * 3] = basePositions[i * 3] + burstDirs[i * 3] * intensity * 0.5;
            pos[i * 3 + 1] = basePositions[i * 3 + 1] + burstDirs[i * 3 + 1] * intensity * 0.5;
            pos[i * 3 + 2] = basePositions[i * 3 + 2] + burstDirs[i * 3 + 2] * intensity * 0.5;
         }
         starGeo.attributes.position.needsUpdate = true;
         // Flash ambient
         const origAmbient = ambient.intensity;
         ambient.intensity = 0.8;
         setTimeout(() => { ambient.intensity = origAmbient; }, 200);
      };

      wrap.addEventListener('mousemove', onMouseMove);
      wrap.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);
      wrap.addEventListener('mouseleave', onMouseLeave);
      wrap.addEventListener('wheel', onWheel, { passive: false });
      wrap.addEventListener('click', () => { if (dragDist < 8) triggerBurst(); });

      // ── Buttons ──
      rotateBtn.addEventListener('click', (e) => {
         e.stopPropagation();
         rotating = !rotating;
         rotateBtn.dataset.rotating = String(rotating);
         rotateBtn.textContent = rotating ? '⟳ Rotate' : '⟳ Paused';
         rotateBtn.style.opacity = rotating ? '1' : '0.5';
      });
      themeBtn.addEventListener('click', (e) => {
         e.stopPropagation();
         currentTheme = (currentTheme + 1) % THEMES.length;
         applyTheme(currentTheme);
         // Rebuild star colors for new theme
         const t = THEMES[currentTheme];
         const c = starGeo.attributes.color.array;
         for (let i = 0; i < STAR_COUNT; i++) {
            const posArr = starGeo.attributes.position.array;
            const rx = posArr[i * 3], ry = posArr[i * 3 + 1], rz = posArr[i * 3 + 2];
            const radius = Math.sqrt(rx * rx + ry * ry + rz * rz) || 0.01;
            const rt = Math.min(radius / 6, 1);
            const tc = rt < 0.5
               ? new THREE.Color(t.inner).lerp(new THREE.Color(t.mid), rt * 2)
               : new THREE.Color(t.mid).lerp(new THREE.Color(t.outer), (rt - 0.5) * 2);
            c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b;
         }
         starGeo.attributes.color.needsUpdate = true;
      });
      burstBtn.addEventListener('click', (e) => { e.stopPropagation(); triggerBurst(); });

      // ── Resize ──
      const onResize = () => {
         const s = getSize();
         w = s.w; h = s.h;
         camera.aspect = w / h;
         camera.updateProjectionMatrix();
         renderer.setSize(w, h);
      };
      window.addEventListener('resize', onResize);
      const ro = new ResizeObserver(onResize);
      ro.observe(canvasEl);

      // ── Animation loop ──
      let rafId;
      const loop = () => {
         rafId = requestAnimationFrame(loop);
         if (this._disposed) return;

         time += 0.01;
         frameCount++;
         const now = performance.now();
         if (now - lastFpsTime > 500) {
            fpsEl.textContent = `${Math.round(frameCount / ((now - lastFpsTime) / 1000))} fps`;
            frameCount = 0;
            lastFpsTime = now;
         }

         // Zoom
         zoomCurrent += (zoomTarget - zoomCurrent) * 0.06;
         camera.position.setLength(zoomCurrent);
         zoomDisplay.textContent = `🔍 ${zoomCurrent.toFixed(1)}×`;

         // Smooth mouse parallax
         if (!isDragging) {
            targetRotX += (mouseY * 0.25 - targetRotX) * 0.035;
            targetRotY += (mouseX * 0.45 - targetRotY) * 0.035;
         }

         // Galaxy rotation
         if (rotating) {
            stars.rotation.y += autoRotateSpeed;
            stars.rotation.x = Math.sin(time * 0.1) * 0.03;
         }

         // Core rotation
         core.rotation.x += 0.008;
         core.rotation.y += 0.015;
         coreMat.emissiveIntensity = 0.6 + Math.sin(time * 0.8) * 0.25;

         // Glow pulse
         glowMat.opacity = 0.55 + Math.sin(time * 0.5) * 0.05;

         // Burst — recover stars
         if (burstTime > 0) {
            const elapsed = (performance.now() - burstTime) / 1000;
            if (elapsed < 2) {
               const p = Math.min(elapsed / 2, 1);
               const ease = 1 - Math.pow(1 - p, 3);
               const pos = starGeo.attributes.position.array;
               for (let i = 0; i < STAR_COUNT; i++) {
                  pos[i * 3] = basePositions[i * 3] + burstDirs[i * 3] * (1 - ease) * 0.5;
                  pos[i * 3 + 1] = basePositions[i * 3 + 1] + burstDirs[i * 3 + 1] * (1 - ease) * 0.5;
                  pos[i * 3 + 2] = basePositions[i * 3 + 2] + burstDirs[i * 3 + 2] * (1 - ease) * 0.5;
               }
               starGeo.attributes.position.needsUpdate = true;

               // Core shake
               const shake = Math.sin(elapsed * 40) * 0.04 * (1 - ease);
               core.position.x = shake;
               core.position.z = shake;
            } else {
               // Restore exact base positions
               const pos = starGeo.attributes.position.array;
               for (let i = 0; i < STAR_COUNT; i++) {
                  pos[i * 3] = basePositions[i * 3];
                  pos[i * 3 + 1] = basePositions[i * 3 + 1];
                  pos[i * 3 + 2] = basePositions[i * 3 + 2];
               }
               starGeo.attributes.position.needsUpdate = true;
               core.position.x = 0;
               core.position.z = 0;
               burstTime = 0;
            }
         }

         // Shockwave
         if (shockwaveTime > 0) {
            const elapsed = (performance.now() - shockwaveTime) / 1000;
            if (elapsed < 2) {
               ring.visible = true;
               const scale = 1 + elapsed * 5;
               ring.scale.set(scale, scale, scale);
               ringMat.opacity = Math.max(0, 0.6 * (1 - elapsed / 2));
            } else {
               ring.visible = false;
               ring.scale.set(1, 1, 1);
               ringMat.opacity = 0;
               shockwaveTime = 0;
            }
         }

         // Orbiters
         for (const o of orbiters) {
            o.angle += 0.008 * o.speed;
            o.mesh.position.x = Math.cos(o.angle) * o.dist;
            o.mesh.position.z = Math.sin(o.angle) * o.dist;
            o.mesh.position.y += Math.sin(time * 0.5 + o.angle) * 0.002;
            o.mesh.rotation.x += 0.02;
            o.mesh.rotation.y += 0.03;
         }

         // Camera
         const rotY = (isDragging ? dragRotY : targetRotY) * 0.4;
         const rotX = (isDragging ? dragRotX : targetRotX) * 0.15;
         camera.position.x = Math.sin(rotY) * zoomCurrent;
         camera.position.z = Math.cos(rotY) * zoomCurrent;
         camera.position.y = 3 + rotX * 2;
         camera.lookAt(0, 0, 0);

         renderer.render(scene, camera);
      };

      this._dispose = () => {
         this._disposed = true;
         if (rafId) cancelAnimationFrame(rafId);
         wrap.removeEventListener('mousemove', onMouseMove);
         wrap.removeEventListener('mousedown', onMouseDown);
         window.removeEventListener('mouseup', onMouseUp);
         wrap.removeEventListener('mouseleave', onMouseLeave);
         wrap.removeEventListener('wheel', onWheel);
         window.removeEventListener('resize', onResize);
         ro.disconnect();
         starGeo.dispose(); starMat.dispose();
         coreGeo.dispose(); coreMat.dispose();
         glowMat.dispose(); ringGeo.dispose(); ringMat.dispose();
         glowTexture.dispose(); starTexture.dispose();
         scene.remove(pointLight);
         for (const o of orbiters) { o.mesh.geometry.dispose(); o.mesh.material.dispose(); }
         renderer.dispose();
         canvasEl.innerHTML = '';
      };

      loop();
   }

   _createGlowTexture(size, stops) {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      for (const [pos, color] of stops) gradient.addColorStop(pos, color);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      return tex;
   }

   beforeDestroy() {
      if (this._dispose) this._dispose();
   }
}

customElements.define('slice-three-galaxy', ThreeGalaxy);
