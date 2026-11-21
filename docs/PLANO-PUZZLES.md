# Plano de ação — Puzzles nas missões de "Por Trás da Cidade"

## 1. Objetivo
Trocar o fluxo "conversar → responder uma pergunta" por **um puzzle curto e simples** em cada missão, mantendo a mensagem educativa. Meta: dar mais dinamismo sem aumentar a dificuldade para crianças de 8 a 12 anos.

## 2. Regras de design (valem para todos os puzzles)
- **Sem cronômetro e sem exigir reflexo.** O jogador pode pensar o tempo que quiser.
- **Erro sem punição:** dica clara e nova tentativa. Depois de 2 erros, oferecer "Mostrar uma ajuda" (revela uma peça certa).
- **Acessível:** tudo em HTML (botões grandes, foco por teclado, leitor de tela), nada de arrastar e soltar como única forma. Usar toque/clique e botões "subir/descer".
- **Não depender só de cor ou som.** Cada peça tem texto e ícone/forma.
- **Duração:** de 30 segundos a 2 minutos por puzzle.
- **A explicação da profissão continua** no final. É ela que ensina o tema.
- **Fallback:** se um puzzle falhar, a missão cai na pergunta de múltipla escolha atual.

## 3. Novo fluxo da missão
Situação → Pistas → **Puzzle** → Feedback + explicação da profissão → Estrela ★

## 4. Tipos de puzzle (4 modelos reutilizáveis)
| Tipo | Como funciona | Interação acessível |
|---|---|---|
| **Ordenar** | Colocar de 4 a 5 etapas na ordem certa | Botões "subir/descer" em cada item |
| **Associar** | Ligar itens da coluna A com a coluna B | Escolher um item e depois seu par |
| **Classificar** | Colocar itens em 2 ou 3 grupos | Botões de grupo em cada item |
| **Selecionar** | Marcar os itens certos de uma lista (ex.: o que respeita uma regra) | Caixas de seleção grandes |

Quatro modelos reaproveitados cobrem as 12 missões e reduzem muito o trabalho.

## 5. Puzzle por NPC
| # | NPC / profissão | Puzzle | Tipo |
|---|---|---|---|
| 1 | Gari | Separar o que vai para o lixo, para a reciclagem ou para fora do bueiro | Classificar |
| 2 | Coletor | Ordenar o caminho do lixo, da calçada ao aterro/reciclagem | Ordenar |
| 3 | Porteiro | Decidir o que fazer com 4 visitantes (liberar, avisar o morador, pedir identificação) | Classificar |
| 4 | Motorista | Levar cada passageiro à parada certa (escola, posto, fábrica) | Associar |
| 5 | Entregador | Combinar cada encomenda com o endereço certo | Associar |
| 6 | Construção civil | Ordenar as etapas da obra (fundação, paredes, fiação, pintura) | Ordenar |
| 7 | Limpeza escolar | Marcar o que precisa ser limpo antes da aula | Selecionar |
| 8 | Merendeira | Montar a bandeja respeitando alergias e equilíbrio | Selecionar |
| 9 | Limpeza hospitalar | Combinar cada tipo de resíduo com a lixeira certa | Associar |
| 10 | Agricultor | Ordenar o ciclo do tomate, do plantio ao prato | Ordenar |
| 11 | Trabalhador rural | Combinar ferramenta e tarefa no campo | Associar |
| 12 | Saneamento | Ordenar as etapas do tratamento da água | Ordenar |

## 6. Estrutura técnica
- `js/puzzles/` com um arquivo por tipo: `ordenar.js`, `associar.js`, `classificar.js`, `selecionar.js`.
- Cada puzzle recebe uma configuração, por exemplo `{ type: 'ordenar', itens: [...], ordemCorreta: [...] }`.
- Adicionar o campo `puzzle` em cada missão de `js/data/missions.js`.
- Uma função comum, `abrirPuzzle(config, aoConcluir)`, é chamada pelo diálogo.
- O `main.js` decide: se a missão tem `puzzle`, abre o puzzle; senão, usa a pergunta.
- Registrar os novos arquivos no `index.html` e no `sw.js` (cache offline).

## 7. Etapas de trabalho
1. **Ler o repositório atual** (mudanças do grupo: músicas, menu, correções) e ajustar este plano ao código real.
2. **Criar a base** (`abrirPuzzle` + estilos) e o tipo **Ordenar**, aplicado às missões 2, 6, 10 e 12.
3. **Associar**, aplicado às missões 4, 5, 9 e 11.
4. **Classificar**, aplicado às missões 1 e 3.
5. **Selecionar**, aplicado às missões 7 e 8.
6. **Acessibilidade e celular:** testar teclado, leitor de tela, alto contraste, fonte grande e toque.
7. **Textos e dicas:** revisar a linguagem e as dicas de cada puzzle.

## 8. Testes de aceite
- Todos os 12 puzzles podem ser concluídos só com teclado e só com toque.
- Errar nunca bloqueia: sempre há dica e nova tentativa.
- A estrela é salva só ao concluir o puzzle.
- Cada missão ainda mostra a explicação da profissão no final.
- Funciona em celular, em modo paisagem e retrato.

## 9. Riscos e cuidados
- **Escopo:** manter os puzzles simples. Se o tempo apertar, fazer só os tipos Ordenar e Associar (8 de 12 missões).
- **Conflito de arquivos:** como o grupo já alterou menu e músicas, trabalhar sobre a versão atual do repositório.
- **Conteúdo educativo:** cada puzzle deve ensinar algo sobre a profissão, não só entreter.
