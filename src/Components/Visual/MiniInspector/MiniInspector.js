/**
 * MiniInspector — a tiny, readable demonstration of how Slice's "live state editing" works.
 *
 * It reads a target component's `static props`, renders one editable control per prop, and on
 * edit writes `target[prop] = value`. Because Slice applies props through setters, that single
 * assignment fires the target's setter and updates its UI live — the same idea the built-in
 * DevTools inspector uses, here in ~80 lines of idiomatic Slice.
 *
 * Usage:
 *   const card = await slice.build('Card', { sliceId: 'demo-card', title: 'Hello' });
 *   container.appendChild(card);
 *   const inspector = await slice.build('MiniInspector', { target: card, title: 'Card props' });
 *   container.appendChild(inspector);   // edit fields -> the card updates instantly
 *
 * `target` accepts a component instance or a sliceId string.
 */
export default class MiniInspector extends HTMLElement {
   static props = {
      target: { type: 'object', default: null },
      title: { type: 'string', default: 'Inspector' }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      // Pattern A: cache refs in the constructor (after attachTemplate) so setters can use them.
      this.$title = this.querySelector('.mini-inspector__title');
      this.$list = this.querySelector('.mini-inspector__list');
      slice.controller.setComponentProps(this, props);
   }

   set title(value) {
      this._title = value || 'Inspector';
      this.$title.textContent = this._title;
   }

   set target(value) {
      // Accept a sliceId string or a live component instance.
      this._target = typeof value === 'string' ? slice.controller.getComponent(value) : value;
      this.renderFields();
   }

   renderFields() {
      if (!this.$list) return;
      this.$list.innerHTML = '';

      const target = this._target;
      const schema = target?.constructor?.props;

      if (!target || !schema) {
         this.$list.innerHTML = '<p class="mini-inspector__empty">No target, or it has no static props.</p>';
         return;
      }

      for (const [name, config] of Object.entries(schema)) {
         // This demo edits the directly-editable primitive types.
         if (!['string', 'number', 'boolean'].includes(config.type)) continue;

         const row = document.createElement('label');
         row.className = 'mini-inspector__row';

         const label = document.createElement('span');
         label.className = 'mini-inspector__label';
         label.textContent = name;

         const input = document.createElement('input');
         input.className = 'mini-inspector__input';
         const current = target[name];

         if (config.type === 'boolean') {
            input.type = 'checkbox';
            input.checked = Boolean(current);
            input.addEventListener('change', () => { target[name] = input.checked; });
         } else if (config.type === 'number') {
            input.type = 'number';
            input.value = current ?? '';
            input.addEventListener('input', () => { target[name] = Number(input.value); });
         } else {
            input.type = 'text';
            input.value = current ?? '';
            input.addEventListener('input', () => { target[name] = input.value; });
         }

         row.appendChild(label);
         row.appendChild(input);
         this.$list.appendChild(row);
      }
   }
}

customElements.define('slice-mini-inspector', MiniInspector);
