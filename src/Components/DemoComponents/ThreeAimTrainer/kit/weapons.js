import * as THREE from 'three';

// Static per-weapon config. `maxAmmo` is the magazine size; the rounds actually
// left in each magazine are game state, tracked by the component.
export const WEAPONS = {
   pistol: {
      name: 'Pistol', maxAmmo: 12,
      fireRate: 300, reloadTime: 800,
      damage: 10, spread: 0.015, auto: false,
      pellets: 1, color: 0x8888ff, hex: '#8888ff', key: '1',
   },
   rifle: {
      name: 'Rifle', maxAmmo: 30,
      fireRate: 100, reloadTime: 1500,
      damage: 12, spread: 0.008, auto: true,
      pellets: 1, color: 0x22c55e, hex: '#22c55e', key: '2',
   },
   shotgun: {
      name: 'Shotgun', maxAmmo: 6,
      fireRate: 600, reloadTime: 2000,
      damage: 8, spread: 0.12, auto: false,
      pellets: 8, color: 0xef4444, hex: '#ef4444', key: '3',
   },
};

const matCache = {};
const texCache = {};

// ── Procedural surface detail ────────────────────────────────────────────────
// Textures are drawn to a canvas at load rather than shipped as image files:
// the kit stays self-contained (nothing to copy into public/, nothing to 404)
// and each one is a few KB of code instead of a binary asset.
//
// All of these drive roughness/bump, never colour. Colour stays with the
// material so the existing palette per weapon is untouched — what changes is
// that light now breaks up across a surface instead of sliding over a flat one.

function drawTexture(key, size, draw, { repeat = [1, 1] } = {}) {
   if (texCache[key]) return texCache[key];

   const canvas = document.createElement('canvas');
   canvas.width = canvas.height = size;
   draw(canvas.getContext('2d'), size);

   const tex = new THREE.CanvasTexture(canvas);
   tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
   tex.repeat.set(repeat[0], repeat[1]);
   tex.anisotropy = 4;
   texCache[key] = tex;
   return tex;
}

/** Brushed metal: fine horizontal grain, so highlights streak along the body. */
function brushedMetal() {
   return drawTexture('brushed', 256, (ctx, s) => {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 2600; i++) {
         const y = Math.random() * s;
         const len = 12 + Math.random() * 90;
         const shade = 90 + Math.random() * 90;
         ctx.strokeStyle = `rgba(${shade},${shade},${shade},0.5)`;
         ctx.lineWidth = Math.random() < 0.75 ? 1 : 2;
         ctx.beginPath();
         ctx.moveTo(Math.random() * s, y);
         ctx.lineTo(Math.random() * s + len, y + (Math.random() - 0.5));
         ctx.stroke();
      }
   }, { repeat: [2, 1] });
}

/** Grip: diagonal cross-hatch stipple — reads as knurled rubber under a moving light. */
function gripStipple() {
   return drawTexture('grip', 128, (ctx, s) => {
      ctx.fillStyle = '#5a5a5a';
      ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(225,225,225,0.85)';
      ctx.lineWidth = 1.5;
      const step = 9;
      for (let i = -s; i < s * 2; i += step) {
         ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + s, s); ctx.stroke();
         ctx.beginPath(); ctx.moveTo(i + s, 0); ctx.lineTo(i, s); ctx.stroke();
      }
      // Dot the diamonds so the hatch doesn't read as flat lines.
      ctx.fillStyle = 'rgba(20,20,20,0.55)';
      for (let x = 0; x < s; x += step) {
         for (let y = 0; y < s; y += step) ctx.fillRect(x + 3, y + 3, 2, 2);
      }
   }, { repeat: [3, 3] });
}

/** Machined barrel: tight concentric rings left by a lathe. */
function machinedRings() {
   return drawTexture('machined', 128, (ctx, s) => {
      ctx.fillStyle = '#6e6e6e';
      ctx.fillRect(0, 0, s, s);
      for (let x = 0; x < s; x += 3) {
         const shade = 70 + Math.random() * 120;
         ctx.fillStyle = `rgba(${shade},${shade},${shade},0.6)`;
         ctx.fillRect(x, 0, 1.5, s);
      }
   }, { repeat: [4, 1] });
}

const SURFACES = { brushed: brushedMetal, grip: gripStipple, machined: machinedRings };

