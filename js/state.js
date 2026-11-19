// Estado global e salvamento automático (localStorage)
const Save = {
  key: 'por-tras-da-cidade-v1',
  data: { stars: [], settings: { contrast: false, bigfont: false, calm: false, music: true, trackIndex: 0 } },
  load() {
    try {
      const stored = JSON.parse(localStorage.getItem(this.key));
      if (stored) {
        if (Array.isArray(stored.stars)) this.data.stars = stored.stars;
        if (stored.settings) Object.assign(this.data.settings, stored.settings);
      }
    } catch (e) { }
    this.applySettings();
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { } },
  reset() { this.data.stars = []; this.save(); },
  applySettings() {
    const s = this.data.settings;
    document.body.classList.toggle('contrast', !!s.contrast);
    document.body.classList.toggle('bigfont', !!s.bigfont);
    document.body.classList.toggle('calm', !!s.calm);
  }
};
// Entrada compartilhada entre teclado e toque
const Input = { up: false, down: false, left: false, right: false, act: false };
