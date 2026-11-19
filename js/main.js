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
    const m = MISSIONS[npc.id], dlg = $('dialog'), text = $('dlg-text'), list = $('dlg-clues'), opts = $('dlg-opts'), fb = $('dlg-fb'), ok = $('dlg-ok');
    const close = () => { dlg.hidden = true; onClose(); };
    const clear = () => { list.innerHTML = ''; list.hidden = true; opts.innerHTML = ''; fb.textContent = ''; ok.hidden = false; };
    const next = (label, fn) => { ok.textContent = label; ok.onclick = fn; ok.hidden = false; ok.focus(); };
    $('dlg-name').textContent = npc.name + ' — ' + npc.job + ' | Missão: ' + npc.title;
    dlg.hidden = false;
    const win = () => {
      clear();
      if (!Save.data.stars.includes(npc.id)) { Save.data.stars.push(npc.id); Save.save(); }
      this.announceRegion(); if (this.scene) this.scene.refreshMarks();
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
    const clues = () => {
      clear(); text.textContent = 'Pistas que encontrei:';
      m.clues.forEach(c => { const li = document.createElement('li'); li.textContent = c; list.appendChild(li); }); list.hidden = false;
      next('Responder à pergunta', ask);
    };
    if (Save.data.stars.includes(npc.id)) { win(); return; }
    clear(); text.textContent = m.situation; next('Investigar pistas', clues);
  },
  togglePause() {
    const m = $('menu'), s = this.scene; if (!s) return;
    if (m.hidden === false) { this.resume(); } else { s.scene.pause(); m.hidden = false; $('btn-play').textContent = 'Continuar'; $('btn-play').focus(); }
  },
  resume() { $('menu').hidden = true; $('settings').hidden = true; if (this.scene) this.scene.resume(); }
};

Save.load();
const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game', backgroundColor: '#1d2547', pixelArt: true,
  scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, WorldScene]
});

$('btn-play').onclick = () => {
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
$('btn-reset').onclick = () => { if (confirm('Apagar todo o progresso salvo?')) { Save.reset(); alert('Progresso apagado.'); } };

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

// Controles de toque
if (matchMedia('(pointer: coarse)').matches) $('touch').hidden = false;
document.querySelectorAll('.dpad button').forEach(b => {
  const d = b.dataset.d, on = v => e => { e.preventDefault(); Input[d] = v; };
  ['pointerdown'].forEach(t => b.addEventListener(t, on(true)));
  ['pointerup','pointerleave','pointercancel'].forEach(t => b.addEventListener(t, on(false)));
});
$('btn-act').addEventListener('click', () => window.UI.scene && window.UI.scene.interact());

// Pausa automática no menu principal
game.events.once('ready', () => {
  const w = setInterval(() => {
    if (window.UI.scene && window.UI.scene.scene.isActive()) {
      window.UI.scene.scene.pause();
      clearInterval(w);
    }
  }, 50);
});

// Dica adaptada para mobile
if (matchMedia('(pointer: coarse)').matches) $('hint').textContent = 'Chegue perto de uma pessoa e toque no botão E';
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});

// Inicializa estado visual da música
Music.updateUI();
