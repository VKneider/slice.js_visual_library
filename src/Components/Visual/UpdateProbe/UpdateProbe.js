// Componente-sonda SOLO para e2e del refresco reactivo (`update()` universal +
// setComponentProps autodetectado). Expone contadores en dataset para que el
// spec observe el comportamiento real en el navegador. No es un componente de
// producción; vive aquí como fixture de Playwright.
export default class UpdateProbe extends HTMLElement {
   static props = {
      label: { type: 'string', default: 'default-label' },
      tag: { type: 'string', default: 'default-tag' },
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);
      this.$label = this.querySelector('.probe__label');
      this.$tag = this.querySelector('.probe__tag');
      this._labelWrites = 0;
      this._tagWrites = 0;
      this._updateRuns = 0;
      this._updateCommits = 0;
      slice.controller.setComponentProps(this, props);
   }

   async init() {
      this.dataset.inited = '1';
   }

   get label() {
      return this._label;
   }
   set label(v) {
      if (v === this._label) return; // diff-guard: no toca el DOM si no cambió
      this._label = v;
      this.$label.textContent = v;
      this.dataset.labelWrites = String(++this._labelWrites);
   }

   get tag() {
      return this._tag;
   }
   set tag(v) {
      if (v === this._tag) return; // diff-guard
      this._tag = v;
      this.$tag.textContent = v;
      this.dataset.tagWrites = String(++this._tagWrites);
   }

   // async => el framework la envuelve (re-entrada + liveness). Cuenta corridas
   // vs commits para evidenciar el coalescing ("gana el último").
   async update({ token } = {}) {
      this.dataset.updateRuns = String(++this._updateRuns);
      await new Promise((r) => setTimeout(r, 30)); // ventana para que se solapen llamadas
      this.dataset.committed = token != null ? String(token) : '';
      this.dataset.updateCommits = String(++this._updateCommits);
   }
}

customElements.define('slice-update-probe', UpdateProbe);
