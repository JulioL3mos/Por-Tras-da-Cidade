// Mini game "construir a creche": arraste (ou clique) as peças na ordem certa e veja a obra crescer.
Object.assign(Minigames, {
  obraEtapas: [
    { id: 'fundacao', nome: 'Fundação', dica: 'Toda construção começa por uma base firme no chão.', ok: 'A fundação segura toda a casa. Sem ela, nada fica de pé.' },
    { id: 'paredes', nome: 'Paredes', dica: 'Com a base pronta, é hora de levantar o que sustenta a casa.', ok: 'Os pedreiros levantam as paredes, tijolo por tijolo.' },
    { id: 'telhado', nome: 'Telhado', dica: 'Depois das paredes, a casa precisa de uma cobertura contra sol e chuva.', ok: 'O telhado protege a creche. Agora dá para trabalhar por dentro.' },
    { id: 'instalacoes', nome: 'Fios e canos', dica: 'Antes de pintar, eletricista e encanador passam fios e canos pela parede.', ok: 'Eletricistas e encanadores levam luz e água para dentro da creche.' },
    { id: 'portas', nome: 'Portas e janelas', dica: 'Com tudo passado pela parede, a casa ganha portas e janelas.', ok: 'Portas e janelas colocadas: a luz do dia entra na creche.' },
    { id: 'pintura', nome: 'Pintura', dica: 'A pintura é a última etapa: ela cobre tudo e deixa a casa bonita.', ok: 'A pintura cobre os fios e canos e deixa a creche colorida.' }
  ],
  obraExtras: [{ id: 'piscina', nome: 'Piscina' }, { id: 'antena', nome: 'Antena grande' }],
  obra(root, cfg, done, say) {
    const W = 480, H = 260, E = this.obraEtapas, calm = Save.data.settings.calm;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas' });
    cv.setAttribute('role', 'img');
    const info = el('p', { className: 'mg-info' });
    const tray = el('div', { className: 'mg-tray', role: 'group' }); tray.setAttribute('aria-label', 'Peças da obra');
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, info, el('p', { className: 'mg-help', textContent: 'Arraste cada peça até o terreno, ou clique nela (ou use Tab e Enter). Se a peça não for a da hora, ela volta para a bandeja.' }), tray, skip);

    const ctx = cv.getContext('2d'), rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    let stage = 0, erros = 0, finished = false; const prog = {}; E.forEach(e => prog[e.id] = 0);
    const pieces = E.concat(this.obraExtras), order = pieces.map((p, i) => pieces[(i * 3 + 2) % pieces.length]);
    const updInfo = () => { info.textContent = 'Etapa ' + Math.min(stage + 1, E.length) + ' de ' + E.length + ' · Erros: ' + erros; cv.setAttribute('aria-label', 'Obra da creche vista de frente. Etapas prontas: ' + (stage ? E.slice(0, stage).map(e => e.nome).join(', ') : 'nenhuma') + '.'); };
    updInfo();
    const icon = (id, c) => { const g = c.getContext('2d'), r = (col, x, y, w, h) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      if (id === 'fundacao') { r('#9aa4b2', 4, 28, 40, 12); r('#6b7280', 4, 28, 40, 3); }
      else if (id === 'paredes') { r('#d9b99b', 6, 10, 36, 30); r('#b9946f', 6, 20, 36, 2); r('#b9946f', 6, 30, 36, 2); }
      else if (id === 'telhado') { r('#c8503c', 4, 24, 40, 6); r('#c8503c', 10, 16, 28, 8); r('#c8503c', 18, 8, 12, 8); }
      else if (id === 'instalacoes') { r('#3f8fd8', 8, 8, 4, 32); r('#f2b134', 20, 8, 4, 32); r('#3f8fd8', 8, 8, 20, 4); r('#f2b134', 20, 36, 20, 4); }
      else if (id === 'portas') { r('#5b3a1e', 8, 12, 14, 28); r('#bfe0ff', 28, 14, 14, 14); r('#fff', 34, 14, 2, 14); r('#fff', 28, 20, 14, 2); }
      else if (id === 'pintura') { r('#ffd166', 12, 6, 24, 24); r('#c8503c', 22, 30, 4, 10); r('#e94f37', 10, 4, 28, 6); }
      else if (id === 'piscina') { r('#5aa9e6', 4, 16, 40, 22); r('#9fd3f5', 8, 20, 12, 4); r('#fff', 4, 14, 40, 3); }
      else { r('#555', 22, 6, 4, 34); r('#555', 10, 10, 28, 3); r('#555', 14, 18, 20, 3); r('#555', 18, 26, 12, 3); } };
    // Arrastar e soltar (mouse e toque) + clique/teclado
    let drag = null, ghost = null; const buttons = [];
    const insideCanvas = e => { const r = cv.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    const finishAll = () => { finished = true; say('A creche ficou pronta! Parabéns, você construiu etapa por etapa!'); updInfo(); setTimeout(done, 1600); };
    const attempt = p => {
      if (finished || p.done) return; const want = E[stage];
      if (p.id === want.id) { p.done = true; p.btn.disabled = true; p.btn.setAttribute('aria-label', p.nome + ' — já colocada'); stage++; say(p.nome + ' colocada! ' + want.ok + (stage < E.length ? ' Próxima etapa: ' + stage + ' de ' + E.length + ' concluídas.' : '')); if (calm) prog[p.id] = 1; updInfo(); if (stage >= E.length) { if (calm) draw(); finishAll(); } }
      else { erros++; const extra = this.obraExtras.some(x => x.id === p.id); say((extra ? p.nome + ' não faz parte desta obra agora.' : 'Ainda não é a hora de ' + p.nome + '.') + (erros >= 2 ? ' Dica: ' + want.dica : ' Pense na ordem de uma construção real.') + ' A peça voltou para a bandeja.'); updInfo(); if (erros >= 3) skip.hidden = false; }
    };
    order.forEach(p => {
      const b = el('button', { type: 'button', className: 'btn ghost mg-piece' }), c = el('canvas', { width: 48, height: 48 }); c.setAttribute('aria-hidden', 'true'); icon(p.id, c);
      b.append(c, el('span', { textContent: p.nome })); const o = Object.assign({}, p, { btn: b, done: false }); buttons.push(o);
      b.addEventListener('pointerdown', e => { if (b.disabled || finished) return; drag = { o, sx: e.clientX, sy: e.clientY, moved: false }; try { b.setPointerCapture(e.pointerId); } catch (x) {} });
      b.addEventListener('pointermove', e => { if (!drag || drag.o !== o) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) { drag.moved = true; ghost = el('div', { className: 'mg-ghost' }); const gc = el('canvas', { width: 48, height: 48 }); icon(p.id, gc); ghost.append(gc); document.body.append(ghost); }
        if (ghost) { ghost.style.left = e.clientX - 24 + 'px'; ghost.style.top = e.clientY - 24 + 'px'; cv.classList.toggle('mg-over', insideCanvas(e)); } });
      const end = e => { if (!drag || drag.o !== o) return; const d = drag; drag = null; if (ghost) { ghost.remove(); ghost = null; } cv.classList.remove('mg-over'); if (e.type === 'pointercancel') return; if (!d.moved || insideCanvas(e)) attempt(o); else say('Solte a peça em cima do terreno.'); };
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end);
      b.addEventListener('click', e => { if (e.detail === 0) attempt(o); });
      tray.append(b);
    });
    skip.onclick = () => { if (finished) return; stage = E.length; E.forEach(e => prog[e.id] = 1); buttons.forEach(o => { o.done = true; o.btn.disabled = true; }); updInfo(); finished = true; say('Tudo bem! A creche foi concluída com ajuda.'); setTimeout(done, 1200); };

    const draw = () => {
      const p = prog, base = 232;
      rect('#bfe6ff', 0, 0, W, H); rect('#fff', 60, 30, 50, 12); rect('#fff', 80, 22, 30, 12); rect('#ffd166', 410, 24, 30, 30);
      rect('#8bc66a', 0, 150, W, H - 150); rect('#6b4423', 70, 148, 340, 4); rect('#6b4423', 70, 148, 4, 100); rect('#6b4423', 406, 148, 4, 100); rect('#6b4423', 70, 244, 340, 4);
      rect('#e0a030', 20, 160, 36, 22); rect('#5b3a1e', 36, 182, 4, 30); rect('#1d2547', 24, 166, 28, 3); rect('#1d2547', 24, 172, 20, 3);
      const wallsDone = p.paredes, pintado = p.pintura;
      if (p.fundacao > 0) { const w = 260 * p.fundacao; rect('#9aa4b2', 240 - w / 2, base - 12, w, 12); rect('#6b7280', 240 - w / 2, base - 12, w, 3); }
      if (wallsDone > 0) { const h = 92 * wallsDone; rect(pintado > 0 ? '#ffd166' : '#d9b99b', 120, base - 12 - h, 240, h); if (!pintado) for (let y = 0; y < h; y += 12) rect('#b9946f', 120, base - 12 - y - 1, 240, 2); }
      if (p.instalacoes > 0 && !(pintado > 0.9)) { const a = p.instalacoes; rect('#3f8fd8', 150, base - 100, 4, 88 * a); rect('#f2b134', 330, base - 100, 4, 88 * a); rect('#3f8fd8', 150, base - 100, 90 * a, 4); rect('#f2b134', 240, base - 30, 90 * a, 4); }
      if (p.telhado > 0) { const dy = (1 - p.telhado) * -60, y0 = base - 104 + dy; for (let i = 0; i < 6; i++) rect('#c8503c', 110 + i * 22, y0 - i * 10, 260 - i * 44, 10); }
      if (p.portas > 0) { const a = p.portas; ctx.globalAlpha = a; rect('#5b3a1e', 222, base - 62, 36, 50); rect('#ffd166', 250, base - 38, 3, 3); rect('#bfe0ff', 140, base - 86, 40, 32); rect('#fff', 158, base - 86, 3, 32); rect('#fff', 140, base - 71, 40, 3); rect('#bfe0ff', 300, base - 86, 40, 32); rect('#fff', 318, base - 86, 3, 32); rect('#fff', 300, base - 71, 40, 3); ctx.globalAlpha = 1; }
      if (p.pintura >= 1) { rect('#e94f37', 360, base - 110, 4, 28); rect('#e94f37', 364, base - 110, 18, 10); }
      if (stage >= E.length && p.pintura >= 1) { ctx.fillStyle = '#1d2547'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'; ctx.fillText('CRECHE PRONTA!', 240, 40); }
    };
    const step = 1 / .6; let last = 0;
    const frame = t => {
      if (!cv.isConnected) return; const dt = Math.min(.05, (t - last) / 1000); last = t;
      E.forEach((e, i) => { if (i < stage && prog[e.id] < 1) prog[e.id] = Math.min(1, prog[e.id] + dt * step); });
      draw(); requestAnimationFrame(frame);
    };
    cv._state = { E, buttons, get stage() { return stage; }, get erros() { return erros; }, attempt, prog };
    draw(); requestAnimationFrame(frame);
  }
});
