// Interface DOM (menus, diálogos, toque) + inicialização do Phaser.
const $ = id => document.getElementById(id);
window.UI = {
  scene: null, lastFocus: null, toastTimer: null,
  bindScene(s) { this.scene = s; },
  regionName: '',
  announceRegion(n) { if (n) this.regionName = n; $('region').textContent = 'Região: ' + this.regionName + ' | Estrelas: ' + Save.data.stars.length + '/12'; },
  showToast(msg) {
    const t = $('toast'); if (!t) return;
    t.textContent = msg; t.hidden = false; t.style.opacity = '1';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      t.style.opacity = '0';
      setTimeout(() => { t.hidden = true; }, 250);
    }, 2200);
  },
  openDialog(npc, onClose) {
    const m = MISSIONS[npc.id], pz = (typeof PUZZLES !== 'undefined' && typeof Puzzles !== 'undefined') ? PUZZLES[npc.id] : null, pzRoot = $('dlg-puzzle'), dlg = $('dialog'), text = $('dlg-text'), list = $('dlg-clues'), opts = $('dlg-opts'), fb = $('dlg-fb'), ok = $('dlg-ok');
    const close = () => { dlg.hidden = true; onClose(); this.checkFinal(); };
    const clear = () => { pzRoot.innerHTML = ''; pzRoot.hidden = true; list.innerHTML = ''; list.hidden = true; opts.innerHTML = ''; fb.textContent = ''; ok.hidden = false; };
    const next = (label, fn) => { ok.textContent = label; ok.onclick = fn; ok.hidden = false; ok.focus(); };
    $('dlg-name').textContent = npc.name + ' — ' + npc.job + ' | Missão: ' + npc.title;
    dlg.hidden = false;
    const win = () => {
      clear();
      if (!Save.data.stars.includes(npc.id)) { Save.data.stars.push(npc.id); Save.save(); }
      this.announceRegion(); if (this.scene) { this.scene.refreshMarks(); this.scene.checkUnlocks(true); }
      text.textContent = '★ ' + m.feedback + ' ' + m.about;
      next('Continuar', close);
    };
    const ask = () => {
      clear(); text.textContent = m.question; ok.hidden = true;
      m.options.forEach((o, i) => { const b = document.createElement('button'); b.className = 'btn'; b.textContent = String.fromCharCode(65 + i) + ') ' + o;
        b.onclick = () => { if (i === m.correct) win(); else { fb.textContent = 'Quase! Dica: ' + m.hint + ' Tente outra alternativa.'; b.disabled = true; } };
        opts.appendChild(b); });
      opts.firstChild.focus();
    };
    const puzzle = () => { clear(); text.textContent = 'Desafio da missão'; ok.hidden = true; Puzzles.open(pzRoot, pz, win, msg => { fb.textContent = msg; }); };
    const clues = () => {
      clear(); text.textContent = 'Pistas que encontrei:';
      m.clues.forEach(c => { const li = document.createElement('li'); li.textContent = c; list.appendChild(li); }); list.hidden = false;
      next(pz ? 'Resolver o desafio' : 'Responder à pergunta', pz ? puzzle : ask);
    };
    if (Save.data.stars.includes(npc.id)) { win(); return; }
    clear(); text.textContent = m.situation; next('Investigar pistas', clues);
  },
  progFrom: 'menu', progWasRunning: false,
  openProgress(from) {
    this.progFrom = from; const s = this.scene;
    if (from === 'menu') $('menu').hidden = true;
    else if (from === 'final') $('final').hidden = true;
    else if (s && s.scene) { this.progWasRunning = !s.scene.isPaused(); if (this.progWasRunning) { if (s.input && s.input.keyboard) s.input.keyboard.resetKeys(); s.scene.pause(); } }
    const st = Save.data.stars;
    $('prog-stars').textContent = 'Estrelas de reconhecimento: ' + st.length + ' de 12.';
    const reg = $('prog-regions'); reg.innerHTML = '';
    REGIONS.forEach(r => { const d = REGION_MISSIONS[r.id].filter(id => st.includes(id)).length, open = regionUnlocked(r.id);
      const li = document.createElement('li'); li.textContent = r.name + ': ' + d + ' de 3 missões — ' + (open ? 'Aberta' : 'Fechada (conclua a região anterior)'); reg.appendChild(li); });
    const mural = $('mural'); mural.innerHTML = '';
    NPCS.forEach(n => { const ok = st.includes(n.id), mi = MISSIONS[n.id], li = document.createElement('li'); li.className = 'card' + (ok ? '' : ' locked');
      const cv = document.createElement('canvas'); cv.width = 72; cv.height = 96; cv.setAttribute('aria-hidden', 'true'); const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      if (ok) { try { c.drawImage(window.game.textures.get('npc' + n.id).getSourceImage(), 0, 0, 24, 32, 0, 0, 72, 96); } catch (e) {} } else { c.fillStyle = '#1d2547'; c.fillRect(0, 0, 72, 96); c.fillStyle = '#fff6dc'; c.font = 'bold 40px monospace'; c.fillText('?', 24, 62); }
      const t = document.createElement('div'); const about = ok ? mi.about : 'Profissão ainda não descoberta. Conclua a missão "' + n.title + '" para conhecer.';
      t.innerHTML = '<strong></strong><p class="st"></p><p class="ab"></p>'; t.children[0].textContent = ok ? n.job : 'A descobrir'; t.children[1].textContent = ok ? '★ Descoberta — ' + n.name : 'Missão ' + n.id; t.children[2].textContent = about;
      li.append(cv, t); mural.appendChild(li); });
    $('prog-final').hidden = st.length < 12;
    $('progress').hidden = false; $('prog-back').focus();
  },
  closeProgress() {
    $('progress').hidden = true; const s = this.scene;
    if (this.progFrom === 'menu') { $('menu').hidden = false; $('btn-progress').focus(); }
    else if (this.progFrom === 'final') { $('final').hidden = false; $('final-continue').focus(); }
    else if (this.progWasRunning && s && s.scene) { s.scene.resume(); if (window.game && window.game.canvas) window.game.canvas.focus(); }
  },
  checkFinal() { if (Save.data.stars.length >= 12 && !Save.data.finalShown) this.showFinal(); },
  showFinal() {
    const s = this.scene; if (s && s.scene && !s.scene.isPaused()) { if (s.input && s.input.keyboard) s.input.keyboard.resetKeys(); s.scene.pause(); }
    $('final-stars').textContent = '★ '.repeat(12).trim(); $('final-stars').setAttribute('aria-label', '12 de 12 estrelas');
    $('final').hidden = false; $('final-continue').focus();
  },
  togglePause() {
    const m = $('menu'), s = this.scene; if (!s) return;
    if (m.hidden === false) {
      this.resume();
    } else {
      if (s.scene) s.scene.pause();
      m.hidden = false;
      $('btn-play').textContent = 'Continuar';
      $('btn-play').focus();
    }
  },
  resume() {
    $('menu').hidden = true;
    $('settings').hidden = true;
    const s = this.scene;
    if (s && s.scene) {
      s.scene.resume();
      if (s.input && s.input.keyboard) {
        s.input.keyboard.resetKeys();
      }
    }
    if (window.game && window.game.canvas) {
      window.game.canvas.focus();
    }
  }
};

