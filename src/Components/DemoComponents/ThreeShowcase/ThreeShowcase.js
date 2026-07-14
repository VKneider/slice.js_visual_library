import * as THREE from 'three';

const CARD = {
   background: 'var(--secondary-background-color, #f4f4f5)',
   border: '1px solid var(--medium-color, #ddd)',
   borderRadius: '10px', padding: '12px 14px'
};
const BTN = {
   font: 'inherit', fontSize: '13px', padding: '8px 14px', borderRadius: '8px',
   cursor: 'pointer', border: '1px solid var(--medium-color, #ccc)',
   background: 'var(--secondary-background-color, #f4f4f5)', color: 'var(--font-primary-color, #111)'
};
const style = (el, s) => Object.assign(el.style, s);

export default class ThreeShowcase extends HTMLElement {
   constructor(props) {
      super();
      this.innerHTML = `
<div class="tx" style="display:grid;gap:16px;max-width:780px;font-family:system-ui,sans-serif">

  <div class="tx-group">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888">Three.js Showcase</span>
    <div class="tx-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:6px">

      <!-- 1. Rotating Cube -->
      <div class="tx-card" style="${cssObj(CARD)}">
        <div class="tx-canvas-wrap tx-cube" style="width:100%;height:130px;border-radius:6px;overflow:hidden;background:#1a1a2e;position:relative">
          <span class="tx-status" style="position:absolute;bottom:4px;right:6px;font-size:9px;color:rgba(255,255,255,0.4)">three</span>
        </div>
        <span class="tx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">BoxGeometry + MeshBasicMaterial · auto-rotate</span>
      </div>

      <!-- 2. Shiny Sphere -->
      <div class="tx-card" style="${cssObj(CARD)}">
        <div class="tx-canvas-wrap tx-sphere" style="width:100%;height:130px;border-radius:6px;overflow:hidden;background:#1a1a2e;position:relative">
          <span class="tx-ok" style="position:absolute;bottom:4px;right:6px;font-size:9px;color:rgba(255,255,255,0.4)">lights</span>
        </div>
        <span class="tx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">SphereGeometry + MeshStandardMaterial · ambient + directional lights</span>
      </div>

      <!-- 3. Wireframe toggle -->
      <div class="tx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <button class="tx-wf-btn" type="button" data-wf="false" style="${cssObj(BTN)}">Wireframe: OFF</button>
        </div>
        <div class="tx-canvas-wrap tx-wf" style="width:100%;height:110px;border-radius:6px;overflow:hidden;background:#1a1a2e;position:relative"></div>
        <span class="tx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">IcosahedronGeometry · click toggles wireframe</span>
      </div>

      <!-- 4. Color click -->
      <div class="tx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <button class="tx-color-btn" type="button" data-color-hits="0" style="${cssObj(BTN)}">Change color</button>
        </div>
        <div class="tx-canvas-wrap tx-color" style="width:100%;height:110px;border-radius:6px;overflow:hidden;background:#1a1a2e;position:relative"></div>
        <span class="tx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">TorusKnotGeometry · click randomizes material color</span>
      </div>

      <!-- 5. Bounce -->
      <div class="tx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          <button class="tx-bounce-btn" type="button" data-bounces="0" style="${cssObj(BTN)}">Bounce</button>
        </div>
        <div class="tx-canvas-wrap tx-bounce" style="width:100%;height:110px;border-radius:6px;overflow:hidden;background:#1a1a2e;position:relative"></div>
        <span class="tx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">TorusGeometry · click triggers y-axis bounce via GSAP-like tween</span>
      </div>

      <!-- 6. Multi geometry -->
      <div class="tx-card" style="${cssObj(CARD)}">
        <div class="tx-canvas-wrap tx-multi" style="width:100%;height:130px;border-radius:6px;overflow:hidden;background:#1a1a2e;position:relative">
          <span class="tx-geo-count" style="position:absolute;bottom:4px;right:6px;font-size:9px;color:rgba(255,255,255,0.4)">4 objects</span>
        </div>
        <span class="tx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">4 geometries in one scene · cone, torus, box, dodecahedron</span>
      </div>

    </div>
  </div>

</div>`;
      this._demos = [];
      this._rafId = null;
      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._initCube();
      this._initSphere();
      this._initWireframe();
      this._initColor();
      this._initBounce();
      this._initMulti();
      this._startLoop();
   }

