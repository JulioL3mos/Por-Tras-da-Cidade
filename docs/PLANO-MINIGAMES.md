# Plano de ação — Mini games em "Por Trás da Cidade"

## 1. Objetivo
Trocar parte dos puzzles por **mini games jogáveis**, em que a criança faz o trabalho da profissão (dirigir, varrer, colher, limpar). O mini game da moto do entregador já está pronto e serve de modelo para os demais.

## 2. Regras de design (valem para todos)
- **Desafio de verdade, sem punição pesada:** bateu ou errou, **volta ao início** do mini game e tenta de novo, quantas vezes quiser. Nunca perde estrela, nem outras missões.
- **Sem tempo limite e sem "game over".** O desafio é acertar o percurso, não correr contra o relógio.
- **Dinâmico:** velocidade crescente, obstáculos variados e alguns em movimento (carros lentos, pedestres atravessando).
- **Ajuda discreta:** depois de várias tentativas o jogo fica um pouco mais lento.
- **Botão "Pular desafio"** aparece depois de 3 tentativas, para quem tiver dificuldade. Pular conclui a missão.
- **Modo calmo:** com a opção "Reduzir animações" ligada, o mini game roda mais devagar e sem efeitos piscando.
- **Controles:** teclado (setas ou WASD) e botões grandes na tela para o celular. Botão de pausa em todos.
- **Duração:** de 1 a 3 minutos por mini game.
- **Feedback e explicação:** mensagens escritas durante o jogo (leitor de tela) e a explicação da profissão no final, como hoje.
- **Fallback:** se um mini game falhar ao carregar, a missão cai no puzzle atual.

## 2.1 Regras do modelo A (percurso)
- **Bateu, volta ao início.** Itens já recolhidos e paradas já feitas continuam valendo.
- **Itens obrigatórios:** quem passar direto por uma parada ou por lixo é levado um pouco para trás, para voltar e fazer direito.
- **Percurso justo:** sempre sobra uma faixa livre, e há mais espaço entre obstáculos para veículos grandes (ônibus e caminhão).
- **Pular desafio:** aparece depois de 3 batidas ou 4 retornos.

## 3. Fluxo da missão
Situação → Pistas → **Mini game** → Feedback + explicação da profissão → Estrela ★

## 4. Modelos de mini game
| Modelo | Como funciona | Reaproveita |
|---|---|---|
| **A. Percurso** | Um veículo ou personagem anda por uma rua vista de cima; você troca de faixa, freia e acelera | O código da moto (já pronto) |
| **B. Conectar canos** | Girar peças de cano até a água ir da represa às casas | Novo |
| **C. Tocar para limpar ou colher** | Tocar nos itens certos (manchas, frutas maduras) e deixar os errados | Novo |

## 5. Proposta para os 12 NPCs
| # | NPC / profissão | Tipo | Ideia | Estado |
|---|---|---|---|---|
| 1 | Gari | Mini game A | Recolher 12 lixos na rua, desviando de pedestres, bicicletas e cones | **Pronto** |
| 2 | Coletor | Mini game A | Dirigir o caminhão e recolher 8 sacos perto das calçadas | **Pronto** |
| 3 | Porteiro | Puzzle (classificar) | Decidir o que fazer com cada visitante | Pronto |
| 4 | Motorista | Mini game A | Fazer o trajeto do ônibus e parar nas 3 paradas (faixa de baixo, segurando ◀) | **Pronto** |
| 5 | Entregador | Mini game A | Moto até a casa do Seu Antônio; bateu, volta ao início | **Pronto** |
| 6 | Construção civil | Mini game: arrastar peças | Arrastar fundação, paredes, telhado etc. para o terreno e ver a creche crescer; há peças que não pertencem | **Pronto (novo)** |
| 7 | Limpeza escolar | Mini game C | Tocar nas manchas das carteiras; mochilas e cadernos recomeçam | **Pronto** |
| 8 | Merendeira | Puzzle (selecionar) | Montar a bandeja de um aluno com alergia | Pronto |
| 9 | Limpeza hospitalar | Mini game C | Eliminar germes (alguns com 2 toques); objetos de pacientes recomeçam | **Pronto** |
| 10 | Agricultor | Puzzle (ordenar) | Caminho do tomate, do plantio ao prato | Pronto |
| 11 | Trabalhador rural | Mini game: horta | Andar pelas fileiras e colher tomates só quando estiverem prontos; colher cedo recomeça | **Pronto (novo)** |
| 12 | Saneamento | Mini game B | Girar canos a tempo; cano que a água passou trava; se vazar, tenta de novo | **Pronto** |

Total: **8 mini games, todos prontos** e **4 puzzles** que continuam como estão.

## 6. Estrutura técnica
- Cada mini game fica em `js/minigames/` e segue a mesma assinatura da moto: `Minigames.nome(root, config, aoConcluir, avisar)`.
- A configuração de cada missão fica em `js/data/puzzles.js`, com `type` igual ao nome do mini game e a `dica`.
- `js/puzzles/puzzles.js` encaminha para o mini game certo ou para o puzzle.
- **Primeira tarefa:** separar o código da moto em um "motor de percurso" que aceite configuração (veículo, obstáculos, itens a coletar, paradas). Assim ônibus, caminhão e gari saem quase de graça.
- Gráficos desenhados por código (pixel art própria), sem arquivos de imagem.
- Registrar cada arquivo novo no `index.html` e no `sw.js` (cache offline).

