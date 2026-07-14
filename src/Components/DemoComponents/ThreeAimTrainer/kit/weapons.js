import * as THREE from 'three';

export const WEAPONS = {
   pistol: {
      name: 'Pistol', ammo: 12, maxAmmo: 12,
      fireRate: 300, reloadTime: 800,
      damage: 10, spread: 0.015, auto: false,
      pellets: 1, color: 0x8888ff, hex: '#8888ff', key: '1',
   },
   rifle: {
      name: 'Rifle', ammo: 30, maxAmmo: 30,
      fireRate: 100, reloadTime: 1500,
      damage: 12, spread: 0.008, auto: true,
      pellets: 1, color: 0x22c55e, hex: '#22c55e', key: '2',
   },
   shotgun: {
      name: 'Shotgun', ammo: 6, maxAmmo: 6,
      fireRate: 600, reloadTime: 2000,
      damage: 8, spread: 0.12, auto: false,
      pellets: 8, color: 0xef4444, hex: '#ef4444', key: '3',
   },
};

const matCache = {};

function mat(color, metalness, roughness, emissive, emissiveIntensity) {
   const k = `${color}_${metalness}_${roughness}_${emissive}_${emissiveIntensity}`;
   if (!matCache[k]) {
      matCache[k] = new THREE.MeshStandardMaterial({
         color, metalness, roughness,
         emissive: emissive || 0x000000,
         emissiveIntensity: emissiveIntensity || 0,
      });
   }
   return matCache[k];
}

export function createWeaponModel(type) {
   const g = new THREE.Group();

   // All models built facing -Z (camera forward). Barrel extends in -Z.
   if (type === 'pistol') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.22), mat(0x5555aa, 0.6, 0.3, 0x222244, 0.3));
      g.add(body);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.12), mat(0x7777cc, 0.7, 0.25, 0x333355, 0.2));
      barrel.position.set(0, 0.005, -0.17);
      g.add(barrel);
      const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.08), mat(0x333366, 0.4, 0.5, 0x111133, 0.3));
      grip.position.set(0, -0.08, 0.04);
      grip.rotation.x = -0.15;
      g.add(grip);
      const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.02, 0.05), mat(0x444477, 0.5, 0.4));
      trigger.position.set(0, -0.025, -0.02);
      g.add(trigger);
   } else if (type === 'rifle') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.42), mat(0x336633, 0.6, 0.3, 0x113311, 0.3));
      g.add(body);
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.28), mat(0x55aa55, 0.7, 0.25, 0x224422, 0.2));
      barrel.position.set(0, 0, -0.35);
      g.add(barrel);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.14), mat(0x224422, 0.4, 0.5, 0x112211, 0.3));
      stock.position.set(0, 0, 0.28);
      g.add(stock);
      const mag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.08), mat(0x448844, 0.5, 0.35, 0x224422, 0.2));
      mag.position.set(0, -0.075, 0);
      g.add(mag);
      const scope = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.06), mat(0x88cc88, 0.6, 0.3));
      scope.position.set(0, 0.06, -0.06);
      g.add(scope);
   } else if (type === 'shotgun') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.34), mat(0x663333, 0.6, 0.3, 0x331111, 0.3));
      g.add(body);
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.24), mat(0xcc4444, 0.7, 0.25, 0x551111, 0.2));
      b1.position.set(-0.03, 0.005, -0.29);
      g.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.24), mat(0xcc4444, 0.7, 0.25, 0x551111, 0.2));
      b2.position.set(0.03, 0.005, -0.29);
      g.add(b2);
      const pump = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.06), mat(0x884444, 0.5, 0.35, 0x331111, 0.2));
      pump.position.set(0, -0.015, -0.12);
      g.add(pump);
      const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.14), mat(0x442222, 0.4, 0.5, 0x221111, 0.3));
      stock.position.set(0, 0, 0.24);
      g.add(stock);
   }

   return g;
}

export function cleanupModel(group) {
   group.traverse(c => {
      if (c.isMesh) {
         c.geometry.dispose();
         if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
         else c.material.dispose();
      }
   });
}

export function createMuzzleFlash() {
   const c = document.createElement('canvas');
   c.width = 128; c.height = 128;
   const ctx = c.getContext('2d');
   const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
   grad.addColorStop(0, 'rgba(255,255,220,1)');
   grad.addColorStop(0.1, 'rgba(255,200,50,0.8)');
   grad.addColorStop(0.4, 'rgba(255,100,20,0.4)');
   grad.addColorStop(1, 'rgba(255,255,255,0)');
   ctx.fillStyle = grad;
   ctx.fillRect(0, 0, 128, 128);
   const tex = new THREE.CanvasTexture(c);
   const mat = new THREE.SpriteMaterial({
      map: tex, blending: THREE.AdditiveBlending, transparent: true,
      opacity: 0, depthWrite: false, depthTest: false,
   });
   const sprite = new THREE.Sprite(mat);
   sprite.scale.set(0.5, 0.5, 1);
   sprite.position.set(0.25, -0.05, -0.55);
   return { sprite, mat, tex };
}

export function addTracer(scene, from, to, color) {
   const pts = [from.clone(), to.clone()];
   const geo = new THREE.BufferGeometry().setFromPoints(pts);
   const mat = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false,
   });
   const line = new THREE.Line(geo, mat);
   scene.add(line);
   return { line, geo, mat, birth: performance.now(), life: 120 };
}

export function updateTracers(tracers, now) {
   for (let i = tracers.length - 1; i >= 0; i--) {
      const t = tracers[i];
      const age = now - t.birth;
      if (age > t.life) {
         t.mat.dispose(); t.geo.dispose(); t.line.parent?.remove(t.line);
         tracers.splice(i, 1);
      } else {
         t.mat.opacity = 1 - age / t.life;
      }
   }
   return tracers;
}

export function createParticleBurst(scene, pos, color, count) {
   const pcs = [];
   for (let i = 0; i < count; i++) {
      const sz = 0.02 + Math.random() * 0.06;
      const g = new THREE.SphereGeometry(sz, 6, 6);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(g, m);
      mesh.position.copy(pos);
      const dir = new THREE.Vector3(
         (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2,
      ).normalize().multiplyScalar(0.4 + Math.random() * 0.8);
      scene.add(mesh);
      pcs.push({
         mesh, geo: g, mat: m, dir,
         birth: performance.now(), life: 400 + Math.random() * 300,
         vel: dir.clone().multiplyScalar(0.015),
      });
   }
   return pcs;
}

export function updateParticles(particles, now) {
   for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.birth;
      if (age > p.life) {
         p.mat.dispose(); p.geo.dispose(); p.mesh.parent?.remove(p.mesh);
         particles.splice(i, 1);
      } else {
         p.mesh.position.add(p.vel);
         p.mesh.scale.multiplyScalar(0.985);
         p.mat.opacity = 1 - age / p.life;
         p.vel.y -= 0.0008;
      }
   }
   return particles;
}
