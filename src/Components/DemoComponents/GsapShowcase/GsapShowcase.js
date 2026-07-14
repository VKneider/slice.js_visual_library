import gsap from 'gsap';

const CARD = {
   background: 'var(--secondary-background-color, #f4f4f5)',
   border: '1px solid var(--medium-color, #ddd)',
   borderRadius: '10px', padding: '12px 14px'
};
const BTN = {
   font: 'inherit', fontSize: '13px', padding: '8px 14px', borderRadius: '8px',
   cursor: 'pointer', border: '1px solid var(--medium-color, #ccc)',
   background: 'var(--secondary-background-color, #f4f4f5)', color: 'var(--font-primary-color, #111)'
};
const DOT = (bg = 'var(--primary-color, #6c5ce7)') => ({
   width: '20px', height: '20px', borderRadius: '50%', background: bg
});
const style = (el, s) => Object.assign(el.style, s);

export default class GsapShowcase extends HTMLElement {
   constructor(props) {
      super();
      this.innerHTML = `
<div class="gx" style="display:grid;gap:16px;max-width:780px;font-family:system-ui,sans-serif">

  <!-- ═══ GROUP: Click interactions ═══ -->
  <div class="gx-group" style="margin-top:4px">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888">Click / Tap</span>
    <div class="gx-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:6px">

      <!-- 1. Bounce (existing) -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <button class="gx-bounce" type="button" data-bounces="0" style="${cssObj(BTN)}">Click to bounce</button>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">scale + yoyo · <span class="gx-bounce-count">0</span> bounces</span>
      </div>

      <!-- 2. Shake -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <button class="gx-shake" type="button" data-shook="false" style="${cssObj(BTN)}">Shake me</button>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">rapid x oscillation</span>
      </div>

      <!-- 3. Wobble -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <button class="gx-wobble" type="button" data-wobbled="false" style="${cssObj(BTN)}">Wobble</button>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">rotation wobble</span>
      </div>

      <!-- 4. Pulse ring -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="gx-pulse-ring" style="position:relative;width:36px;height:36px">
            <div class="gx-pulse-dot" style="${cssObj(DOT())};width:16px;height:16px;position:absolute;top:10px;left:10px"></div>
          </div>
          <button class="gx-pulse-btn" type="button" data-pulses="0" style="${cssObj(BTN)}">Pulse</button>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">expanding ring with scale+opacity</span>
      </div>

    </div>
  </div>

  <!-- ═══ GROUP: Hover / Focus ═══ -->
  <div class="gx-group">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888">Hover / Focus</span>
    <div class="gx-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:6px">

      <!-- 5. Lift (existing) -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div class="gx-lift" tabindex="0" data-state="rest" style="padding:10px 14px;border-radius:8px;text-align:center;user-select:none;border:1px solid var(--medium-color,#ccc);background:var(--secondary-background-color,#f4f4f5);color:var(--font-primary-color,#111);font-size:13px">Hover to lift</div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">translateY on hover/focus</span>
      </div>

      <!-- 6. Glow -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div class="gx-glow" tabindex="0" data-glow="off" style="padding:10px 14px;border-radius:8px;text-align:center;user-select:none;border:1px solid var(--medium-color,#ccc);background:var(--secondary-background-color,#f4f4f5);color:var(--font-primary-color,#111);font-size:13px">Hover to glow</div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">box-shadow + scale on hover</span>
      </div>

      <!-- 7. Stagger hover bars -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div class="gx-stagger-hover" style="display:flex;gap:4px;justify-content:center;padding:8px 0">
          ${'<div class="gx-sh-bar" style="width:8px;height:24px;border-radius:4px;background:var(--primary-color,#6c5ce7)"></div>'.repeat(8)}
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:4px">Hover the group · staggerEach bar grows</span>
      </div>

    </div>
  </div>

  <!-- ═══ GROUP: Timelines & Sequencing ═══ -->
  <div class="gx-group">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888">Timelines &amp; Sequencing</span>
    <div class="gx-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:6px">

      <!-- 8. Timeline (existing) -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-tl-toggle" type="button" data-playing="false" style="${cssObj(BTN)}">Play</button>
          <div class="gx-tl-track" data-tl="start" style="position:relative;flex:1;height:10px;border-radius:999px;background:var(--medium-color,#ddd)">
            <span class="gx-tl-dot" style="position:absolute;top:-5px;left:0;width:20px;height:20px;border-radius:50%;background:var(--primary-color,#6c5ce7)"></span>
          </div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">timeline .play() / .reverse()</span>
      </div>

      <!-- 9. Keyframes -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-kf-btn" type="button" data-kf-state="idle" style="${cssObj(BTN)}">Animate</button>
          <div class="gx-kf-box" style="width:32px;height:32px;border-radius:6px;background:var(--primary-color,#6c5ce7)"></div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">keyframes: move → rotate → scale → back</span>
      </div>

      <!-- 10. Chain tweens -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-chain-btn" type="button" data-chain="ready" style="${cssObj(BTN)}">Chain</button>
          <div class="gx-chain-box" style="width:24px;height:24px;border-radius:4px;background:var(--primary-color,#6c5ce7)"></div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">sequential .to() calls · each starts when prev ends</span>
      </div>

      <!-- 11. Timeline with labels -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:8px">
          <button class="gx-label-btn" type="button" data-label-play="false" style="${cssObj(BTN)}">Go</button>
          <span class="gx-label-stage" style="font-size:12px;font-weight:600;color:var(--font-primary-color,#111)">⬤</span>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">timeline with stage labels (⬤→◆→★→⬤)</span>
      </div>

    </div>
  </div>

  <!-- ═══ GROUP: Effects & Visual ═══ -->
  <div class="gx-group">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888">Effects &amp; Visual</span>
    <div class="gx-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:6px">

      <!-- 12. Elastic bounce -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-elastic-btn" type="button" data-elastic="0" style="${cssObj(BTN)}">Drop</button>
          <div class="gx-elastic-ball" style="width:28px;height:28px;border-radius:50%;background:#f59e0b"></div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">elastic ease bounce (yoyo)</span>
      </div>

      <!-- 13. Squash & Stretch -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-squash-btn" type="button" data-squashed="0" style="${cssObj(BTN)}">Squash</button>
          <div class="gx-squash-box" style="width:32px;height:32px;border-radius:6px;background:#10b981"></div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">scaleX + scaleY squash &amp; stretch</span>
      </div>

      <!-- 14. Spinner -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-spin-btn" type="button" data-spinning="false" style="${cssObj(BTN)}">Spin</button>
          <div class="gx-spin-box" style="width:28px;height:28px;border-radius:6px;background:#3b82f6;text-align:center;line-height:28px;font-size:16px;color:#fff">⟳</div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">continuous rotation (repeat -1)</span>
      </div>

      <!-- 15. 3D Flip -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px;perspective:300px">
          <button class="gx-flip-btn" type="button" data-flipped="false" style="${cssObj(BTN)}">Flip</button>
          <div class="gx-flip-box" style="width:32px;height:32px;border-radius:6px;background:#8b5cf6;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff">A</div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">3D rotateY card flip</span>
      </div>

      <!-- 16. Color shift -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-color-btn" type="button" data-color-shifts="0" style="${cssObj(BTN)}">Color</button>
          <div class="gx-color-box" style="width:32px;height:32px;border-radius:6px;background:#6c5ce7"></div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">tween backgroundColor through 4 colors</span>
      </div>

      <!-- 17. Filter blur -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-blur-btn" type="button" data-blurred="false" style="${cssObj(BTN)}">Blur</button>
          <div class="gx-blur-text" style="font-size:20px;font-weight:700;color:var(--font-primary-color,#111)">GSAP</div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">CSS filter blur tween</span>
      </div>

    </div>
  </div>

  <!-- ═══ GROUP: Stagger & Utilities ═══ -->
  <div class="gx-group">
    <span style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;color:#888">Stagger &amp; Utilities</span>
    <div class="gx-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-top:6px">

      <!-- 18. Stagger grid -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <button class="gx-stag-btn" type="button" data-stag="ready" style="${cssObj(BTN)}">Stagger</button>
          <div class="gx-stag-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px">
            ${'<div class="gx-stag-cell" style="width:18px;height:18px;border-radius:3px;background:var(--primary-color,#6c5ce7);opacity:0.2"></div>'.repeat(12)}
          </div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">fromTo with stagger (from random)</span>
      </div>

      <!-- 19. Wave stagger -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="gx-wave-btn" type="button" data-wave="idle" style="${cssObj(BTN)}">Wave</button>
          <div class="gx-wave-bars" style="display:flex;gap:3px;align-items:flex-end;height:36px">
            ${Array.from({length:7},(_,i)=>`<div class="gx-wave-bar" data-wi="${i}" style="width:6px;height:${14+i*4}px;border-radius:3px;background-color:var(--primary-color,#6c5ce7)"></div>`).join('')}
          </div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">stagger with from:&quot;edges&quot; wave</span>
      </div>

      <!-- 20. Counter tween (existing) -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;align-items:center;gap:12px">
          <button class="gx-count-btn" type="button" style="${cssObj(BTN)}">Count up</button>
          <span class="gx-count" data-value="0" style="font-size:20px;font-weight:700;font-variant-numeric:tabular-nums">0</span>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:6px">tween a plain JS object {v: 0→100}</span>
      </div>

      <!-- 21. Progress scrub -->
      <div class="gx-card" style="${cssObj(CARD)}">
        <div style="display:flex;flex-direction:column;gap:8px">
          <input class="gx-scrub-slider" type="range" min="0" max="1" step="0.01" value="0" style="width:100%;accent-color:var(--primary-color,#6c5ce7)" />
          <div style="display:flex;align-items:center;gap:12px">
            <span class="gx-scrub-pct" style="font-size:12px;font-weight:600;min-width:3em;color:var(--font-primary-color,#111)">0%</span>
            <div class="gx-scrub-track" style="position:relative;flex:1;height:8px;border-radius:999px;background:var(--medium-color,#ddd)">
              <span class="gx-scrub-dot" style="position:absolute;top:-6px;left:0;width:20px;height:20px;border-radius:50%;background:var(--primary-color,#6c5ce7)"></span>
            </div>
          </div>
        </div>
        <span class="gx-label" style="display:block;font-size:11px;color:#888;margin-top:4px">slider scrubs timeline .progress()</span>
      </div>

    </div>
  </div>

</div>`;
      this._props = props;

      // ── cache refs ──
      this.$ = (sel) => this.querySelector(sel);
      this.$$ = (sel) => this.querySelectorAll(sel);

      // card 1
      this.$bounce = this.$('.gx-bounce');
      // card 2
      this.$shake = this.$('.gx-shake');
      // card 3
      this.$wobble = this.$('.gx-wobble');
      // card 4
      this.$pulseBtn = this.$('.gx-pulse-btn');
      this.$pulseDot = this.$('.gx-pulse-dot');
      // card 5
      this.$lift = this.$('.gx-lift');
      // card 6
      this.$glow = this.$('.gx-glow');
      // card 7
      this.$shBars = this.$$('.gx-sh-bar');
      // card 8
      this.$tlToggle = this.$('.gx-tl-toggle');
      this.$tlTrack = this.$('.gx-tl-track');
      this.$tlDot = this.$('.gx-tl-dot');
      // card 9
      this.$kfBtn = this.$('.gx-kf-btn');
      this.$kfBox = this.$('.gx-kf-box');
      // card 10
      this.$chainBtn = this.$('.gx-chain-btn');
      this.$chainBox = this.$('.gx-chain-box');
      // card 11
      this.$labelBtn = this.$('.gx-label-btn');
      this.$labelStage = this.$('.gx-label-stage');
      // card 12
      this.$elasticBtn = this.$('.gx-elastic-btn');
      this.$elasticBall = this.$('.gx-elastic-ball');
      // card 13
      this.$squashBtn = this.$('.gx-squash-btn');
      this.$squashBox = this.$('.gx-squash-box');
      // card 14
      this.$spinBtn = this.$('.gx-spin-btn');
      this.$spinBox = this.$('.gx-spin-box');
      // card 15
      this.$flipBtn = this.$('.gx-flip-btn');
      this.$flipBox = this.$('.gx-flip-box');
      // card 16
      this.$colorBtn = this.$('.gx-color-btn');
      this.$colorBox = this.$('.gx-color-box');
      // card 17
      this.$blurBtn = this.$('.gx-blur-btn');
      this.$blurText = this.$('.gx-blur-text');
      // card 18
      this.$stagBtn = this.$('.gx-stag-btn');
      this.$stagCells = this.$$('.gx-stag-cell');
      // card 19
      this.$waveBtn = this.$('.gx-wave-btn');
      this.$waveBars = this.$$('.gx-wave-bar');
      // card 20
      this.$countBtn = this.$('.gx-count-btn');
      this.$count = this.$('.gx-count');
      this.$bounceCount = this.$('.gx-bounce-count');
      // card 21
      this.$scrubSlider = this.$('.gx-scrub-slider');
      this.$scrubPct = this.$('.gx-scrub-pct');
      this.$scrubTrack = this.$('.gx-scrub-track');
      this.$scrubDot = this.$('.gx-scrub-dot');

      slice.controller.setComponentProps(this, props);
   }

