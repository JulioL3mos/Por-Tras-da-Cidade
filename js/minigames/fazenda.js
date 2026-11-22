// Mini game "Rotina da fazenda" (agricultor): arar, plantar, regar e carregar a colheita.
// Errar numa tarefa repete só aquela tarefa. Depois de várias falhas, aparece o botão de pular.
Object.assign(Minigames, {
  fazenda(root, cfg, done, say) {
    const W = 480, H = 280, BANDS = [70, 140, 210], SEG = 44, X0 = 24, X1 = W - 24, SW = (X1 - X0) / SEG, calm = Save.data.settings.calm;
    const NOMES = ['Arar a terra', 'Plantar as mudas', 'Regar', 'Colher e levar ao mercado'];
    const DICAS = ['Segure e arraste a enxada por cada faixa para abrir a terra. Desvie das pedras!', 'Toque nos pontos marcados para plantar uma muda em cada um.', 'Segure o botão para regar. Mantenha a umidade na faixa CERTA por 4 segundos. Encharcar estraga as mudas.', 'Passe para o caminhão só os tomates maduros. Os verdes ficam no pé.'];
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas', tabIndex: 0 });
    cv.setAttribute('role', 'application');
    const info = el('p', { className: 'mg-info' }), tarefa = el('p', { className: 'mg-visitante' }); tarefa.setAttribute('aria-live', 'polite');
    const prog = el('progress', { max: 100, value: 0 }); prog.setAttribute('aria-label', 'Progresso da tarefa');
    const regar = el('button', { className: 'btn', type: 'button', textContent: 'Segurar para regar', hidden: true });
    const tray = el('div', { className: 'mg-tray', role: 'group', hidden: true }); tray.setAttribute('aria-label', 'Caixas de tomates');
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, prog, info, tarefa, regar, tray, start, pauseBtn, skip);
    start.focus();

    let seed = cfg.seed || 4; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    let fase = 0, falhas = 0, running = false, paused = false, finished = false, last = 0, clock = 0, shake = 0, lifted = false, fim = 0;
    // arar
    const furrow = BANDS.map(() => Array(SEG).fill(false)), rocks = [];
    BANDS.forEach((y, b) => { [0, 1].forEach(k => rocks.push({ x: X0 + 90 + k * 170 + rnd() * 70, y: y + (rnd() < .5 ? -14 : 14), r: 12, b })); });
    const hoe = { x: X0, y: BANDS[0], vx: 0, vy: 0 }, ptr = { down: false, x: 0, y: 0 }, keys = { up: false, down: false, left: false, right: false };
    // plantar
    const spots = []; BANDS.forEach((y, b) => [0, 1, 2, 3].forEach(k => spots.push({ x: 80 + k * 110, y, planted: false })));
    let cursor = 0, errosPlantio = 0;
    // regar
    let moist = .1, okT = 0, hold = false, lastMsg = 0;
    // carregar
    const crates = [0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ id: i, ripe: i < 5, loaded: false })); const ordem = crates.map((c, i) => crates[(i * 3 + 1) % 8]); let carregadas = 0, fimTimer = 0;
    const updInfo = () => { info.textContent = 'Tarefa ' + Math.min(fase + 1, 4) + ' de 4: ' + (NOMES[fase] || 'Fim') + ' · Falhas: ' + falhas; };
    const setFase = n => { fase = n; updInfo(); prog.value = 0; tarefa.textContent = DICAS[n] || ''; if (DICAS[n]) say('Tarefa ' + (n + 1) + ' de 4: ' + NOMES[n] + '. ' + DICAS[n]);
      regar.hidden = n !== 2; tray.hidden = n !== 3; cv.setAttribute('aria-label', 'Fazenda, tarefa ' + (n + 1) + ' de 4: ' + NOMES[n] + '. ' + DICAS[n]); };
    const falha = msg => { falhas++; shake = .35; updInfo(); say(msg); if (falhas >= 3) skip.hidden = false; };
    const finish = txt => { if (finished) return; finished = true; running = false; say(txt); setTimeout(done, 1500); };
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
    // --- arar ---
    const resetArar = () => { furrow.forEach(f => f.fill(false)); hoe.x = X0; hoe.y = BANDS[0]; };
    const down = (x, y) => { if (!running || paused || finished || fase !== 0) return; ptr.down = true; ptr.x = x; ptr.y = y; hoe.x = x; hoe.y = y; };
    const move = (x, y) => { ptr.x = x; ptr.y = y; }, up = () => { ptr.down = false; };
    // --- plantar ---
    const tocar = (x, y) => { if (!running || paused || finished || fase !== 1) return; let s = null, d = 1e9; spots.forEach(p => { const k = Math.hypot(p.x - x, p.y - y); if (k < d) { d = k; s = p; } });
      if (s && d <= 22) { if (!s.planted) { s.planted = true; const n = spots.filter(p => p.planted).length; prog.value = Math.round(n / spots.length * 100); if (n < spots.length) { if (n % 4 === 0) say(n + ' de ' + spots.length + ' mudas plantadas.'); } else { say('Todas as mudas foram plantadas!'); setFase(2); } } }
      else { errosPlantio++; if (errosPlantio >= 3) { errosPlantio = 0; spots.forEach(p => { p.planted = false; }); prog.value = 0; falha('Plantou fora dos pontos três vezes! As mudas ficaram apertadas e a tarefa recomeça. Planta só nos pontos marcados.'); } else say('Ali não é um ponto de plantio. Toque nos círculos marcados nas faixas.'); } };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); const p = pt(e); if (fase === 0) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} down(p.x, p.y); } else if (fase === 1) tocar(p.x, p.y); });
    cv.addEventListener('pointermove', e => { if (ptr.down) { const p = pt(e); move(p.x, p.y); } }); ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, up));
    const KM = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    cv.addEventListener('keydown', e => { const k = KM[e.key], act = e.key === 'Enter' || e.key === ' ';
      if (fase === 0) { if (k) keys[k] = true; else if (act) { if (!e.repeat) { lifted = !lifted; say(lifted ? 'Enxada levantada.' : 'Enxada abaixada: arando.'); } } else return; }
      else if (fase === 1) { if (k === 'left' || k === 'up') cursor = (cursor + spots.length - 1) % spots.length; else if (k === 'right' || k === 'down') cursor = (cursor + 1) % spots.length; else if (act) { const s = spots[cursor]; tocar(s.x, s.y); } else return; if (k) say('Ponto ' + (cursor + 1) + ' de ' + spots.length + (spots[cursor].planted ? ', já plantado.' : '.')); }
      else if (fase === 2) { if (act) { if (!hold) { hold = true; } } else return; } else return; e.preventDefault(); });
    cv.addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = false; if ((e.key === 'Enter' || e.key === ' ') && fase === 2) hold = false; });
    regar.addEventListener('pointerdown', e => { e.preventDefault(); hold = true; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => regar.addEventListener(t, () => { hold = false; }));
    regar.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); hold = true; } }); regar.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') hold = false; });
    // --- carregar (arrastar ou clicar) ---
    let drag = null, ghost = null; const insideCanvas = e => { const r = cv.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    const icone = (g, ripe) => { g.fillStyle = '#b9946f'; g.fillRect(4, 22, 40, 20); g.fillStyle = '#8a6a4a'; g.fillRect(4, 22, 40, 3); [[10, 14], [24, 12], [18, 18]].forEach(([x, y]) => { g.fillStyle = ripe ? '#e8321f' : '#6fbf3f'; g.fillRect(x, y, 12, 12); g.fillStyle = '#2f8a3e'; g.fillRect(x + 4, y - 3, 4, 3); }); };
    const carregar = c => {
      if (finished || c.loaded || fase !== 3) return;
      if (!c.ripe) { falha('Esse tomate ainda está verde! Deixe no pé para amadurecer. Ele voltou para a bandeja.'); return; }
      c.loaded = true; c.btn.disabled = true; carregadas++; prog.value = Math.round(carregadas / 5 * 100); say('Caixa de tomates maduros no caminhão! ' + carregadas + ' de 5.');
      if (carregadas >= 5) { fase = 4; updInfo(); tray.hidden = true; tarefa.textContent = 'Do plantio ao mercado: tudo feito pelo agricultor!'; fimTimer = 0; fim = 1; cv.setAttribute('aria-label', 'O caminhão sai para o mercado. Plantio, cuidado, colheita, transporte e mercado: o caminho do tomate até o seu prato.'); finish('O caminhão sai para o mercado! Plantio, cuidado, colheita e transporte: foi assim que o tomate chegou ao prato. Parabéns, Seu Tião!'); } };
    ordem.forEach(c => { const b = el('button', { type: 'button', className: 'btn ghost mg-piece' }), cc = el('canvas', { width: 48, height: 48 }); cc.setAttribute('aria-hidden', 'true'); icone(cc.getContext('2d'), c.ripe); b.append(cc, el('span', { textContent: 'Tomate ' + (c.ripe ? 'maduro' : 'verde') })); c.btn = b;
      b.addEventListener('pointerdown', e => { if (b.disabled || finished) return; drag = { c, sx: e.clientX, sy: e.clientY, moved: false }; try { b.setPointerCapture(e.pointerId); } catch (x) {} });
      b.addEventListener('pointermove', e => { if (!drag || drag.c !== c) return; if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) { drag.moved = true; ghost = el('div', { className: 'mg-ghost' }); const gc = el('canvas', { width: 48, height: 48 }); icone(gc.getContext('2d'), c.ripe); ghost.append(gc); document.body.append(ghost); }
        if (ghost) { ghost.style.left = e.clientX - 24 + 'px'; ghost.style.top = e.clientY - 24 + 'px'; cv.classList.toggle('mg-over', insideCanvas(e)); } });
      const end = e => { if (!drag || drag.c !== c) return; const d = drag; drag = null; if (ghost) { ghost.remove(); ghost = null; } cv.classList.remove('mg-over'); if (e.type === 'pointercancel') return; if (!d.moved || insideCanvas(e)) carregar(c); else say('Solte a caixa em cima do caminhão.'); };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('click', e => { if (e.detail === 0) carregar(c); }); tray.append(b); });

    const ctx = cv.getContext('2d'), rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const txt = (t, x, y, c = '#1d2547', f = 'bold 10px monospace') => { ctx.fillStyle = c; ctx.font = f; ctx.textAlign = 'center'; ctx.fillText(t, x, y); };
    const muda = (x, y, s) => { rect('#4fa34a', x - 2 * s, y - 10 * s, 4 * s, 10 * s); rect('#6fbf3f', x - 8 * s, y - 10 * s, 6 * s, 4 * s); rect('#6fbf3f', x + 2 * s, y - 13 * s, 6 * s, 4 * s); };
    const draw = () => {
      ctx.save(); if (shake > 0 && !calm) ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
      if (fase <= 1) { rect('#8b5a2b', 0, 0, W, H); BANDS.forEach((y, b) => { rect('#7a4d22', X0, y - 24, X1 - X0, 48); const f = furrow[b]; for (let i = 0; i < SEG; i++) if (f[i]) rect('#4a2f17', X0 + i * SW, y - 12, Math.ceil(SW) + 1, 24); });
        rocks.forEach(r => { rect('#9aa4b2', r.x - r.r, r.y - r.r + 3, r.r * 2, r.r * 2 - 5); rect('#cbd5e1', r.x - r.r + 3, r.y - r.r + 2, r.r, 4); });
        if (fase === 1) spots.forEach((s, i) => { ctx.strokeStyle = s.planted ? '#6fbf3f' : '#ffd166'; ctx.lineWidth = 3; ctx.strokeRect(s.x - 14, s.y - 14, 28, 28); if (s.planted) muda(s.x, s.y + 8, 1.4); if (i === cursor) { ctx.strokeStyle = '#e94f37'; ctx.lineWidth = 3; ctx.strokeRect(s.x - 19, s.y - 19, 38, 38); } });
        if (fase === 0) { const push = ptr.down || (!lifted && (keys.up || keys.down || keys.left || keys.right)); rect(push ? '#9aa4b2' : '#cbd5e1', hoe.x - 10, hoe.y - 3, 20, 6); rect('#8a5a2b', hoe.x - 2, hoe.y - 34, 4, 32); rect('#3f8fd8', hoe.x - 8, hoe.y - 52, 16, 18); rect('#f2c9a0', hoe.x - 6, hoe.y - 62, 12, 10); rect('#e0b24a', hoe.x - 10, hoe.y - 66, 20, 5); if (!push) txt('LEVANTADA', hoe.x, hoe.y + 18); } }
      else if (fase === 2) { rect('#bfe6ff', 0, 0, W, 130); rect('#8bc66a', 0, 130, W, 20); rect('#8b5a2b', 0, 150, W, H - 150); for (let i = 0; i < 12; i++) muda(30 + i * 36, 210, 1.8 + (okT > 0 ? Math.min(.6, okT / 8) : 0));
        rect('#cbd5e1', 380, 50, 70, 40); rect('#9aa4b2', 372, 60, 10, 14); if (hold && !calm) for (let i = 0; i < 5; i++) rect('#3fa7ff', 340 + ((clock * 40 + i * 9) % 30), 74 + ((clock * 90 + i * 20) % 120), 3, 6);
        const gx = 420, gy = 100, gh = 160; rect('#1d2547', gx - 2, gy - 2, 34, gh + 4); rect('#f2d544', gx, gy + gh * .1, 30, gh * .9 - gh * .1 * 0); rect('#6fbf3f', gx, gy + gh * (1 - .75), 30, gh * .30); rect('#e94f37', gx, gy, 30, gh * .1);
        rect('#3fa7ff', gx + 8, gy + gh * (1 - Math.min(1, moist)), 14, gh * Math.min(1, moist)); txt('ENCHARCADA', gx + 15, gy - 6); txt('CERTO', gx - 22, gy + gh * .40); txt('SECA', gx + 15, gy + gh + 12);
        rect('#1d2547', 20, 20, 160, 14); rect('#6fbf3f', 22, 22, Math.round(156 * Math.min(1, okT / 4)), 10); txt('Tempo na faixa certa', 100, 48); }
      else { rect('#bfe6ff', 0, 0, W, 150); rect('#8bc66a', 0, 150, W, 20); rect('#b9946f', 0, 170, W, 110); rect('#fff', 320, 190, 120, 40); txt('MERCADO', 380, 215, '#1d2547', 'bold 12px monospace'); rect('#c8503c', 310, 180, 140, 10);
        const tx = 40 + (fim ? Math.min(300, fimTimer * 90) : 0), ty = 130; rect('#111', tx + 10, ty + 62, 24, 12); rect('#111', tx + 100, ty + 62, 24, 12); rect('#c8503c', tx, ty + 30, 130, 36); rect('#3f8fd8', tx + 90, ty + 10, 40, 24); rect('#bfe0ff', tx + 112, ty + 14, 14, 14); rect('#8a6a4a', tx + 4, ty + 22, 84, 10);
        for (let i = 0; i < carregadas; i++) { rect('#b9946f', tx + 6 + (i % 3) * 27, ty + 6 + Math.floor(i / 3) * -1 * 0 - (i >= 3 ? 14 : 0) + 8, 24, 14); rect('#e8321f', tx + 10 + (i % 3) * 27, ty + 2 - (i >= 3 ? 14 : 0) + 8, 16, 8); }
        if (fim) { ['PLANTIO', 'CUIDADO', 'COLHEITA', 'TRANSPORTE', 'MERCADO'].forEach((t, i) => { const x = 20 + i * 92; rect('#fff6dc', x, 250, 84, 22); txt(t, x + 42, 265); rect('#6fbf3f', x + 70, 252, 10, 10); if (i < 4) rect('#1d2547', x + 84, 260, 8, 3); }); } }
      ctx.restore(); if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const frame = t => {
      if (!cv.isConnected) { running = false; return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden, dt = Math.min(.05, (t - last) / 1000); last = t;
      if (fim) fimTimer += dt;
      if (running && !paused && !menuOpen && !finished) {
        clock += dt; shake = Math.max(0, shake - dt);
        if (fase === 0) {
          let nx = hoe.x, ny = hoe.y; const kb = keys.up || keys.down || keys.left || keys.right;
          if (ptr.down) { const dx = ptr.x - hoe.x, dy = ptr.y - hoe.y, d = Math.hypot(dx, dy), s = Math.min(d, 260 * dt); if (d > .5) { nx += dx / d * s; ny += dy / d * s; } }
          else if (kb) { const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0), n = Math.hypot(kx, ky) || 1; nx += kx / n * 170 * dt; ny += ky / n * 170 * dt; }
          hoe.x = Math.max(0, Math.min(W, nx)); hoe.y = Math.max(0, Math.min(H, ny));
          const push = ptr.down || (!lifted && kb);
          if (push) { BANDS.forEach((by, b) => { if (Math.abs(hoe.y - by) <= 20) for (let i = 0; i < SEG; i++) if (Math.abs(X0 + i * SW + SW / 2 - hoe.x) < 10) furrow[b][i] = true; });
            if (rocks.some(r => Math.hypot(hoe.x - r.x, hoe.y - r.y) < r.r + 9)) { resetArar(); ptr.down = false; falha('A enxada bateu numa pedra! A terra fechou e a tarefa recomeça. Passe pelo lado livre da faixa.'); } }
          const tot = furrow.reduce((s, f) => s + f.filter(Boolean).length, 0) / (SEG * BANDS.length); prog.value = Math.round(tot * 100);
          if (tot >= .97) { ptr.down = false; say('Terra arada!'); setFase(1); } }
        else if (fase === 2) {
          moist = Math.max(0, moist + (hold ? .35 : -.12) * dt);
          if (moist >= .9) { moist = .1; okT = 0; hold = false; falha('Encharcou! A água demais estraga as mudas e a tarefa recomeça. Solte o botão antes de passar da faixa CERTA.'); }
          else if (moist >= .45 && moist <= .75) { okT += dt; if (okT >= 4) { say('As mudas estão bem regadas!'); okT = 4; setFase(3); } } else okT = Math.max(0, okT - dt);
          prog.value = Math.round(Math.min(1, okT / 4) * 100); }
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; setFase(0); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); cv.focus(); };
    skip.onclick = () => finish('Tudo bem! A rotina da fazenda foi concluída com ajuda.');
    updInfo(); cv.setAttribute('aria-label', 'Fazenda: quatro tarefas em sequência: arar, plantar, regar e colher.');
    cv._state = { hoe, down, move, up, furrow, rocks, BANDS, X0, X1, spots, tocar, crates, carregar, set hold(v) { hold = v; }, get moist() { return moist; }, get okT() { return okT; }, get fase() { return fase; }, get falhas() { return falhas; }, get carregadas() { return carregadas; }, SW, SEG };
    draw(); requestAnimationFrame(frame);
  }
});