   // ── helpers ──

   _setup(sel) {
      const wrap = this.querySelector(sel);
      const w = wrap.clientWidth || 220;
      const h = wrap.clientHeight || 130;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.z = 4;
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      wrap.appendChild(renderer.domElement);
      const resize = () => {
         const rw = wrap.clientWidth || 220;
         const rh = wrap.clientHeight || 130;
         camera.aspect = rw / rh;
         camera.updateProjectionMatrix();
         renderer.setSize(rw, rh);
      };
      window.addEventListener('resize', resize);
      const demo = { wrap, scene, camera, renderer, resize, disposed: false, animate: null };
      this._demos.push(demo);
      wrap._demoRef = demo;
      return demo;
   }

   _startLoop() {
      const loop = () => {
         if (this._disposed) return;
         this._rafId = requestAnimationFrame(loop);
         for (const d of this._demos) {
            if (!d.disposed && d.animate) d.animate();
            if (!d.disposed) d.renderer.render(d.scene, d.camera);
         }
      };
      loop();
   }

   _randColor() {
      return new THREE.Color(`hsl(${Math.random() * 360}, 70%, 55%)`);
   }

   // ── 1. Rotating Cube ──
   _initCube() {
      const d = this._setup('.tx-cube');
      const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const mat = new THREE.MeshBasicMaterial({ color: 0x6c5ce7 });
      const mesh = new THREE.Mesh(geo, mat);
      d.scene.add(mesh);
      d.animate = () => { mesh.rotation.x += 0.008; mesh.rotation.y += 0.015; };
      d.scene.userData = { mesh, geo, mat };
   }

