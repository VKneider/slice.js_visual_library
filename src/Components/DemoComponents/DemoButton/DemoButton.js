/**
 * DemoButton — a tiny demo/test fixture.
 * String + number + boolean props with setters that touch the DOM, so it's an ideal
 * target for the inspector / MiniInspector and for runnable doc scenarios. Clicking it
 * increments `clicks` (which also flows through the setter).
 */
export default class DemoButton extends HTMLElement {
   static props = {
      label: { type: 'string', default: 'Click me' },
      clicks: { type: 'number', default: 0 },
      disabled: { type: 'boolean', default: false }
   };

   constructor(props) {
      super();
      // Demo components build their DOM directly (no template files).
      this.innerHTML =
         '<button class="demo-button" type="button">' +
         '<span class="demo-button__label"></span><span class="demo-button__count"></span></button>';
      this.$btn = this.querySelector('.demo-button');
      this.$label = this.querySelector('.demo-button__label');
      this.$count = this.querySelector('.demo-button__count');
      Object.assign(this.$btn.style, {
         display: 'inline-flex', alignItems: 'center', gap: '4px',
         padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', font: 'inherit', fontSize: '14px',
         border: '1px solid var(--primary-color)',
         background: 'var(--primary-color)', color: 'var(--primary-color-contrast, #fff)'
      });
      this.$btn.addEventListener('click', () => { this.clicks = this._clicks + 1; });
      slice.controller.setComponentProps(this, props);
   }

   set label(v) { this._label = v ?? ''; this.$label.textContent = this._label; }
   set clicks(v) { this._clicks = Number(v) || 0; this.$count.textContent = this._clicks ? ' · ' + this._clicks : ''; }
   set disabled(v) {
      this._disabled = Boolean(v);
      this.$btn.disabled = this._disabled;
      this.$btn.style.opacity = this._disabled ? '0.5' : '1';
      this.$btn.style.cursor = this._disabled ? 'not-allowed' : 'pointer';
   }
}

customElements.define('slice-demo-button', DemoButton);
