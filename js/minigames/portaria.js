// Mini game "Quem entra?" (porteiro): observar a pessoa, ler a prancheta do dia e decidir.
// Decisão errada dispara o alarme e a rodada recomeça (com explicação). Sem tempo limite.
Object.assign(Minigames, {
  portariaPrancheta: [
    'Moradores em casa: apartamento 12 (Dona Rita), 33 (Seu Paulo) e 42 (Dona Alice).',
    'Morador viajando: apartamento 21. Não recebe visitas.',
    'Entregas esperadas hoje: pizza para o 33 e gás para o 12.',
    'Visita autorizada: Tomás, sobrinho da Dona Alice (42).',
    'Regras: moradores e visitas autorizadas entram. Entregas esperadas e serviços: interfone para confirmar com o morador. Quem não está na lista ou não diz para onde vai: não entra.'
  ],
  portariaVisitantes: [
    { nome: 'Dona Rita', cor: '#d9468f', prop: 'sacola', diz: 'Oi! Eu moro no 12, voltei do mercado.', ve: 'Carrega sacolas e usa o cartão de entrada do prédio.', acao: 0, why: 'Moradores entram sem precisar de aviso.' },
    { nome: 'Entregador de pizza', cor: '#e07a1f', prop: 'pizza', diz: 'Pizza para o apartamento 33!', ve: 'Segura uma caixa de pizza com o nome Paulo.', acao: 1, why: 'A entrega estava na lista. O porteiro interfona para o morador confirmar e descer.' },
    { nome: 'Tomás', cor: '#3f8fd8', prop: 'doc', diz: 'Sou o Tomás, sobrinho da Dona Alice, do 42.', ve: 'Mostra um documento com o nome Tomás.', acao: 0, why: 'Tomás está na lista de visitas autorizadas pela Dona Alice.' },
    { nome: 'Amiga do 21', cor: '#7a5cc7', prop: 'flores', diz: 'Vim visitar o pessoal do 21.', ve: 'Segura um buquê de flores.', acao: 2, why: 'O apartamento 21 está viajando e não recebe visitas.' },
    { nome: 'Pessoa desconhecida', cor: '#555', prop: 'nada', diz: 'Só quero entrar um pouquinho, não preciso falar com ninguém.', ve: 'Não diz para qual apartamento vai.', acao: 2, why: 'Quem não diz a quem vem visitar não deve entrar no prédio.' },
    { nome: 'Técnico de internet', cor: '#1fa3b8', prop: 'caixa', diz: 'Vim consertar a internet do 33.', ve: 'Tem crachá, mas esse serviço não está na lista de hoje.', acao: 1, why: 'Serviço que não estava na lista precisa ser confirmado com o morador antes de entrar.' },
    { nome: 'Entregador de gás', cor: '#c8503c', prop: 'gas', diz: 'Entrega de gás para o 12!', ve: 'Camiseta da empresa e um botijão. A entrega está na lista.', acao: 1, why: 'A entrega estava na lista. O porteiro interfona para o morador confirmar.' },
    { nome: 'Dona Alice', cor: '#2fa84f', prop: 'bolsa', diz: 'Sou a Dona Alice do 42. Esqueci a chave!', ve: 'Você a conhece: ela mora no 42 e está na lista de moradores em casa.', acao: 0, why: 'Ela é moradora e o porteiro a conhece. Moradores entram sem precisar de aviso.' }
  ],
  portaria(root, cfg, done, say) {
    const W = 480, H = 230, V = this.portariaVisitantes, AC = ['Liberar a entrada', 'Interfonar para o morador', 'Não liberar'], N = V.length;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas' }); cv.setAttribute('role', 'img');
    const prog = el('progress', { max: N, value: 0 }); prog.setAttribute('aria-label', 'Visitantes atendidos');
    const info = el('p', { className: 'mg-info' }), vis = el('p', { className: 'mg-visitante' }); vis.setAttribute('aria-live', 'polite');
    const prancheta = el('ul', { className: 'mg-prancheta' }); this.portariaPrancheta.forEach(t => prancheta.append(el('li', { textContent: t })));
    const btns = el('div', { className: 'mg-acoes', role: 'group' }); btns.setAttribute('aria-label', 'Decisão do porteiro');
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, prog, info, vis, el('h4', { className: 'mg-h', textContent: 'Prancheta do dia' }), prancheta, el('p', { className: 'mg-help', textContent: 'Veja quem chegou, leia a prancheta e decida. Atalhos: 1, 2 e 3. Decisão errada dispara o alarme e a rodada recomeça. Sem tempo limite.' }), btns, skip);
    const ctx = cv.getContext('2d'), rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let fila = shuffle(V), i = 0, resets = 0, finished = false, alarme = 0, ok = 0;
    const atual = () => fila[i];
    const wrap = (t, n) => { const ls = ['']; t.split(' ').forEach(x => { if ((ls[ls.length - 1] + ' ' + x).trim().length > n && ls[ls.length - 1]) ls.push(x); else ls[ls.length - 1] = (ls[ls.length - 1] + ' ' + x).trim(); }); return ls; };
    const draw = () => {
      rect('#e8dcc0', 0, 0, W, H); rect('#d1c29d', 0, 0, W, 30); rect('#bfe0d8', 330, 40, 120, 80); rect('#8a6a4a', 328, 38, 124, 4); rect('#8a6a4a', 328, 118, 124, 4);
      rect('#b9946f', 0, 150, W, 80); rect('#8a6a4a', 0, 150, W, 8);
      rect('#222', 60, 172, 10, 8); rect('#222', 76, 172, 10, 8); rect('#2b3a67', 58, 140, 30, 34); rect('#3f8fd8', 54, 108, 38, 36); rect('#f2c9a0', 60, 84, 26, 24); rect('#1d2547', 60, 80, 26, 8); rect('#1d2547', 66, 94, 3, 3); rect('#1d2547', 78, 94, 3, 3); rect('#ffd166', 62, 74, 22, 8);
      ctx.fillStyle = '#1d2547'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('Seu Nelson (você)', 73, 200);
      if (alarme > 0) { rect('#e8321f', 0, 0, W, 6); rect('#e8321f', 0, H - 6, W, 6); ctx.fillStyle = '#e8321f'; ctx.font = 'bold 14px monospace'; ctx.fillText('ALARME!', 240, 24); }
      if (!finished && i < N) { const v = atual(), x = 390, y = 70;
        rect('#222', x - 12, y + 80, 10, 8); rect('#222', x + 4, y + 80, 10, 8); rect('#2b3a67', x - 12, y + 52, 26, 30); rect(v.cor, x - 16, y + 18, 34, 36); rect('#f2c9a0', x - 10, y - 6, 22, 24); rect('#2b1b0f', x - 10, y - 10, 22, 8); rect('#1d2547', x - 5, y + 6, 3, 3); rect('#1d2547', x + 5, y + 6, 3, 3);
        const P = { sacola: () => { rect('#fff', x + 20, y + 46, 16, 20); rect('#e94f37', x + 24, y + 42, 8, 6); }, pizza: () => { rect('#b9946f', x + 18, y + 28, 30, 6); rect('#c8503c', x + 22, y + 22, 22, 6); }, doc: () => { rect('#fff', x + 20, y + 30, 14, 18); rect('#3f8fd8', x + 22, y + 32, 10, 4); }, flores: () => { rect('#2f8a3e', x + 24, y + 34, 4, 18); rect('#e94f37', x + 20, y + 28, 12, 8); rect('#ffd166', x + 26, y + 24, 8, 8); },
          nada: () => {}, caixa: () => { rect('#555', x + 18, y + 40, 24, 16); rect('#ffd166', x - 10, y + 24, 12, 6); }, gas: () => { rect('#c8503c', x + 18, y + 36, 14, 30); rect('#fff', x + 20, y + 30, 10, 6); }, bolsa: () => { rect('#8a5a2b', x + 18, y + 40, 20, 16); rect('#5b3a1e', x + 22, y + 36, 12, 4); } }; P[v.prop]();
        rect('#fff', 180, 30, 150, 14 + wrap(v.diz, 22).length * 13); ctx.fillStyle = '#1d2547'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left'; wrap(v.diz, 22).forEach((l, k) => ctx.fillText(l, 186, 46 + k * 13));
        rect('#fff6dc', 130, 150, 200, 4); ctx.fillStyle = '#1d2547'; ctx.fillText(v.nome, 336, 140); }
    };
    const updInfo = () => { prog.value = Math.min(i, N); info.textContent = 'Tentativa ' + (resets + 1) + ' · Visitante ' + Math.min(i + 1, N) + ' de ' + N; if (i < N && !finished) { const v = atual(); vis.textContent = 'Chegou: ' + v.nome + '. Ele(a) diz: "' + v.diz + '" Você observa: ' + v.ve; cv.setAttribute('aria-label', 'Portaria do prédio. Na janela está ' + v.nome + '. ' + v.diz + ' ' + v.ve); } };
    const finish = txt => { if (finished) return; finished = true; say(txt); vis.textContent = txt; updInfo(); draw(); setTimeout(done, 1400); };
    function decidir(a) {
      if (finished || i >= N) return; const v = atual();
      if (a === v.acao) { i++; ok++; alarme = 0;
        if (i >= N) { finish(resets === 0 ? (cfg.vitoria || 'Prédio seguro o dia todo! Parabéns, Seu Nelson!') : 'Prédio seguro! Concluído na tentativa ' + (resets + 1) + '. Quem persiste chega lá.'); return; }
        updInfo(); draw(); say('Certo! ' + v.why + ' Próximo: ' + atual().nome + '. ' + atual().diz + ' ' + atual().ve); return; }
      resets++; alarme = 1; i = 0; fila = shuffle(V); updInfo(); draw();
      say('Alarme! "' + AC[a] + '" não era a decisão certa para ' + v.nome + '. ' + v.why + ' O certo era "' + AC[v.acao] + '". A rodada recomeça. Tentativa ' + (resets + 1) + '. Chegou: ' + atual().nome + '. ' + atual().diz + ' ' + atual().ve);
      if (resets >= 3) skip.hidden = false;
    }
    AC.forEach((t, k) => { const b = el('button', { className: 'btn' + (k === 2 ? ' ghost' : ''), type: 'button', textContent: (k + 1) + ' · ' + t }); b.onclick = () => decidir(k); btns.append(b); });
    const onKey = e => { const k = Number(e.key); if (k >= 1 && k <= 3 && !finished) { e.preventDefault(); decidir(k - 1); } };
    window.addEventListener('keydown', onKey);
    const watch = () => { if (!cv.isConnected) { window.removeEventListener('keydown', onKey); return; } requestAnimationFrame(watch); }; requestAnimationFrame(watch);
    skip.onclick = () => finish('Tudo bem! A portaria foi concluída com ajuda.');
    updInfo(); draw();
    cv._state = { decidir, atual, AC, V, get indice() { return i; }, get resets() { return resets; }, get ok() { return ok; } };
  }
});
