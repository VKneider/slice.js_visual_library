/**
 * DemoToggle — demo/test fixture. A boolean `on` with `onText`/`offText` labels.
 * Clicking flips `on` through its setter. Good for exercising boolean props.
 */
export default class DemoToggle extends HTMLElement {
   static props = {
      on: { type: 'boolean', default: false },
      onText: { type: 'string', default: 'ON' },
      offText: { type: 'string', default: 'OFF' }
   };

   constructor(props) {
      super();
      this.innerHTML =
         '<button class="demo-toggle" type="button">' +
         '<span class="demo-toggle__dot"></span><span class="demo-toggle__text"></span></button>';
      this.$btn = this.querySelector('.demo-toggle');
      this.$dot = this.querySelector('.demo-toggle__dot');
      this.$text = this.querySelector('.demo-toggle__text');
      Object.assign(this.$btn.style, {
         display: 'inline-flex', alignItems: 'center', gap: '8px',
         padding: '7px 14px', borderRadius: '999px', cursor: 'pointer', font: 'inherit', fontSize: '13px',
         border: '1px solid var(--medium-color)', background: 'var(--secondary-background-color)',
         color: 'var(--font-primary-color)'
      });
      Object.assign(this.$dot.style, {
         width: '9px', height: '9px', borderRadius: '50%', transition: 'background 0.15s ease'
      });
      this.$btn.addEventListener('click', () => { this.on = !this._on; });
      slice.controller.setComponentProps(this, props);
   }

   set on(v) { this._on = Boolean(v); this._apply(); }
   set onText(v) { this._onText = v ?? 'ON'; this._apply(); }
   set offText(v) { this._offText = v ?? 'OFF'; this._apply(); }

   _apply() {
      if (!this.$btn) return;
      const on = this._on;
      this.$text.textContent = on ? (this._onText ?? 'ON') : (this._offText ?? 'OFF');
      this.$dot.style.background = on ? 'var(--success-color, #46d39a)' : 'var(--medium-color, #888)';
      this.$btn.style.borderColor = on ? 'var(--primary-color)' : 'var(--medium-color)';
   }
}

customElements.define('slice-demo-toggle', DemoToggle);