Save.load();
window.game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', backgroundColor: '#1d2547', pixelArt: true,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, WorldScene]
});

let autoPauseTimer = null;
$('btn-play').onclick = () => {
  if (autoPauseTimer) {
    clearInterval(autoPauseTimer);
    autoPauseTimer = null;
  }
  if (Music.enabled() && !Music.playing) {
    Music.start();
  }
  window.UI.resume();
  $('top-bar').hidden = false;
  $('hint').hidden = false;
};
$('btn-pause').onclick = () => window.UI.togglePause();
$('btn-settings').onclick = () => { $('settings').hidden = false; $('menu').hidden = true; $('opt-contrast').focus(); };
$('set-back').onclick = () => { $('settings').hidden = true; $('menu').hidden = false; $('btn-settings').focus(); };
$('btn-reset').onclick = () => { if (confirm('Apagar todo o progresso salvo?')) { Save.reset(); location.reload(); } };

// Opções de acessibilidade
[['opt-contrast','contrast'],['opt-bigfont','bigfont'],['opt-calm','calm']].forEach(([id, k]) => {
  $(id).checked = Save.data.settings[k];
  $(id).onchange = e => { Save.data.settings[k] = e.target.checked; Save.save(); Save.applySettings(); };
});

// Controles de áudio e música (Configurações)
$('opt-music').checked = Save.data.settings.music !== false;
$('opt-music').onchange = e => {
  Save.data.settings.music = e.target.checked;
  Save.save();
  e.target.checked ? Music.start() : Music.stop();
  Music.updateUI();
  window.UI.showToast(e.target.checked ? '🔊 Som ativado' : '🔇 Mudo ativado');
};

const selTrack = $('select-track');
if (selTrack) {
  selTrack.value = String(Music.getTrackIndex());
  selTrack.onchange = e => {
    const idx = parseInt(e.target.value, 10);
    const t = Music.setTrack(idx);
    window.UI.showToast('🎵 ' + t.name);
  };
}

// Botões no Menu Principal
const btnTrackMenu = $('btn-track-menu');
if (btnTrackMenu) {
  btnTrackMenu.onclick = () => {
    const t = Music.nextTrack();
    window.UI.showToast('🎵 ' + t.name);
  };
}
const btnMuteMenu = $('btn-mute-menu');
if (btnMuteMenu) {
  btnMuteMenu.onclick = () => {
    const enabled = Music.toggleMute();
    window.UI.showToast(enabled ? '🔊 Som ativado' : '🔇 Mudo ativado');
  };
}

