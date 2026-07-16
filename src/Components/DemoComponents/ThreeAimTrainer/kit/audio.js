let audioCtx = null;

function init() {
   if (audioCtx) return;
   try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
}

// A context created outside a user gesture starts 'suspended', and every tone
// then plays into silence with no error to show for it. Call this from a real
// gesture (START / click) to bring it back.
export function resumeAudio() {
   init();
   if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
}

function tone(freq, dur, type, vol, ramp) {
   if (!audioCtx) return;
   try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      if (ramp) osc.frequency.linearRampToValueAtTime(ramp, audioCtx.currentTime + dur);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
   } catch (_) {}
}

export function playHitSound() {
   init();
   tone(880, 0.12, 'sine', 0.25, 1200);
}

export function playHeadshotSound() {
   init();
   tone(1100, 0.15, 'sine', 0.3, 1600);
   setTimeout(() => tone(1400, 0.1, 'sine', 0.2, 1800), 50);
}

export function playMissSound() {
   init();
   tone(180, 0.1, 'square', 0.08, 80);
}

export function playShootSound(type) {
   init();
   if (type === 'shotgun') {
      tone(60, 0.15, 'sawtooth', 0.15, 40);
      setTimeout(() => tone(55, 0.1, 'square', 0.08, 30), 20);
   } else if (type === 'rifle') {
      tone(350, 0.06, 'square', 0.12, 200);
   } else {
      tone(200, 0.08, 'square', 0.15, 400);
   }
}

export function playReloadSound() {
   init();
   tone(400, 0.05, 'sine', 0.1, 600);
   setTimeout(() => tone(500, 0.05, 'sine', 0.08, 700), 100);
}
