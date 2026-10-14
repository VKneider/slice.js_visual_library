import { test } from '../playwright/harness/sliceFixtures.js';

const SIZES = ['sm', 'md', 'lg'];

test('spike demo', async ({ mountHtml }) => {
   const h = await mountHtml(`<div></div>`);

   // addStyleTag waits for the sheet; a hand-rolled <link> + onload did not,
   // and `document.body.innerHTML = ''` took the harness root with it, leaving
   // every element with no layout at all.
   const href = h.page.url().replace(/\/.*$/, '/Themes/scale.css');
   await h.page.addStyleTag({ url: href });
   await h.page.waitForTimeout(300);

   const measured = await h.page.evaluate(async (sizes) => {
      const style = document.createElement('style');
      style.textContent = `
        body { margin: 0; background: #f6f5fb; font-family: system-ui, sans-serif; }
        .wrap { padding: 28px 32px; max-width: 760px; }
        h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .07em;
             color: #6b46c1; margin: 30px 0 12px; }
        .row { display: grid; grid-template-columns: 54px 1fr; gap: 14px; align-items: center;
               margin-bottom: 12px; }
        .sz { font-size: 12px; color: #6b7280; font-family: ui-monospace, monospace; }
        .pair { display: flex; gap: 12px; align-items: center; }
        .panel { background: #fff; border: 1px solid #e9e5f5; border-radius: 14px;
                 padding: 20px 22px; }
        .mi-cta .slice_button { background: #059669; border-color: #059669; height: 52px; padding-inline: 26px; }
        .mi-input .slice_input { border-radius: 999px; }
      `;
      document.head.appendChild(style);

      const wrap = document.createElement('div');
      wrap.className = 'wrap';
      // Attached BEFORE anything is built or measured: a detached element has
      // no layout, so getBoundingClientRect() reports 0 for all of them.
      document.body.appendChild(wrap);

      const heading = (text) => {
         const t = document.createElement('h2');
         t.textContent = text;
         wrap.appendChild(t);
      };

      const r2 = (n) => Math.round(n * 10) / 10;
      const out = { sizes: {}, panel: null };

      // ── 1. the scale: Button and Input at each size ──
      heading('1 — size means the same thing on both');
      for (const size of sizes) {
         const row = document.createElement('div');
         row.className = 'row';

         const tag = document.createElement('div');
         tag.className = 'sz';
         tag.textContent = size;

         const pair = document.createElement('div');
         pair.className = 'pair';
         const btn = await slice.build('Button', { value: 'Continue', size });
         const inp = await slice.build('Input', { size, value: 'ada@example.com' });
         pair.append(btn, inp);
         row.append(tag, pair);
         wrap.appendChild(row);

         await new Promise((r) => setTimeout(r, 200));
         out.sizes[size] = {
            button: r2(btn.querySelector('.slice_button').getBoundingClientRect().height),
            input: r2(inp.querySelector('.slice_input').getBoundingClientRect().height),
         };
      }

      // ── 2. a Form built on the same tokens ──
      heading('2 — a form whose controls share a rhythm');
      const panel = document.createElement('div');
      panel.className = 'panel';
      const form = await slice.build('Form', {
         maxWidth: '100%',
         variant: 'plain',
         nextText: 'Create account',
         schema: [
            { kind: 'field', name: 'name', label: 'Full name', component: 'Input',
              props: { size: 'sm', value: 'Ada Lovelace' } },
            { kind: 'field', name: 'email', label: 'Email', component: 'Input',
              props: { size: 'sm', value: 'ada@example.com' }, required: true },
            { kind: 'field', name: 'newsletter', label: 'Send me the newsletter',
              component: 'Switch', props: { checked: true }, full: true },
         ],
      });
      panel.appendChild(form);
      wrap.appendChild(panel);
      await new Promise((r) => setTimeout(r, 500));
      out.panel = r2(form.getBoundingClientRect().height);

      // ── 3. className as the escape hatch ──
      heading('3 — your class, no !important');
      const row3 = document.createElement('div');
      row3.className = 'pair';
      const big = await slice.build('Button', { value: 'Comprar', size: 'lg', className: 'mi-cta' });
      const pill = await slice.build('Input', { size: 'md', className: 'mi-input', value: 'rounded' });
      row3.append(big, pill);
      wrap.appendChild(row3);
      await new Promise((r) => setTimeout(r, 250));
      await new Promise((r) => setTimeout(r, 600));

      return out;
   }, SIZES);

   console.log('SPIKE ' + JSON.stringify(measured));
   await h.page.locator('.wrap').screenshot({ path: `${process.env.TEMP}\\opencode\\spike.png` });
});