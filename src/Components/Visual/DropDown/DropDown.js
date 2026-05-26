export default class DropDown extends HTMLElement {

   static props = {
      label: { 
         type: 'string', 
         default: '', 
         required: false 
      },
      options: { 
         type: 'array', 
         default: [], 
         required: false 
      }
   };

   constructor(props) {
      super();
      slice.attachTemplate(this);

      this.$dropdown = this.querySelector('.slice_dropdown');
      this.$box = this.querySelector('.slice_dropbox');
      this.$label = this.querySelector('.slice_dropdown_label');
      this.$caret = this.querySelector('.caret');

      this.$dropdown.addEventListener('click', (event) => {
         event.stopPropagation();
         this.toggleDrop();
      });

      this.$box.addEventListener('mouseleave', () => {
         this.closeDrop();
      });

      slice.controller.setComponentProps(this, props);
   }

   init() {
      this._outsideClickListener = (event) => {
         if (!this.contains(event.target)) {
            this.closeDrop();
         }
      };

      document.addEventListener('click', this._outsideClickListener);
   }

   beforeDestroy() {
      if (this._outsideClickListener) {
         document.removeEventListener('click', this._outsideClickListener);
      }
   }

   get label() {
      return this._label;
   }

   set label(value) {
      this._label = value;
      this.$label.textContent = value;
   }

   get options() {
      return this._options;
   }

   set options(values) {
      this._options = Array.isArray(values) ? values : [];
      this.$box.innerHTML = '';

      this._options.forEach((element) => {
         const div = document.createElement('div');
         const e = document.createElement('a');

         const text = element?.text || element?.label || '';
         const href = element?.href || element?.path || '#';

         e.addEventListener('click', async (event) => {
            if (element?.path && slice?.router?.navigate) {
               event.preventDefault();
               await slice.router.navigate(element.path);
            }
            this.closeDrop();
         });
         e.textContent = text;
         e.href = href;
         div.appendChild(e);
         this.$box.appendChild(div);
      });
   }

   toggleDrop() {
      this.$box.classList.toggle('slice_dropbox_open');
      this.$caret.classList.toggle('caret_open');
   }
   closeDrop() {
      this.$box.classList.remove('slice_dropbox_open');
      this.$caret.classList.remove('caret_open');
   }
}

customElements.define('slice-dropdown', DropDown);
