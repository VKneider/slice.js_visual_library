/**
 * GsapShowcase — interactive GSAP examples (a real npm animation library used
 * via a bare import) for the /playground view. Every widget reacts to user
 * input and exposes a data-* marker so its end state is assertable in tests.
 */
import gsap from 'gsap';

const BTN = {
   font: 'inherit', fontSize: '13px', padding: '8px 14px', borderRadius: '8px',
   cursor: 'pointer', border: '1px solid var(--medium-color, #ccc)',
   background: 'var(--secondary-background-color, #f4f4f5)', color: 'var(--font-primary-color, #111)'
};
const style = (el, s) => Object.assign(el.style, s);

export default class GsapShowcase extends HTMLElement {
   constructor(props) {
      super();
      this.innerHTML = `
        <div class="gx" style="display:grid;gap:18px;max-width:420px;">
          <div class="gx-row">
            <button class="gx-bounce" type="button" data-bounces="0">Click to bounce</button>
          </div>
          <div class="gx-row">
            <div class="gx-lift" tabindex="0" data-state="rest">Hover / focus to lift</div>
          </div>
          <div class="gx-row" style="display:flex;align-items:center;gap:12px;">
            <button class="gx-tl-toggle" type="button" data-playing="false">Play</button>
            <div class="gx-tl-track" data-tl="start">
              <span class="gx-tl-dot"></span>
            </div>
          </div>
          <div class="gx-row" style="display:flex;align-items:center;gap:12px;">
            <button class="gx-count-btn" type="button">Count up</button>
            <span class="gx-count" data-value="0">0</span>
          </div>
        </div>`;

      this.$bounce = this.querySelector('.gx-bounce');
      this.$lift = this.querySelector('.gx-lift');
      this.$tlToggle = this.querySelector('.gx-tl-toggle');
      this.$tlTrack = this.querySelector('.gx-tl-track');
      this.$tlDot = this.querySelector('.gx-tl-dot');
      this.$countBtn = this.querySelector('.gx-count-btn');
      this.$count = this.querySelector('.gx-count');

      style(this.$bounce, BTN);
      style(this.$tlToggle, BTN);
      style(this.$countBtn, BTN);
      style(this.$lift, {
         padding: '14px 16px', borderRadius: '10px', textAlign: 'center', userSelect: 'none',
         border: '1px solid var(--medium-color, #ccc)', background: 'var(--secondary-background-color, #f4f4f5)',
         color: 'var(--font-primary-color, #111)'
      });
      style(this.$tlTrack, {
         position: 'relative', flex: '1', height: '10px', borderRadius: '999px',
         background: 'var(--medium-color, #ddd)'
      });
      style(this.$tlDot, {
         position: 'absolute', top: '-5px', left: '0', width: '20px', height: '20px',
         borderRadius: '50%', background: 'var(--primary-color, #6c5ce7)'
      });
      style(this.$count, { fontSize: '20px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' });

      slice.controller.setComponentProps(this, props);
   }

   init() {
      // 1) Click → bounce (scale up + back), count each completed bounce.
      this.$bounce.addEventListener('click', () => {
         gsap.fromTo(this.$bounce, { scale: 1 }, {
            scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut',
            onComplete: () => {
               const n = Number(this.$bounce.dataset.bounces || '0') + 1;
               this.$bounce.dataset.bounces = String(n);
            }
         });
      });

      // 2) Hover / focus → lift, leave / blur → settle.
      const lift = () => { this.$lift.dataset.state = 'lifted'; gsap.to(this.$lift, { y: -12, duration: 0.2, ease: 'power2.out' }); };
      const settle = () => { this.$lift.dataset.state = 'rest'; gsap.to(this.$lift, { y: 0, duration: 0.2, ease: 'power2.out' }); };
      this.$lift.addEventListener('mouseenter', lift);
      this.$lift.addEventListener('mouseleave', settle);
      this.$lift.addEventListener('focus', lift);
      this.$lift.addEventListener('blur', settle);

      // 3) Timeline the user drives: play forward, click again to reverse.
      this._tl = gsap.timeline({
         paused: true,
         onComplete: () => { this.$tlTrack.dataset.tl = 'done'; },
         onReverseComplete: () => { this.$tlTrack.dataset.tl = 'start'; }
      });
      this._tl.to(this.$tlDot, { x: () => this.$tlTrack.clientWidth - 20, duration: 0.6, ease: 'power2.inOut' });

      this.$tlToggle.addEventListener('click', () => {
         const playing = this.$tlToggle.dataset.playing === 'true';
         if (playing) {
            this._tl.reverse();
            this.$tlToggle.dataset.playing = 'false';
            this.$tlToggle.textContent = 'Play';
         } else {
            this._tl.play();
            this.$tlToggle.dataset.playing = 'true';
            this.$tlToggle.textContent = 'Reverse';
         }
      });

      // 4) Tween a plain object and render it → an animated counter.
      this.$countBtn.addEventListener('click', () => {
         const box = { v: 0 };
         gsap.to(box, {
            v: 100, duration: 0.5, ease: 'power1.out',
            onUpdate: () => { this.$count.textContent = String(Math.round(box.v)); },
            onComplete: () => { this.$count.dataset.value = '100'; this.$count.textContent = '100'; }
         });
      });
   }

   beforeDestroy() {
      this._tl?.kill();
   }
}

customElements.define('slice-gsap-showcase', GsapShowcase);
