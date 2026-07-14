/**
 * GsapDemo — showcases using a real, popular npm animation library (GSAP,
 * GreenSock) inside a Slice component through a plain bare import. The bars
 * animate in with a stagger on mount; when the tween finishes the root gets
 * data-gsap="done" so tests can await the end state.
 *
 * Registered under DemoComponents and shown in the /playground view.
 */
import gsap from 'gsap';

export default class GsapDemo extends HTMLElement {
   static props = {
      bars: { type: 'number', default: 3 },
      duration: { type: 'number', default: 0.4 }
   };

   constructor(props) {
      super();
      this.innerHTML = '<div class="gsap-demo" data-gsap="pending"></div>';
      this.$root = this.querySelector('.gsap-demo');
      Object.assign(this.$root.style, {
         display: 'flex', gap: '10px', alignItems: 'flex-end',
         minHeight: '140px', padding: '12px'
      });
      // Record that GSAP resolved to a real object with its API (for tests).
      this.$root.dataset.gsapType = typeof gsap.to;
      slice.controller.setComponentProps(this, props);
   }

   init() {
      const count = Math.max(1, this._bars || 3);
      const bars = [];
      for (let i = 0; i < count; i++) {
         const bar = document.createElement('div');
         bar.className = 'gsap-demo__bar';
         Object.assign(bar.style, {
            width: '28px',
            height: `${50 + i * 26}px`,
            borderRadius: '6px',
            background: 'var(--primary-color, #6c5ce7)',
            opacity: '0'
         });
         this.$root.appendChild(bar);
         bars.push(bar);
      }

      // Real GSAP tween: fade + slide the bars in, staggered.
      gsap.fromTo(
         bars,
         { opacity: 0, y: 26 },
         {
            opacity: 1,
            y: 0,
            duration: this._duration || 0.4,
            stagger: 0.08,
            ease: 'power2.out',
            onComplete: () => this.$root.setAttribute('data-gsap', 'done')
         }
      );
   }

   get bars() { return this._bars; }
   set bars(v) { this._bars = v; }

   get duration() { return this._duration; }
   set duration(v) { this._duration = v; }
}

customElements.define('slice-gsap-demo', GsapDemo);