## 7. Etapas de trabalho
1. ~~**Motor de percurso:** generalizar a moto (veículos, coletáveis e paradas).~~ **Feito** (`js/minigames/percurso.js`).
2. ~~**Ônibus** (missão 4).~~ **Feito.**
3. ~~**Caminhão do coletor** (2) e **gari** (1).~~ **Feito.**
4. ~~**Modelo C, tocar para limpar ou colher** (7, 9 e 11).~~ **Feito** (`js/minigames/tocar.js`).
5. ~~**Modelo B, conectar canos** (12).~~ **Feito** (`js/minigames/canos.js`).
6. **Ajustes:** dificuldade, textos, modo calmo, celular e leitor de tela.

## 8. Testes de aceite
- Cada mini game tem solução possível (testada com um robô que desvia) e o botão de pular libera quem não conseguir.
- O botão "Pular desafio" aparece e conclui a missão.
- Funciona só com teclado e só com toque.
- Pausa funciona em qualquer momento.
- A estrela é salva ao concluir ou pular.
- Funciona em celular, em modo retrato e paisagem, sem a tela do jogo ficar cortada.

## 9. Riscos e decisões em aberto
- **Escopo:** 7 mini games novos é bastante. Se o tempo apertar, fazer só os do modelo A (1, 2 e 4) e deixar os demais como puzzles.
- **Desempenho em celulares antigos:** manter as telas pequenas e simples.
- **Estrela ao pular:** hoje pular conta como concluído. Decidir se isso continua.
- **Som:** os mini games não têm efeitos sonoros. Decidir se vale adicionar sons simples (batida, coleta).
- **Controle no celular:** os botões ficam na área do diálogo. Testar se cobrem a visão do jogo.

## 10. Progressão (feita junto)
- **Regiões que abrem:** o jogador começa no Bairro Residencial. Cada região só abre quando as 3 missões da anterior estão concluídas (cercas no mapa e aviso na tela).
- **Tela de progresso** (menu ou botão "★ Progresso"): estrelas, missões por região e se está aberta ou fechada.
- **Mural de profissões:** 12 cartas; as profissões descobertas mostram o personagem e a explicação, as outras aparecem como "A descobrir".
- **Tela final:** ao concluir as 12 missões, aparece o título "Guardião de Vila Horizonte" com a mensagem final.

## 11. Rodada de variedade (feedback após os testes)
O nível de desafio ficou bom. O ponto a melhorar é a **variedade de mecânicas**: manter o veículo só no entregador, no ônibus e no coletor, e dar mecânicas próprias aos outros.

| # | NPC | Situação | Proposta |
|---|---|---|---|
| 1 | Gari | A fazer | **Varrer a rua:** arrastar a vassoura (dedo, mouse ou setas) para juntar folhas e papéis em montinhos e empurrar até o carrinho; ventinhos espalham o lixo e pedestres passam (esbarrar espalha o trecho de novo) |
| 6 | Construção civil | **Pronto** | Arrastar as peças e ver a creche crescer |
| 7 | Limpeza escolar | A fazer | **Arrumar a sala:** empurrar as carteiras até as marcações no chão, recolhendo antes as mochilas e objetos que bloqueiam o caminho (quebra-cabeça de empurrar) |
| 9 | Limpeza hospitalar | A fazer | **Esteira de resíduos:** itens passam numa esteira e você manda cada um para a lixeira certa (infectante, cortante, reciclável, comum); errar recomeça |
| 11 | Trabalhador rural | **Pronto** | Horta com plantas que crescem e colheita no ponto certo |

Mecânicas por missão depois desta rodada: percurso (moto, ônibus, caminhão), conectar canos, arrastar peças, horta, e as três novas (varrer, empurrar e triar), além dos puzzles do porteiro, da merendeira e do agricultor.
O mini game de "tocar" (`tocar.js`) sai do jogo quando as missões 7 e 9 forem refeitas.

## 12. Estado após a rodada de variedade 2 (tudo implementado)
| # | NPC | Mecânica | Arquivo |
|---|---|---|---|
| 1 | Gari | Varrer a rua: arrastar a vassoura até o contêiner, com vento e pedestres | `varrer.js` |
| 2 | Coletor | Percurso: caminhão recolhendo sacos | `percurso.js` |
| 3 | Porteiro | "Quem entra?": ler a prancheta e decidir | `portaria.js` |
| 4 | Motorista | Percurso: ônibus parando nas paradas | `percurso.js` |
| 5 | Entregador | Percurso: moto | `percurso.js` |
| 6 | Construção civil | Arrastar peças e ver a creche crescer | `obra.js` |
| 7 | Limpeza escolar | Tocar nas manchas das carteiras | `tocar.js` |
| 8 | Merendeira | Higiene e montar o prato de 3 alunos | `prato.js` |
| 9 | Limpeza hospitalar | Esteira de resíduos: escolher a lixeira | `triagem.js` |
| 10 | Agricultor | Rotina da fazenda: arar, plantar, regar e carregar | `fazenda.js` |
| 11 | Trabalhador rural | Horta com plantas que crescem | `horta.js` |
| 12 | Saneamento | Conectar canos | `canos.js` |

Observações: o `tocar.js` mantém só o uso da escola; o código dos temas "hospital" e "campo" e o veículo "gari" do `percurso.js` ficaram sem uso e podem ser removidos numa limpeza futura. Os puzzles em `js/puzzles/puzzles.js` (ordenar, associar, classificar e selecionar) ficaram como reserva.
