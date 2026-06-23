// e2e (navegador real) del refresco reactivo: `update()` universal envuelto por
// el framework + `setComponentProps` que autodetecta build vs refresco.
// Conduce el runtime real (window.slice) en la página /__test.
import { test, expect } from '../../../../playwright/harness/sliceFixtures.js';

async function gotoHarness(page) {
   await page.goto('/__test');
   await page.waitForFunction(() => !!(window.slice && typeof window.slice.build === 'function'));
   await page.waitForSelector('[data-test-root]', { state: 'attached' });
}

test.describe('Refresco reactivo (update / setComponentProps)', () => {
   test('build aplica defaults; refresco NO los reaplica ni pisa props omitidas; diff-guard corta', async ({ page }) => {
      await gotoHarness(page);

      const res = await page.evaluate(async () => {
         const root = document.querySelector('[data-test-root]');
         root.innerHTML = '';

         // BUILD con solo `label` -> `tag` debe tomar su default.
         const probe = await window.slice.build('UpdateProbe', { sliceId: 'probe-refresh', label: 'A' });
         root.appendChild(probe);
         const out = {};
         out.builtLabel = probe.querySelector('.probe__label').textContent;
         out.builtTag = probe.querySelector('.probe__tag').textContent;
         out.labelWrites0 = probe.dataset.labelWrites;
         out.tagWrites0 = probe.dataset.tagWrites;

         // REFRESCO con solo `label` (componente ya registrado -> autodetecta refresco).
         window.slice.setComponentProps(probe, { label: 'B' });
         out.refLabel = probe.querySelector('.probe__label').textContent;
         out.refTag = probe.querySelector('.probe__tag').textContent; // debe seguir el default, NO resetearse
         out.labelWrites1 = probe.dataset.labelWrites;
         out.tagWrites1 = probe.dataset.tagWrites;

         // REFRESCO con el MISMO `label` -> el diff-guard debe cortar (sin re-escribir DOM).
         window.slice.setComponentProps(probe, { label: 'B' });
         out.labelWrites2 = probe.dataset.labelWrites;

         return out;
      });

      // Build aplica defaults
      expect(res.builtLabel).toBe('A');
      expect(res.builtTag).toBe('default-tag');
      expect(res.labelWrites0).toBe('1');
      expect(res.tagWrites0).toBe('1');

      // Refresco: cambia label, NO toca tag (no reaplica default ni clobberea)
      expect(res.refLabel).toBe('B');
      expect(res.refTag).toBe('default-tag');
      expect(res.labelWrites1).toBe('2');
      expect(res.tagWrites1).toBe('1'); // tag intacto

      // Diff-guard: refresco redundante no re-escribe
      expect(res.labelWrites2).toBe('2');
   });

   test('slice.isComponentAlive refleja registro y destroy', async ({ page }) => {
      await gotoHarness(page);

      const res = await page.evaluate(async () => {
         const root = document.querySelector('[data-test-root]');
         root.innerHTML = '';
         const probe = await window.slice.build('UpdateProbe', { sliceId: 'probe-alive', label: 'X' });
         root.appendChild(probe);

         const aliveBefore = window.slice.isComponentAlive(probe);
         window.slice.controller.destroyComponent('probe-alive');
         const aliveAfter = window.slice.isComponentAlive(probe);
         return { aliveBefore, aliveAfter };
      });

      expect(res.aliveBefore).toBe(true);
      expect(res.aliveAfter).toBe(false);
   });

   test('update() async se serializa + coalesce (gana el último)', async ({ page }) => {
      await gotoHarness(page);

      const res = await page.evaluate(async () => {
         const root = document.querySelector('[data-test-root]');
         root.innerHTML = '';
         const probe = await window.slice.build('UpdateProbe', { sliceId: 'probe-coalesce', label: 'C' });
         root.appendChild(probe);

         // Disparos rápidos SIN await: el primero corre, el resto coalescen al último.
         probe.update({ token: 1 });
         probe.update({ token: 2 });
         probe.update({ token: 3 });
         probe.update({ token: 4 });
         probe.update({ token: 5 });

         // Esperar a que drene (cada update tarda ~30ms; con coalescing corren 2 a lo sumo).
         await new Promise((r) => setTimeout(r, 250));

         return {
            committed: probe.dataset.committed,
            updateRuns: probe.dataset.updateRuns,
            updateCommits: probe.dataset.updateCommits,
         };
      });

      // Gana el último
      expect(res.committed).toBe('5');
      // Coalescing: NO corrió las 5 veces (a lo sumo 2: la primera + el pendiente final)
      expect(Number(res.updateRuns)).toBeLessThanOrEqual(2);
      expect(Number(res.updateCommits)).toBeLessThanOrEqual(2);
   });
});
