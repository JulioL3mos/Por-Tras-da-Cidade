// Mini game "tocar para limpar ou colher": limpeza escolar, hospitalar e colheita de laranjas.
// Toque nos alvos certos. Tocar numa isca (mochila, objeto do paciente, laranja verde) recomeça do zero.
Object.assign(Minigames, {
  temas: {
    escola:   { celula: 'Carteira', alvo: 'mancha de sujeira', iscas: ['mochila de aluno', 'caderno de aluno'], rot: ['MANCHA', 'MOCHILA', 'CADERNO'], erro: 'Era o material de um aluno! A limpeza recomeça do zero.' },
    hospital: { celula: 'Superfície', alvo: 'germes', iscas: ['prancheta do paciente', 'bolsa de soro'], rot: ['GERMES', 'PRANCHETA', 'SORO'], erro: 'Era um objeto do paciente! A limpeza recomeça do zero.' },
    campo:    { celula: 'Galho', alvo: 'laranja madura', iscas: ['laranja verde'], rot: ['MADURA', 'VERDE'], erro: 'Essa laranja ainda está verde! A colheita recomeça do zero.' }
  },
  tocar(root, cfg, done, say) {
    const th = this.temas[cfg.tema], [cols, rows] = cfg.grade || [4, 3], CW = 120, CH = 100, W = cols * CW, H = rows * CH, meta = cfg.meta || 10;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas', tabIndex: 0 });
    cv.setAttribute('role', 'application');
    cv.setAttribute('aria-label', cfg.descricao || 'Mini game de toque: toque nos alvos certos. Com o teclado, use as setas para escolher o quadrado e Enter ou Espaço para tocar.');
    const prog = el('progress', { max: meta, value: 0 }); prog.setAttribute('aria-label', 'Progresso');
    const info = el('p', { className: 'mg-info' });
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, prog, info, el('p', { className: 'mg-help', textContent: 'Toque ou clique nos alvos. Teclado: setas ou W A S D para escolher e Enter ou Espaço para tocar. Tocar na coisa errada recomeça do zero. Sem tempo limite.' }), start, pauseBtn, skip);
    start.focus();

    const cells = Array(cols * rows).fill(null), calm = Save.data.settings.calm;
    let cur = 0, feitos = 0, resets = 0, running = false, paused = false, finished = false, clock = 0, last = 0, spawnT = .5, shake = 0;
    const updInfo = () => { info.textContent = 'Tentativa ' + (resets + 1) + ' · ' + feitos + ' de ' + meta; prog.value = feitos; };
    updInfo();
    const describe = i => { const c = cells[i], base = th.celula + ' ' + (i + 1) + ': ';
      if (!c) return base + 'vazio.'; if (c.kind === 'alvo') return base + (cfg.tema === 'campo' ? th.alvo : c.hp > 1 ? 'sujeira grossa, precisa de 2 toques' : th.alvo) + '.';
      return base + (c.kind === 'verde' ? 'laranja verde, ainda não está no ponto. Não toque.' : c.nome + '. Não toque.'); };
    const finish = txt => { if (finished) return; finished = true; cleanup(); say(txt); setTimeout(done, 1200); };
    const reset = c => { feitos = 0; resets++; shake = .35; cells.fill(null); spawnT = 1.2; updInfo(); say(th.erro + ' Tentativa ' + (resets + 1) + '.'); if (resets >= 3) skip.hidden = false; };
    const tap = i => {
      cur = i; if (!running || paused || finished) return; const c = cells[i]; if (!c) return;
      if (c.kind !== 'alvo') { reset(c); return; }
      if (--c.hp > 0) { say('Quase! Mais um toque.'); return; }
      cells[i] = null; feitos++; updInfo();
      if (feitos >= meta) finish(resets === 0 ? (cfg.vitoria || 'Missão cumprida de primeira! Parabéns!') : 'Missão cumprida na tentativa ' + (resets + 1) + '! Quem persiste chega lá.');
      else if (feitos % 3 === 0) say(feitos + ' de ' + meta + '.');
    };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); tap(Math.floor((e.clientY - r.top) / r.height * H / CH) * cols + Math.floor((e.clientX - r.left) / r.width * W / CW)); });
    cv.addEventListener('keydown', e => {
      const k = e.key; let n = cur;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') n = cur % cols ? cur - 1 : cur; else if (k === 'ArrowRight' || k === 'd' || k === 'D') n = cur % cols < cols - 1 ? cur + 1 : cur;
      else if (k === 'ArrowUp' || k === 'w' || k === 'W') n = cur >= cols ? cur - cols : cur; else if (k === 'ArrowDown' || k === 's' || k === 'S') n = cur < cols * (rows - 1) ? cur + cols : cur;
      else if (k === 'Enter' || k === ' ') { e.preventDefault(); tap(cur); return; } else return;
      e.preventDefault(); cur = n; say(describe(cur));
    });
    const cleanup = () => { running = false; };

    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const ctx = cv.getContext('2d');
    const label = (txt, cx, y) => { ctx.fillStyle = '#1d2547'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText(txt, cx, y); };
    const drawCell = (i) => {
      const x = (i % cols) * CW, y = Math.floor(i / cols) * CH, cx = x + CW / 2, cy = y + CH / 2 - 6, c = cells[i];
      rect(cfg.tema === 'escola' ? '#cfe6f2' : cfg.tema === 'hospital' ? '#e8f4f0' : '#4fa34a', x, y, CW, CH);
      if (cfg.tema === 'escola') { rect('#d9b87a', x + 12, y + 14, CW - 24, CH - 34); rect('#a3815a', x + 12, y + CH - 24, CW - 24, 6); }
      else if (cfg.tema === 'hospital') { rect('#bfe0d8', x + 8, y + 8, CW - 16, CH - 16); rect('#fff', x + 12, y + 12, CW - 24, 6); }
      else { rect('#2f8a3e', x + 8, y + 10, 30, 14); rect('#3fa84e', x + CW - 44, y + CH - 40, 32, 14); rect('#6b4423', x, y + CH / 2 + 16, CW, 5); }
      if (c) {
        if (c.kind === 'alvo' && cfg.tema === 'escola') { rect('#6b4423', cx - 20, cy - 10, 40, 24); rect('#8a5a2b', cx - 12, cy - 18, 24, 10); rect('#4a2f17', cx + 6, cy + 4, 14, 10); label(th.rot[0], cx, y + CH - 6); }
        else if (c.kind === 'alvo' && cfg.tema === 'hospital') { const g = c.hp > 1 ? '#3b8f3b' : '#5fbf5f', r = c.hp > 1 ? 24 : 18; rect(g, cx - r, cy - r + 6, r * 2, r * 2 - 8); rect(g, cx - r - 6, cy - 4, 6, 8); rect(g, cx + r, cy - 4, 6, 8); rect('#fff', cx - 8, cy - 2, 5, 5); rect('#fff', cx + 4, cy - 2, 5, 5); rect('#111', cx - 6, cy, 2, 2); rect('#111', cx + 6, cy, 2, 2); label(c.hp > 1 ? 'GERMES x2' : th.rot[0], cx, y + CH - 6); }
        else if (c.kind === 'alvo') { ctx.fillStyle = '#f28c1f'; ctx.beginPath(); ctx.arc(cx, cy + 2, 22, 0, 7); ctx.fill(); rect('#ffd08a', cx - 10, cy - 12, 8, 6); rect('#2f8a3e', cx - 2, cy - 26, 10, 6); label(th.rot[0], cx, y + CH - 6); }
        else if (c.kind === 'verde') { ctx.fillStyle = '#6fbf3f'; ctx.beginPath(); ctx.arc(cx, cy + 2, 22, 0, 7); ctx.fill(); rect('#2f8a3e', cx - 2, cy - 26, 10, 6); rect('#111', cx - 12, cy - 2, 24, 3); label(th.rot[1] + ' - ESPERE', cx, y + CH - 6); }
        else if (cfg.tema === 'escola') { if (c.v) { rect('#e94f37', cx - 18, cy - 20, 36, 40); rect('#fff', cx - 12, cy - 12, 24, 3); rect('#fff', cx - 12, cy - 4, 24, 3); } else { rect('#3f8fd8', cx - 18, cy - 22, 36, 44); rect('#2b6cb0', cx - 12, cy + 2, 24, 14); rect('#111', cx - 18, cy - 10, 4, 24); } label(th.rot[c.v ? 2 : 1], cx, y + CH - 6); }
        else { if (c.v) { rect('#bfe0ff', cx - 14, cy - 20, 28, 40); rect('#fff', cx - 6, cy - 26, 12, 8); rect('#5aa9e6', cx - 10, cy - 8, 20, 20); } else { rect('#fff', cx - 18, cy - 22, 36, 44); rect('#8a5a2b', cx - 6, cy - 26, 12, 8); rect('#aaa', cx - 12, cy - 10, 24, 3); rect('#aaa', cx - 12, cy, 24, 3); rect('#aaa', cx - 12, cy + 10, 24, 3); } label(th.rot[c.v ? 2 : 1], cx, y + CH - 6); }
      }
    };
    const draw = () => {
      ctx.save(); if (shake > 0 && !calm) ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
      for (let i = 0; i < cells.length; i++) drawCell(i);
      ctx.strokeStyle = '#1d2547'; ctx.lineWidth = 2; for (let i = 1; i < cols; i++) { ctx.beginPath(); ctx.moveTo(i * CW, 0); ctx.lineTo(i * CW, H); ctx.stroke(); } for (let j = 1; j < rows; j++) { ctx.beginPath(); ctx.moveTo(0, j * CH); ctx.lineTo(W, j * CH); ctx.stroke(); }
      ctx.strokeStyle = '#e94f37'; ctx.lineWidth = 5; ctx.strokeRect((cur % cols) * CW + 3, Math.floor(cur / cols) * CH + 3, CW - 6, CH - 6);
      ctx.restore(); if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const frame = t => {
      if (!cv.isConnected) { cleanup(); return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden, dt = Math.min(.05, (t - last) / 1000); last = t;
      if (running && !paused && !menuOpen && !finished) {
        clock += dt; shake = Math.max(0, shake - dt); spawnT -= dt;
        cells.forEach((c, i) => { if (!c) return;
          if (c.kind === 'isca' || c.kind === 'iscaV') { c.life -= dt; if (c.life <= 0) cells[i] = null; }
          else if (c.kind === 'verde') { c.age += dt; if (c.age >= (cfg.amadurece || 4)) cells[i] = { kind: 'alvo', hp: 1 }; } });
        if (spawnT <= 0) { spawnT = (cfg.spawn || .9) * (resets >= 5 ? 1.25 : 1);
          const vivos = cells.filter(c => c && (c.kind === 'alvo' || c.kind === 'verde')).length, vazios = cells.map((c, i) => c ? -1 : i).filter(i => i >= 0);
          if (vivos < (cfg.max || 6) && vazios.length) { const i = vazios[Math.floor(Math.random() * vazios.length)], r = Math.random();
            if (cfg.tema === 'campo') cells[i] = r < (cfg.verdes || .4) ? { kind: 'verde', age: 0 } : { kind: 'alvo', hp: 1 };
            else if (r < (cfg.isca || .3)) { const v = Math.random() < .5 ? 0 : 1; cells[i] = { kind: 'isca', v, life: cfg.vidaIsca || 3, nome: th.iscas[v] }; }
            else cells[i] = { kind: 'alvo', hp: Math.random() < (cfg.duplos || 0) ? 2 : 1 }; } }
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; say('Começou! Use as setas e Enter, ou toque na tela.'); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); };
    skip.onclick = () => finish('Tudo bem! A missão foi concluída com ajuda.');
    cv._state = { cells, cols, rows, tap, get feitos() { return feitos; }, get resets() { return resets; }, meta };
    draw(); requestAnimationFrame(frame);
  }
});