// Botões no HUD superior
$('btn-mute-hud').onclick = () => {
  const enabled = Music.toggleMute();
  window.UI.showToast(enabled ? '🔊 Som ativado' : '🔇 Mudo ativado');
};

$('btn-track-hud').onclick = () => {
  const t = Music.nextTrack();
  window.UI.showToast('🎵 ' + t.name);
};

// Funções de atalho com debounce
let lastKeyAction = 0;
window.handleMuteShortcut = function() {
  const now = Date.now();
  if (now - lastKeyAction < 200) return;
  lastKeyAction = now;
  const enabled = Music.toggleMute();
  window.UI.showToast(enabled ? '🔊 Som ativado' : '🔇 Mudo ativado');
};

window.handleTrackShortcut = function() {
  const now = Date.now();
  if (now - lastKeyAction < 200) return;
  lastKeyAction = now;
  const t = Music.nextTrack();
  window.UI.showToast('🎵 ' + t.name);
};

// Teclado global na fase de captura (window, capture: true)
window.addEventListener('keydown', e => {
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
  const isTextInput = tag === 'TEXTAREA' || (tag === 'INPUT' && e.target.type !== 'checkbox' && e.target.type !== 'radio');
  if (isTextInput) return;

  if (e.key === 'Escape' && !$('settings').hidden) {
    $('set-back').click();
    return;
  }

  // Tecla M para Mudo
  if (e.key === 'm' || e.key === 'M' || e.code === 'KeyM' || e.keyCode === 77) {
    e.preventDefault();
    window.handleMuteShortcut();
  }
  // Tecla T para Trocar Música
  else if (e.key === 't' || e.key === 'T' || e.code === 'KeyT' || e.keyCode === 84) {
    e.preventDefault();
    window.handleTrackShortcut();
  }
}, true);

// Suporte de movimentação pelo teclado via Input (WASD e Setas)
window.addEventListener('keydown', e => {
  if ($('menu') && !$('menu').hidden) return;
  if ($('dialog') && !$('dialog').hidden) return;
  const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  const k = (e.key || '').toLowerCase();
  if (k === 'w' || e.key === 'ArrowUp') Input.up = true;
  if (k === 's' || e.key === 'ArrowDown') Input.down = true;
  if (k === 'a' || e.key === 'ArrowLeft') Input.left = true;
  if (k === 'd' || e.key === 'ArrowRight') Input.right = true;
  if (k === 'e' || e.key === ' ') Input.act = true;
});

window.addEventListener('keyup', e => {
  const k = (e.key || '').toLowerCase();
  if (k === 'w' || e.key === 'ArrowUp') Input.up = false;
  if (k === 's' || e.key === 'ArrowDown') Input.down = false;
  if (k === 'a' || e.key === 'ArrowLeft') Input.left = false;
  if (k === 'd' || e.key === 'ArrowRight') Input.right = false;
  if (k === 'e' || e.key === ' ') Input.act = false;
});

window.addEventListener('blur', () => {
  Input.up = Input.down = Input.left = Input.right = Input.act = false;
});

// Controles de toque
if (matchMedia('(pointer: coarse)').matches) $('touch').hidden = false;
document.querySelectorAll('.dpad button').forEach(b => {
  const d = b.dataset.d, on = v => e => { e.preventDefault(); Input[d] = v; };
  ['pointerdown'].forEach(t => b.addEventListener(t, on(true)));
  ['pointerup','pointerleave','pointercancel'].forEach(t => b.addEventListener(t, on(false)));
});
$('btn-act').addEventListener('click', () => window.UI.scene && window.UI.scene.interact());

// Pausa automática no menu principal (apenas se o menu ainda estiver aberto)
window.game.events.once('ready', () => {
  autoPauseTimer = setInterval(() => {
    if (window.UI.scene && window.UI.scene.scene && window.UI.scene.scene.isActive()) {
      if ($('menu') && $('menu').hidden === false) {
        window.UI.scene.scene.pause();
      }
      clearInterval(autoPauseTimer);
      autoPauseTimer = null;
    }
  }, 50);
});

// Dica adaptada para mobile
if (matchMedia('(pointer: coarse)').matches) $('hint').textContent = 'Chegue perto de uma pessoa e toque no botão E';
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

// Inicializa estado visual da música
Music.updateUI();

// Progresso, mural e tela final
$('btn-progress').onclick = () => window.UI.openProgress('menu');
$('btn-progress-hud').onclick = () => window.UI.openProgress('hud');
$('prog-back').onclick = () => window.UI.closeProgress();
$('prog-final').onclick = () => { $('progress').hidden = true; window.UI.showFinal(); };
$('final-mural').onclick = () => window.UI.openProgress('final');
$('final-continue').onclick = () => {
  Save.data.finalShown = true; Save.save(); $('final').hidden = true;
  const s = window.UI.scene; if (s && s.scene) { s.scene.resume(); if (window.game && window.game.canvas) window.game.canvas.focus(); }
};
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('progress').hidden) $('prog-back').click(); });