   // ── 2. Shiny Sphere ──
   _initSphere() {
      const d = this._setup('.tx-sphere');
      const ambient = new THREE.AmbientLight(0x404060);
      d.scene.add(ambient);
      // Use two directional lights for nicer shading
      const light1 = new THREE.DirectionalLight(0xffffff, 1);
      light1.position.set(2, 3, 4);
      d.scene.add(light1);
      const light2 = new THREE.DirectionalLight(0xff8844, 0.5);
      light2.position.set(-3, 1, -2);
      d.scene.add(light2);
      const geo = new THREE.SphereGeometry(0.9, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.6, roughness: 0.3 });
      const mesh = new THREE.Mesh(geo, mat);
      d.scene.add(mesh);
      d.animate = () => { mesh.rotation.y += 0.01; mesh.rotation.x += 0.005; };
      d.scene.userData = { mesh, geo, mat };
   }

   // ── 3. Wireframe Toggle ──
   _initWireframe() {
      const d = this._setup('.tx-wf');
      const geo = new THREE.IcosahedronGeometry(1, 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, wireframe: false });
      const mesh = new THREE.Mesh(geo, mat);
      d.scene.add(mesh);
      const ambient = new THREE.AmbientLight(0x404060);
      d.scene.add(ambient);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(2, 3, 4);
      d.scene.add(light);
      d.animate = () => { mesh.rotation.x += 0.01; mesh.rotation.y += 0.015; };

      const btn = this.querySelector('.tx-wf-btn');
      btn.addEventListener('click', () => {
         const on = btn.dataset.wf === 'true';
         mat.wireframe = !on;
         btn.dataset.wf = on ? 'false' : 'true';
         btn.textContent = `Wireframe: ${on ? 'OFF' : 'ON'}`;
      });
      d.scene.userData = { mesh, geo, mat };
   }

   // ── 4. Color Change ──
   _initColor() {
      const d = this._setup('.tx-color');
      const geo = new THREE.TorusKnotGeometry(0.7, 0.25, 64, 16);
      const mat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.4, roughness: 0.5 });
      const mesh = new THREE.Mesh(geo, mat);
      d.scene.add(mesh);
      const ambient = new THREE.AmbientLight(0x404060);
      d.scene.add(ambient);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(2, 3, 4);
      d.scene.add(light);
      d.animate = () => { mesh.rotation.x += 0.008; mesh.rotation.y += 0.02; };

      const btn = this.querySelector('.tx-color-btn');
      btn.addEventListener('click', () => {
         mat.color = this._randColor();
         const n = Number(btn.dataset.colorHits || '0') + 1;
         btn.dataset.colorHits = String(n);
      });
      d.scene.userData = { mesh, geo, mat };
   }

   // ── 5. Bounce ──
   _initBounce() {
      const d = this._setup('.tx-bounce');
      d.camera.position.z = 3.5;
      const geo = new THREE.TorusGeometry(0.8, 0.3, 24, 48);
      const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.3, roughness: 0.6 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = Math.PI / 2;
      d.scene.add(mesh);
      const ambient = new THREE.AmbientLight(0x404060);
      d.scene.add(ambient);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(2, 3, 4);
      d.scene.add(light);

      let bounceStart = 0;
      const BOUNCE_DURATION = 600;
      d.animate = () => {
         mesh.rotation.z += 0.01;
         if (bounceStart > 0) {
            const elapsed = performance.now() - bounceStart;
            const t = Math.min(elapsed / BOUNCE_DURATION, 1);
            // Ease-out cubic: 1 - (1-t)^3
            const ease = 1 - Math.pow(1 - t, 3);
            mesh.position.y = -1.2 + ease * 2.4;
            if (t >= 1) { mesh.position.y = 1.2; bounceStart = 0; }
         }
      };

      const btn = this.querySelector('.tx-bounce-btn');
      btn.addEventListener('click', () => {
         const n = Number(btn.dataset.bounces || '0') + 1;
         btn.dataset.bounces = String(n);
         bounceStart = performance.now();
      });
      d.scene.userData = { mesh, geo, mat };
   }

   // ── 6. Multi Geometry ──
   _initMulti() {
      const d = this._setup('.tx-multi');
      d.camera.position.z = 4.5;

      const group = new THREE.Group();
      const ambient = new THREE.AmbientLight(0x404060);
      d.scene.add(ambient);
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(2, 3, 4);
      d.scene.add(light);

      const configs = [
         { geo: new THREE.ConeGeometry(0.4, 0.7, 12), color: 0x6c5ce7, x: -1.2, y: 0.2 },
         { geo: new THREE.TorusGeometry(0.35, 0.12, 12, 24), color: 0xf59e0b, x: -0.4, y: -0.1 },
         { geo: new THREE.BoxGeometry(0.5, 0.5, 0.5), color: 0x10b981, x: 0.5, y: 0 },
         { geo: new THREE.DodecahedronGeometry(0.35), color: 0x3b82f6, x: 1.3, y: 0.15 },
      ];
      for (const cfg of configs) {
         const m = new THREE.Mesh(cfg.geo, new THREE.MeshStandardMaterial({ color: cfg.color }));
         m.position.set(cfg.x, cfg.y, 0);
         group.add(m);
      }
      d.scene.add(group);

      d.animate = () => { group.rotation.y += 0.008; };
      d.scene.userData = { group, configs };
   }

   beforeDestroy() {
      this._disposed = true;
      if (this._rafId) cancelAnimationFrame(this._rafId);
      for (const d of this._demos) {
         if (d.disposed) continue;
         d.disposed = true;
         window.removeEventListener('resize', d.resize);
         // Dispose scene objects
         d.scene.traverse((child) => {
            if (child.isMesh) {
               child.geometry?.dispose();
               if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
               else child.material?.dispose();
            }
         });
         d.renderer.dispose();
         d.wrap.innerHTML = '';
      }
      this._demos = [];
   }
}

function cssObj(obj) {
   return Object.entries(obj).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';');
}

customElements.define('slice-three-showcase', ThreeShowcase);
