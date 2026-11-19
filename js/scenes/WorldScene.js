// Exploração: mapa de Vila Horizonte (50x36 tiles), movimentação, colisões, NPCs.
const T = 32, MAP_W = 50, MAP_H = 36;
// [x, y, largura, altura, cor do telhado] em tiles
const BUILDINGS = [
  [2,2,5,4,0xc8503c],[9,2,5,4,0x3f8fd8],[15,3,4,3,0x8a5cc7],[2,8,4,3,0xe0a030],[19,8,4,3,0xc8503c],
  [27,2,6,5,0x3f8fd8],[35,2,5,4,0xe07a1f],[41,2,6,5,0x888888],[28,9,5,4,0xc8503c],[35,9,5,4,0x2fa84f],
  [3,20,9,6,0xd9468f],[14,25,8,6,0xffffff],
  [28,26,5,4,0xc8503c],[36,26,6,4,0x8a8a8a],[44,25,4,4,0x4a6fa5]
];
class WorldScene extends Phaser.Scene {
  constructor() { super('World'); }
  create() {
    const W = MAP_W * T, H = MAP_H * T;
    this.add.tileSprite(0, 0, W, H, 'grass').setOrigin(0);
    [[0,16,MAP_W,3],[24,0,3,MAP_H]].forEach(([x,y,w,h]) => this.add.tileSprite(x*T, y*T, w*T, h*T, 'path').setOrigin(0));
    [[30,20,6,4],[38,20,8,4],[30,31,5,3]].forEach(([x,y,w,h]) => this.add.tileSprite(x*T, y*T, w*T, h*T, 'crop').setOrigin(0));
    this.walls = this.physics.add.staticGroup();
    BUILDINGS.forEach(([x,y,w,h,c]) => {
      const body = this.add.tileSprite(x*T, y*T, w*T, h*T, 'wall').setOrigin(0).setTint(0xf2e2c4);
      this.add.tileSprite(x*T, y*T, w*T, T, 'roof').setOrigin(0).setTint(c);
      this.add.image(x*T + Math.floor(w/2)*T, (y+h-1)*T, 'door').setOrigin(0);
      this.physics.add.existing(body, true); this.walls.add(body);
    });
    [[1,14],[11,14],[22,13],[22,5],[1,30],[12,18],[23,22],[48,16],[46,12],[26,33]].forEach(([x,y]) => {
      const t = this.add.image(x*T, y*T, 'tree').setOrigin(0).setDepth(y*T+40);
      this.physics.add.existing(t, true); t.body.setSize(14, 10).setOffset(9, 28); this.walls.add(t);
    });
    this.npcs = NPCS.map(n => {
      const s = this.physics.add.staticImage(n.x*T + 16, n.y*T + 16, 'npc' + n.id).setDepth(n.y*T + 32);
      s.npc = n; s.mark = this.add.image(s.x, s.y - 30, 'mark').setDepth(9999);
      if (!Save.data.settings.calm) this.tweens.add({ targets: s.mark, y: s.y - 36, yoyo: true, repeat: -1, duration: 600 });
      return s;
    });
    this.player = this.physics.add.sprite(25*T + 16, 17*T, 'player');
    this.player.body.setSize(16, 12).setOffset(4, 20); this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, W, H);
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.npcs);
    this.cameras.main.setBounds(0, 0, W, H).startFollow(this.player, true, 0.15, 0.15).setZoom(1.5);
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC');
    this.input.keyboard.addCapture('UP,DOWN,LEFT,RIGHT,SPACE');
    this.talking = false; this.regionId = 0;
    this.keys.E.on('down', () => this.interact()); this.keys.SPACE.on('down', () => this.interact());
    this.keys.ESC.on('down', () => window.UI.togglePause());
    this.input.keyboard.on('keydown-M', () => window.handleMuteShortcut && window.handleMuteShortcut());
    this.input.keyboard.on('keydown-T', () => window.handleTrackShortcut && window.handleTrackShortcut());
    window.UI.bindScene(this); this.refreshMarks();
  }
  refreshMarks() { this.npcs.forEach(n => n.mark.setVisible(!Save.data.stars.includes(n.npc.id))); }
  regionAt(x, y) { return (x < 25*T ? 0 : 1) + (y < 17*T ? 0 : 2) + 1; }
  nearestNpc() {
    let best = null, d = 56;
    this.npcs.forEach(n => { const k = Phaser.Math.Distance.Between(n.x, n.y, this.player.x, this.player.y); if (k < d) { d = k; best = n; } });
    return best;
  }
  interact() {
    if (this.talking || this.scene.isPaused()) return;
    const n = this.nearestNpc(); if (!n) return;
    this.talking = true; this.player.setVelocity(0);
    window.UI.openDialog(n.npc, () => { this.talking = false; });
  }
  update() {
    const k = this.keys, p = this.player;
    if (this.talking) { p.setVelocity(0); return; }
    const dx = (k.D.isDown || k.RIGHT.isDown || Input.right ? 1 : 0) - (k.A.isDown || k.LEFT.isDown || Input.left ? 1 : 0);
    const dy = (k.S.isDown || k.DOWN.isDown || Input.down ? 1 : 0) - (k.W.isDown || k.UP.isDown || Input.up ? 1 : 0);
    const v = new Phaser.Math.Vector2(dx, dy).normalize().scale(150);
    p.setVelocity(v.x, v.y);
    p.setDepth(p.y + 16);
    if (dx) p.setFlipX(dx < 0);
    const r = this.regionAt(p.x, p.y);
    if (r !== this.regionId) { this.regionId = r; window.UI.announceRegion(REGIONS[r - 1].name); }
  }
}
