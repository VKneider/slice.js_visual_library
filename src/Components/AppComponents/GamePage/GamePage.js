export default class GamePage extends HTMLElement {
   constructor() {
      super();
      slice.attachTemplate(this);
   }

   async init() {
      this._game = null;
      const game = await slice.build('ThreeAimTrainer');
      if (game) {
         game.style.display = 'block';
         this._game = game;
         this.querySelector('[data-gp-root]').appendChild(game);
      }
   }

   beforeDestroy() {
      if (this._game && typeof this._game.beforeDestroy === 'function') {
         this._game.beforeDestroy();
      }
   }
}

customElements.define('slice-game-page', GamePage);
