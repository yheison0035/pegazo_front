// Sonido del aviso de consignación: una campana corta (muy compatible) + la voz.
// La campana usa Web Audio (suena aunque el navegador bloquee la voz TTS).

export function chime() {
  try {
    if (typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const beep = (freq, start, dur) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      const t = ctx.currentTime + start;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t);
      o.stop(t + dur + 0.02);
    };
    // Dos notas tipo "ding-dong".
    beep(880, 0, 0.28);
    beep(1175, 0.18, 0.35);
  } catch {
    /* ignora */
  }
}

export function speak(text) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'es-CO';
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch {
    /* el navegador puede bloquear la voz hasta que el usuario interactúe */
  }
}

// Campana + voz con el valor y (si viene) el nombre.
export function announceDeposit(amount, senderName) {
  chime();
  speak(
    `Recibiste una consignación de ${Math.round(Number(amount) || 0)} pesos${
      senderName ? `, de ${senderName}` : ''
    }`
  );
}
