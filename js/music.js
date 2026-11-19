// Trilha "Vila Horizonte": chiptune original gerado pelo Web Audio (sem arquivos de áudio).
const Music = {
  ctx: null, master: null, timer: null, step: 0, next: 0, playing: false,
  bpm: 112,
  chordsRoot: [36, 33, 41, 43],               // baixo: C, Am, F, G
  melody: [76,79,76,72,74,76,79,0,  69,72,76,72,69,72,71,0,  69,72,77,72,81,79,77,76,  74,79,83,79,74,76,74,0],
  enabled() { return Save.data.settings.music !== false; },
  hz(n) { return 440 * Math.pow(2, (n - 69) / 12); },
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC(); this.master = this.ctx.createGain(); this.master.gain.value = 0.12; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.05, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    this.noise = buf;
  },
  tone(n, t, dur, type, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = this.hz(n);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  schedule(s, t) {
    const dur = 60 / this.bpm / 2, bar = Math.floor(s / 8) % 4, beat = s % 8;
    if (this.melody[s]) this.tone(this.melody[s], t, dur * 1.6, 'square', 0.35);
    if (beat % 4 === 0) this.tone(this.chordsRoot[bar], t, dur * 3.5, 'triangle', 0.9);
    if (beat % 2 === 1) this.tone(this.chordsRoot[bar] + 12 + (beat === 3 || beat === 7 ? 7 : 4), t, dur * 0.8, 'square', 0.12);
    if (beat % 2 === 1) { const n = this.ctx.createBufferSource(), g = this.ctx.createGain(); n.buffer = this.noise; g.gain.value = 0.25; n.connect(g); g.connect(this.master); n.start(t); }
  },
  start() {
    if (!this.enabled() || this.playing) return;
    this.init(); if (!this.ctx) return;
    this.ctx.resume(); this.playing = true; this.next = this.ctx.currentTime + 0.1;
    this.timer = setInterval(() => {
      while (this.next < this.ctx.currentTime + 0.25) { this.schedule(this.step, this.next); this.step = (this.step + 1) % 32; this.next += 60 / this.bpm / 2; }
    }, 60);
  },
  stop() { clearInterval(this.timer); this.playing = false; if (this.ctx) this.ctx.suspend(); }
};
document.addEventListener('visibilitychange', () => { if (!Music.ctx) return; if (document.hidden) { Music.ctx.suspend(); } else if (Music.playing) Music.ctx.resume(); });
