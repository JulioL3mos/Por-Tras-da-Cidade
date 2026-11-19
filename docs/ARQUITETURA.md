# Arquitetura — Por Trás da Cidade
```
por-tras-da-cidade/
├─ index.html             # telas DOM (menu, diálogo, config, toque), acessíveis a leitores de tela
├─ css/style.css          # identidade visual, alto contraste, fonte grande, movimento reduzido
├─ js/state.js            # Save (localStorage) + Input compartilhado (teclado/toque)
├─ js/data/npcs.js        # regiões e 12 NPCs   (Etapa 3: missions.js com as 12 missões)
├─ js/scenes/BootScene.js # pixel art gerada por código (placeholders próprios)
├─ js/scenes/WorldScene.js# mapa, colisões, NPCs, região atual
├─ js/main.js             # UI DOM + Phaser.Game
├─ print/                 # (Etapa 7) versão A4 imprimível
└─ docs/                  # arquitetura e metodologias acadêmicas
```
Decisão-chave: menus, diálogos e missões ficam em HTML (não no canvas), garantindo leitor de tela, foco por teclado e botões grandes. O Phaser cuida só do mundo.
Missão = {situação, narrador, pistas[], pergunta, 3 alternativas, dica, feedback, explicação}. Erro → dica + nova tentativa, sem penalidade.
Regiões liberam em sequência 1→2→3→4 (Etapa 5).
Teste local: `python3 -m http.server` na pasta e abrir http://localhost:8000
