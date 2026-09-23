// Grupos ipsativos espelhados no teste manual (PDF Jocelaine Rufatto / LAP).
// Cada grupo = 1 linha do manual: 4 adjetivos, ordem fixa [D, I, S, C].
// O respondente ordena 1-4 sem repetir: 4 = mais se parece, 1 = menos se parece.
export const GROUP_COUNT = 10;

function group(id, D, I, S, C) {
  return {
    id,
    options: [
      { code: 'D', text: D },
      { code: 'I', text: I },
      { code: 'S', text: S },
      { code: 'C', text: C }
    ]
  };
}

export const questionGroups = {
  'pt-BR': [
    group('g01', 'DIRECIONADO', 'INFLUENTE', 'ESTÁVEL', 'CUIDADOSO'),
    group('g02', 'CONFIANTE', 'OTIMISTA', 'DECIDIDO', 'CONTIDO'),
    group('g03', 'AVENTUREIRO', 'ENTUSIASMADO', 'PREVISÍVEL', 'LÓGICO'),
    group('g04', 'DECISIVO', 'ABERTO', 'PACIENTE', 'ANALÍTICO'),
    group('g05', 'DESAFIADOR', 'IMPULSIVO', 'EQUILIBRADO', 'PRECISO'),
    group('g06', 'INCANSÁVEL', 'EMOTIVO', 'PROTETOR', 'CONTESTADOR'),
    group('g07', 'COMPETITIVO', 'PERSUASIVO', 'ACOMODADO', 'CURIOSO'),
    group('g08', 'ASSERTIVO', 'FALADOR', 'MODESTO', 'EDUCADO'),
    group('g09', 'EXPERIMENTADOR', 'CHARMOSO', 'FÁCIL DE CONVIVER', 'CONSISTENTE'),
    group('g10', 'RIGOROSO', 'SENSÍVEL', 'SINCERO', 'PERFECCIONISTA')
  ],
  'es-PY': [
    group('g01', 'DIRECTO', 'INFLUYENTE', 'ESTABLE', 'CUIDADOSO'),
    group('g02', 'SEGURO', 'OPTIMISTA', 'DECIDIDO', 'RESERVADO'),
    group('g03', 'AVENTURERO', 'ENTUSIASTA', 'PREVISIBLE', 'LÓGICO'),
    group('g04', 'DECISIVO', 'ABIERTO', 'PACIENTE', 'ANALÍTICO'),
    group('g05', 'DESAFIANTE', 'IMPULSIVO', 'EQUILIBRADO', 'PRECISO'),
    group('g06', 'INCANSABLE', 'EMOTIVO', 'PROTECTOR', 'CUESTIONADOR'),
    group('g07', 'COMPETITIVO', 'PERSUASIVO', 'ACOMODADO', 'CURIOSO'),
    group('g08', 'ASERTIVO', 'HABLADOR', 'MODESTO', 'EDUCADO'),
    group('g09', 'EXPERIMENTADOR', 'CARISMÁTICO', 'FÁCIL DE CONVIVIR', 'CONSISTENTE'),
    group('g10', 'RIGUROSO', 'SENSIBLE', 'SINCERO', 'PERFECCIONISTA')
  ]
};

// Formato canônico: questionGroups. Não há alias legado.

