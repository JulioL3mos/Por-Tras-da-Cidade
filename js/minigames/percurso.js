// Motor de percurso (vista de cima) usado por moto, ônibus, caminhão de lixo e gari.
// Desafio real: bateu, volta ao início (itens já recolhidos continuam valendo).
// Sem tempo limite e sem derrota final; "Pular desafio" aparece após 3 tentativas.
const Minigames = {
  veiculos: {
    moto:    { hw: 36, hh: 18, vel: 150, freio: .4, gas: 1.4,  item: null },
    onibus:  { hw: 70, hh: 24, vel: 130, freio: 0,  gas: 1.25, item: 'parada' },
    coletor: { hw: 58, hh: 26, vel: 130, freio: .3, gas: 1.3,  item: 'saco' },
    gari:    { hw: 20, hh: 18, vel: 105, freio: .3, gas: 1.3,  item: 'lixo' }
  },
  tipos: { buraco: [30, 20, 0], cone: [18, 26, 0], 'poça': [38, 22, 0], carro: [54, 30, 0], 'carro lento': [54, 30, 45], pedestre: [14, 22, 0], bicicleta: [30, 16, -90] },
  percurso(root, cfg, done, say) {
    const V = this.veiculos[cfg.veiculo], W = 480, H = 240, LANES = 4, LH = 48, TOP = 24, LEN = cfg.comprimento || 2800, START = 60;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas' });
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', cfg.descricao || 'Mini game visto de cima: troque de faixa com as setas para cima e para baixo, freie com a seta para a esquerda. Se bater, volta ao início.');
    const prog = el('progress', { max: 100, value: 0 }); prog.setAttribute('aria-label', 'Progresso do percurso');
    const info = el('p', { className: 'mg-info' });
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    const pad = el('div', { className: 'mg-pad', role: 'group' }); pad.setAttribute('aria-label', 'Controles');
    const keys = { up: false, down: false, brake: false, gas: false };
    [['▲', 'up', 'Subir de faixa'], ['▼', 'down', 'Descer de faixa'], ['◀', 'brake', cfg.veiculo === 'onibus' ? 'Parar' : 'Frear'], ['▶', 'gas', 'Acelerar']].forEach(([s, k, n]) => {
      const b = el('button', { className: 'btn small', type: 'button', textContent: s }); b.setAttribute('aria-label', n);
      const set = v => e => { e.preventDefault(); keys[k] = v; };
      b.addEventListener('pointerdown', set(true)); ['pointerup', 'pointerleave', 'pointercancel'].forEach(t => b.addEventListener(t, set(false))); pad.append(b);
    });
    root.append(cv, prog, info, el('p', { className: 'mg-help', textContent: 'Setas ou W A S D: ▲▼ trocam de faixa, ◀ ' + (cfg.veiculo === 'onibus' ? 'para' : 'freia') + ', ▶ acelera. Se bater, volta ao início. Sem tempo limite.' }), pad, start, pauseBtn, skip);
    start.focus();

    let seed = cfg.seed || 7; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const laneY = l => TOP + l * LH + LH / 2;
    // Itens obrigatórios (paradas, sacos, lixo)
    const items = [], n = V.item ? (cfg.itens || 3) : 0, first = V.item === 'parada' ? 700 : 600;
    for (let i = 0; i < n; i++) {
      const x = first + i * (LEN - first - 300) / Math.max(1, n - 1);
      const lane = V.item === 'parada' ? 3 : V.item === 'saco' ? (rnd() < .5 ? 0 : 3) : Math.floor(rnd() * 4);
      items.push({ x, y: V.item === 'parada' ? H - 12 : laneY(lane), lane, kind: V.item, done: false, t: 0, v: Math.floor(rnd() * 3) });
    }
    // Obstáculos (sempre sobra ao menos uma faixa livre)
    const nomes = cfg.obstaculos || ['buraco', 'cone', 'poça', 'carro', 'carro lento', 'pedestre'], obs = [];
    for (let x = 400; x < LEN - 220; x += 150 + rnd() * 80 + (V.hw > 40 ? 90 : 0)) {
      if (items.some(it => Math.abs(it.x - x) < (V.hw > 40 ? V.hw + 95 : 90))) continue;
      if (nomes.includes('pedestre') && rnd() < .18) { const l = Math.floor(rnd() * 3), y = TOP + (l + 1) * LH; obs.push({ x, x0: x, y, y0: y, kind: 'pedestre', w: 14, h: 22, vx: 0, ph: rnd() * 6 }); continue; }
      const pool = nomes.filter(k => k !== 'pedestre'), lanes = [0, 1, 2, 3].sort(() => rnd() - .5).slice(0, rnd() < .45 ? 2 : 1);
      lanes.forEach(l => { const k = pool[Math.floor(rnd() * pool.length)], d = this.tipos[k]; obs.push({ x, x0: x, y: laneY(l), y0: laneY(l), kind: k, w: d[0], h: d[1], vx: d[2], ph: 0 }); });
    }
    const calm = Save.data.settings.calm, ctx = cv.getContext('2d'), baseSpeed = (cfg.velocidade || V.vel) * (calm ? .7 : 1), nome = cfg.itemNome || 'Itens';
    const m = { x: START, y: laneY(1) };
    let running = false, paused = false, restarts = 0, rollbacks = 0, invul = 1, clock = 0, last = 0, finished = false, half = false, shake = 0;
    const doneCount = () => items.filter(i => i.done).length;
    const updInfo = () => { info.textContent = 'Tentativa ' + (restarts + 1) + (n ? ' · ' + nome + ' ' + doneCount() + '/' + n : ''); };
    updInfo();
    cv._state = { m, obs, items, keys, get restarts() { return restarts; }, TOP, LH, LANES, V };
    const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'brake', a: 'brake', A: 'brake', ArrowRight: 'gas', d: 'gas', D: 'gas' };
    const onKey = v => e => { const k = keyMap[e.key]; if (k && running) { keys[k] = v; if (e.key.startsWith('Arrow')) e.preventDefault(); } };
    const kd = onKey(true), ku = onKey(false);
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
    const cleanup = () => { running = false; window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); Object.keys(keys).forEach(k => keys[k] = false); };
    const finish = txt => { if (finished) return; finished = true; cleanup(); say(txt); setTimeout(done, 1200); };

    const rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const drawVeiculo = (x, y) => {
      if (cfg.veiculo === 'moto') { rect('#111', x - 22, y - 3, 8, 6); rect('#111', x + 14, y - 3, 8, 6); rect('#444', x - 16, y - 5, 32, 10); rect('#f2b134', x - 22, y - 9, 16, 18); rect('#a3701a', x - 22, y - 9, 16, 3); rect('#e94f37', x - 4, y - 7, 12, 14); rect('#f2c9a0', x + 8, y - 4, 7, 8); rect('#222', x + 8, y - 6, 8, 4); }
      else if (cfg.veiculo === 'onibus') { rect('#111', x - 30, y - 15, 12, 4); rect('#111', x + 18, y - 15, 12, 4); rect('#111', x - 30, y + 11, 12, 4); rect('#111', x + 18, y + 11, 12, 4); rect('#f2b134', x - 38, y - 13, 76, 26); rect('#c98a10', x - 38, y - 13, 76, 4); rect('#bfe0ff', x - 32, y - 7, 12, 10); rect('#bfe0ff', x - 16, y - 7, 12, 10); rect('#bfe0ff', x, y - 7, 12, 10); rect('#bfe0ff', x + 16, y - 7, 18, 10); rect('#fff', x + 36, y - 9, 3, 6); }
      else if (cfg.veiculo === 'coletor') { rect('#111', x - 28, y - 15, 12, 4); rect('#111', x + 14, y - 15, 12, 4); rect('#111', x - 28, y + 11, 12, 4); rect('#111', x + 14, y + 11, 12, 4); rect('#fff6dc', x - 32, y - 13, 42, 26); rect('#2fa84f', x - 32, y - 13, 42, 6); rect('#2fa84f', x + 10, y - 12, 22, 24); rect('#bfe0ff', x + 24, y - 8, 7, 14); rect('#ffd166', x + 31, y - 6, 3, 4); }
      else { rect('#333', x - 6, y + 8, 12, 3); rect('#8a5a2b', x + 6, y - 2, 16, 3); rect('#d9b44a', x + 18, y - 4, 5, 7); rect('#f4a300', x - 6, y - 7, 12, 14); rect('#f2c9a0', x - 4, y - 14, 9, 8); rect('#2b1b0f', x - 5, y - 15, 11, 3); }
    };
    const draw = () => {
      const cx = m.x - 120; ctx.save(); if (shake > 0 && !calm) ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
      rect('#8bc66a', 0, 0, W, H); rect('#c9b78a', 0, 0, W, TOP); rect('#c9b78a', 0, H - TOP, W, TOP); rect('#4a4f63', 0, TOP, W, LANES * LH);
      for (let l = 1; l < LANES; l++) for (let x = -(cx % 40); x < W; x += 40) rect('#e8e4d0', x, TOP + l * LH - 1, 20, 3);
      for (let i = 0; i * 120 < LEN + 200; i++) { const x = i * 120 - cx; if (x < -60 || x > W) continue; rect(['#c8503c', '#3f8fd8', '#e0a030', '#8a5cc7'][i % 4], x, 2, 60, 16); rect('#fff6dc', x + 6, 6, 8, 8); rect('#2f8a3e', x + 80, H - 20, 16, 16); }
      for (let y = TOP; y < TOP + LANES * LH; y += 12) for (let k = 0; k < 2; k++) rect((y / 12 + k) % 2 ? '#111' : '#fff', LEN - cx + k * 12, y, 12, 12);
      items.forEach(it => { const x = it.x - cx; if (x < -40 || x > W + 40 || it.done) return;
        if (it.kind === 'parada') { rect('#3f8fd8', x - 24, H - 22, 48, 5); rect('#fff', x - 24, H - 17, 4, 12); rect('#fff', x + 20, H - 17, 4, 12); rect('#ffd166', x - 8, H - 34, 16, 10); rect('#111', x - 5, H - 31, 10, 4); if (it.t > 0) rect('#2fa84f', x - 24, H - 40, Math.round(48 * Math.min(1, it.t / 1.2)), 4); }
        else if (it.kind === 'saco') { rect('#222', x - 8, it.y - 9, 16, 18); rect('#444', x - 4, it.y - 12, 8, 4); rect('#6f6', x - 3, it.y - 2, 6, 3); }
        else { const c = ['#e8e4d0', '#5aa9e6', '#e0a030'][it.v]; rect(c, x - 7, it.y - 7, 14, 14); rect('#111', x - 7, it.y + 5, 14, 2); } });
      obs.forEach(o => { const x = o.x - cx; if (x < -70 || x > W + 70) return; const y = o.y;
        if (o.kind === 'buraco') { rect('#1b1b24', x - 15, y - 10, 30, 20); rect('#33333f', x - 11, y - 7, 22, 14); }
        else if (o.kind === 'cone') { rect('#e8671f', x - 9, y - 13, 18, 26); rect('#fff', x - 9, y - 4, 18, 5); }
        else if (o.kind === 'poça') { rect('#5aa9e6', x - 19, y - 11, 38, 22); rect('#9fd3f5', x - 12, y - 6, 12, 5); }
        else if (o.kind === 'pedestre') { rect('#7a5cc7', x - 7, y - 4, 14, 14); rect('#f2c9a0', x - 5, y - 12, 10, 8); rect('#333', x - 7, y + 10, 5, 2); }
        else if (o.kind === 'bicicleta') { rect('#111', x - 15, y - 3, 8, 8); rect('#111', x + 7, y - 3, 8, 8); rect('#e94f37', x - 9, y - 6, 18, 4); rect('#f2c9a0', x - 3, y - 12, 7, 7); rect('#3f8fd8', x - 4, y - 5, 8, 8); }
        else { const c = o.kind === 'carro' ? '#2f7ad9' : '#2fa84f'; rect(c, x - 27, y - 15, 54, 30); rect('#bfe0ff', x - 9, y - 11, 22, 22); rect('#111', x - 24, y - 17, 10, 3); rect('#111', x + 14, y - 17, 10, 3); if (o.vx) rect('#ffd166', x + 22, y - 3, 5, 6); } });
      if (!(invul > 0 && !calm && Math.floor(invul * 10) % 2)) drawVeiculo(m.x - cx, m.y);
      ctx.restore();
      if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const restart = o => {
      restarts++; shake = .35; invul = 1.2; m.x = START; m.y = laneY(1); half = false; prog.value = 0;
      obs.forEach(b => { b.x = b.x0; b.y = b.y0; }); items.forEach(i => { i.t = 0; });
      const what = o.kind === 'carro' || o.kind === 'carro lento' ? 'um carro' : o.kind === 'pedestre' ? 'um pedestre' : o.kind === 'bicicleta' ? 'uma bicicleta' : o.kind === 'cone' ? 'um cone' : o.kind === 'poça' ? 'uma poça' : 'um buraco';
      updInfo(); say('Bateu em ' + what + '! Voltando ao início. Tentativa ' + (restarts + 1) + '. Observe os obstáculos e troque de faixa a tempo.');
      if (restarts >= 3) skip.hidden = false;
    };
    const frame = t => {
      if (!cv.isConnected) { cleanup(); return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden;
      const dt = Math.min(.05, (t - last) / 1000); last = t;
      if (running && !paused && !menuOpen && !finished) {
        clock += dt; invul = Math.max(0, invul - dt); shake = Math.max(0, shake - dt);
        const pr = (m.x - START) / (LEN - START), base = baseSpeed * (1 + .25 * pr) * (restarts >= 5 ? .85 : 1);
        m.x += base * (keys.brake ? V.freio : keys.gas ? V.gas : 1) * dt;
        m.y = Math.min(TOP + LANES * LH - 14, Math.max(TOP + 14, m.y + ((keys.down ? 1 : 0) - (keys.up ? 1 : 0)) * 170 * dt));
        obs.forEach(o => { if (o.vx) o.x += o.vx * dt; if (o.kind === 'pedestre') o.y = o.y0 + Math.sin(clock * 1.3 + o.ph) * LH * .8; });
        items.forEach((it, i) => { if (it.done) return;
          if (it.kind === 'parada') { if (keys.brake && Math.abs(m.x - it.x) < 60 && m.y > TOP + 3 * LH) { it.t += dt; if (it.t >= 1.2) { it.done = true; updInfo(); say('Os passageiros embarcaram! Parada ' + doneCount() + ' de ' + n + '.'); } } else if (it.t > 0 && !keys.brake) it.t = Math.max(0, it.t - dt); }
          else if (Math.abs(m.x - it.x) < (V.hw + 16) / 2 && Math.abs(m.y - it.y) < (V.hh + 16) / 2 + 8) { it.done = true; updInfo(); say((it.kind === 'saco' ? 'Saco recolhido! ' : 'Lixo recolhido! ') + doneCount() + ' de ' + n + '.'); }
          if (!it.done && m.x > it.x + (it.kind === 'parada' ? 90 : 70)) { rollbacks++; if (rollbacks >= 4) skip.hidden = false; m.x = Math.max(START, it.x - 200); invul = 1; say(it.kind === 'parada' ? 'Você passou da parada! Volte e segure ◀ na faixa de baixo para parar.' : it.kind === 'saco' ? 'Ficou um saco de lixo para trás! Voltando um pouco para recolher.' : 'Ficou lixo na rua! Voltando um pouco para recolher.'); }
        });
        if (invul <= 0) { const o = obs.find(o => Math.abs(m.x - o.x) < (V.hw + o.w) / 2 && Math.abs(m.y - o.y) < (V.hh + o.h) / 2); if (o) restart(o); }
        prog.value = Math.min(100, Math.round((m.x - START) / (LEN - START) * 100));
        if (!half && prog.value >= 50) { half = true; say('Metade do caminho!'); }
        if (m.x >= LEN && items.every(i => i.done)) finish(restarts === 0 ? (cfg.vitoria || 'Missão cumprida de primeira! Parabéns!') + '' : 'Missão cumprida na tentativa ' + (restarts + 1) + '! Quem persiste chega lá.');
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; say('Começou!'); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); };
    skip.onclick = () => finish('Tudo bem! A missão foi concluída com ajuda.');
    draw(); requestAnimationFrame(frame);
  },
  moto(r, c, d, s) { return this.percurso(r, Object.assign({ veiculo: 'moto' }, c), d, s); }
};
