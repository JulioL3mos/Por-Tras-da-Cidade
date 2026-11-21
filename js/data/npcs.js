// 12 personagens (um por missão). x,y em tiles. As missões completas entram na Etapa 3 (js/data/missions.js).
const REGIONS = [
  { id: 1, name: 'Bairro Residencial' }, { id: 2, name: 'Centro da Cidade' },
  { id: 3, name: 'Escola e Hospital' },  { id: 4, name: 'Área Rural' }
];
const NPCS = [
  { id: 1,  name: 'Dona Cida',   job: 'Gari',               x: 8,  y: 12, color: 0xf4a300, title: 'A rua esquecida' },
  { id: 2,  name: 'Seu Bento',   job: 'Coletor de resíduos',x: 17, y: 13, color: 0x2fa84f, title: 'O lixo desapareceu?' },
  { id: 3,  name: 'Seu Nelson',  job: 'Porteiro',           x: 4,  y: 6,  color: 0x7a5cc7, title: 'Quem cuida da entrada?' },
  { id: 4,  name: 'Dona Rosa',   job: 'Motorista de ônibus',x: 29, y: 14, color: 0xd94a4a, title: 'A cidade precisa se movimentar' },
  { id: 5,  name: 'Téo',         job: 'Entregador',         x: 38, y: 14, color: 0x1fa3b8, title: 'Uma entrega importante' },
  { id: 6,  name: 'Seu Jorge',   job: 'Pedreiro',           x: 44, y: 8,  color: 0xe07a1f, title: 'A construção não pode parar' },
  { id: 7,  name: 'Marta',       job: 'Limpeza escolar',    x: 7,  y: 27, color: 0x2f7ad9, title: 'Hora de preparar a escola' },
  { id: 8,  name: 'Dona Lúcia',  job: 'Merendeira',         x: 15, y: 22, color: 0xd9468f, title: 'O almoço de todos' },
  { id: 9,  name: 'Paulo',       job: 'Limpeza hospitalar', x: 18, y: 32, color: 0x3bb39a, title: 'Um ambiente seguro' },
  { id: 10, name: 'Seu Tião',    job: 'Agricultor',         x: 31, y: 22, color: 0x8a6a2f, title: 'De onde vem a comida?' },
  { id: 11, name: 'Zeca',        job: 'Trabalhador rural',  x: 41, y: 22, color: 0xb5a02a, title: 'Quem trabalha no campo?' },
  { id: 12, name: 'Ana',         job: 'Saneamento',         x: 44, y: 30, color: 0x4a6fa5, title: 'A água que ninguém vê' }
];

// Cada região abre quando as 3 missões da região anterior estão concluídas.
const REGION_MISSIONS = { 1: [1, 2, 3], 2: [4, 5, 6], 3: [7, 8, 9], 4: [10, 11, 12] };
function regionUnlocked(r) { return r === 1 || REGION_MISSIONS[r - 1].every(id => Save.data.stars.includes(id)); }
