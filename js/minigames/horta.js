// Mini game "colher na horta": plantas crescem nas fileiras; ande com o trabalhador e colha só as que estão no ponto.
// Colher antes da hora estraga a planta e a colheita recomeça do zero. Sem tempo limite.
Object.assign(Minigames, {
  horta(root, cfg, done, say) {
    const COLS = cfg.cols || 6, ROWS = cfg.rows || 4, CW = 80, CH = 70, W = COLS * CW, H = ROWS * CH, meta = cfg.meta || 12, calm = Save.data.settings.calm;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas', tabIndex: 0 });
    cv.setAttribute('role', 'application');
    cv.setAttribute('aria-label', cfg.descricao || 'Horta vista de cima, com 4 fileiras de plantas. Ande com as setas e aperte Enter ou Espaço para colher a planta em que você está.');
    const prog = el('progress', { max: meta, value: 0 }); prog.setAttribute('aria-label', 'Progresso da colheita');
    const info = el('p', { className: 'mg-info' });
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    const pad = el('div', { className: 'mg-pad', role: 'group' }); pad.setAttribute('aria-label', 'Controles do trabalhador');
    const keys = { up: false, down: false, left: false, right: false };
    [['▲', 'up', 'Para cima'], ['▼', 'down', 'Para baixo'], ['◀', 'left', 'Para a esquerda'], ['▶', 'right', 'Para a direita']].forEach(([s, k, n]) => {
      const b = el('button', { className: 'btn small', type: 'button', textContent: s }); b.setAttribute('aria-label', n);
      const set = v => e => { e.preventDefault(); setKey(k, v); };
      b.addEventListener('pointerdown', set(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, set(false))); pad.append(b);
    });
    const colher = el('button', { className: 'btn', type: 'button', textContent: 'Colher' }); colher.setAttribute('aria-label', 'Colher a planta em que o trabalhador está');
    root.append(cv, prog, info, el('p', { className: 'mg-help', textContent: 'Setas ou W A S D andam pela horta. Enter, Espaço ou o botão Colher colhem a planta. Só colha as plantas PRONTAS: colher antes da hora estraga e a colheita recomeça do zero. Sem tempo limite.' }), pad, colher, start, pauseBtn, skip);
    start.focus();

    let seed = cfg.seed || 11; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const grow = (cfg.crescimento || 5) * (calm ? 1.3 : 1), janela = (cfg.janela || 7) * (calm ? 1.4 : 1);
    const plants = []; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) plants.push({ stage: 0, t: -rnd() * grow * 1.6, dur: [grow * (.8 + rnd() * .5), grow * (.8 + rnd() * .5)] });
    const w = { c: 0, r: 0, x: 0, y: 0 };
    let running = false, paused = false, finished = false, feitos = 0, resets = 0, moveT = 0, last = 0, clock = 0, shake = 0;
    const NOMES = ['broto', 'crescendo', 'pronta para colher', 'passou do ponto'];
    const updInfo = () => { info.textContent = 'Tentativa ' + (resets + 1) + ' · Colhidas ' + feitos + ' de ' + meta; prog.value = feitos; };
    updInfo();
    const idx = () => w.r * COLS + w.c;
    const describe = () => 'Fileira ' + (w.r + 1) + ', planta ' + (w.c + 1) + ': ' + NOMES[plants[idx()].stage] + '.';
    const move = (dc, dr) => { const nc = Math.max(0, Math.min(COLS - 1, w.c + dc)), nr = Math.max(0, Math.min(ROWS - 1, w.r + dr)); if (nc === w.c && nr === w.r) return; w.c = nc; w.r = nr; say(describe()); };
    const finish = txt => { if (finished) return; finished = true; running = false; say(txt); setTimeout(done, 1200); };
    const harvest = () => {
      if (!running || paused || finished) return; const p = plants[idx()];
      if (p.stage === 2) { p.stage = 0; p.t = -grow * .6; feitos++; updInfo();
        if (feitos >= meta) finish(resets === 0 ? (cfg.vitoria || 'Colheita feita de primeira! Parabéns!') : 'Colheita feita na tentativa ' + (resets + 1) + '! Quem persiste chega lá.'); else if (feitos % 3 === 0) say(feitos + ' de ' + meta + ' colhidas.'); }
      else if (p.stage < 2) { p.stage = 0; p.t = -grow * .6; feitos = 0; resets++; shake = .35; updInfo(); say('Ainda não estava no ponto! A planta estragou e a colheita recomeça do zero. Tentativa ' + (resets + 1) + '. Espere ficar PRONTA.'); if (resets >= 3) skip.hidden = false; }
      else say('Essa planta já passou do ponto. Procure uma pronta.');
    };
    colher.onclick = () => { harvest(); cv.focus(); };
    // Anda uma casa assim que a tecla é apertada e repete enquanto ela estiver segurada
    const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const setKey = (k, v) => { if (v && !keys[k]) { if (running && !paused && !finished) move(DIR[k][0], DIR[k][1]); moveT = .16; } keys[k] = v; };
    const KEYS = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    const kd = e => { const dir = KEYS[e.key];
      if (dir) setKey(dir, true); else if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') { if (!e.repeat) harvest(); } else return; e.preventDefault(); };
    const ku = e => { const dir = KEYS[e.key]; if (dir) setKey(dir, false); };
    cv.addEventListener('keydown', kd); cv.addEventListener('keyup', ku);
    cv.addEventListener('pointerdown', e => { const rc = cv.getBoundingClientRect(), c = Math.floor((e.clientX - rc.left) / rc.width * COLS), r = Math.floor((e.clientY - rc.top) / rc.height * ROWS); if (c >= 0 && c < COLS && r >= 0 && r < ROWS) { w.c = c; w.r = r; } });

    const ctx = cv.getContext('2d'), rect = (c, x, y, wd, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), wd, h); };
    const draw = () => {
      ctx.save(); if (shake > 0 && !calm) ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
      rect('#6b4423', 0, 0, W, H);
      for (let r = 0; r < ROWS; r++) { rect('#8b5a2b', 0, r * CH + 8, W, CH - 16); rect('#7a4d22', 0, r * CH + CH / 2 - 1, W, 2); }
      plants.forEach((p, i) => { const c = i % COLS, r = Math.floor(i / COLS), cx = c * CW + CW / 2, by = r * CH + CH - 18;
        if (p.stage === 0) { rect('#4fa34a', cx - 2, by - 12, 4, 12); rect('#6fbf3f', cx - 8, by - 12, 6, 4); rect('#6fbf3f', cx + 2, by - 14, 6, 4); }
        else if (p.stage === 1) { rect('#2f8a3e', cx - 14, by - 26, 28, 26); rect('#4fa34a', cx - 10, by - 30, 20, 8); rect('#9ad66b', cx - 6, by - 14, 5, 5); rect('#9ad66b', cx + 3, by - 20, 5, 5); }
        else if (p.stage === 2) { rect('#2f8a3e', cx - 17, by - 32, 34, 32); rect('#4fa34a', cx - 12, by - 36, 24, 8); rect('#e8321f', cx - 12, by - 22, 9, 9); rect('#e8321f', cx + 2, by - 28, 9, 9); rect('#e8321f', cx - 4, by - 12, 9, 9); rect('#fff', cx - 10, by - 20, 2, 2); rect('#fff', cx + 4, by - 26, 2, 2); }
        else { rect('#8a7a52', cx - 14, by - 22, 28, 22); rect('#5b4a2a', cx - 8, by - 14, 6, 6); rect('#5b4a2a', cx + 2, by - 18, 6, 6); }
        ctx.fillStyle = '#fff6dc'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText(['BROTO', 'CRESCENDO', 'PRONTA!', 'PASSOU'][p.stage], cx, r * CH + CH - 4);
        if (p.stage === 2 && !calm && Math.floor(clock * 4) % 2) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.strokeRect(c * CW + 4, r * CH + 10, CW - 8, CH - 14); } });
      const tx = w.c * CW + CW / 2, ty = w.r * CH + CH / 2 - 4; w.x += (tx - w.x) * (calm ? 1 : .35); w.y += (ty - w.y) * (calm ? 1 : .35);
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 4; ctx.strokeRect(w.c * CW + 3, w.r * CH + 3, CW - 6, CH - 6);
      const x = w.x, y = w.y; rect('#222', x - 8, y + 12, 6, 6); rect('#222', x + 2, y + 12, 6, 6); rect('#3f8fd8', x - 8, y - 2, 16, 15); rect('#f2c9a0', x - 6, y - 12, 12, 10); rect('#e0b24a', x - 12, y - 14, 24, 4); rect('#e0b24a', x - 7, y - 20, 14, 7); rect('#8a5a2b', x + 8, y + 2, 10, 10); rect('#5b3a1e', x + 8, y + 2, 10, 2);
      ctx.restore(); if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const frame = t => {
      if (!cv.isConnected) { running = false; return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden, dt = Math.min(.05, (t - last) / 1000); last = t;
      if (running && !paused && !menuOpen && !finished) {
        clock += dt; shake = Math.max(0, shake - dt); moveT -= dt;
        plants.forEach(p => { p.t += dt; if (p.stage < 2 && p.t >= p.dur[p.stage]) { p.stage++; p.t = 0; } else if (p.stage === 2 && p.t >= janela) { p.stage = 3; p.t = 0; } else if (p.stage === 3 && p.t >= 1.8) { p.stage = 0; p.t = -grow * .4; } });
        if (moveT <= 0 && (keys.up || keys.down || keys.left || keys.right)) { moveT = .14; move((keys.right ? 1 : 0) - (keys.left ? 1 : 0), (keys.down ? 1 : 0) - (keys.up ? 1 : 0)); }
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; say('Começou! As plantas vão crescendo. Colha só as prontas.'); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); cv.focus(); };
    skip.onclick = () => finish('Tudo bem! A colheita foi concluída com ajuda.');
    cv._state = { plants, w, move, harvest, get feitos() { return feitos; }, get resets() { return resets; }, meta, COLS, ROWS, idx };
    draw(); requestAnimationFrame(frame);
  }
});
