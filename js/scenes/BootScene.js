// Gera toda a pixel art por código (placeholders próprios; podem ser trocados por PNGs depois).
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  tex(key, w, h, fn) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    fn(g); g.generateTexture(key, w, h); g.destroy();
  }
  create() {
    const rnd = new Phaser.Math.RandomDataGenerator(['vila']);
    this.tex('grass', 32, 32, g => {
      g.fillStyle(0x6bbf59).fillRect(0, 0, 32, 32);
      for (let i = 0; i < 14; i++) { g.fillStyle(rnd.pick([0x5aab4a, 0x7ccf68])).fillRect(rnd.between(0, 30), rnd.between(0, 30), 2, 2); }
    });
    this.tex('path', 32, 32, g => {
      g.fillStyle(0xe3c98f).fillRect(0, 0, 32, 32);
      for (let i = 0; i < 10; i++) { g.fillStyle(0xd1b476).fillRect(rnd.between(0, 28), rnd.between(0, 28), 4, 2); }
    });
    this.tex('crop', 32, 32, g => {
      g.fillStyle(0x8b5a2b).fillRect(0, 0, 32, 32);
      for (let y = 4; y < 32; y += 8) { g.fillStyle(0x4fa34a).fillRect(2, y, 28, 3); g.fillStyle(0x7ccf68).fillRect(6, y - 2, 4, 2).fillRect(18, y - 2, 4, 2); }
    });
    this.tex('wall', 32, 32, g => {
      g.fillStyle(0xffffff).fillRect(0, 0, 32, 32).fillStyle(0xdddddd);
      for (let y = 0; y < 32; y += 8) { g.fillRect(0, y, 32, 1); for (let x = (y / 8) % 2 ? 0 : 8; x < 32; x += 16) g.fillRect(x, y, 1, 8); }
    });
    this.tex('roof', 32, 32, g => {
      g.fillStyle(0xffffff).fillRect(0, 0, 32, 32).fillStyle(0xcccccc);
      for (let y = 6; y < 32; y += 8) g.fillRect(0, y, 32, 2);
    });
    this.tex('door', 32, 32, g => { g.fillStyle(0x5b3a1e).fillRect(6, 4, 20, 28).fillStyle(0xffd166).fillRect(21, 18, 3, 3); });
    this.tex('tree', 32, 40, g => {
      g.fillStyle(0x6b4423).fillRect(13, 26, 6, 14);
      g.fillStyle(0x2f8a3e).fillCircle(16, 16, 15).fillStyle(0x3fa84e).fillCircle(11, 12, 7);
    });
    const person = (key, shirt, skin, hair) => this.tex(key, 24, 32, g => {
      g.fillStyle(0x000000, 0.25).fillEllipse(12, 30, 18, 6);
      g.fillStyle(0x2b3a67).fillRect(6, 22, 5, 8).fillRect(13, 22, 5, 8);
      g.fillStyle(shirt).fillRect(4, 12, 16, 12);
      g.fillStyle(skin).fillRect(6, 2, 12, 11).fillRect(2, 13, 3, 8).fillRect(19, 13, 3, 8);
      g.fillStyle(hair).fillRect(5, 0, 14, 5).fillRect(5, 4, 2, 4);
      g.fillStyle(0x1d2547).fillRect(9, 8, 2, 2).fillRect(14, 8, 2, 2);
    });
    person('player', 0xe94f37, 0xf2c9a0, 0x3a2a1a);
    NPCS.forEach(n => person('npc' + n.id, n.color, rnd.pick([0xf2c9a0, 0xc68e5e, 0x8d5a3b]), rnd.pick([0x2b1b0f, 0x6b3a1e, 0xd9b44a, 0x888888])));
    this.tex('mark', 16, 16, g => { g.fillStyle(0xffc93c).fillTriangle(0, 0, 16, 0, 8, 14).lineStyle(2, 0x1d2547).strokeTriangle(0, 0, 16, 0, 8, 14); });
    this.scene.start('World');
  }
}
