// Mini game "Descarte certo" (limpeza hospitalar): itens passam numa esteira e você escolhe a lixeira.
// Lixeira errada, ou item que chega ao fim da esteira sem escolha, recomeça a triagem (com explicação).
Object.assign(Minigames, {
  lixeiras: [
    { nome: 'Caixa amarela', sub: 'seringas, agulhas e lâminas', why: 'Objetos que furam e cortam machucam quem recolhe o lixo, por isso vão numa caixa rígida.' },
    { nome: 'Saco branco', sub: 'gaze, luva e curativo com sangue', why: 'Material com sangue pode passar doenças, por isso vai no saco branco de resíduo infectante.' },
    { nome: 'Reciclável', sub: 'papel, papelão e plástico limpos', why: 'Papel, papelão e plástico limpos podem virar material novo na reciclagem.' },
    { nome: 'Lixo comum', sub: 'restos de comida e sujeira comum', why: 'Restos de comida e sujeira comum não são perigosos nem recicláveis, então vão no lixo comum.' }
  ],
  itensLixo: [['Seringa usada', 0], ['Agulha usada', 0], ['Lâmina de bisturi', 0], ['Gaze com sangue', 1], ['Luva com sangue', 1], ['Curativo sujo', 1], ['Caixa de papelão', 2], ['Garrafa plástica vazia', 2], ['Folha de papel limpa', 2], ['Restos de comida', 3], ['Guardanapo usado', 3], ['Casca de banana', 3]],
  triagem(root, cfg, done, say) {
    const W = 480, H = 220, B = this.lixeiras, meta = this.itensLixo.length, calm = Save.data.settings.calm, EX = W - 50;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas' });
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', cfg.descricao || 'Esteira de resíduos do hospital. O item que está mais perto do fim da esteira é o próximo a ser separado. Escolha a lixeira com os botões ou as teclas de 1 a 4.');
    const prog = el('progress', { max: meta, value: 0 }); prog.setAttribute('aria-label', 'Itens separados');
    const info = el('p', { className: 'mg-info' }), cur = el('p', { className: 'mg-info', id: 'mg-atual' }); cur.setAttribute('aria-live', 'polite');
    const bins = el('div', { className: 'mg-bins', role: 'group' }); bins.setAttribute('aria-label', 'Lixeiras');
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    const binIcon = (c, i) => { const g = c.getContext('2d'), r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      if (i === 0) { r('#f2b134', 6, 12, 28, 24); r('#a3701a', 4, 8, 32, 6); r('#111', 18, 18, 4, 12); r('#111', 12, 22, 16, 4); }
      else if (i === 1) { r('#fff', 8, 8, 24, 30); r('#9aa4b2', 8, 8, 24, 3); r('#e8321f', 16, 20, 8, 8); r('#9aa4b2', 6, 14, 3, 20); }
      else if (i === 2) { r('#3f8fd8', 6, 12, 28, 24); r('#fff', 14, 18, 12, 3); r('#fff', 14, 24, 12, 3); r('#fff', 14, 30, 12, 3); r('#1d6fb8', 4, 8, 32, 5); }
      else { r('#6b7280', 6, 12, 28, 24); r('#4b5563', 4, 8, 32, 5); r('#9aa4b2', 12, 16, 3, 16); r('#9aa4b2', 25, 16, 3, 16); } };
    const binBtns = B.map((b, i) => { const c = el('canvas', { width: 40, height: 44 }); c.setAttribute('aria-hidden', 'true'); binIcon(c, i);
      const btn = el('button', { className: 'btn ghost mg-bin', type: 'button' }, c, el('span', { innerHTML: '<strong></strong><small></small>' })); btn.querySelector('strong').textContent = (i + 1) + ' · ' + b.nome; btn.querySelector('small').textContent = b.sub;
      btn.setAttribute('aria-label', 'Lixeira ' + (i + 1) + ': ' + b.nome + ', para ' + b.sub); btn.onclick = () => sortear(i); bins.append(btn); return btn; });
    root.append(cv, prog, info, cur, el('p', { className: 'mg-help', textContent: 'O item mais perto do fim da esteira é o próximo. Escolha a lixeira clicando, tocando ou com as teclas 1 a 4. Lixeira errada, ou item que chega ao fim sem escolha, recomeça a triagem.' }), bins, start, pauseBtn, skip);
    start.focus();

    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let fila = [], belt = [], feitos = 0, resets = 0, running = false, paused = false, finished = false, spawnT = 1, last = 0, flash = [0, 0, 0, 0], shake = 0;
    const pr = () => feitos / meta;
    const reiniciar = () => { fila = shuffle(this.itensLixo).map(([nome, bin]) => ({ nome, bin, x: -30 })); belt = []; spawnT = 1.4; };
    reiniciar();
    const lead = () => belt.reduce((m, it) => (!m || it.x > m.x) ? it : m, null);
    const updInfo = () => { info.textContent = 'Tentativa ' + (resets + 1) + ' · Separados ' + feitos + ' de ' + meta; prog.value = feitos; const l = lead(); cur.textContent = l ? 'Próximo item: ' + l.nome : 'Aguardando o próximo item...'; };
    updInfo();
    const finish = txt => { if (finished) return; finished = true; running = false; say(txt); setTimeout(done, 1200); };
    const erro = (it, motivo) => { resets++; feitos = 0; shake = .35; reiniciar(); updInfo(); say(motivo + ' "' + it.nome + '" vai na lixeira "' + B[it.bin].nome + '". ' + B[it.bin].why + ' A triagem recomeça. Tentativa ' + (resets + 1) + '.'); if (resets >= 3) skip.hidden = false; };
    function sortear(i) {
      if (!running || paused || finished) return; const it = lead(); if (!it) return;
      if (it.bin === i) { belt.splice(belt.indexOf(it), 1); feitos++; flash[i] = .35; updInfo();
        if (feitos >= meta) finish(resets === 0 ? (cfg.vitoria || 'Triagem perfeita de primeira! Parabéns!') : 'Triagem concluída na tentativa ' + (resets + 1) + '! Quem persiste chega lá.'); else say('Certo! ' + it.nome + ' na ' + B[i].nome.toLowerCase() + '. ' + feitos + ' de ' + meta + '.'); }
      else erro(it, 'Lixeira errada!');
    }
    const onKey = e => { if (!running) return; const k = Number(e.key); if (k >= 1 && k <= 4) { e.preventDefault(); sortear(k - 1); } };
    window.addEventListener('keydown', onKey);
    const cleanup = () => window.removeEventListener('keydown', onKey);

    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const ctx = cv.getContext('2d');
    const wrap = t => { const w = t.split(' '), l = ['']; w.forEach(x => { if ((l[l.length - 1] + ' ' + x).trim().length > 11 && l[l.length - 1]) l.push(x); else l[l.length - 1] = (l[l.length - 1] + ' ' + x).trim(); }); return l; };
    const icone = (it, x, y) => { const n = it.nome;
      if (/Seringa/.test(n)) { rect('#e5e7eb', x - 14, y - 5, 22, 10); rect('#9aa4b2', x + 8, y - 2, 8, 4); rect('#111', x + 16, y - 1, 8, 2); rect('#e8321f', x - 10, y - 3, 8, 6); rect('#555', x - 18, y - 7, 4, 14); }
      else if (/Agulha/.test(n)) { rect('#cbd5e1', x - 16, y - 1, 32, 3); rect('#555', x - 20, y - 4, 6, 9); }
      else if (/Lâmina/.test(n)) { rect('#cbd5e1', x - 14, y - 6, 26, 12); rect('#555', x - 14, y - 6, 8, 12); rect('#fff', x + 2, y - 3, 8, 2); }
      else if (/Gaze/.test(n)) { rect('#fff', x - 14, y - 12, 28, 24); rect('#e8321f', x - 6, y - 6, 8, 8); rect('#e8321f', x + 4, y + 2, 5, 5); }
      else if (/Luva/.test(n)) { rect('#9ad6ff', x - 10, y - 4, 20, 16); for (let i = 0; i < 4; i++) rect('#9ad6ff', x - 10 + i * 6, y - 14, 4, 10); rect('#e8321f', x - 4, y + 2, 6, 6); }
      else if (/Curativo/.test(n)) { rect('#e8c9a0', x - 16, y - 6, 32, 12); rect('#fff', x - 6, y - 6, 12, 12); rect('#e8321f', x - 3, y - 2, 5, 5); }
      else if (/papelão/.test(n)) { rect('#b9946f', x - 14, y - 12, 28, 24); rect('#8a6a4a', x - 14, y - 2, 28, 3); }
      else if (/Garrafa/.test(n)) { rect('#9fd3f5', x - 7, y - 4, 14, 18); rect('#9fd3f5', x - 3, y - 14, 6, 10); rect('#3f8fd8', x - 4, y - 16, 8, 3); }
      else if (/Folha/.test(n)) { rect('#fff', x - 12, y - 14, 24, 28); rect('#cbd5e1', x - 8, y - 8, 16, 2); rect('#cbd5e1', x - 8, y - 2, 16, 2); rect('#cbd5e1', x - 8, y + 4, 12, 2); }
      else if (/Restos/.test(n)) { rect('#8a6a2b', x - 12, y - 8, 24, 16); rect('#6fbf3f', x - 6, y - 12, 10, 8); rect('#e0a030', x + 2, y + 2, 8, 6); }
      else if (/Guardanapo/.test(n)) { rect('#f3f4f6', x - 12, y - 10, 24, 20); rect('#cbd5e1', x - 6, y - 4, 12, 3); rect('#b9946f', x + 2, y + 2, 6, 5); }
      else { rect('#f2d544', x - 14, y - 4, 28, 10); rect('#c9a82a', x + 8, y - 10, 6, 8); rect('#8a6a2b', x - 16, y - 2, 4, 6); } };
    const draw = () => {
      ctx.save(); if (shake > 0 && !calm) ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
      rect('#e8f4f0', 0, 0, W, H); rect('#bfe0d8', 0, 0, W, 26); rect('#fff', 20, 6, 60, 10); rect('#e8321f', 44, 4, 12, 14); rect('#e8321f', 38, 8, 24, 6);
      rect('#4b5563', 0, 84, W, 80); rect('#374151', 0, 84, W, 6); rect('#374151', 0, 158, W, 6);
      for (let x = -((performance.now() / 20) % 30 | 0) * (running && !paused && !calm ? 1 : 0); x < W; x += 30) rect('#5b6573', x, 118, 14, 10);
      belt.forEach(it => { icone(it, it.x, 118); const ls = wrap(it.nome); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ls.forEach((t, i) => ctx.fillText(t, it.x, 148 + i * 11)); });
      const l = lead(); if (l) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3; ctx.strokeRect(l.x - 30, 92, 60, 66); rect('#ffd166', l.x - 8, 72, 16, 8); rect('#ffd166', l.x - 4, 80, 8, 6); }
      rect('#e8321f', EX, 84, 3, 80); ctx.fillStyle = '#e8321f'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText('FIM', EX + 1, 80);
      B.forEach((b, i) => { const x = 20 + i * 112, f = flash[i] > 0; rect(f ? '#6fbf3f' : '#d1d5db', x, 176, 100, 38); ctx.fillStyle = '#1d2547'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText((i + 1) + ' ' + b.nome, x + 50, 200); });
      ctx.restore(); if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const frame = t => {
      if (!cv.isConnected) { cleanup(); return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden, dt = Math.min(.05, (t - last) / 1000); last = t;
      if (running && !paused && !menuOpen && !finished) {
        shake = Math.max(0, shake - dt); flash = flash.map(f => Math.max(0, f - dt)); spawnT -= dt;
        const v = (58 + 42 * pr()) * (calm ? .7 : 1); belt.forEach(it => { it.x += v * dt; });
        if (spawnT <= 0 && fila.length && belt.length < 4) { belt.push(fila.shift()); spawnT = (2.3 - .8 * pr()) * (calm ? 1.3 : 1); updInfo(); }
        const l = lead(); if (l && l.x >= EX) erro(l, 'Um item chegou ao fim da esteira sem ser separado!');
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; say('Começou! Os itens vão aparecer na esteira.'); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); };
    skip.onclick = () => finish('Tudo bem! A triagem foi concluída com ajuda.');
    cv._state = { get belt() { return belt; }, lead, sortear, B, get feitos() { return feitos; }, get resets() { return resets; }, meta, get fila() { return fila; } };
    draw(); requestAnimationFrame(frame);
  }
});
