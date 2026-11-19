// Estado global e salvamento automático (localStorage)
const Save = {
  key: 'por-tras-da-cidade-v1',
  data: { stars: [], settings: { contrast: false, bigfont: false, calm: false } },
  load() {
    try { Object.assign(this.data, JSON.parse(localStorage.getItem(this.key)) || {}); } catch (e) {}
    this.applySettings();
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) {} },
  reset() { this.data.stars = []; this.save(); },
  applySettings() {
    const s = this.data.settings;
    document.body.classList.toggle('contrast', s.contrast);
    document.body.classList.toggle('bigfont', s.bigfont);
    document.body.classList.toggle('calm', s.calm);
  }
};
// Entrada compartilhada entre teclado e toque
const Input = { up: false, down: false, left: false, right: false, act: false };
