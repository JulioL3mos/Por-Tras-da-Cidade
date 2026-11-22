# Plano — Novos mini games (rodada de variedade 2)

> **Estado: implementado.** Hospital, merendeira, porteiro, gari e agricultor foram refeitos. A tabela final está no fim do `PLANO-MINIGAMES.md`.

## 1. Onde estamos
Os testes mostraram que o **nível de desafio está bom** e que o foco é **variedade de mecânicas**. Estado atual das 12 missões:

| # | NPC | Mecânica atual | Decisão |
|---|---|---|---|
| 1 | Gari | Percurso de rua (veículo) | **Reformular** (proposta 4.4) |
| 2 | Coletor | Percurso: caminhão | Manter |
| 3 | Porteiro | Puzzle: classificar | **Reformular** (proposta 4.2) |
| 4 | Motorista | Percurso: ônibus | Manter |
| 5 | Entregador | Percurso: moto | Manter |
| 6 | Construção civil | Arrastar peças e ver a creche crescer | Manter |
| 7 | Limpeza escolar | Tocar nas manchas | Manter |
| 8 | Merendeira | Puzzle: selecionar | **Reformular** (proposta 4.5) |
| 9 | Limpeza hospitalar | Tocar nos germes | **Reformular** (proposta 4.1) |
| 10 | Agricultor | Puzzle: ordenar | **Reformular** (proposta 4.3) |
| 11 | Trabalhador rural | Horta com plantas que crescem | Manter |
| 12 | Saneamento | Conectar canos | Manter |

## 2. Regras que continuam valendo
- Desafio de verdade, sem punição pesada: **errou, recomeça** aquele mini game (nunca perde estrela nem outras missões).
- Sem tempo limite que force a derrota; botão **"Pular desafio"** depois de 3 erros.
- Funciona com **mouse, toque e teclado** (arrastar sempre tem alternativa por clique ou teclado).
- Mensagens escritas para leitor de tela; modo calmo ("Reduzir animações") deixa tudo mais devagar.
- Cada erro explica **por quê**, para ensinar a profissão.

## 3. Ordem de trabalho sugerida
1. **Hospital** (ideia sua, escopo menor e já definido).
2. **Merendeira** (reaproveita o arrastar da obra, então sai mais rápido).
3. **Porteiro** (o mais fraco hoje).
4. **Gari** (confirmar a proposta).
5. **Agricultor** (o maior, fica por último).

## 4. Propostas

### 4.1 Limpeza hospitalar — "Descarte certo" (esteira de resíduos)
**Ideia:** triar o lixo do hospital. Cada tipo vai para a lixeira certa.
- **Como joga:** os itens passam numa esteira. Você escolhe a lixeira de cada um: **clicando ou tocando na lixeira**, com as teclas **1 a 4**, ou arrastando o item até ela.
- **Lixeiras (versão simplificada):**
  1. **Caixa rígida amarela:** seringas, agulhas e lâminas usadas (cortam e furam).
  2. **Saco branco (infectante):** gaze, luvas e curativos com sangue.
  3. **Reciclável:** papel, papelão e plástico limpos.
  4. **Lixo comum:** restos de comida e papel de copa.
- **Desafio:** 12 itens; a esteira acelera aos poucos. Item na lixeira errada, ou que chega ao fim da esteira sem escolha, recomeça. A mensagem explica: "Seringa vai na caixa amarela porque pode ferir quem recolhe o lixo".
- **Não depender de cor:** cada lixeira tem nome escrito e um desenho próprio.
- **Alternativa B (se preferir):** o Paulo anda pela sala, pega cada item e leva até a lixeira (movimento, como a horta). É mais lento de jogar no celular. **Recomendo a esteira.**
- **Cuidado:** os critérios de descarte devem ser conferidos numa fonte oficial (por exemplo, as normas da Anvisa para resíduos de serviços de saúde) antes da apresentação.
- **Esforço:** médio.

### 4.5 Merendeira — "Monte o prato" (arrastar ingredientes)
**Ideia:** no mesmo estilo visual da obra. A Dona Lúcia tem o prato em cima e os ingredientes embaixo; você **monta o prato** arrastando (ou clicando, ou com Tab e Enter) e a comida vai aparecendo no prato.
- **Começo (higiene):** antes de cozinhar, vestir a **touca** e o **avental** e lavar as mãos. Isso reforça o cuidado de higiene que aparece nas pistas da missão.
- **Os alunos:** 3 alunos chegam à fila, cada um com um balão dizendo o que precisa. Para cada um você monta um prato:
  1. Um aluno sem restrição: prato **equilibrado**.
  2. Um aluno com **alergia a ovo**.
  3. Um aluno **vegetariano** (ou sem leite).