   init() {
      // ── 1. Bounce (click → scale) ──
      this.$bounce.addEventListener('click', () => {
         gsap.fromTo(this.$bounce, { scale: 1 }, {
            scale: 1.25, duration: 0.15, yoyo: true, repeat: 1, ease: 'power1.inOut',
            onComplete: () => {
               const n = Number(this.$bounce.dataset.bounces || '0') + 1;
               this.$bounce.dataset.bounces = String(n);
               this.$bounceCount.textContent = String(n);
            }
         });
      });

      // ── 2. Shake (rapid x oscillation) ──
      this.$shake.addEventListener('click', () => {
         this.$shake.dataset.shook = 'true';
         gsap.to(this.$shake, {
            x: 6, duration: 0.05, repeat: 5, yoyo: true, ease: 'none',
            onComplete: () => { gsap.set(this.$shake, { x: 0 }); this.$shake.dataset.shook = 'false'; }
         });
      });

      // ── 3. Wobble (rotation) ──
      this.$wobble.addEventListener('click', () => {
         this.$wobble.dataset.wobbled = 'true';
         gsap.to(this.$wobble, {
            rotation: 8, duration: 0.06, repeat: 6, yoyo: true, ease: 'sine.inOut',
            onComplete: () => { gsap.set(this.$wobble, { rotation: 0 }); this.$wobble.dataset.wobbled = 'false'; }
         });
      });

      // ── 4. Pulse ring ──
      this.$pulseBtn.addEventListener('click', () => {
         const ring = document.createElement('div');
         style(ring, {
            position: 'absolute', inset: '0', borderRadius: '50%',
            border: '2px solid var(--primary-color,#6c5ce7)',
            pointerEvents: 'none'
         });
         this.$pulseDot.parentElement.appendChild(ring);
         gsap.fromTo(ring, { scale: 0.6, opacity: 0.8 }, {
            scale: 2.2, opacity: 0, duration: 0.5, ease: 'power2.out',
            onComplete: () => ring.remove()
         });
         const n = Number(this.$pulseBtn.dataset.pulses || '0') + 1;
         this.$pulseBtn.dataset.pulses = String(n);
      });

      // ── 5. Lift (existing hover/focus) ──
      const lift = () => { this.$lift.dataset.state = 'lifted'; gsap.to(this.$lift, { y: -10, duration: 0.2, ease: 'power2.out' }); };
      const settle = () => { this.$lift.dataset.state = 'rest'; gsap.to(this.$lift, { y: 0, duration: 0.2, ease: 'power2.out' }); };
      this.$lift.addEventListener('mouseenter', lift);
      this.$lift.addEventListener('mouseleave', settle);
      this.$lift.addEventListener('focus', lift);
      this.$lift.addEventListener('blur', settle);

      // ── 6. Glow (hover box-shadow + scale) ──
      const glowOn = () => {
         this.$glow.dataset.glow = 'on';
         gsap.to(this.$glow, { scale: 1.04, boxShadow: '0 4px 16px rgba(108,92,231,0.35)', duration: 0.2, ease: 'power2.out' });
      };
      const glowOff = () => {
         this.$glow.dataset.glow = 'off';
         gsap.to(this.$glow, { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)', duration: 0.2, ease: 'power2.out' });
      };
      this.$glow.addEventListener('mouseenter', glowOn);
      this.$glow.addEventListener('mouseleave', glowOff);
      this.$glow.addEventListener('focus', glowOn);
      this.$glow.addEventListener('blur', glowOff);

      // ── 7. Stagger hover bars ──
      this.$shBars.forEach((bar, i) => {
         bar._origH = parseInt(bar.style.height);
      });
      const barGroup = this.$('.gx-stagger-hover');
      barGroup.addEventListener('mouseenter', () => {
         gsap.to(this.$shBars, { scaleY: 2.2, duration: 0.2, stagger: 0.03, ease: 'back.out(2)', transformOrigin: 'bottom' });
      });
      barGroup.addEventListener('mouseleave', () => {
         gsap.to(this.$shBars, { scaleY: 1, duration: 0.2, stagger: 0.03, ease: 'power2.out', transformOrigin: 'bottom' });
      });

      // ── 8. Timeline play/reverse (existing) ──
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

      // ── 9. Keyframes ──
      this.$kfBtn.addEventListener('click', () => {
         if (this.$kfBtn.dataset.kfState === 'running') return;
         this.$kfBtn.dataset.kfState = 'running';
         gsap.to(this.$kfBox, {
            keyframes: [
               { x: 40, duration: 0.25, ease: 'power2.out' },
               { rotation: 180, duration: 0.3, ease: 'power1.inOut' },
               { scale: 1.5, duration: 0.2, ease: 'back.out(2)' },
               { x: 0, rotation: 360, scale: 1, duration: 0.35, ease: 'power2.inOut' }
            ],
            onComplete: () => { this.$kfBtn.dataset.kfState = 'idle'; }
         });
      });

      // ── 10. Chain tweens ──
      this.$chainBtn.addEventListener('click', () => {
         if (this.$chainBtn.dataset.chain === 'running') return;
         this.$chainBtn.dataset.chain = 'running';
         const tl = gsap.timeline({ onComplete: () => { this.$chainBtn.dataset.chain = 'ready'; } });
         tl.to(this.$chainBox, { x: 60, duration: 0.3, ease: 'power2.out' })
            .to(this.$chainBox, { rotation: 180, duration: 0.25, ease: 'power1.inOut' })
            .to(this.$chainBox, { scale: 1.4, duration: 0.2, ease: 'back.out(2)' })
            .to(this.$chainBox, { x: 0, rotation: 360, scale: 1, duration: 0.3, ease: 'power2.inOut' });
      });

      // ── 11. Timeline with labels ──
      const LABELS = ['⬤', '◆', '★', '⬤'];
      this._labelTL = gsap.timeline({ paused: true, onReverseComplete: () => { this._labelStageIdx = 0; this.$labelStage.textContent = LABELS[0]; } });
      this._labelTL
         .to({}, { duration: 0.4, onStart: () => { this.$labelStage.textContent = '◆'; } })
         .to({}, { duration: 0.4, onStart: () => { this.$labelStage.textContent = '★'; } })
         .to({}, { duration: 0.4, onStart: () => { this.$labelStage.textContent = '⬤'; } });
      this._labelStageIdx = 0;
      this.$labelBtn.addEventListener('click', () => {
         const playing = this.$labelBtn.dataset.labelPlay === 'true';
         if (playing) {
            this._labelTL.reverse();
            this.$labelBtn.dataset.labelPlay = 'false';
            this.$labelBtn.textContent = 'Go';
         } else {
            this._labelTL.play();
            this.$labelBtn.dataset.labelPlay = 'true';
            this.$labelBtn.textContent = 'Back';
         }
      });
      this._labelTL.eventCallback('onComplete', () => { this.$labelBtn.dataset.labelPlay = 'false'; this.$labelBtn.textContent = 'Go'; });

      // ── 12. Elastic bounce ──
      this.$elasticBtn.addEventListener('click', () => {
         const n = Number(this.$elasticBtn.dataset.elastic || '0') + 1;
         this.$elasticBtn.dataset.elastic = String(n);
         gsap.fromTo(this.$elasticBall, { y: -50 }, { y: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)' });
      });

      // ── 13. Squash & Stretch ──
      this.$squashBtn.addEventListener('click', () => {
         const n = Number(this.$squashBtn.dataset.squashed || '0') + 1;
         this.$squashBtn.dataset.squashed = String(n);
         const tl = gsap.timeline();
         tl.to(this.$squashBox, { scaleX: 1.4, scaleY: 0.6, duration: 0.1, ease: 'none', transformOrigin: 'center' })
            .to(this.$squashBox, { scaleX: 0.8, scaleY: 1.3, duration: 0.12, ease: 'power1.out', transformOrigin: 'center' })
            .to(this.$squashBox, { scaleX: 1, scaleY: 1, duration: 0.15, ease: 'elastic.out(1, 0.4)', transformOrigin: 'center' });
      });

      // ── 14. Spinner ──
      this.$spinBtn.addEventListener('click', () => {
         const spinning = this.$spinBtn.dataset.spinning === 'true';
         if (spinning) {
            this._spinTween?.kill();
            this.$spinBtn.dataset.spinning = 'false';
            this.$spinBtn.textContent = 'Spin';
            gsap.set(this.$spinBox, { rotation: 0 });
         } else {
            this._spinTween = gsap.to(this.$spinBox, { rotation: 360, duration: 0.8, ease: 'none', repeat: -1 });
            this.$spinBtn.dataset.spinning = 'true';
            this.$spinBtn.textContent = 'Stop';
         }
      });

      // ── 15. 3D Flip ──
      this.$flipBtn.addEventListener('click', () => {
         const flipped = this.$flipBtn.dataset.flipped === 'true';
         gsap.to(this.$flipBox, {
            rotationY: flipped ? 0 : 180, duration: 0.4, ease: 'power2.inOut',
            onStart: () => {
               if (!flipped) { this.$flipBox.textContent = 'B'; gsap.set(this.$flipBox, { background: '#f59e0b' }); }
            },
            onReverseComplete: () => { this.$flipBox.textContent = 'A'; gsap.set(this.$flipBox, { background: '#8b5cf6' }); }
         });
         this.$flipBtn.dataset.flipped = flipped ? 'false' : 'true';
      });

      // ── 16. Color shift ──
      const COLORS = ['#6c5ce7', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#6c5ce7'];
      this.$colorBtn.addEventListener('click', () => {
         const n = Number(this.$colorBtn.dataset.colorShifts || '0') + 1;
         this.$colorBtn.dataset.colorShifts = String(n);
         const tl = gsap.timeline();
         COLORS.forEach((c, i) => {
            if (i === 0) return;
            tl.to(this.$colorBox, { backgroundColor: c, duration: 0.2, ease: 'none' });
         });
      });

      // ── 17. Filter blur ──
      this.$blurBtn.addEventListener('click', () => {
         const blurred = this.$blurBtn.dataset.blurred === 'true';
         if (blurred) {
            gsap.to(this.$blurText, { filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' });
            this.$blurBtn.dataset.blurred = 'false';
            this.$blurBtn.textContent = 'Blur';
         } else {
            gsap.to(this.$blurText, { filter: 'blur(4px)', duration: 0.3, ease: 'power2.out' });
            this.$blurBtn.dataset.blurred = 'true';
            this.$blurBtn.textContent = 'Unblur';
         }
      });

      // ── 18. Stagger grid ──
      this.$stagBtn.addEventListener('click', () => {
         if (this.$stagBtn.dataset.stag === 'running') return;
         this.$stagBtn.dataset.stag = 'running';
         gsap.fromTo(this.$stagCells, { opacity: 0.2, scale: 0.5 }, {
            opacity: 1, scale: 1, duration: 0.25, stagger: { each: 0.03, from: 'random' },
            ease: 'back.out(2)',
            onComplete: () => { this.$stagBtn.dataset.stag = 'ready'; }
         });
      });

      // ── 19. Wave stagger ──
      this.$waveBtn.addEventListener('click', () => {
         if (this.$waveBtn.dataset.wave === 'running') return;
         this.$waveBtn.dataset.wave = 'running';
         gsap.fromTo(this.$waveBars, { scaleY: 0.2, transformOrigin: 'bottom' }, {
            scaleY: 1, duration: 0.25, stagger: { each: 0.04, from: 'edges' },
            ease: 'power2.out',
            onComplete: () => { this.$waveBtn.dataset.wave = 'idle'; }
         });
      });

      // ── 20. Counter (existing) ──
      this.$countBtn.addEventListener('click', () => {
         const box = { v: 0 };
         gsap.to(box, {
            v: 100, duration: 0.5, ease: 'power1.out',
            onUpdate: () => { this.$count.textContent = String(Math.round(box.v)); },
            onComplete: () => { this.$count.dataset.value = '100'; this.$count.textContent = '100'; }
         });
      });

      // ── 21. Progress scrub ──
      this._scrubTL = gsap.timeline({ paused: true });
      this._scrubTL.to(this.$scrubDot, { x: () => this.$scrubTrack.clientWidth - 20, duration: 1, ease: 'none' });
      this._scrubbing = false;
      this.$scrubSlider.addEventListener('input', () => {
         const val = parseFloat(this.$scrubSlider.value);
         this._scrubTL.progress(val);
         this.$scrubPct.textContent = `${Math.round(val * 100)}%`;
      });

      // ── handle resize for dynamic widths ──
      this._resizeObserver = new ResizeObserver(() => {
         if (this._tl) {
            this._tl.clear();
            this._tl.to(this.$tlDot, { x: () => this.$tlTrack.clientWidth - 20, duration: 0.6, ease: 'power2.inOut' });
         }
      });
      this._resizeObserver.observe(this.$tlTrack);
      this._resizeObserver.observe(this.$scrubTrack);
   }

   beforeDestroy() {
      this._tl?.kill();
      this._labelTL?.kill();
      this._scrubTL?.kill();
      this._spinTween?.kill();
      this._resizeObserver?.disconnect();
   }
}

function cssObj(obj) {
   return Object.entries(obj).map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`).join(';');
}

customElements.define('slice-gsap-showcase', GsapShowcase);