/**
 * @param {string} [surface] key into SURFACES; adds roughness + bump detail.
 *   Omit for smooth parts (sights, trim) that should stay clean.
 */
function mat(color, metalness, roughness, emissive, emissiveIntensity, surface) {
   const k = `${color}_${metalness}_${roughness}_${emissive}_${emissiveIntensity}_${surface || ''}`;
   if (!matCache[k]) {
      const map = surface ? SURFACES[surface]() : null;
      matCache[k] = new THREE.MeshStandardMaterial({
         color, metalness, roughness,
         emissive: emissive || 0x000000,
         emissiveIntensity: emissiveIntensity || 0,
         roughnessMap: map,
         bumpMap: map,
         bumpScale: surface === 'grip' ? 0.012 : 0.004,
         // Reflections come from scene.environment (see buildArena): without one,
         // a metalness of 0.6+ has nothing to mirror and just renders dark.
         envMapIntensity: 1.1,
      });
   }
   return matCache[k];
}

// A barrel is a barrel: CylinderGeometry rotated onto -Z. These were boxes, so
// every "round" part had four flat faces and read as a stick from the hip.
function tube(radius, length, material, segments = 12) {
   const geo = new THREE.CylinderGeometry(radius, radius, length, segments);
   geo.rotateX(Math.PI / 2);
   return new THREE.Mesh(geo, material);
}