- **Regra do prato equilibrado:** 1 carboidrato (arroz, macarrão, batata ou pão), 1 leguminosa (feijão), 1 proteína, 1 vegetal (salada, cenoura ou brócolis) e 1 fruta. A bebida pode ser suco ou água.
- **Ingredientes na bandeja (cerca de 14):** arroz, macarrão, feijão, frango grelhado, carne moída, omelete, ovo cozido, bolo com ovo, salada, cenoura, brócolis, banana, laranja e suco. Mais alguns que **não fazem parte da merenda** (refrigerante, salgadinho e doce).
- **Desafio:** colocar ingrediente que o aluno não pode comer (alergia ou restrição), ou algo que não é de merenda, **recomeça aquele prato**, e a mensagem explica o porquê. Esses erros contam para o botão de pular (depois de 3).
- **Visual:** o prato dividido em partes que se preenchem em pixel art, a fila de alunos com balões e a Dona Lúcia ao fundo. Cada ingrediente tem nome escrito, para não depender só da imagem.
- **Ensina:** merendeiras cuidam da higiene, das alergias e da nutrição de centenas de crianças.
- **Esforço:** médio (reaproveita o código de arrastar da obra).

### 4.2 Porteiro — "Quem entra?" (decidir na portaria)
**Ideia:** você é o porteiro e cada visitante chega ao balcão. É um jogo de **observar e decidir**, bem diferente dos outros.
- **Como joga:** uma pessoa chega e diz o que quer ("Vim entregar uma pizza no 21", "Sou amigo do morador do 33", "Moro no 12, esqueci a chave"). Na lateral há a **prancheta do dia**: entregas esperadas, visitas autorizadas e moradores que estão fora. Você escolhe: **Liberar**, **Interfonar para o morador** ou **Não liberar**.
- **Detalhes para observar:** crachá, uniforme, nome na encomenda, apartamento certo. A regra do dia muda a cada rodada ("hoje o 21 está viajando: não libere visitas dele").
- **Desafio:** uma rodada de 6 a 8 pessoas. Liberar quem não devia (ou barrar um morador) soa o alarme e a rodada recomeça, explicando o que passou.
- **Ensina:** o porteiro cuida da segurança e da rotina do prédio, e conhece cada morador.
- **Alternativa:** "Ronda do prédio", andando pelos andares para fechar portas e apagar luzes. É mais parecida com a horta, por isso **recomendo "Quem entra?"**.
- **Esforço:** médio.

### 4.3 Agricultor — "Rotina da fazenda" (4 tarefas encadeadas)
**Ideia:** em vez de ordenar etapas, você **faz** cada etapa, uma depois da outra, e o caminho do tomate ao prato se monta sozinho.
1. **Arar:** arrastar a enxada (dedo, mouse ou setas) para abrir 3 sulcos retos na terra.
2. **Plantar:** tocar nos pontos marcados dos sulcos para colocar as mudas, com o espaçamento certo.
3. **Regar:** segurar o botão para regar e manter a barra de umidade na faixa certa (nem seca, nem encharcada) por alguns segundos.
4. **Colher e levar ao mercado:** arrastar as caixas de tomates maduros para o caminhão (os verdes ficam).
- **Desafio:** errar uma tarefa só repete **aquela tarefa**, não tudo.
- **Entre as tarefas:** um quadro mostra a linha "plantio → cuidado → colheita → transporte → mercado" se completando.
- **Esforço:** grande (quatro mini tarefas). Se faltar tempo, fazer só 3 (arar, regar, colher).

### 4.4 Gari — "Varrer a rua" (arrastar a vassoura)
**Ideia:** o gari trabalha com a vassoura, então a mecânica é **varrer**.
- **Como joga:** arrastar a vassoura (dedo ou mouse; no teclado, setas) para juntar folhas, papéis e latas em montinhos e empurrar até o carrinho.
- **Desafio:** o vento espalha o lixo de novo e pedestres passam; esbarrar espalha o trecho e recomeça aquele trecho.
- **Esforço:** médio a grande (física simples de empurrar).

## 5. Itens técnicos
- Novos arquivos em `js/minigames/`: `triagem.js` (hospital), `prato.js` (merendeira), `portaria.js` (porteiro), `fazenda.js` (agricultor), `varrer.js` (gari).
- Reaproveitar os ajudantes de arrastar e de teclado da obra e da horta.
- Atualizar `js/data/puzzles.js`, `index.html` e `sw.js` a cada novo mini game.
- Quando o hospital for refeito, o tema "hospital" e o tema "campo" saem do `tocar.js`; só o da escola fica.

## 6. Testes de aceite (para cada um)
- Dá para vencer sem errar e dá para errar e tentar de novo.
- O botão de pular aparece e conclui a missão.
- Funciona só com teclado, só com toque e só com mouse.
- Cada erro mostra a explicação.
- Funciona no celular, em retrato e paisagem.
