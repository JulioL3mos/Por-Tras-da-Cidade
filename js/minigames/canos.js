// Mini game "conectar os canos" (saneamento). A água corre pelos canos; gire-os a tempo.
// Cano que a água já passou fica travado. Se vazar, a água volta ao tanque (os canos continuam como estão).
Object.assign(Minigames, {
  canos(root, cfg, done, say) {
    const COLS = cfg.cols || 6, ROWS = cfg.rows || 5, S = 64, M = 48, W = M * 2 + COLS * S, H = ROWS * S;
    const UP = 1, RIGHT = 2, DOWN = 4, LEFT = 8, DX = { 1: 0, 2: 1, 4: 0, 8: -1 }, DY = { 1: -1, 2: 0, 4: 1, 8: 0 };
    const rotMask = (m, r) => { for (let k = 0; k < r; k++) m = ((m << 1) | (m >> 3)) & 15; return m; }, opp = b => ((b << 2) | (b >> 2)) & 15, BASE = { reto: 5, curva: 3 };
    const nomes = { 1: 'cima', 2: 'direita', 4: 'baixo', 8: 'esquerda' };
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas', tabIndex: 0 });
    cv.setAttribute('role', 'application');
    cv.setAttribute('aria-label', 'Mini game de canos: gire os canos para ligar o tanque, à esquerda, à torneira, à direita. Com o teclado, use as setas para escolher o cano e Enter ou Espaço para girar.');
    const info = el('p', { className: 'mg-info' });
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, info, el('p', { className: 'mg-help', textContent: 'Toque ou clique num cano para girar. Teclado: setas ou W A S D para escolher e Enter ou Espaço para girar. Depois que a água passa, o cano trava. Sem tempo limite: se vazar, a água volta ao tanque.' }), start, pauseBtn, skip);
    start.focus();

    let seed = cfg.seed || 3; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    // Caminho-solução da esquerda para a direita
    const sr = Math.floor(rnd() * ROWS); let r = sr; const path = [];
    for (let c = 0; c < COLS; c++) { path.push([c, r]); const t = Math.max(0, Math.min(ROWS - 1, r + Math.floor(rnd() * 5) - 2)); while (r !== t) { r += r < t ? 1 : -1; path.push([c, r]); } }
    const er = r, grid = [], sol = [];
    for (let y = 0; y < ROWS; y++) { grid.push([]); sol.push([]); for (let x = 0; x < COLS; x++) { const q = rnd(); grid[y].push({ type: q < .3 ? 'vazio' : q < .55 ? 'reto' : 'curva', rot: Math.floor(rnd() * 4), filled: false }); sol[y].push(null); } }
    path.forEach(([x, y], i) => {
      const prev = path[i - 1], next = path[i + 1], dir = (a, b) => b[0] > a[0] ? RIGHT : b[1] > a[1] ? DOWN : UP;
      const entry = prev ? opp(dir(prev, [x, y])) : LEFT, exit = next ? dir([x, y], next) : RIGHT, mk = entry | exit, type = (mk === 5 || mk === 10) ? 'reto' : 'curva';
      let want = 0; while (rotMask(BASE[type], want) !== mk) want++;
      sol[y][x] = want; const wrong = type === 'reto' ? (want + 1 + 2 * Math.floor(rnd() * 2)) % 4 : (want + 1 + Math.floor(rnd() * 3)) % 4;
      grid[y][x] = { type, rot: rnd() < .8 ? wrong : want, filled: false };
    });
    const mask = t => t.type === 'vazio' ? 0 : rotMask(BASE[t.type], t.rot);
    const calm = Save.data.settings.calm, passo = (cfg.passo || 1.3) * (calm ? 1.4 : 1), atraso0 = cfg.atraso || 6, ctx = cv.getContext('2d');
    let cur = 0, leaks = 0, delay = atraso0, front = null, stepT = 0, running = false, paused = false, finished = false, last = 0, spill = 0, spillAt = null, lastSec = -1;
    const updInfo = (txt) => { info.textContent = 'Tentativa ' + (leaks + 1) + ' · ' + txt; };
    updInfo('A água começa a correr quando você clicar em Começar.');
    const describe = i => { const x = i % COLS, y = Math.floor(i / COLS), t = grid[y][x], m = mask(t), base = 'Linha ' + (y + 1) + ', coluna ' + (x + 1) + ': ';
      if (t.type === 'vazio') return base + 'sem cano.';
      return base + (t.type === 'reto' ? 'cano reto' : 'cano em curva') + ' ligando ' + [1, 2, 4, 8].filter(b => m & b).map(b => nomes[b]).join(' e ') + (t.filled ? '. Tem água, está travado.' : '.'); };
    const rotate = (x, y) => { const t = grid[y][x]; cur = y * COLS + x; if (!running || paused || finished || t.type === 'vazio') return; if (t.filled) { say('A água já passou por esse cano, ele está travado.'); return; } t.rot = (t.rot + 1) % 4; say(describe(cur)); };
    const finish = txt => { if (finished) return; finished = true; running = false; say(txt); setTimeout(done, 1200); };
    const leak = () => { leaks++; spill = 1.2; spillAt = { x: front.x, y: front.y, entry: front.entry }; grid.forEach(row => row.forEach(t => { t.filled = false; })); front = null; delay = Math.min(atraso0, 4);
      say('Vazamento! A água voltou ao tanque. Os canos continuam como você deixou. Arrume e tente de novo. Tentativa ' + (leaks + 1) + '.'); if (leaks >= 3) skip.hidden = false; };
    const advance = () => {
      const t = grid[front.y][front.x], mk = mask(t);
      if (!(mk & front.entry)) { leak(); return; }
      t.filled = true; const out = mk & ~front.entry, nx = front.x + DX[out], ny = front.y + DY[out];
      if (nx >= COLS && out === RIGHT && front.y === er) { finish(leaks === 0 ? (cfg.vitoria || 'A água chegou às torneiras de primeira! Parabéns!') : 'A água chegou às torneiras na tentativa ' + (leaks + 1) + '! Quem persiste chega lá.'); return; }
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) { front = { x: front.x, y: front.y, entry: out }; leak(); return; }
      front = { x: nx, y: ny, entry: opp(out) };
    };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); const rc = cv.getBoundingClientRect(), px = (e.clientX - rc.left) / rc.width * W - M, py = (e.clientY - rc.top) / rc.height * H; const x = Math.floor(px / S), y = Math.floor(py / S); if (x >= 0 && x < COLS && y >= 0 && y < ROWS) rotate(x, y); });
    cv.addEventListener('keydown', e => { const k = e.key, x = cur % COLS, y = Math.floor(cur / COLS); let n = cur;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') n = x ? cur - 1 : cur; else if (k === 'ArrowRight' || k === 'd' || k === 'D') n = x < COLS - 1 ? cur + 1 : cur;
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') n = y ? cur - COLS : cur; else if (k === 'ArrowDown' || k === 's' || k === 'S') n = y < ROWS - 1 ? cur + COLS : cur;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); rotate(x, y); return; } else return;
      e.preventDefault(); cur = n; say(describe(cur)); });

    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const arms = (cx, cy, m, th, col) => { rect(col, cx - th / 2, cy - th / 2, th, th); if (m & UP) rect(col, cx - th / 2, cy - S / 2, th, S / 2); if (m & DOWN) rect(col, cx - th / 2, cy, th, S / 2); if (m & LEFT) rect(col, cx - S / 2, cy - th / 2, S / 2, th); if (m & RIGHT) rect(col, cx, cy - th / 2, S / 2, th); };
    const draw = () => {
      rect('#7a5a3a', 0, 0, W, H);
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) { const t = grid[y][x], px = M + x * S, py = y * S, cx = px + S / 2, cy = py + S / 2, m = mask(t);
        rect('#8a6a4a', px + 1, py + 1, S - 2, S - 2);
        if (t.type !== 'vazio') { arms(cx, cy, m, 26, '#4b5563'); arms(cx, cy, m, 20, '#9aa4b2'); if (t.filled) arms(cx, cy, m, 12, '#3fa7ff'); } }
      if (front) { const px = M + front.x * S + S / 2, py = front.y * S + S / 2; arms(px, py, front.entry, 12, '#7fc4ff'); }
      rect('#3f8fd8', 4, sr * S + 8, M - 12, S - 16); rect('#bfe0ff', 8, sr * S + 12, M - 20, 8); rect('#9aa4b2', M - 8, sr * S + S / 2 - 10, 8, 20); rect('#3fa7ff', M - 8, sr * S + S / 2 - 6, 8, 12);
      const hx = M + COLS * S, hy = er * S; rect('#9aa4b2', hx, hy + S / 2 - 10, 10, 20); rect('#c8503c', hx + 12, hy + 14, 30, 8); rect('#fff6dc', hx + 14, hy + 22, 26, 22); rect('#5b3a1e', hx + 24, hy + 30, 8, 14); rect('#3fa7ff', hx + 4, hy + S / 2 + 12, 6, 8);
      ctx.fillStyle = '#fff6dc'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('TANQUE', 20, sr * S + S - 2); ctx.fillText('TORNEIRA', hx + 24, hy + S - 2);
      if (spill > 0 && spillAt) { const px = M + spillAt.x * S + S / 2, py = spillAt.y * S + S / 2; rect('#e94f37', px - 14, py - 14, 28, 28); rect('#fff', px - 8, py - 8, 16, 16); ctx.fillStyle = '#e94f37'; ctx.fillText('VAZOU!', px, py - 18); }
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.strokeRect(M + (cur % COLS) * S + 3, Math.floor(cur / COLS) * S + 3, S - 6, S - 6);
      if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const frame = t => {
      if (!cv.isConnected) { running = false; return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden, dt = Math.min(.05, (t - last) / 1000); last = t;
      if (running && !paused && !menuOpen && !finished) {
        spill = Math.max(0, spill - dt);
        if (!front) { delay -= dt; const sec = Math.max(0, Math.ceil(delay)); if (sec !== lastSec) { lastSec = sec; updInfo(sec > 0 ? 'A água chega em ' + sec + 's. Arrume os canos!' : 'A água está correndo!'); }
          if (delay <= 0) { front = { x: 0, y: sr, entry: LEFT }; stepT = 0; } }
        else { stepT -= dt; if (stepT <= 0) { stepT = passo; advance(); if (front) updInfo('A água está correndo! Arrume os canos à frente dela.'); } }
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; say('A água chega em ' + atraso0 + ' segundos. Arrume os canos!'); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); };
    skip.onclick = () => finish('Tudo bem! A missão foi concluída com ajuda.');
    cv._state = { grid, sol, path, sr, er, rotate, get leaks() { return leaks; }, get finished() { return finished; }, COLS, ROWS };
    draw(); requestAnimationFrame(frame);
  }
});