function box(w, h, d, material) {
   return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

const put = (group, mesh, x, y, z) => {
   mesh.position.set(x, y, z);
   group.add(mesh);
   return mesh;
};

/**
 * Marks the barrel tip, in the model's own space, as `group.userData.muzzle`.
 *
 * The muzzle used to be a table of hand-measured camera-space offsets kept
 * alongside the models. Two sources of truth for one point: they drifted apart
 * whenever a model changed, and the offsets could not follow the weapon at all
 * once it moved (aiming down sights re-centres it). As a child of the group the
 * tip is wherever the barrel actually is — bob, sway and zoom included — for free.
 */
function markMuzzle(group, x, y, z) {
   const muzzle = new THREE.Object3D();
   muzzle.position.set(x, y, z);
   group.add(muzzle);
   group.userData.muzzle = muzzle;
}

export function createWeaponModel(type) {
   const g = new THREE.Group();

   // All models built facing -Z (camera forward). Barrel extends in -Z.
   if (type === 'pistol') {
      put(g, box(0.14, 0.06, 0.22, mat(0x5555aa, 0.65, 0.35, 0x222244, 0.3, 'brushed')), 0, 0, 0);
      put(g, tube(0.018, 0.13, mat(0x7777cc, 0.85, 0.2, 0x333355, 0.2, 'machined')), 0, 0.005, -0.17);
      // Slide rail: a highlight edge along the top so the body isn't one slab.
      put(g, box(0.10, 0.012, 0.20, mat(0x9a9aff, 0.9, 0.15, 0x4444aa, 0.35)), 0, 0.036, -0.01);
      const grip = put(g, box(0.06, 0.1, 0.08, mat(0x333366, 0.25, 0.75, 0x111133, 0.3, 'grip')), 0, -0.08, 0.04);
      grip.rotation.x = -0.15;
      put(g, box(0.07, 0.02, 0.05, mat(0x444477, 0.5, 0.45)), 0, -0.025, -0.02);
      // Front sight — the eye needs something to line up when aiming down sights.
      put(g, box(0.008, 0.016, 0.01, mat(0xf5f5ff, 0.3, 0.6, 0xf59e0b, 0.9)), 0, 0.05, -0.21);
      // Barrel sits at z -0.17 and is 0.13 long, so its tip is at -0.235.
      markMuzzle(g, 0, 0.005, -0.235);
   } else if (type === 'rifle') {
      put(g, box(0.1, 0.06, 0.42, mat(0x336633, 0.65, 0.35, 0x113311, 0.3, 'brushed')), 0, 0, 0);
      put(g, tube(0.015, 0.3, mat(0x55aa55, 0.85, 0.2, 0x224422, 0.2, 'machined')), 0, 0, -0.35);
      // Muzzle brake: reads as a real barrel end instead of a cut-off stick.
      put(g, tube(0.024, 0.05, mat(0x2f4f2f, 0.9, 0.25, 0x112211, 0.2, 'machined'), 8), 0, 0, -0.50);
      // Handguard vents.
      for (let i = 0; i < 4; i++) {
         put(g, box(0.052, 0.006, 0.018, mat(0x1d3a1d, 0.6, 0.5)), 0, 0.032, -0.13 - i * 0.045);
      }
      const stock = put(g, box(0.06, 0.07, 0.14, mat(0x224422, 0.2, 0.8, 0x112211, 0.3, 'grip')), 0, 0, 0.28);
      stock.rotation.x = 0.04;
      put(g, box(0.04, 0.09, 0.08, mat(0x448844, 0.55, 0.4, 0x224422, 0.2, 'brushed')), 0, -0.075, 0);
      put(g, box(0.05, 0.085, 0.05, mat(0x2a4a2a, 0.25, 0.8, 0x112211, 0.3, 'grip')), 0, -0.07, 0.1);
      put(g, tube(0.018, 0.09, mat(0x88cc88, 0.7, 0.25), 10), 0, 0.062, -0.06);
      put(g, box(0.006, 0.014, 0.006, mat(0xf5fff5, 0.3, 0.6, 0x22c55e, 0.9)), 0, 0.082, -0.10);
      // Muzzle brake ends at -0.50 - 0.025.
      markMuzzle(g, 0, 0, -0.525);
   } else if (type === 'shotgun') {
      put(g, box(0.16, 0.06, 0.34, mat(0x663333, 0.65, 0.35, 0x331111, 0.3, 'brushed')), 0, 0, 0);
      for (const x of [-0.03, 0.03]) {
         put(g, tube(0.016, 0.26, mat(0xcc4444, 0.85, 0.2, 0x551111, 0.2, 'machined')), x, 0.005, -0.29);
      }
      // Barrel clamp — ties the two tubes together so they read as one weapon.
      put(g, box(0.085, 0.014, 0.02, mat(0x3a1a1a, 0.8, 0.3)), 0, 0.005, -0.38);
      put(g, box(0.1, 0.04, 0.06, mat(0x884444, 0.25, 0.8, 0x331111, 0.2, 'grip')), 0, -0.015, -0.12);
      const stock = put(g, box(0.08, 0.08, 0.14, mat(0x442222, 0.2, 0.8, 0x221111, 0.3, 'grip')), 0, 0, 0.24);
      stock.rotation.x = 0.05;
      put(g, box(0.006, 0.012, 0.008, mat(0xfff5f5, 0.3, 0.6, 0xef4444, 0.9)), 0, 0.04, -0.40);
      // Twin barrels sit at z -0.29 and are 0.26 long: tips at -0.42, midpoint on x.
      markMuzzle(g, 0, 0.005, -0.42);
   }

   return g;
}

// Frees a model's geometries. Materials are deliberately left alone: they come
// from the module-level `matCache` and are shared across models AND across
// mounts, so disposing them here left the cache handing out dead materials to
// the next component that asked for one. Use disposeWeaponMaterials() for those.
export function cleanupModel(group) {
   group.traverse(c => {
      if (c.isMesh) c.geometry.dispose();
   });
}

// Drops the shared material and texture caches. Safe to call on teardown: the
// next createWeaponModel() redraws whatever it needs.
export function disposeWeaponMaterials() {
   for (const k of Object.keys(matCache)) {
      matCache[k].dispose();
      delete matCache[k];
   }
   for (const k of Object.keys(texCache)) {
      texCache[k].dispose();
      delete texCache[k];
   }
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

/**
 * @param {number} k frame-rate scale (dt * 60). The per-frame tuning below is
 *   kept as-is and scaled by k, so the burst looks identical at 60Hz and drifts
 *   neither faster on a 144Hz screen nor slower on a struggling one.
 */
export function updateParticles(particles, now, k = 1) {
   for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.birth;
      if (age > p.life) {
         p.mat.dispose(); p.geo.dispose(); p.mesh.parent?.remove(p.mesh);
         particles.splice(i, 1);
      } else {
         p.mesh.position.addScaledVector(p.vel, k);
         p.mesh.scale.multiplyScalar(Math.pow(0.985, k));
         p.mat.opacity = 1 - age / p.life;
         p.vel.y -= 0.0008 * k;
      }
   }
   return particles;
}
