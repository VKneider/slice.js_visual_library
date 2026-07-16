import * as THREE from 'three';

const BOUND_X = 4.5;
const BOUND_Y = 2.5;

// The spheres the player shoots at.
//
// Targets are pooled and their meshes share one unit-sphere geometry (size comes
// from `scale`), because a round spawns dozens of them: allocating a geometry,
// a ring and two materials per spawn made every target a small permanent leak
// and put steady pressure on the GC mid-aim.
export class TargetField {
   constructor(scene) {
      this.scene = scene;
      this.active = [];
      // Kept in sync with `active` so the raycast has an array to hand straight
      // to three.js — the hot path used to rebuild one per pellet (8 per shotgun
      // blast) via filter().map().
      this.meshes = [];
      this.pool = [];
      this.sphereGeo = new THREE.SphereGeometry(1, 20, 20);
      this.ringGeo = new THREE.RingGeometry(1.1, 1.4, 24);
   }

   acquire() {
      const pooled = this.pool.pop();
      if (pooled) return pooled;

      const mat = new THREE.MeshStandardMaterial({ emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.4 });
      const ringMat = new THREE.MeshBasicMaterial({
         transparent: true,
         opacity: 0.15,
         side: THREE.DoubleSide,
         blending: THREE.AdditiveBlending,
         depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.sphereGeo, mat);
      const ring = new THREE.Mesh(this.ringGeo, ringMat);
      const target = { mesh, ring, mat, ringMat, alive: false, r: 1, vx: 0, vy: 0, spawn: 0, life: 0, seed: 0, headshot: false };
      // Lets a raycast hit resolve straight back to its target instead of a
      // linear scan of every live target.
      mesh.userData.target = target;
      return target;
   }

   spawn(diff, now, cam) {
      const target = this.acquire();
      const r = diff.r[0] + Math.random() * (diff.r[1] - diff.r[0]);
      const hue = 200 + Math.random() * 160;

      target.r = r;
      target.alive = true;
      target.spawn = now;
      target.life = 1800 + Math.random() * 1800;
      target.seed = Math.random() * Math.PI * 2;
      target.headshot = r < 0.25;
      target.vx = (Math.random() - 0.5) * diff.ms * 0.6;
      target.vy = (Math.random() - 0.5) * diff.ms * 0.4;

      target.mat.color.setHSL(hue / 360, 0.85, 0.55);
      target.mat.emissive.copy(target.mat.color);
      target.ringMat.color.copy(target.mat.color);

      target.mesh.scale.setScalar(r);
      target.ring.scale.setScalar(r);
      target.mesh.position.set(
         (Math.random() - 0.5) * 9,
         -1.8 + Math.random() * 4,
         -2.5 - Math.random() * 6,
      );
      target.ring.position.copy(target.mesh.position);
      target.ring.lookAt(cam.position);

      this.scene.add(target.mesh, target.ring);
      this.active.push(target);
      this.meshes.push(target.mesh);
      return target;
   }

   /** Returns the target to the pool; its meshes and materials are reused. */
   retire(target) {
      if (!target.alive) return;
      target.alive = false;
      this.scene.remove(target.mesh, target.ring);

      // Swap-remove: order does not matter and this keeps retirement O(1)
      // instead of shifting the whole array on every kill.
      const i = this.active.indexOf(target);
      if (i !== -1) {
         this.active[i] = this.active[this.active.length - 1];
         this.active.pop();
         this.meshes[i] = this.meshes[this.meshes.length - 1];
         this.meshes.pop();
      }
      this.pool.push(target);
   }

   /**
    * Advances every live target and retires the expired ones.
    * @param {number} k frame-rate scale (dt * 60) so motion is time-based
    * @param {number} now performance.now()
    * @param {THREE.Camera} cam targets' rings always face the player
    * @param {(target: object) => void} onExpire
    */
   update(k, now, cam, onExpire) {
      for (let i = this.active.length - 1; i >= 0; i--) {
         const target = this.active[i];

         if (now - target.spawn > target.life) {
            this.retire(target);
            onExpire?.(target);
            continue;
         }

         target.mesh.position.x += target.vx * 0.008 * k;
         target.mesh.position.y += target.vy * 0.008 * k;
         if (Math.abs(target.mesh.position.x) > BOUND_X) target.vx *= -1;
         if (Math.abs(target.mesh.position.y) > BOUND_Y) target.vy *= -1;
         target.mesh.position.y += Math.sin(now * 0.002 + target.seed) * 0.003 * k;

         target.ring.position.copy(target.mesh.position);
         target.ring.lookAt(cam.position);
      }
   }

   /** Retires every live target (round reset) without freeing the pool. */
   clear() {
      for (let i = this.active.length - 1; i >= 0; i--) this.retire(this.active[i]);
   }

   dispose() {
      this.clear();
      for (const target of this.pool) {
         target.mat.dispose();
         target.ringMat.dispose();
      }
      this.pool.length = 0;
      this.sphereGeo.dispose();
      this.ringGeo.dispose();
   }
}
