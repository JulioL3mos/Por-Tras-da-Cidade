// Mini game "Monte o prato" (merendeira): higiene primeiro, depois 3 alunos com necessidades diferentes.
// Ingrediente proibido para o aluno recomeça o prato (com explicação). Arrastar, clicar ou Tab + Enter.
Object.assign(Minigames, {
  pratoHig: [
    { id: 'touca', nome: 'Touca', ok: true, why: 'A touca evita que cabelo caia na comida.' },
    { id: 'avental', nome: 'Avental', ok: true, why: 'O avental limpo protege a comida da sujeira da roupa.' },
    { id: 'sabao', nome: 'Lavar as mãos', ok: true, why: 'Mãos bem lavadas evitam passar germes para a comida.' },
    { id: 'joias', nome: 'Anel e pulseiras', ok: false, why: 'Na cozinha não se usa anel nem pulseira, porque podem cair na comida e guardam sujeira.' },
    { id: 'celular', nome: 'Celular', ok: false, why: 'Celular carrega muitos germes e não deve ficar perto da comida.' }
  ],
  pratoIng: [
    { id: 'arroz', nome: 'Arroz', g: 'carbo' }, { id: 'macarrao', nome: 'Macarrão', g: 'carbo' }, { id: 'batata', nome: 'Batata cozida', g: 'carbo' },
    { id: 'feijao', nome: 'Feijão', g: 'feijao' },
    { id: 'frango', nome: 'Frango grelhado', g: 'prot', carne: true }, { id: 'carne', nome: 'Carne moída', g: 'prot', carne: true },
    { id: 'omelete', nome: 'Omelete', g: 'prot', ovo: true }, { id: 'ovo', nome: 'Ovo cozido', g: 'prot', ovo: true },
    { id: 'salada', nome: 'Salada', g: 'veg' }, { id: 'cenoura', nome: 'Cenoura ralada', g: 'veg' }, { id: 'brocolis', nome: 'Brócolis', g: 'veg' },
    { id: 'banana', nome: 'Banana', g: 'fruta' }, { id: 'laranja', nome: 'Laranja', g: 'fruta' },
    { id: 'bolo', nome: 'Bolo com ovo', g: 'doce', ovo: true }, { id: 'refri', nome: 'Refrigerante', g: 'fora' }, { id: 'salgadinho', nome: 'Salgadinho', g: 'fora' }
  ],
  pratoGrupos: { carbo: 'carboidrato', feijao: 'feijão', prot: 'proteína', veg: 'vegetal', fruta: 'fruta' },
  pratoAlunos: [
    { nome: 'Davi', fala: 'Quero um prato equilibrado!', dica: 'Um de cada grupo: carboidrato, feijão, proteína, vegetal e fruta.' },
    { nome: 'Lia', fala: 'Tenho alergia a ovo!', ovo: true, dica: 'Omelete, ovo cozido e bolo levam ovo. Escolha outra proteína.' },
    { nome: 'Caio', fala: 'Sou vegetariano: não como carne nem frango.', veg: true, dica: 'Sem frango e sem carne. Ovo e feijão podem.' }
  ],
  prato(root, cfg, done, say) {
    const W = 480, H = 270, G = this.pratoGrupos, ING = this.pratoIng, HIG = this.pratoHig, ALUNOS = this.pratoAlunos;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas' }); cv.setAttribute('role', 'img');
    const info = el('p', { className: 'mg-info' }), tray = el('div', { className: 'mg-tray', role: 'group' }); tray.setAttribute('aria-label', 'Bandeja');
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, info, el('p', { className: 'mg-help', textContent: 'Arraste cada item até a bancada, ou clique nele (ou use Tab e Enter). Ingrediente que o aluno não pode comer recomeça o prato.' }), tray, skip);
    const ctx = cv.getContext('2d'), rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    let fase = 0, ai = -1, erros = 0, resets = 0, finished = false, mudanca = 0; const hig = {}, prato = {}; let buttons = [];
    const aluno = () => ALUNOS[ai];
    const proibido = (i, a) => (a.ovo && i.ovo) || (a.veg && i.carne);
    const updInfo = () => {
      if (fase > 0 && ai >= ALUNOS.length) { info.textContent = 'Todos os pratos estão prontos! · Erros: ' + erros; cv.setAttribute('aria-label', 'Cozinha da escola: os três alunos foram atendidos.'); return; }
      info.textContent = (fase === 0 ? 'Etapa 1 de 4: higiene (' + HIG.filter(h => hig[h.id]).length + ' de 3)' : 'Etapa ' + (ai + 2) + ' de 4: prato do ' + aluno().nome) + ' · Erros: ' + erros;
      cv.setAttribute('aria-label', fase === 0 ? 'Cozinha da escola: a Dona Lúcia precisa se preparar. Itens de higiene colocados: ' + (HIG.filter(h => hig[h.id]).map(h => h.nome).join(', ') || 'nenhum') + '.' : 'Cozinha da escola: ' + aluno().nome + ' diz: ' + aluno().fala + ' Prato: ' + (Object.keys(G).map(k => G[k] + ': ' + (prato[k] ? prato[k].nome : 'vazio')).join('; ')) + '.'); };
    // ícones 48x48
    const icone = (g, id, s) => { const r = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x * s, y * s, w * s, h * s); };
      const m = { touca: () => { r('#fff', 10, 14, 28, 16); r('#e5e7eb', 10, 26, 28, 4); r('#fff', 16, 8, 16, 8); }, avental: () => { r('#fff', 12, 8, 24, 34); r('#9aa4b2', 12, 8, 24, 3); r('#e5e7eb', 18, 24, 12, 10); },
        sabao: () => { r('#9fd3f5', 10, 26, 28, 12); r('#fff', 14, 14, 8, 8); r('#fff', 26, 18, 6, 6); r('#fff', 20, 8, 5, 5); }, joias: () => { r('#e0b24a', 10, 14, 28, 6); r('#e0b24a', 10, 26, 28, 6); r('#bfe0ff', 20, 8, 8, 6); },
        celular: () => { r('#111', 16, 6, 16, 36); r('#9fd3f5', 18, 10, 12, 24); }, arroz: () => { r('#fff', 8, 22, 32, 16); r('#e5e7eb', 12, 18, 24, 6); r('#fff', 14, 14, 20, 6); }, macarrao: () => { r('#f2d544', 8, 24, 32, 12); r('#e0b24a', 8, 30, 32, 3); r('#f2d544', 12, 18, 24, 8); },
        batata: () => { r('#d9b44a', 10, 20, 28, 18); r('#f2d544', 14, 16, 20, 8); r('#b9946f', 18, 28, 5, 5); }, feijao: () => { r('#5b3a1e', 8, 22, 32, 16); r('#3a2410', 14, 24, 6, 6); r('#3a2410', 26, 28, 6, 6); r('#8a5a2b', 12, 18, 24, 6); },
        frango: () => { r('#c98a3a', 10, 16, 28, 20); r('#e0a85a', 14, 18, 14, 8); r('#fff', 34, 24, 8, 4); }, carne: () => { r('#7a3b1e', 10, 18, 28, 18); r('#5b2a12', 16, 24, 6, 6); r('#5b2a12', 28, 22, 6, 6); },
        omelete: () => { r('#f2d544', 8, 20, 32, 16); r('#fff6dc', 14, 24, 20, 8); r('#e0b24a', 10, 20, 28, 3); }, ovo: () => { r('#fff', 14, 12, 20, 28); r('#f2d544', 20, 22, 8, 8); },
        salada: () => { r('#4fa34a', 8, 18, 32, 20); r('#9ad66b', 12, 14, 12, 10); r('#e8321f', 28, 22, 8, 8); r('#2f8a3e', 20, 26, 12, 8); }, cenoura: () => { r('#f28c1f', 10, 18, 28, 14); r('#e07a1f', 14, 22, 6, 6); r('#f2a444', 26, 24, 6, 6); },
        brocolis: () => { r('#2f8a3e', 12, 10, 24, 18); r('#4fa34a', 16, 6, 16, 8); r('#9ad66b', 22, 28, 6, 12); }, banana: () => { r('#f2d544', 10, 24, 28, 8); r('#f2d544', 14, 18, 8, 8); r('#f2d544', 30, 14, 8, 12); r('#8a6a2b', 36, 12, 4, 4); },
        laranja: () => { r('#f28c1f', 12, 12, 24, 26); r('#f2a444', 16, 16, 8, 6); r('#2f8a3e', 22, 6, 8, 6); }, bolo: () => { r('#b9946f', 10, 20, 28, 18); r('#ffd166', 10, 16, 28, 6); r('#e94f37', 22, 10, 4, 6); },
        refri: () => { r('#7a1d1d', 16, 10, 16, 30); r('#fff', 16, 20, 16, 8); r('#9aa4b2', 18, 6, 12, 5); }, salgadinho: () => { r('#e94f37', 12, 8, 24, 32); r('#f2d544', 16, 18, 16, 12); r('#fff', 18, 12, 12, 3); } };
      (m[id] || (() => {}))(); };
    // ---------- desenho ----------
    const bal = (t, x, y) => { const w = [], ls = ['']; t.split(' ').forEach(x2 => { if ((ls[ls.length - 1] + ' ' + x2).trim().length > 24 && ls[ls.length - 1]) ls.push(x2); else ls[ls.length - 1] = (ls[ls.length - 1] + ' ' + x2).trim(); });
      rect('#fff', x, y, 168, 14 + ls.length * 13); rect('#1d2547', x, y, 168, 2); rect('#fff', x + 20, y + 14 + ls.length * 13, 10, 8); ctx.fillStyle = '#1d2547'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left'; ls.forEach((l, i) => ctx.fillText(l, x + 6, y + 18 + i * 13)); };
    const SLOT = { carbo: [150, 74], feijao: [216, 74], prot: [282, 74], veg: [150, 134], fruta: [216, 134] };
    const draw = () => {
      rect('#f2e8d0', 0, 0, W, H); rect('#d8c9a8', 0, 0, W, 24); rect('#bfe0d8', 16, 4, 60, 14); rect('#b9946f', 0, 196, W, 74); rect('#8a6a4a', 0, 196, W, 6);
      const x = 70, y = 70; rect('#222', x - 12, y + 100, 10, 8); rect('#222', x + 4, y + 100, 10, 8); rect('#2b3a67', x - 12, y + 60, 26, 42); rect(hig.avental ? '#fff' : '#d9468f', x - 16, y + 30, 34, 32); rect('#f2c9a0', x - 10, y + 6, 22, 24); rect('#6b3a1e', x - 10, y + 2, 22, 8);
      if (hig.touca) { rect('#fff', x - 12, y - 8, 26, 12); rect('#e5e7eb', x - 12, y + 2, 26, 3); } rect('#1d2547', x - 5, y + 16, 3, 3); rect('#1d2547', x + 4, y + 16, 3, 3);
      if (hig.sabao) { rect('#9fd3f5', x + 18, y + 40, 6, 6); rect('#fff', x + 26, y + 34, 4, 4); rect('#fff', x + 22, y + 28, 4, 4); }
      ctx.fillStyle = '#1d2547'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText('Dona Lúcia', x + 2, 188);
      if (fase === 0) { bal('Antes de cozinhar, preciso me preparar. O que devo usar?', 150, 40); }
      else if (ai < ALUNOS.length) { const a = aluno(); rect('#222', 392, 196, 8, 8); rect('#222', 410, 196, 8, 8); rect('#3f8fd8', 388, 150, 34, 46); rect('#f2c9a0', 392, 124, 26, 26); rect('#2b1b0f', 392, 120, 26, 8); rect('#1d2547', 398, 134, 3, 3); rect('#1d2547', 409, 134, 3, 3);
        if (mudanca > 0) { rect('#6fbf3f', 400, 142, 10, 3); } else rect('#1d2547', 400, 142, 10, 2); bal(a.fala, 300, 24); ctx.fillStyle = '#1d2547'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText(a.nome, 405, 188);
        rect('#fff', 140, 62, 214, 140); rect('#d1d5db', 140, 62, 214, 4); rect('#d1d5db', 140, 198, 214, 4);
        Object.keys(SLOT).forEach(k => { const [sx, sy] = SLOT[k]; rect('#f3f4f6', sx, sy, 62, 54); rect('#cbd5e1', sx, sy, 62, 2); ctx.fillStyle = '#1d2547'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center'; ctx.fillText(G[k].toUpperCase(), sx + 31, sy + 50);
          if (prato[k]) { ctx.save(); ctx.translate(sx + 7, sy); icone(ctx, prato[k].id, .9); ctx.restore(); } }); }
      if (fase === 0) { HIG.forEach(() => {}); }
    };
    // ---------- tabuleiro / bandeja ----------
    let drag = null, ghost = null; const insideCanvas = e => { const r = cv.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
    const montarBandeja = lista => { tray.innerHTML = ''; buttons = [];
      const ordem = lista.map((p, i) => lista[(i * 5 + 3) % lista.length]); const uniq = []; ordem.forEach(p => { if (!uniq.includes(p)) uniq.push(p); }); lista.forEach(p => { if (!uniq.includes(p)) uniq.push(p); });
      uniq.forEach(p => { const b = el('button', { type: 'button', className: 'btn ghost mg-piece' }), c = el('canvas', { width: 48, height: 48 }); c.setAttribute('aria-hidden', 'true'); icone(c.getContext('2d'), p.id, 1); b.append(c, el('span', { textContent: p.nome }));
        const o = { p, btn: b }; buttons.push(o);
        b.addEventListener('pointerdown', e => { if (b.disabled || finished) return; drag = { o, sx: e.clientX, sy: e.clientY, moved: false }; try { b.setPointerCapture(e.pointerId); } catch (x) {} });
        b.addEventListener('pointermove', e => { if (!drag || drag.o !== o) return; if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 8) { drag.moved = true; ghost = el('div', { className: 'mg-ghost' }); const gc = el('canvas', { width: 48, height: 48 }); icone(gc.getContext('2d'), p.id, 1); ghost.append(gc); document.body.append(ghost); }
          if (ghost) { ghost.style.left = e.clientX - 24 + 'px'; ghost.style.top = e.clientY - 24 + 'px'; cv.classList.toggle('mg-over', insideCanvas(e)); } });
        const end = e => { if (!drag || drag.o !== o) return; const d = drag; drag = null; if (ghost) { ghost.remove(); ghost = null; } cv.classList.remove('mg-over'); if (e.type === 'pointercancel') return; if (!d.moved || insideCanvas(e)) tentar(p); else say('Solte o item em cima da bancada.'); };
        b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('click', e => { if (e.detail === 0) tentar(p); }); tray.append(b); }); };
    const trava = (id, v) => { const o = buttons.find(x => x.p.id === id); if (o) { o.btn.disabled = v; } };
    const finishAll = () => { finished = true; updInfo(); say('Os três pratos estão prontos! Todos os alunos vão almoçar bem. Parabéns, Dona Lúcia!'); setTimeout(done, 1600); };
    const proximoAluno = () => { ai++; Object.keys(prato).forEach(k => delete prato[k]); if (ai >= ALUNOS.length) { finishAll(); draw(); return; } montarBandeja(ING); updInfo(); draw(); say('Chegou ' + aluno().nome + '. Ele diz: ' + aluno().fala); };
    const reiniciarPrato = msg => { resets++; erros++; Object.keys(prato).forEach(k => delete prato[k]); buttons.forEach(o => { o.btn.disabled = false; }); updInfo(); draw(); say(msg + ' O prato recomeça. Dica: ' + aluno().dica); if (erros >= 3) skip.hidden = false; };
    function tentar(p) {
      if (finished) return;
      if (fase === 0) {
        if (!p.ok) { erros++; updInfo(); say(p.nome + ' não deve ser usado na cozinha. ' + p.why + ' O item voltou para a bandeja.'); if (erros >= 3) skip.hidden = false; return; }
        if (hig[p.id]) return; hig[p.id] = true; trava(p.id, true); say(p.nome + ' colocado! ' + p.why); updInfo(); draw();
        if (HIG.filter(h => h.ok).every(h => hig[h.id])) { fase = 1; say('Dona Lúcia está pronta para cozinhar com higiene!'); setTimeout(() => { if (!finished) { proximoAluno(); } }, calmWait()); }
        return; }
      const a = aluno();
      if (proibido(p, a)) { reiniciarPrato(p.nome + ' ' + (a.ovo ? 'leva ovo, e ' + a.nome + ' tem alergia. Isso pode ser perigoso!' : 'é carne, e ' + a.nome + ' é vegetariano.')); return; }
      if (p.g === 'fora' || p.g === 'doce') { erros++; updInfo(); say(p.nome + ' não faz parte da merenda equilibrada. Ele voltou para a bandeja.'); if (erros >= 3) skip.hidden = false; return; }
      if (prato[p.g]) { say('Já tem ' + G[p.g] + ' no prato (' + prato[p.g].nome + '). Escolha um item de outro grupo.'); return; }
      prato[p.g] = p; trava(p.id, true); mudanca = 0; say(p.nome + ' no prato (' + G[p.g] + ').'); updInfo(); draw();
      if (Object.keys(G).every(k => prato[k])) { mudanca = 1; draw(); say('Prato do ' + a.nome + ' pronto: equilibrado e seguro! Ele sorriu.'); setTimeout(() => { if (!finished) proximoAluno(); }, calmWait()); }
    }
    const calmWait = () => Save.data.settings.calm ? 400 : 1100;
    skip.onclick = () => { if (finished) return; finished = true; say('Tudo bem! A merenda foi concluída com ajuda.'); setTimeout(done, 1200); };
    montarBandeja(HIG); updInfo(); draw();
    cv._state = { tentar, HIG, ING, ALUNOS, get fase() { return fase; }, get aluno() { return ai; }, get erros() { return erros; }, get resets() { return resets; }, get prato() { return prato; }, G, proibido, get buttons() { return buttons; } };
  }
});
