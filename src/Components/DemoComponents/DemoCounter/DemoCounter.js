/**
 * DemoCounter — demo/test fixture. A number `value` adjusted by `step` via −/+ buttons,
 * with a `label`. Great for exercising number props through setters.
 */
export default class DemoCounter extends HTMLElement {
   static props = {
      value: { type: 'number', default: 0 },
      step: { type: 'number', default: 1 },
      label: { type: 'string', default: 'Counter' }
   };

   constructor(props) {
      super();
      this.innerHTML =
         '<div class="demo-counter">' +
         '<span class="demo-counter__label"></span>' +
         '<button class="demo-counter__dec" type="button">−</button>' +
         '<output class="demo-counter__value">0</output>' +
         '<button class="demo-counter__inc" type="button">+</button></div>';
      this.$root = this.querySelector('.demo-counter');
      this.$label = this.querySelector('.demo-counter__label');
      this.$value = this.querySelector('.demo-counter__value');
      Object.assign(this.$root.style, {
         display: 'inline-flex', alignItems: 'center', gap: '10px',
         padding: '8px 12px', borderRadius: '10px',
         border: '1px solid var(--medium-color)', background: 'var(--secondary-background-color)',
         color: 'var(--font-primary-color)', font: 'inherit', fontSize: '14px'
      });
      for (const b of this.querySelectorAll('button')) {
         Object.assign(b.style, {
            width: '26px', height: '26px', borderRadius: '7px', cursor: 'pointer',
            border: '1px solid var(--medium-color)', background: 'var(--primary-background-color)',
            color: 'var(--font-primary-color)', font: 'inherit', lineHeight: '1'
         });
      }
      this.$value.style.minWidth = '2ch';
      this.$value.style.textAlign = 'center';
      this.$value.style.fontWeight = '600';
      this.querySelector('.demo-counter__dec').addEventListener('click', () => { this.value = this._value - this._step; });
      this.querySelector('.demo-counter__inc').addEventListener('click', () => { this.value = this._value + this._step; });
      slice.controller.setComponentProps(this, props);
   }

   set value(v) { this._value = Number(v) || 0; this.$value.textContent = String(this._value); }
   set step(v) { this._step = Number(v) || 1; }
   set label(v) { this._label = v ?? ''; this.$label.textContent = this._label; }
}

customElements.define('slice-demo-counter', DemoCounter);
