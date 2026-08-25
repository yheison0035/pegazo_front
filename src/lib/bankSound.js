// Sonido del aviso de consignación: una campana corta (Web Audio, muy
// compatible) + la voz (Web Speech). Ambas requieren que el usuario haya
// interactuado con la página al menos una vez (política de autoplay); por eso
// se "desbloquean" en el primer clic/tecla con primeAudio().

let audioCtx = null; // contexto compartido (se resume en el gesto)
let cachedVoices = [];
let voicePrimed = false; // la locución-prime inaudible se hace una sola vez

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

function loadVoices() {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return cachedVoices;
    const v = synth.getVoices();
    if (v && v.length) cachedVoices = v;
  } catch {
    /* ignora */
  }
  return cachedVoices;
}

function pickSpanishVoice() {
  const voices = loadVoices();
  return (
    voices.find((v) => /es[-_]?CO/i.test(v.lang)) ||
    voices.find((v) => /es[-_]?(MX|419|US)/i.test(v.lang)) ||
    voices.find((v) => /^es/i.test(v.lang)) ||
    null
  );
}

// Se llama desde un gesto del usuario (clic/tecla) para desbloquear audio y voz.
export function primeAudio() {
  try {
    const ctx = getCtx();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  } catch {
    /* ignora */
  }
  try {
    const synth = window.speechSynthesis;
    if (synth) {
      synth.resume();
      loadVoices();
      synth.onvoiceschanged = loadVoices;
      // Locución real pero inaudible SOLO la primera vez: satisface el requisito
      // de gesto en Chrome de forma fiable (una cadena vacía no lo desbloquea).
      if (!voicePrimed) {
        const u = new SpeechSynthesisUtterance('.');
        u.volume = 0;
        synth.speak(u);
        voicePrimed = true;
      }
    }
  } catch {
    /* ignora */
  }
}

export function chime() {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
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
    const synth = window.speechSynthesis;
    if (!synth || !text) return;

    const doSpeak = () => {
      try {
        // Limpia la cola (a veces queda una locución atascada que bloquea las
        // siguientes) y reanuda.
        synth.cancel();
        synth.resume();
        const u = new SpeechSynthesisUtterance(text);
        const voices = loadVoices();
        // Voz en español; si no hay ninguna, se usa la voz por defecto del
        // sistema (mejor que forzar un idioma sin voz, que deja todo mudo).
        const v = pickSpanishVoice() || voices[0] || null;
        if (v) {
          u.voice = v;
          u.lang = v.lang || 'es-CO';
        } else {
          u.lang = 'es-CO';
        }
        u.rate = 1;
        u.pitch = 1;
        u.volume = 1;
        // Pequeño respiro tras el cancel() para evitar la carrera en Chrome.
        setTimeout(() => {
          try {
            synth.speak(u);
          } catch {
            /* ignora */
          }
        }, 60);
      } catch {
        /* ignora */
      }
    };

    // Si las voces aún no cargaron, esperamos el evento una sola vez (con un
    // respaldo por si no dispara) para no perder la locución.
    if (!loadVoices().length) {
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        loadVoices();
        doSpeak();
      };
      try {
        synth.addEventListener('voiceschanged', run, { once: true });
      } catch {
        /* ignora */
      }
      setTimeout(run, 300);
    } else {
      doSpeak();
    }
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
