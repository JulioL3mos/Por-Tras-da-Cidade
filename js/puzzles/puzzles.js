// Puzzles acessíveis (botões, caixas e listas nativas; sem arrastar, sem cronômetro).
const Puzzles = {
  el(tag, props, ...kids) { const e = Object.assign(document.createElement(tag), props || {}); kids.forEach(k => e.append(k)); return e; },
  open(root, cfg, done, say) {
    if (['tocar', 'canos', 'obra', 'horta'].includes(cfg.type) && typeof Minigames !== 'undefined') return Minigames[cfg.type](root, cfg, done, say);
    if (['moto', 'onibus', 'coletor', 'gari'].includes(cfg.type) && typeof Minigames !== 'undefined') return Minigames.percurso(root, Object.assign({ veiculo: cfg.type }, cfg), done, say);
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(this.el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const t = this[cfg.type](root, cfg); let fails = 0;
    const check = this.el('button', { className: 'btn', type: 'button', textContent: 'Conferir' });
    const help = this.el('button', { className: 'btn ghost', type: 'button', textContent: 'Mostrar uma ajuda', hidden: true });
    check.onclick = () => {
      const r = t.check();
      if (r.ok) { say(''); done(); return; }
      fails++; say('Quase! ' + r.msg + ' Dica: ' + cfg.dica + (fails >= 2 ? ' Você pode pedir uma ajuda.' : '')); if (fails >= 2) help.hidden = false;
    };
    help.onclick = () => say(t.help());
    root.append(check, help);
    const first = root.querySelector('button, input, select'); if (first) first.focus();
  },
  ordenar(root, cfg) {
    const n = cfg.itens.length, idx = [...Array(n).keys()];
    let arr = idx.map((_, i) => idx[(i + 2) % n]); [arr[0], arr[1]] = [arr[1], arr[0]];
    const ol = this.el('ol', { className: 'pz-list' }); root.append(ol);
    const draw = (focus) => {
      ol.innerHTML = '';
      arr.forEach((v, pos) => {
        const mk = (sym, name, d) => { const b = this.el('button', { className: 'btn small pz-move', type: 'button', textContent: sym, disabled: pos + d < 0 || pos + d >= n });
          b.setAttribute('aria-label', name + ': ' + cfg.itens[v] + ' (posição ' + (pos + 1) + ' de ' + n + ')');
          b.onclick = () => { [arr[pos], arr[pos + d]] = [arr[pos + d], arr[pos]]; draw(sym + (pos + d)); }; if (focus === sym + pos) setTimeout(() => b.focus()); return b; };
        ol.append(this.el('li', { className: 'pz-row' }, this.el('span', { textContent: cfg.itens[v] }), mk('▲', 'Subir', -1), mk('▼', 'Descer', 1)));
      });
    };
    draw();
    return {
      check: () => { const ok = arr.filter((v, i) => v === i).length; return { ok: ok === n, msg: ok + ' de ' + n + ' etapas já estão no lugar certo.' }; },
      help: () => { const i = arr.findIndex((v, k) => v !== k); const j = arr.indexOf(i); [arr[i], arr[j]] = [arr[j], arr[i]]; draw(); return 'Ajuda: "' + cfg.itens[i] + '" vai na posição ' + (i + 1) + '.'; }
    };
  },
  associar(root, cfg) {
    const opts = cfg.pares.map(p => p[1]); const shown = opts.map((_, i) => opts[(i + 1) % opts.length]); const sels = [];
    cfg.pares.forEach(([a], i) => {
      const s = this.el('select', { className: 'pz-select', id: 'pz-s' + i }); s.append(this.el('option', { value: '', textContent: 'Escolha…' }));
      shown.forEach(o => s.append(this.el('option', { value: o, textContent: o }))); sels.push(s);
      root.append(this.el('div', { className: 'pz-row' }, this.el('label', { htmlFor: 'pz-s' + i, textContent: a }), s));
    });
    return {
      check: () => { const ok = sels.filter((s, i) => s.value === cfg.pares[i][1]).length; return { ok: ok === sels.length, msg: ok + ' de ' + sels.length + ' combinações estão certas.' }; },
      help: () => { const i = sels.findIndex((s, k) => s.value !== cfg.pares[k][1]); sels[i].value = cfg.pares[i][1]; return 'Ajuda: "' + cfg.pares[i][0] + '" combina com "' + cfg.pares[i][1] + '".'; }
    };
  },
  classificar(root, cfg) {
    const sets = cfg.itens.map(([txt], i) => {
      const fs = this.el('fieldset', { className: 'pz-set' }, this.el('legend', { textContent: txt }));
      const radios = cfg.grupos.map((g, gi) => { const r = this.el('input', { type: 'radio', name: 'pz-c' + i, value: gi, id: 'pz-c' + i + '-' + gi });
        fs.append(this.el('label', { className: 'pz-choice', htmlFor: r.id }, r, ' ' + g)); return r; });
      root.append(fs); return radios;
    });
    return {
      check: () => { const ok = sets.filter((rs, i) => rs[cfg.itens[i][1]].checked).length; return { ok: ok === sets.length, msg: ok + ' de ' + sets.length + ' itens estão no grupo certo.' }; },
      help: () => { const i = sets.findIndex((rs, k) => !rs[cfg.itens[k][1]].checked); sets[i][cfg.itens[i][1]].checked = true; return 'Ajuda: "' + cfg.itens[i][0] + '" vai em "' + cfg.grupos[cfg.itens[i][1]] + '".'; }
    };
  },
  selecionar(root, cfg) {
    const boxes = cfg.itens.map(([txt], i) => { const c = this.el('input', { type: 'checkbox', id: 'pz-k' + i });
      root.append(this.el('label', { className: 'pz-choice', htmlFor: c.id }, c, ' ' + txt)); return c; });
    return {
      check: () => { const ok = boxes.filter((b, i) => b.checked === cfg.itens[i][1]).length; return { ok: ok === boxes.length, msg: 'Você acertou ' + ok + ' de ' + boxes.length + ' escolhas.' }; },
      help: () => { const i = boxes.findIndex((b, k) => b.checked !== cfg.itens[k][1]); boxes[i].checked = cfg.itens[i][1]; return 'Ajuda: "' + cfg.itens[i][0] + '" ' + (cfg.itens[i][1] ? 'deve' : 'não deve') + ' ser marcado.'; }
    };
  }
};
