import * as THREE from 'three';

// The room the player shoots in: walls, floor grid, wall strips and lights.
//
// Every geometry and material is tracked and returned behind `dispose()`.
// renderer.dispose() frees GPU program/state but NOT the geometries and
// materials the scene holds, so anything built here has to be released by hand
// or it survives the component and leaks a full arena per mount.
// A metallic MeshStandardMaterial mirrors scene.environment — with no
// environment there is nothing to mirror, so every metal part renders as a flat
// dark shape lit only by the three lights below. This bakes a small procedural
// sky (violet ceiling glow → dark floor, with a hot strip where the arena's
// light sits) into a PMREM, which is what gives the weapons their sheen.
function buildEnvironment(renderer) {
   const canvas = document.createElement('canvas');
   canvas.width = 64;
   canvas.height = 32;
   const ctx = canvas.getContext('2d');

   const sky = ctx.createLinearGradient(0, 0, 0, 32);
   sky.addColorStop(0, '#4a3f8f');
   sky.addColorStop(0.45, '#151530');
   sky.addColorStop(1, '#05050c');
   ctx.fillStyle = sky;
   ctx.fillRect(0, 0, 64, 32);

   ctx.fillStyle = 'rgba(150,140,255,0.85)';
   ctx.fillRect(0, 5, 64, 3);

   const tex = new THREE.CanvasTexture(canvas);
   tex.mapping = THREE.EquirectangularReflectionMapping;
   tex.colorSpace = THREE.SRGBColorSpace;

   const pmrem = new THREE.PMREMGenerator(renderer);
   const target = pmrem.fromEquirectangular(tex);
   pmrem.dispose();
   tex.dispose();
   return target;
}

export function buildArena(scene, renderer) {
   const disposables = [];
   const objects = [];

   const keep = (resource) => {
      disposables.push(resource);
      return resource;
   };

   const envTarget = renderer ? buildEnvironment(renderer) : null;
   if (envTarget) scene.environment = envTarget.texture;

   const wallMat = (color, emissive) => keep(new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.15,
      metalness: 0.3,
      roughness: 0.7,
      side: THREE.DoubleSide,
   }));

   const plane = (width, height, pos, rot, material) => {
      const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(width, height)), material);
      mesh.position.copy(pos);
      if (rot) mesh.rotation.copy(rot);
      scene.add(mesh);
      objects.push(mesh);
      return mesh;
   };

   // Back, floor, ceiling, left, right.
   plane(14, 6.5, new THREE.Vector3(0, 0, -11.5), new THREE.Euler(0, 0, 0), wallMat(0x0a0a20, 0x111133));
   plane(14, 7, new THREE.Vector3(0, -3.25, -5), new THREE.Euler(-Math.PI / 2, 0, 0), wallMat(0x0a0a18, 0x0a0a22));
   plane(14, 7, new THREE.Vector3(0, 3.25, -5), new THREE.Euler(Math.PI / 2, 0, 0), wallMat(0x080810, 0x080818));
   plane(7, 7, new THREE.Vector3(-6.25, 0, -5), new THREE.Euler(0, Math.PI / 2, 0), wallMat(0x0c0c1e, 0x0c0c22));
   plane(7, 7, new THREE.Vector3(6.25, 0, -5), new THREE.Euler(0, -Math.PI / 2, 0), wallMat(0x0c0c1e, 0x0c0c22));

   const grid = new THREE.GridHelper(12, 24, 0x222255, 0x181844);
   grid.position.y = -3.25;
   scene.add(grid);
   objects.push(grid);
   disposables.push(grid.geometry, grid.material);

   // Depth cue down both walls: one geometry + one material for all 16 strips.
   const stripMat = keep(new THREE.MeshBasicMaterial({ color: 0x6c5ce7, transparent: true, opacity: 0.3 }));
   const stripGeo = keep(new THREE.BoxGeometry(6, 0.04, 0.04));
   for (let z = -3; z >= -10; z -= 2) {
      for (const x of [-5.9, 5.9]) {
         const strip = new THREE.Mesh(stripGeo, stripMat);
         strip.position.set(x, -1.5, z);
         scene.add(strip);
         objects.push(strip);
      }
   }

   const ambient = new THREE.AmbientLight(0x222244, 0.4);
   const directional = new THREE.DirectionalLight(0x8888ff, 0.6);
   directional.position.set(2, 5, 3);
   const point = new THREE.PointLight(0x6c5ce7, 0.5, 10);
   point.position.set(0, 0, -4);
   scene.add(ambient, directional, point);
   objects.push(ambient, directional, point);

   return {
      dispose() {
         for (const object of objects) scene.remove(object);
         for (const resource of disposables) resource.dispose();
         objects.length = 0;
         disposables.length = 0;
         if (envTarget) {
            scene.environment = null;
            envTarget.dispose();
         }
      },
   };
}
