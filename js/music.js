// Trilha sonora de "Por Trás da Cidade":
// Trilha 1: "Vila Chiptune (8-bit)" - chiptune procedural via Web Audio API.
// Trilha 2: "Tema da Cidade" - trilha completa importada (audio/tema-cidade.wav).

const Music = {
  ctx: null, master: null, timer: null, step: 0, next: 0, playing: false,
  bpm: 112,
  chordsRoot: [36, 33, 41, 43], // baixo: C, Am, F, G
  melody: [76,79,76,72,74,76,79,0,  69,72,76,72,69,72,71,0,  69,72,77,72,81,79,77,76,  74,79,83,79,74,76,74,0],
  
  tracks: [
    { id: 'synth', name: '1. Vila Chiptune (8-bit)', type: 'synth' },
    { id: 'theme', name: '2. Tema da Cidade', type: 'audio', src: 'audio/tema-cidade.wav' }
  ],
  audioEl: null,

  enabled() {
    return Save.data.settings.music !== false;
  },

  getTrackIndex() {
    const idx = Save.data.settings.trackIndex;
    return (typeof idx === 'number' && idx >= 0 && idx < this.tracks.length) ? idx : 0;
  },

  getCurrentTrack() {
    return this.tracks[this.getTrackIndex()];
  },

  hz(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  initSynth() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.12;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.05,
          buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate),
          d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    this.noise = buf;
  },

  initAudio() {
    if (this.audioEl) return;
    this.audioEl = new Audio('audio/tema-cidade.wav');
    this.audioEl.loop = true;
    this.audioEl.volume = 0.55;
    this.audioEl.preload = 'auto';
  },

  tone(n, t, dur, type, vol) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = this.hz(n);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },

  schedule(s, t) {
    const dur = 60 / this.bpm / 2, bar = Math.floor(s / 8) % 4, beat = s % 8;
    if (this.melody[s]) this.tone(this.melody[s], t, dur * 1.6, 'square', 0.35);
    if (beat % 4 === 0) this.tone(this.chordsRoot[bar], t, dur * 3.5, 'triangle', 0.9);
    if (beat % 2 === 1) this.tone(this.chordsRoot[bar] + 12 + (beat === 3 || beat === 7 ? 7 : 4), t, dur * 0.8, 'square', 0.12);
    if (beat % 2 === 1) {
      const n = this.ctx.createBufferSource(), g = this.ctx.createGain();
      n.buffer = this.noise; g.gain.value = 0.25;
      n.connect(g); g.connect(this.master);
      n.start(t);
    }
  },

  startSynth() {
    this.initSynth();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.next = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => {
      if (this.next < this.ctx.currentTime) {
        this.next = this.ctx.currentTime + 0.05;
      }
      while (this.next < this.ctx.currentTime + 0.25) {
        this.schedule(this.step, this.next);
        this.step = (this.step + 1) % 32;
        this.next += 60 / this.bpm / 2;
      }
    }, 60);
  },

  stopSynth() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  },

  startAudio() {
    this.initAudio();
    if (!this.audioEl) return;
    try {
      if (this.audioEl.readyState >= 1) {
        this.audioEl.currentTime = 0;
      }
    } catch (e) {}
    const p = this.audioEl.play();
    if (p && typeof p.then === 'function') {
      p.catch(e => {
        console.warn("Reprodução de áudio aguardando interação:", e);
      });
    }
  },

  stopAudio() {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
      } catch (e) {}
    }
  },

  stopCurrent() {
    this.stopSynth();
    this.stopAudio();
  },

  start() {
    this.playing = true;
    if (!this.enabled()) {
      this.stopCurrent();
      this.updateUI();
      return;
    }
    const track = this.getCurrentTrack();
    if (track.type === 'synth') {
      this.stopAudio();
      this.startSynth();
    } else {
      this.stopSynth();
      this.startAudio();
    }
    this.updateUI();
  },

  stop() {
    this.playing = false;
    this.stopCurrent();
    this.updateUI();
  },

  setTrack(index) {
    index = ((index % this.tracks.length) + this.tracks.length) % this.tracks.length;
    Save.data.settings.trackIndex = index;
    Save.save();

    this.stopCurrent();
    if (this.enabled()) {
      this.playing = true;
      const track = this.getCurrentTrack();
      if (track.type === 'synth') {
        this.startSynth();
      } else {
        this.startAudio();
      }
    }
    this.updateUI();
    return this.getCurrentTrack();
  },

  nextTrack() {
    const nextIdx = (this.getTrackIndex() + 1) % this.tracks.length;
    return this.setTrack(nextIdx);
  },

  toggleMute() {
    const nextEnabled = !this.enabled();
    Save.data.settings.music = nextEnabled;
    Save.save();
    if (nextEnabled) {
      this.start();
    } else {
      this.stopCurrent();
    }
    this.updateUI();
    return nextEnabled;
  },

  updateUI() {
    const isMuted = !this.enabled();
    const track = this.getCurrentTrack();
    const trackIdx = this.getTrackIndex();

    // 1. Checkbox em Configurações
    const chk = document.getElementById('opt-music');
    if (chk) chk.checked = !isMuted;

    // 2. Select em Configurações
    const sel = document.getElementById('select-track');
    if (sel && sel.value != trackIdx) sel.value = String(trackIdx);

    // 3. Botão Mudo no HUD do jogo
    const btnMute = document.getElementById('btn-mute-hud');
    if (btnMute) {
      btnMute.textContent = isMuted ? '🔇' : '🔊';
      btnMute.title = isMuted ? 'Desmutar (Tecla M)' : 'Mudo (Tecla M)';
      btnMute.setAttribute('aria-label', isMuted ? 'Desmutar som (Tecla M)' : 'Mutar som (Tecla M)');
      btnMute.classList.toggle('is-muted', isMuted);
    }

    // 4. Botão Trilha no HUD do jogo
    const btnTrack = document.getElementById('btn-track-hud');
    if (btnTrack) {
      btnTrack.textContent = '🎵 ' + (trackIdx + 1);
      btnTrack.title = 'Trocar música (Tecla T) — Atual: ' + track.name;
      btnTrack.setAttribute('aria-label', 'Trocar música (Tecla T) — Atual: ' + track.name);
    }

    // 5. Botões no Menu Principal
    const btnTrackMenu = document.getElementById('btn-track-menu');
    if (btnTrackMenu) {
      btnTrackMenu.textContent = '🎵 ' + track.name;
      btnTrackMenu.title = 'Trocar música (Tecla T)';
    }
    const btnMuteMenu = document.getElementById('btn-mute-menu');
    if (btnMuteMenu) {
      btnMuteMenu.textContent = isMuted ? '🔇 Áudio Desativado' : '🔊 Som Ligado';
      btnMuteMenu.title = 'Alternar mudo (Tecla M)';
      btnMuteMenu.classList.toggle('is-muted', isMuted);
    }
  }
};

document.addEventListener('visibilitychange', () => {
  if (!Music.playing) return;
  if (document.hidden) {
    if (Music.ctx && Music.ctx.state === 'running') Music.ctx.suspend().catch(() => {});
    if (Music.audioEl && !Music.audioEl.paused) Music.audioEl.pause();
  } else if (Music.enabled()) {
    const track = Music.getCurrentTrack();
    if (track.type === 'synth' && Music.ctx) Music.ctx.resume().catch(() => {});
    else if (track.type === 'audio' && Music.audioEl) Music.audioEl.play().catch(() => {});
  }
});
