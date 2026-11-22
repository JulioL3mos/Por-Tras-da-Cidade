// Mini game "Varrer a rua" (gari): segure e arraste a vassoura para empurrar o lixo até o contêiner.
// O vento empurra o lixo para trás e pedestres atravessam: esbarrar neles espalha o lixo de novo.
Object.assign(Minigames, {
  varrer(root, cfg, done, say) {
    const W = 480, H = 300, R = 26, PR = 6, CX = W - 64, N = cfg.lixos || 28, meta = cfg.meta || N - 2, calm = Save.data.settings.calm;
    const el = (t, p, ...k) => { const e = Object.assign(document.createElement(t), p || {}); k.forEach(x => e.append(x)); return e; };
    root.innerHTML = ''; root.hidden = false; say('');
    root.append(el('p', { className: 'pz-intro', textContent: cfg.instrucao }));
    const cv = el('canvas', { width: W, height: H, className: 'mg-canvas', tabIndex: 0 });
    cv.setAttribute('role', 'application');
    cv.setAttribute('aria-label', cfg.descricao || 'Rua vista de cima. Folhas, papéis e latas estão espalhados. Use as setas para mover a vassoura e empurrar o lixo até o contêiner à direita. Espaço levanta ou abaixa a vassoura.');
    const prog = el('progress', { max: meta, value: 0 }); prog.setAttribute('aria-label', 'Lixo recolhido');
    const info = el('p', { className: 'mg-info' });
    const start = el('button', { className: 'btn', type: 'button', textContent: 'Começar' });
    const pauseBtn = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pausar', hidden: true });
    const skip = el('button', { className: 'btn ghost', type: 'button', textContent: 'Pular desafio', hidden: true });
    root.append(cv, prog, info, el('p', { className: 'mg-help', textContent: 'Mouse ou dedo: segure e arraste para varrer (ao tocar, a vassoura aparece ali; ao soltar, ela fica levantada). Teclado: setas movem a vassoura e Espaço levanta ou abaixa. Empurre o lixo até o contêiner da direita. O vento empurra o lixo para trás. Se esbarrar num pedestre, o lixo se espalha de novo.' }), start, pauseBtn, skip);
    start.focus();

    let seed = cfg.seed || 5; const rnd = () => { seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const tipos = ['folha', 'papel', 'lata', 'garrafa'], P = Array.from({ length: N }, (_, i) => ({ x: 50 + rnd() * (CX - 150), y: 24 + rnd() * (H - 48), vx: 0, vy: 0, t: tipos[i % 4], c: false }));
    const b = { x: 70, y: H / 2, vx: 0, vy: 0 }, ptr = { down: false, x: 0, y: 0 }, keys = { up: false, down: false, left: false, right: false }, ped = { on: false, x: 0, y: 0 };
    let running = false, paused = false, finished = false, lifted = false, feitos = 0, resets = 0, last = 0, clock = 0, windT = 6, windOn = 0, pedT = 4, shake = 0, safe = 0;
    const updInfo = () => { info.textContent = 'Tentativa ' + (resets + 1) + ' · Lixo recolhido ' + feitos + ' de ' + meta; prog.value = feitos; };
    updInfo();
    const finish = txt => { if (finished) return; finished = true; running = false; say(txt); setTimeout(done, 1200); };
    const scatter = () => { resets++; shake = .35; safe = 1.2; P.forEach(p => { if (!p.c) { p.x = 30 + rnd() * (CX - 70); p.y = 20 + rnd() * (H - 40); p.vx = p.vy = 0; } }); updInfo();
      say('Você esbarrou no pedestre! O lixo se espalhou de novo. Solte a vassoura para esperar quem passa. Tentativa ' + (resets + 1) + '.'); if (resets >= 3) skip.hidden = false; };
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; };
    const down = (x, y) => { if (!running || paused || finished) return; ptr.down = true; ptr.x = x; ptr.y = y; b.x = x; b.y = y; b.vx = b.vy = 0; };
    const move = (x, y) => { ptr.x = x; ptr.y = y; }, up = () => { ptr.down = false; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); const p = pt(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} down(p.x, p.y); });
    cv.addEventListener('pointermove', e => { if (ptr.down) { const p = pt(e); move(p.x, p.y); } });
    ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, up));
    const KM = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
    cv.addEventListener('keydown', e => { const k = KM[e.key]; if (k) keys[k] = true; else if (e.key === ' ' || e.key === 'Enter') { if (!e.repeat) { lifted = !lifted; say(lifted ? 'Vassoura levantada.' : 'Vassoura abaixada: varrendo.'); } } else return; e.preventDefault(); });
    cv.addEventListener('keyup', e => { const k = KM[e.key]; if (k) keys[k] = false; });

    const ctx = cv.getContext('2d'), rect = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const lixo = p => { const x = p.x, y = p.y; if (p.t === 'folha') { rect('#c98a3a', x - 5, y - 3, 10, 6); rect('#8a5a2b', x - 1, y - 1, 6, 2); } else if (p.t === 'papel') { rect('#fff', x - 4, y - 5, 8, 10); rect('#cbd5e1', x - 2, y - 2, 4, 2); } else if (p.t === 'lata') { rect('#9aa4b2', x - 3, y - 5, 6, 10); rect('#e8321f', x - 3, y - 1, 6, 3); } else { rect('#9fd3f5', x - 2, y - 5, 4, 10); rect('#3f8fd8', x - 1, y - 7, 2, 3); } };
    const draw = () => {
      ctx.save(); if (shake > 0 && !calm) ctx.translate((Math.random() - .5) * 6, (Math.random() - .5) * 6);
      rect('#9ca3af', 0, 0, W, H); for (let y = 0; y < H; y += 40) for (let x = (y / 40 % 2) * 20; x < CX; x += 40) rect('#8b929d', x, y, 38, 2);
      rect('#4b5563', 0, 0, W, 6); rect('#4b5563', 0, H - 6, W, 6);
      rect('#2f8a3e', CX, 0, 64, H); rect('#256f31', CX, 0, 6, H); ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('CONTÊINER', CX + 35, 16); ctx.fillText('DE LIXO', CX + 35, 28);
      for (let y = 40; y < H - 30; y += 60) { rect('#1f6f2c', CX + 14, y, 36, 40); rect('#fff', CX + 22, y + 10, 20, 3); }
      P.forEach(p => { if (!p.c) lixo(p); });
      if (windOn > 0 && !calm) { for (let i = 0; i < 6; i++) { const y = (i * 53 + clock * 90) % H; rect('rgba(255,255,255,.6)', (W - ((clock * 300 + i * 70) % W)) % W, y, 40, 2); } }
      if (ped.on) { const x = ped.x, y = ped.y; rect('#222', x - 6, y + 12, 5, 6); rect('#222', x + 2, y + 12, 5, 6); rect('#7a5cc7', x - 7, y - 2, 14, 16); rect('#f2c9a0', x - 5, y - 12, 10, 10); rect('#2b1b0f', x - 5, y - 13, 10, 4); }
      const push = ptr.down || (!lifted && (keys.up || keys.down || keys.left || keys.right));
      rect(push ? '#8a5a2b' : '#c9b78a', b.x - 22, b.y - 7, 44, 14); rect('#5b3a1e', b.x - 22, b.y + 3, 44, 3); rect('#e0c28a', b.x - 2, b.y - 46, 4, 40);
      rect('#f4a300', b.x - 8, b.y - 66, 16, 18); rect('#f2c9a0', b.x - 6, b.y - 78, 12, 12); rect('#e8e4d0', b.x - 6, b.y - 80, 12, 4);
      if (!push) { ctx.fillStyle = '#1d2547'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillText('LEVANTADA', b.x, b.y + 22); }
      ctx.restore(); if (!running && !finished) rect('rgba(29,37,71,.55)', 0, 0, W, H);
    };
    const frame = t => {
      if (!cv.isConnected) { running = false; return; }
      const menu = document.getElementById('menu'), menuOpen = menu && !menu.hidden, dt = Math.min(.05, (t - last) / 1000); last = t;
      if (running && !paused && !menuOpen && !finished) {
        clock += dt; shake = Math.max(0, shake - dt); safe = Math.max(0, safe - dt);
        let nx = b.x, ny = b.y; const kb = keys.up || keys.down || keys.left || keys.right;
        if (ptr.down) { const dx = ptr.x - b.x, dy = ptr.y - b.y, d = Math.hypot(dx, dy), s = Math.min(d, 420 * dt); if (d > .5) { nx += dx / d * s; ny += dy / d * s; } }
        else if (kb) { const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0), ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0), n = Math.hypot(kx, ky) || 1; nx += kx / n * 230 * dt; ny += ky / n * 230 * dt; }
        nx = Math.max(0, Math.min(W, nx)); ny = Math.max(0, Math.min(H, ny)); b.vx = (nx - b.x) / dt; b.vy = (ny - b.y) / dt; b.x = nx; b.y = ny;
        const push = ptr.down || (!lifted && kb);
        windT -= dt; if (windT <= 0 && windOn <= 0) { windOn = 1.6; windT = 7; say('Vento! O lixo está sendo empurrado para trás.'); } if (windOn > 0) windOn -= dt;
        const fr = Math.pow(.03, dt);
        P.forEach(p => { if (p.c) return;
          if (push) { const dx = p.x - b.x, dy = p.y - b.y, d = Math.hypot(dx, dy) || .01; if (d < R + PR) { const nxn = dx / d, nyn = dy / d; p.x = b.x + nxn * (R + PR); p.y = b.y + nyn * (R + PR); p.vx = b.vx * .9 + nxn * 30; p.vy = b.vy * .9 + nyn * 30; } }
          if (windOn > 0) p.vx -= 150 * (calm ? .5 : 1) * dt;
          p.vx *= fr; p.vy *= fr; p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.x < PR) { p.x = PR; p.vx = 0; } if (p.y < PR + 6) { p.y = PR + 6; p.vy = 0; } if (p.y > H - PR - 6) { p.y = H - PR - 6; p.vy = 0; }
          if (p.x >= CX) { p.c = true; feitos++; updInfo(); if (feitos % 7 === 0 && feitos < meta) say(feitos + ' de ' + meta + ' recolhidos.'); } });
        if (!ped.on) { pedT -= dt; if (pedT <= 0) { ped.on = true; ped.x = 90 + rnd() * (CX - 200); ped.y = -20; pedT = 7 + rnd() * 3; say('Atenção, um pedestre vai atravessar a rua. Solte a vassoura para ele passar.'); } }
        else { ped.y += 58 * dt; if (ped.y > H + 20) ped.on = false; }
        if (ped.on && push && safe <= 0 && Math.abs(b.x - ped.x) < R * .7 + 8 && Math.abs(b.y - ped.y) < R * .7 + 14) scatter();
        if (feitos >= meta) finish(resets === 0 ? (cfg.vitoria || 'A rua ficou limpa de primeira! Parabéns!') : 'A rua ficou limpa na tentativa ' + (resets + 1) + '! Quem persiste chega lá.');
      }
      draw(); requestAnimationFrame(frame);
    };
    start.onclick = () => { running = true; start.hidden = true; pauseBtn.hidden = false; say('Começou! Varra o lixo até o contêiner, à direita.'); cv.focus(); };
    pauseBtn.onclick = () => { paused = !paused; pauseBtn.textContent = paused ? 'Continuar' : 'Pausar'; say(paused ? 'Jogo pausado.' : ''); cv.focus(); };
    skip.onclick = () => finish('Tudo bem! A rua foi limpa com ajuda.');
    cv._state = { P, b, ped, down, move, up, W, H, CX, R, meta, get feitos() { return feitos; }, get resets() { return resets; }, get windOn() { return windOn; } };
    draw(); requestAnimationFrame(frame);
  }
});
