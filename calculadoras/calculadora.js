// main.js - Core Logic for Health Calculators & Test Wizard

// Google Sheets Web App URL (Insira sua URL do script do Google Apps Script aqui)
const GOOGLE_SHEET_URL = "";

// Global State
let currentTest = null;
let currentStep = 0;
let answers = [];
let testQuestions = [];
let calculatedScore = null;

// Options for Pure Procrastination Scale (PPS)
const ppsOptions = [
    { text: 'Nunca', value: 1 },
    { text: 'Raramente', value: 2 },
    { text: 'Às vezes', value: 3 },
    { text: 'Frequentemente', value: 4 },
    { text: 'Sempre', value: 5 }
];

// Questions Database
const testsDatabase = {
    'pps': {
        title: 'Escala de Procrastinação Pura (PPS)',
        category: 'Comportamental',
        maxScore: 60,
        loadingTitle: 'Analisando Padrão Comportamental...',
        loadingSubtitle: 'Processando suas respostas sobre foco, tomada de decisão e consistência.',
        methodologyTitle: 'Sobre a Escala de Procrastinação Pura (PPS)',
        methodologyText: `
            <p>A Escala de Procrastinação Pura (PPS) é um instrumento psicológico desenvolvido para medir a tendência geral de procrastinação comportamental em adultos. Criada pelo pesquisador canadense Piers Steel em 2010, a escala combina itens de medidas anteriores de procrastinação em um formato mais conciso e validado empiricamente. É amplamente utilizada em pesquisas sobre autorregulação, desempenho acadêmico e produtividade.</p>
            <p class="mt-2">A escala avalia o domínio da procrastinação comportamental e decisional com base em 12 declarações autodeclaradas.</p>
            <p class="mt-2">A pontuação final é obtida pela soma das respostas de todos os itens, variando de 12 a 60 pontos:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Baixa Procrastinação (12 a 21 pontos):</strong> Executores consistentes com alta autorregulação e foco.</li>
                <li><strong>Procrastinação Moderada Leve (22 a 31 pontos):</strong> Pequenos desvios de foco, facilmente corrigíveis com hábitos de entrada.</li>
                <li><strong>Procrastinação Moderada (32 a 41 pontos):</strong> Conflito inicial entre sistema límbico e córtex pré-frontal, exigindo controle de distrações.</li>
                <li><strong>Procrastinação Elevada (42 a 51 pontos):</strong> Dificuldade acentuada na conversão de intenções em ações, necessitando fricção ambiental.</li>
                <li><strong>Procrastinação Crônica (52 a 60 pontos):</strong> Alto risco de improdutividade estrutural e esgotamento mental.</li>
            </ul>
        `,
        questions: [
            { text: 'Eu atraso tarefas além do que seria razoável', options: ppsOptions },
            { text: 'Eu deixo tarefas importantes para a última hora', options: ppsOptions },
            { text: 'Eu começo tarefas tarde demais', options: ppsOptions },
            { text: 'Eu não consigo começar tarefas quando deveria', options: ppsOptions },
            { text: 'Eu frequentemente me arrependo de ter procrastinado', options: ppsOptions },
            { text: 'Eu deixo tarefas importantes sem terminar', options: ppsOptions },
            { text: 'Eu passo tempo demais pensando antes de agir', options: ppsOptions },
            { text: 'Eu evito iniciar tarefas difíceis', options: ppsOptions },
            { text: 'Eu adio decisões importantes', options: ppsOptions },
            { text: 'Eu tenho dificuldade em manter consistência nas tarefas', options: ppsOptions },
            { text: 'Eu começo tarefas, mas não consigo finalizá-las', options: ppsOptions },
            { text: 'Eu troco tarefas importantes por atividades mais fáceis', options: ppsOptions }
        ]
    },
    'fadiga-adrenal': {
        title: 'Avaliação de Fadiga Adrenal',
        category: 'Hormonal',
        maxScore: 32,
        loadingTitle: 'Processando Perfil Biológico...',
        loadingSubtitle: 'Estamos cruzando suas respostas com padrões integrativos de saúde hormonal.',
        methodologyTitle: 'Como funciona a pontuação deste teste?',
        methodologyText: `
            <p>Este questionário baseia-se na escala de sintomas clínicos de sobrecarga de estresse e fadiga biológica. As perguntas avaliam parâmetros-chave do ritmo circadiano, como a curva de energia diária, a qualidade do sono e a dependência de estimulantes.</p>
            <p class="mt-2">A pontuação é dividida de acordo com as fases de resposta ao estresse adaptativo:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Excelente / Equilíbrio (0 a 6 pontos):</strong> Boa resiliência ao estresse, ritmo circadiano e energia equilibrados.</li>
                <li><strong>Alerta Inicial (7 a 12 pontos):</strong> Fase de alarme inicial, indicando sobrecarga ativa leve e esforço compensatório do corpo.</li>
                <li><strong>Sobrecarga Moderada (13 a 18 pontos):</strong> Instabilidade de cortisol, fadiga diurna e dependência leve de estimulantes.</li>
                <li><strong>Sobrecarga Acentuada (19 a 24 pontos):</strong> Sinais evidentes de resistência ao estresse, fadiga persistente e sono instável.</li>
                <li><strong>Exaustão / Esgotamento (25 a 32 pontos):</strong> Fase de exaustão, esgotamento das reservas funcionais e fadiga crônica.</li>
            </ul>
        `,
        questions: [
            {
                text: 'Como está o seu nível de energia ao acordar pela manhã?',
                options: [
                    { text: 'Excelente, acordo disposto(a) e sem necessidade de despertador ou café.', value: 0 },
                    { text: 'Moderado, demoro um pouco para "pegar no tranco", mas funciono bem.', value: 1 },
                    { text: 'Difícil, acordo cansado(a) mesmo tendo dormido horas suficientes; preciso de café imediatamente.', value: 3 },
                    { text: 'Exaustão completa, sinto-me pesado(a) e sem forças para sair da cama.', value: 4 }
                ]
            },
            {
                text: 'Como se comporta a sua energia ao longo da tarde (especialmente entre 14h e 17h)?',
                options: [
                    { text: 'Estável e produtiva, sem quedas abruptas.', value: 0 },
                    { text: 'Sinto uma leve sonolência, mas que passa rápido sem interferir.', value: 1 },
                    { text: 'Queda acentuada de energia ("crash"), com forte desejo por doces ou cafeína.', value: 3 },
                    { text: 'Sinto uma letargia profunda, névoa mental (brain fog) e dificuldade extrema de focar.', value: 4 }
                ]
            },
            {
                text: 'Qual é o seu padrão de sono durante a noite?',
                options: [
                    { text: 'Durmo rápido, tenho um sono profundo e contínuo de 7 a 8 horas.', value: 0 },
                    { text: 'Às vezes demoro um pouco para dormir ou acordo uma vez, mas volto a dormir logo.', value: 1 },
                    { text: 'Acordo no meio da noite (geralmente entre 2h e 4h) com a mente acelerada.', value: 3 },
                    { text: 'Exausto(a) o dia todo, mas com pico de agitação e energia à noite (cansado, mas ligado).', value: 4 }
                ]
            },
            {
                text: 'Com que frequência você sente necessidade de estimulantes (café, energéticos, doces) para se concentrar?',
                options: [
                    { text: 'Raramente ou nunca. Consumo apenas por prazer social ou gastronômico.', value: 0 },
                    { text: 'Ocasionalmente, em dias de maior demanda ou noites mal dormidas.', value: 1 },
                    { text: 'Diariamente, preciso de várias xícaras de café ao longo do dia para me manter ativo(a).', value: 3 },
                    { text: 'Constantemente. Sinto que meu cérebro simplesmente não funciona sem café ou açúcar.', value: 4 }
                ]
            },
            {
                text: 'Como seu corpo reage ao estresse emocional ou pressões do dia a dia?',
                options: [
                    { text: 'Lido bem, mantenho a calma e resolvo os problemas com clareza.', value: 0 },
                    { text: 'Fico irritado(a) ou ansioso(a) momentaneamente, mas me recupero rapidamente.', value: 1 },
                    { text: 'Sinto-me sobrecarregado(a) facilmente, com episódios de ansiedade ou palpitações.', value: 3 },
                    { text: 'Incapaz de lidar com qualquer estresse adicional; pequenas tarefas parecem montanhas.', value: 4 }
                ]
            },
            {
                text: 'Você tem sentido desejos intensos por alimentos específicos (salgados ou doces)?',
                options: [
                    { text: 'Não, minha alimentação e apetite são equilibrados ao longo do dia.', value: 0 },
                    { text: 'Às vezes sinto desejo de comer algo doce no fim do dia ou após as refeições.', value: 1 },
                    { text: 'Frequentemente sinto uma necessidade incontrolável de comer doces ou pães.', value: 3 },
                    { text: 'Sinto forte desejo por alimentos bem salgados e sinto fraqueza/tontura se demoro a comer.', value: 4 }
                ]
            },
            {
                text: 'Como está a sua imunidade e recuperação física ultimamente?',
                options: [
                    { text: 'Excelente. Raramente fico doente e me recupero super rápido após exercícios.', value: 0 },
                    { text: 'Normal. Tenho cerca de 1 ou 2 resfriados leves por ano.', value: 1 },
                    { text: 'Demoro muito para me recuperar de resfriados ou treinos; sinto dores musculares frequentes.', value: 3 },
                    { text: 'Fico doente com frequência (infecções recorrentes) e sinto fadiga extrema por dias após esforço leve.', value: 4 }
                ]
            },
            {
                text: 'Como está a clareza da sua mente no dia a dia?',
                options: [
                    { text: 'Excelente. Mente afiada, boa memória e raciocínio rápido.', value: 0 },
                    { text: 'Às vezes esqueço pequenas coisas quando estou sob pressão, mas nada anormal.', value: 1 },
                    { text: 'Sinto episódios frequentes de esquecimento, dificuldade de achar palavras e raciocínio lento.', value: 3 },
                    { text: 'Sinto névoa mental (brain fog) quase constante; dificuldade de foco e de tomar decisões simples.', value: 4 }
                ]
            }
        ]
    },
    'iap': {
        title: 'Índice Aterogênico do Plasma (IAP)',
        category: 'Cardiovascular',
        maxScore: 0.5,
        loadingTitle: 'Calculando Risco Cardiovascular...',
        loadingSubtitle: 'Convertendo os marcadores de Triglicerídeos e HDL para estimar o tamanho das partículas de LDL.',
        methodologyTitle: 'Como funciona a pontuação deste teste?',
        methodologyText: `
            <p>O Índice Aterogênico do Plasma (IAP ou AIP) é uma relação matemática avançada entre os Triglicerídeos e o HDL-Colesterol, calculada através do logaritmo de sua proporção molar: <strong>log10(Triglicerídeos / HDL-C)</strong>.</p>
            <p class="mt-2">Diferente de analisar o colesterol isoladamente, o IAP reflete o diâmetro das partículas de lipoproteínas. Valores elevados de IAP indicam que as partículas de LDL-Colesterol são predominantemente pequenas, densas e altamente propensas à oxidação, o que acelera o acúmulo de placas de gordura (aterogênese) nas artérias.</p>
            <p class="mt-2">A classificação de risco cardiovascular é dividida em:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Excelente / Baixo Risco (menor que 0,10):</strong> Predomínio de partículas de LDL maiores e saudáveis.</li>
                <li><strong>Risco Moderado Leve (de 0,10 a 0,28):</strong> Perfil inicial com tendência a partículas de LDL intermediárias.</li>
                <li><strong>Risco Moderado (de 0,28 a 0,33):</strong> Nível intermediário de alerta, requerendo ajustes preventivos de hábitos.</li>
                <li><strong>Risco Moderado Alto (de 0,33 a 0,38):</strong> Tendência acentuada a partículas de LDL menores e densas.</li>
                <li><strong>Alto Risco (maior que 0,38):</strong> Forte associação com risco cardiovascular, aterosclerose e resistência à insulina.</li>
            </ul>
        `,
        questions: [
            {
                text: 'Insira os valores do seu painel lipídico:',
                type: 'numeric',
                inputs: [
                    { label: 'Triglicerídeos (mg/dL)', id: 'triglycerides', placeholder: 'Ex: 120', min: 10, max: 1000 },
                    { label: 'HDL-Colesterol (mg/dL)', id: 'hdl', placeholder: 'Ex: 50', min: 5, max: 150 }
                ]
            }
        ]
    },
    'tg-hdl': {
        title: 'Relação Triglicerídeos/HDL',
        category: 'Cardiovascular',
        maxScore: 6,
        loadingTitle: 'Calculando Relação TG/HDL...',
        loadingSubtitle: 'Dividindo os níveis de Triglicerídeos pelo HDL-C para analisar a sensibilidade à insulina.',
        methodologyTitle: 'Sobre a Relação Triglicerídeos/HDL',
        methodologyText: `
            <p>A <strong>Relação Triglicerídeos/HDL (TG/HDL)</strong> é calculada dividindo a concentração de Triglicerídeos pelo colesterol HDL, ambos medidos em mg/dL: <strong>Triglicerídeos / HDL</strong>.</p>
            <p class="mt-2">Esta relação é um dos marcadores indiretos mais valiosos na medicina funcional e cardiovascular. Ela correlaciona-se fortemente com a <strong>Resistência à Insulina</strong> (níveis elevados costumam preceder alterações de glicemia e hemoglobina glicada em anos) e com o <strong>Tamanho das Partículas de LDL (Padrão B)</strong>, sugerindo predomínio de LDL pequeno e denso, altamente inflamatório.</p>
            <p class="mt-2">A classificação de referência funcional para a relação é:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Excelente (menor que 1,0):</strong> Risco mínimo, sensibilidade à insulina ideal e perfil lipídico excelente.</li>
                <li><strong>Baixo Risco (de 1,0 a 2,0):</strong> Perfil saudável, bom controle glicêmico e baixo risco metabólico.</li>
                <li><strong>Risco Moderado Leve (de 2,0 a 3,0):</strong> Alerta inicial, indicando início de resistência à insulina periférica.</li>
                <li><strong>Risco Moderado Alto (de 3,0 a 4,0):</strong> Resistência insulínica evidente e presença de partículas de LDL menores e densas.</li>
                <li><strong>Alto Risco (maior que 4,0):</strong> Alta probabilidade de síndrome metabólica e alto risco de eventos cardiovasculares.</li>
            </ul>
        `,
        questions: [
            {
                text: 'Insira os valores do seu painel lipídico:',
                type: 'numeric',
                inputs: [
                    { label: 'Triglicerídeos (mg/dL)', id: 'triglycerides', placeholder: 'Ex: 120', min: 10, max: 1000 },
                    { label: 'HDL-Colesterol (mg/dL)', id: 'hdl', placeholder: 'Ex: 50', min: 5, max: 150 }
                ]
            }
        ]
    },
    'apob-apoa1': {
        title: 'Relação Apo B / Apo A1',
        category: 'Cardiovascular',
        maxScore: 2.0,
        loadingTitle: 'Calculando Relação Apo B / Apo A1...',
        loadingSubtitle: 'Dividindo os níveis de Apolipoproteína B pela Apolipoproteína A1 para avaliar o risco aterogênico.',
        methodologyTitle: 'Sobre a Relação Apo B / Apo A1',
        methodologyText: `
            <p>A <strong>Relação Apo B / Apo A1</strong> é calculada dividindo a concentração de Apolipoproteína B pela de Apolipoproteína A1: <strong>Apo B / Apo A1</strong>. Ambos os marcadores são medidos nas mesmas unidades (geralmente mg/dL ou g/L).</p>
            <p class="mt-2">A <strong>Apolipoproteína B (Apo B)</strong> está presente em todas as lipoproteínas potencialmente aterogênicas (LDL, VLDL, IDL), fornecendo uma estimativa do número total de partículas que podem se acumular nas paredes arteriais. Já a <strong>Apolipoproteína A1 (Apo A1)</strong> é a principal proteína do HDL, responsável pelo transporte reverso do colesterol (retirando o excesso de colesterol dos tecidos e levando ao fígado).</p>
            <p class="mt-2">Esta relação reflete o balanço exato entre as forças que promovem o depósito de placas de gordura (aterogênese) e as que protegem o sistema cardiovascular. Por medir o número de partículas e não apenas a quantidade de colesterol transportada (como faz o exame tradicional de LDL-C), esta relação é um preditor muito mais robusto e precoce do risco de infarto, AVC e complicações vasculares.</p>
            <p class="mt-2">Classificação funcional de risco atualizada:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Excelente (menor que 0,50):</strong> Excelente equilíbrio metabólico e cardiovascular. Risco mínimo de deposição de placas.</li>
                <li><strong>Baixo Risco (de 0,50 a 0,70):</strong> Perfil de lipoproteínas equilibrado e boa proteção vascular.</li>
                <li><strong>Risco Intermediário (de 0,70 a 0,90):</strong> Nível moderado de alerta, indicando necessidade de otimização de hábitos e dieta.</li>
                <li><strong>Alto Risco (maior que 0,90):</strong> Predomínio de partículas aterogênicas sobre as protetoras. Risco cardiovascular aumentado.</li>
                <li><strong>Muito Alto Risco (maior que 1,00):</strong> Desequilíbrio lipídico severo e alta suscetibilidade a eventos cardiovasculares. Requer intervenção clínica ativa.</li>
            </ul>
        `,
        questions: [
            {
                text: 'Insira os valores das suas apolipoproteínas:',
                type: 'numeric',
                inputs: [
                    { label: 'Apolipoproteína B (Apo B)', id: 'apob', placeholder: 'Ex: 85', min: 10, max: 300 },
                    { label: 'Apolipoproteína A1 (Apo A1)', id: 'apoa1', placeholder: 'Ex: 130', min: 10, max: 300 }
                ]
            }
        ]
    }
};

// Results mapping for Adrenal Fatigue (Non-diagnostic, patient-friendly language)
const adrenalResults = [
    {
        min: 0,
        max: 7,
        status: 'Bom Equilíbrio',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Suas respostas indicam uma boa capacidade de adaptação biológica ao estresse cotidiano. Os sinais corporais apontam que seus níveis de energia e ritmo de descanso encontram-se equilibrados.',
        recommendations: [
            'Mantenha sua rotina de sono regular e consistente.',
            'Pratique exercícios físicos moderados para preservar sua resiliência biológica.',
            'Reserve momentos diários para desconexão e descanso mental.'
        ]
    },
    {
        min: 7,
        max: 13,
        status: 'Alerta Inicial',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Sua pontuação sugere sinais de alerta iniciais relacionados à sobrecarga física ou mental. O corpo pode estar trabalhando de forma compensatória para lidar com demandas elevadas recentes, o que costuma gerar pequenas oscilações de energia.',
        recommendations: [
            'Evite o consumo de cafeína ou outros estimulantes após as 14h.',
            'Adote rituais para desligar telas e desacelerar a mente 1 hora antes de dormir.',
            'Considere técnicas integrativas de relaxamento e suporte adaptativo.'
        ]
    },
    {
        min: 13,
        max: 19,
        status: 'Sobrecarga Moderada',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Suas respostas apontam para uma sobrecarga de estresse moderada com instabilidade na regulação energética. É comum sentir cansaço ao acordar e melhora tardia no final do dia, recorrendo frequentemente a café ou doces para manter o foco.',
        recommendations: [
            'Priorize o repouso ativo e reduza a intensidade de treinos muito exauridos.',
            'Assegure o aporte de micronutrientes de suporte como Magnésio, Vitamina C e Complexo B.',
            'Mantenha refeições com intervalos regulares contendo proteínas e gorduras de qualidade.'
        ]
    },
    {
        min: 19,
        max: 25,
        status: 'Sobrecarga Acentuada',
        color: '#f43f5e', // rose-500
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua pontuação sugere uma sobrecarga acentuada e persistente. O corpo demonstra sinais claros de dificuldade de recuperação e resistência ao estresse, afetando a qualidade do sono e a constância da energia diurna.',
        recommendations: [
            'Monitore seus níveis de cortisol salivar ao longo do dia para avaliar o ritmo circadiano.',
            'Evite exercícios extenuantes à noite, priorizando atividades regenerativas.',
            'Evite o uso abusivo de estimulantes e considere chás relaxantes à noite.'
        ]
    },
    {
        min: 25,
        max: 999,
        status: 'Exaustão / Esgotamento',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Sua pontuação indica indícios de sobrecarga acentuada com sinais de fadiga e cansaço persistentes. Quando o organismo é submetido a demandas contínuas de estresse sem descanso adequado, a vitalidade geral e o foco mental podem ser temporariamente comprometidos. Recomenda-se orientação profissional.',
        recommendations: [
            'Consulte um profissional de saúde qualificado para realizar exames de cortisol e marcadores integrativos.',
            'Reduza gradativamente o uso de estimulantes artificiais que apenas mascaram o cansaço do corpo.',
            'Foque no descanso biológico e em um suporte nutricional de recuperação.'
        ]
    }
];

// Results mapping for Atherogenic Index of Plasma (IAP)
const iapResults = [
    {
        min: -999,
        max: 0.10,
        status: 'Excelente / Baixo Risco',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Seu Índice Aterogênico do Plasma (IAP) está na faixa ideal (baixo risco). Isso indica uma proporção saudável e equilibrada entre Triglicerídeos e HDL-C, sugerindo que suas partículas de LDL-Colesterol são predominantemente grandes e flutuantes, apresentando baixo potencial inflamatório e de aderência nas artérias.',
        recommendations: [
            'Mantenha uma dieta limpa, rica em gorduras monoinsaturadas (azeite de oliva extra virgem, abacate, sementes).',
            'Continue praticando atividade física regular para dar suporte metabólico à função do HDL.',
            'Refaça seu painel lipídico anualmente para acompanhamento clínico preventivo.'
        ]
    },
    {
        min: 0.10,
        max: 0.28,
        status: 'Risco Moderado Leve',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Seu IAP aponta para um risco moderado leve. Embora ainda esteja próximo dos limites saudáveis, sugere uma tendência inicial de aumento na proporção de partículas de LDL ligeiramente menores e mais densas, o que merece atenção preventiva precoce.',
        recommendations: [
            'Reduza levemente o consumo de carboidratos refinados e açúcares simples para controlar a trigliceridemia.',
            'Aumente a prática de atividades físicas aeróbicas de intensidade moderada para favorecer o metabolismo lipídico.',
            'Monitore os níveis de Triglicerídeos e HDL a cada 6 meses para avaliar a evolução.'
        ]
    },
    {
        min: 0.28,
        max: 0.33,
        status: 'Risco Moderado',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Seu IAP está em uma faixa de risco moderado. Isto indica um desequilíbrio metabólico intermediário com presença moderada de partículas de LDL menores e mais densas (mais propensas à oxidação). É um excelente momento para intervenções preventivas estruturadas no estilo de vida.',
        recommendations: [
            'Reduza o consumo de açúcares refinados, farinhas e bebidas açucaradas para diminuir os Triglicerídeos.',
            'Incremente exercícios físicos de resistência e treinos aeróbicos (cardio) para otimizar os níveis e a qualidade do HDL.',
            'Considere avaliar outros fatores metabólicos, como a insulina e a glicose de jejum.'
        ]
    },
    {
        min: 0.33,
        max: 0.38,
        status: 'Risco Moderado Alto',
        color: '#f43f5e', // rose-500 (pink-red)
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Seu IAP está classificado como risco moderado alto. Há uma tendência acentuada de predomínio de partículas de LDL pequenas, densas e oxidadas, sinalizando um ambiente favorável à formação de placas arteriais (aterogênese) e possíveis sinais de resistência insulínica.',
        recommendations: [
            'Restrinja carboidratos de alto índice glicêmico e industrializados, priorizando uma alimentação de base integrativa.',
            'Pratique treinos de força (musculação) associados a estímulos cardiovasculares para melhorar a flexibilidade metabólica.',
            'Investigue marcadores avançados como insulina de jejum, hemoglobina glicada e PCR-ultrassensível.'
        ]
    },
    {
        min: 0.38,
        max: 999,
        status: 'Alto Risco',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Seu IAP está elevado (alto risco). Este padrão tem forte associação clínica com a presença de partículas de LDL pequenas e densas, que penetram facilmente na parede das artérias e causam aterogênese. É um forte sinalizador de resistência insulínica acentuada e disfunção metabólica.',
        recommendations: [
            'Consulte um médico integrativo para avaliar marcadores vasculares avançados (como ApoB, PCR-ultrassensível e homocisteína).',
            'Adote uma estratégia nutricional de baixo índice glicêmico (como alimentação Low Carb ou de baixo índice glicêmico) para reduzir a trigliceridemia.',
            'Priorize a melhora da sensibilidade à insulina com atividade física regular e suporte nutricional direcionado.'
        ]
    }
];

// Results mapping for Pure Procrastination Scale (PPS)
const ppsResults = [
    {
        min: 12,
        max: 22,
        status: 'Baixa Procrastinação',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Sua pontuação indica um excelente funcionamento das funções executivas do córtex pré-frontal, com alta capacidade de autorregulação e controle de impulsos. Seu comportamento é altamente alinhado com a Teoria da Motivação Temporal (TMT), onde a utilidade percebida das tarefas supera com consistência as tentações de gratificação imediata.',
        recommendations: [
            'Perfil: Executor Consistente com alta confiabilidade operacional.',
            'Otimização Cognitiva: Continue utilizando o estabelecimento de metas difíceis, porém específicas (Metas SMART) para manter o engajamento dopaminérgico elevado.',
            'Mitigação de Fadiga de Decisão: Proteja sua energia cognitiva automatizando decisões triviais na primeira metade do dia, reservando o córtex pré-frontal para tarefas complexas.',
            'Intenções de Implementação: Para projetos de altíssima complexidade futuros, utilize o planejamento clássico "Se... Então" para prever e neutralizar potenciais obstáculos.'
        ]
    },
    {
        min: 22,
        max: 32,
        status: 'Procrastinação Moderada Leve',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Sua pontuação sugere desvios eventuais de foco e procrastinação ocasional. Costuma ocorrer principalmente diante de tarefas com prazos longos ou menor apelo de interesse imediato. Pequenos ajustes de hábitos e método de início rápido ajudam a manter a consistência.',
        recommendations: [
            'Utilize a técnica de iniciar imediatamente por apenas 5 minutos para vencer a inércia.',
            'Defina prazos intermediários (micro-prazos) para criar senso de urgência saudável.',
            'Monitore e remova pequenas distrações do seu ambiente de trabalho antes de iniciar tarefas importantes.'
        ]
    },
    {
        min: 32,
        max: 42,
        status: 'Procrastinação Moderada',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Seus resultados revelam uma vulnerabilidade transitória na autorregulação, caracterizada por oscilações entre o foco deliberado e a busca por alívio emocional imediato. Cientificamente, isso reflete o clássico sequestro temporário do córtex pré-frontal pelo sistema límbico diante de tarefas tediosas, estressantes ou ambíguas (procrastinação como mecanismo ineficaz de regulação emocional de curto prazo).',
        recommendations: [
            'Perfil: Necessita de ajustes comportamentais e controle ambiental.',
            'Regulação Emocional Antecipada: Reconheça o desconforto inicial da tarefa como uma reação límbica natural. Faça 2 minutos de respiração diafragmática lenta para reduzir a reatividade da amígdala antes de começar.',
            'Micro-passos de Entrada: Reduza a barreira de ativação inicial dividindo a tarefa em frações tão pequenas que a resistência emocional seja nula.',
            'Controle de Estímulos: Reduza a sobrecarga atencional eliminando gatilhos visuais e notificações digitais de distração antes de iniciar blocos de foco.'
        ]
    },
    {
        min: 42,
        max: 52,
        status: 'Procrastinação Elevada',
        color: '#f43f5e', // rose-500
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua pontuação aponta para uma dificuldade acentuada e persistente na conversão de intenções em ações (lacuna intenção-comportamento). Há uma evitação ativa de tarefas complexas que geram ansiedade ou frustração. Do ponto de vista neurobiológico, isso indica uma fadiga crônica das funções executivas, onde o cérebro prioriza sistematicamente a homeostase emocional de curto prazo (alívio imediato) em detrimento dos benefícios futuros (desconto hiperbólico).',
        recommendations: [
            'Perfil: Risco de baixa execução e perdas operacionais.',
            'Regra da Caixa de Foco (5 Minutos): Force-se a iniciar uma tarefa pendente com o acordo neurológico de poder parar após 5 minutos. Isso quebra a inércia cognitiva inicial em mais de 80% das tentativas.',
            'Criação de Barreiras de Fricção: Aumente a distância física dos seus maiores distratores (ex: colocar o celular em outro cômodo). Dificultar o acesso imediato reduz a tomada de decisão impulsiva.',
            'Ancoragem de Hábitos: Associe a tarefa evitada a um hábito diário já consolidado na sua rotina (ex: "Assim que terminar meu café da manhã, abrirei o documento X").'
        ]
    },
    {
        min: 52,
        max: 999,
        status: 'Procrastinação Crônica',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Os resultados indicam um padrão crônico de evitação com forte impacto limitante no seu cotidiano e sofrimento psicológico. Cientificamente, a procrastinação crônica não é um defeito de caráter ou falta de gestão de tempo, mas sim uma disfunção severa na regulação emocional e no processamento dopaminérgico. Este padrão costuma estar correlacionado com fadiga crônica (desregulação do cortisol), ansiedade e paralisia por análise.',
        recommendations: [
            'Perfil: Alto risco de improdutividade estrutural e sobrecarga mental.',
            'Suporte Clínico e Diagnóstico: Recomenda-se realizar uma avaliação integrativa dos seus exames laboratoriais (ritmo de cortisol, hormônios tireoidianos e marcadores de inflamação subclínica) para tratar causas biológicas de fadiga mental.',
            'Foco Único Absoluto (Single-tasking): Abandone listas de tarefas longas. Defina apenas UMA micro-entrega essencial para o dia e execute-a nas primeiras horas da manhã.',
            'Autocompaixão Ativa: O perdão a si mesmo e a redução da culpa atenuam o estresse psicológico que alimenta novas evasões. Substitua a autocrítica punitiva por uma abordagem de resolução pragmática.'
        ]
    }
];

// Results mapping for Triglyceride/HDL Ratio
const tgHdlResults = [
    {
        min: 0,
        max: 1.0,
        status: 'Excelente',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Sua relação Triglicerídeos/HDL está abaixo de 1.0, o que representa uma excelente flexibilidade metabólica e sensibilidade à insulina ideal. O perfil lipídico indica que o transporte de lipoproteínas está altamente eficiente, com risco cardiovascular mínimo.',
        recommendations: [
            'Mantenha seu padrão dietético atual com foco em comida de verdade e baixo teor de açúcares refinados.',
            'Continue a prática de atividades físicas regulares de força e resistência (como musculação e aeróbicos) para sustentar a função otimizada do HDL.',
            'Acompanhe este marcador anualmente junto aos seus exames laboratoriais de rotina.'
        ]
    },
    {
        min: 1.0,
        max: 2.0,
        status: 'Baixo Risco',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Sua relação Triglicerídeos/HDL está entre 1.0 e 2.0, indicando um perfil metabólico saudável e sob controle. A sensibilidade à insulina está preservada e o risco cardiovascular é considerado baixo.',
        recommendations: [
            'Foque em manter uma rotina consistente de exercícios físicos.',
            'Evite o consumo frequente de açúcares simples e alimentos ultraprocessados.',
            'Monitore este marcador anualmente para prevenção continuada.'
        ]
    },
    {
        min: 2.0,
        max: 3.0,
        status: 'Risco Moderado Leve',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Sua relação está entre 2.0 e 3.0. Isto representa uma faixa de alerta intermediária, sugerindo o início de uma resistência à insulina periférica e um desequilíbrio na depuração de triglicerídeos. Há uma probabilidade moderada de presença de partículas de LDL menores e mais propensas à oxidação.',
        recommendations: [
            'Reduza estrategicamente o consumo de carboidratos refinados, doces e bebidas açucaradas de alto índice glicêmico.',
            'Otimize os níveis e a função de HDL adicionando gorduras saudáveis à dieta (como azeite de oliva e abacate) e aumentando a intensidade dos treinos.',
            'Considere realizar exames complementares como glicose, insulina de jejum e hemoglobina glicada.'
        ]
    },
    {
        min: 3.0,
        max: 4.0,
        status: 'Risco Moderado Alto',
        color: '#f43f5e', // rose-500
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua relação está entre 3.0 e 4.0, sinalizando resistência insulínica evidente e provável presença de partículas de LDL pequenas, densas e oxidadas. Há um ambiente favorável à sobrecarga cardiovascular, merecendo intervenção focada no estilo de vida.',
        recommendations: [
            'Reduza significativamente o consumo de farinhas, açúcares e bebidas alcoólicas.',
            'Pratique treinos de força de forma consistente para melhorar a captação de glicose pelo músculo.',
            'Investigue outros marcadores metabólicos de gordura visceral e inflamação.'
        ]
    },
    {
        min: 4.0,
        max: 999,
        status: 'Alto Risco / Resistência à Insulina',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Sua relação está acima de 4.0. Este patamar é fortemente associado a uma resistência insulínica significativa, risco aumentado para síndrome metabólica e predomínio de partículas de LDL pequenas, densas e altamente aterogênicas (Padrão B). Este desequilíbrio metabólico merece atenção ativa e intervenções no estilo de vida.',
        recommendations: [
            'Consulte um profissional de saúde integrativo para avaliar o risco cardiovascular global e investigar síndrome metabólica.',
            'Adote uma abordagem alimentar de baixo carboidrato (Low Carb ou Cetogênica limpa) para reduzir drasticamente a trigliceridemia.',
            'Priorize a melhora da sinalização da insulina através de treinos resistidos direcionados (musculação) e suporte metabólico.'
        ]
    }
];

// Results mapping for Apo B / Apo A1 Ratio
const apobApoa1Results = [
    {
        min: 0,
        max: 0.50,
        status: 'Excelente',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Sua relação Apo B / Apo A1 está abaixo de 0,50, o que é classificado como Excelente. Isso indica uma proporção altamente favorável de partículas protetoras (HDL/Apo A1) em relação às partículas aterogênicas (Apo B). Suas artérias possuem excelente proteção contra o acúmulo de placas de gordura.',
        recommendations: [
            'Mantenha seu estilo de vida ativo e dieta equilibrada para preservar essa excelente proteção cardiovascular.',
            'Continue priorizando fontes de gorduras saudáveis (como azeite de oliva extra virgem e abacate) e atividade física regular.',
            'Refaça seus exames preventivos anualmente para monitorar a estabilidade metabólica.'
        ]
    },
    {
        min: 0.50,
        max: 0.70,
        status: 'Baixo Risco',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Sua relação Apo B / Apo A1 está entre 0,50 e 0,70, indicando Baixo Risco cardiovascular. Sua depuração de colesterol e a quantidade de partículas aterogênicas estão sob bom controle biológico. Seu perfil lipídico apresenta boa resiliência protetora.',
        recommendations: [
            'Mantenha uma rotina consistente de atividade física, combinando treinos de força e cardio.',
            'Foque em uma alimentação com baixo teor de açúcares simples e rica em fibras e antioxidantes.',
            'Acompanhe este marcador regularmente em suas rotinas preventivas.'
        ]
    },
    {
        min: 0.70,
        max: 0.90,
        status: 'Risco Intermediário',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Sua relação Apo B / Apo A1 encontra-se entre 0,70 e 0,90, o que representa um Risco Intermediário. Isso aponta para uma elevação moderada no número de partículas aterogênicas em comparação com as protetoras. É um sinal de alerta de que ajustes de estilo de vida são recomendados para evitar o avanço da aterogênese.',
        recommendations: [
            'Reduza carboidratos de alto índice glicêmico e alimentos ultraprocessados para otimizar os níveis de triglicerídeos e VLDL/LDL.',
            'Aumente a prática de atividades físicas aeróbicas de intensidade moderada a alta para estimular a função do HDL e Apo A1.',
            'Avalie marcadores adicionais de inflamação vascular, como a PCR-ultrassensível (PCR-us).'
        ]
    },
    {
        min: 0.90,
        max: 1.00,
        status: 'Alto Risco',
        color: '#f43f5e', // rose-500 (pink-red)
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua relação Apo B / Apo A1 está acima de 0,90, indicando Alto Risco cardiovascular. O número de partículas aterogênicas carregando Apo B está significativamente elevado em relação às partículas protetoras. Esse padrão favorece o acúmulo e oxidação de lipoproteínas na parede das artérias.',
        recommendations: [
            'Consulte um profissional de saúde integrativo para realizar uma investigação cardiovascular abrangente e avaliar a espessura médio-intimal carotídea.',
            'Adote estratégias nutricionais mais rígidas, como uma dieta com restrição de carboidratos refinados (Low Carb) e rica em antioxidantes.',
            'Trabalhe na otimização de outros fatores de risco relacionados, como gordura visceral e estresse oxidativo.'
        ]
    },
    {
        min: 1.00,
        max: 999,
        status: 'Muito Alto Risco',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Sua relação Apo B / Apo A1 é superior a 1,00, o que configura um Muito Alto Risco cardiovascular. Existe um grave desequilíbrio na proporção de partículas aterogênicas no sangue. A taxa de deposição de gordura nas paredes vasculares supera significativamente a taxa de remoção protetora, requerendo atenção médica e modulação terapêutica ativa.',
        recommendations: [
            'Consulte seu médico especialista para uma análise diagnóstica completa e estruturação de plano terapêutico.',
            'Implemente uma estratégia focada na reversão da resistência à insulina e inflamação sistêmica (fatores que impulsionam o perfil Apo B alto).',
            'Considere o suporte de nutracêuticos específicos ou intervenções sob orientação médica direta para proteger o endotélio vascular.'
        ]
    }
];

// Open a test from the Hub
function openTest(testId) {
    currentTest = testId;
    testQuestions = testsDatabase[testId].questions;
    currentStep = 0;
    answers = [];

    // Update URL parameter
    try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('test', testId);
        window.history.pushState({ testId }, '', newUrl.toString());
    } catch(e) {
        console.error(e);
    }

    // Setup Wizard UI Text
    document.getElementById('test-category').textContent = testsDatabase[testId].title;
    
    // Hide Hub Screen and Show Wizard with GSAP transition
    gsap.to('#hub-screen', {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('hub-screen').classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            const wizard = document.getElementById('test-wizard');
            wizard.classList.remove('hidden');
            
            gsap.fromTo('#test-wizard', 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.4 }
            );
            
            renderStep();
        }
    });
}

// Close Test Wizard and return to Hub
function closeTest() {
    // Remove URL parameter
    try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('test');
        window.history.pushState({}, '', newUrl.toString());
    } catch(e) {
        console.error(e);
    }

    gsap.to('#test-wizard', {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('test-wizard').classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            const hub = document.getElementById('hub-screen');
            hub.classList.remove('hidden');
            
            gsap.fromTo('#hub-screen',
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.4 }
            );
        }
    });
}

// Render the current question step
function renderStep() {
    const question = testQuestions[currentStep];
    const totalSteps = testQuestions.length;

    // Update Counter & Progress Bar
    document.getElementById('step-counter').textContent = `Pergunta ${currentStep + 1} de ${totalSteps}`;
    const progressPercent = ((currentStep) / totalSteps) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercent}%`;

    // Show/Hide Back Button
    const prevBtn = document.getElementById('prev-btn');
    if (currentStep > 0) {
        prevBtn.classList.remove('opacity-0', 'pointer-events-none');
    } else {
        prevBtn.classList.add('opacity-0', 'pointer-events-none');
    }

    // GSAP Animation to transition questions smoothly
    gsap.fromTo('#question-box', 
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" }
    );

    // Set Question Text
    document.getElementById('question-text').textContent = question.text;

    // Set Options/Inputs List
    const optionsBox = document.getElementById('options-box');
    optionsBox.innerHTML = '';

    if (question.type === 'numeric') {
        const wrapper = document.createElement('div');
        wrapper.className = 'space-y-6 text-left';
        
        question.inputs.forEach(input => {
            const container = document.createElement('div');
            container.className = 'flex flex-col gap-1.5';
            
            const savedValue = answers[currentStep] ? answers[currentStep][input.id] : '';
            
            container.innerHTML = `
                <label for="input-${input.id}" class="text-sm font-semibold text-navy leading-none">
                    ${input.label}
                </label>
                <input 
                    type="number" 
                    id="input-${input.id}" 
                    placeholder="${input.placeholder}" 
                    min="${input.min}" 
                    max="${input.max}" 
                    step="any"
                    value="${savedValue !== undefined ? savedValue : ''}"
                    class="w-full px-5 py-4 rounded-xl border border-gray-200 focus:border-blue-medium focus:ring-2 focus:ring-blue-light outline-none font-medium transition-all text-base"
                />
            `;
            wrapper.appendChild(container);
        });

        const actionBtn = document.createElement('button');
        actionBtn.id = 'submit-numeric-btn';
        actionBtn.onclick = () => submitNumericStep();
        actionBtn.className = 'w-full bg-blue-medium hover:bg-opacity-95 text-white font-extrabold py-5 px-6 rounded-xl text-base transition-all shadow-md flex items-center justify-center gap-2 mt-4 hover:shadow-lg active:scale-[0.98] animate-pulse-btn';
        actionBtn.innerHTML = `
            Calcular Resultado
            <i class="ph-bold ph-caret-right"></i>
        `;
        wrapper.appendChild(actionBtn);
        optionsBox.appendChild(wrapper);

        // Auto-focus first input field
        setTimeout(() => {
            const firstInput = document.getElementById(`input-${question.inputs[0].id}`);
            if (firstInput) firstInput.focus();
        }, 150);
    } else {
        question.options.forEach((opt, idx) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'option-btn';
            
            // If this option was previously selected
            if (answers[currentStep] !== undefined && answers[currentStep].index === idx) {
                optionBtn.classList.add('selected');
            }

            optionBtn.onclick = () => selectOption(idx, opt.value);
            
            optionBtn.innerHTML = `
                <div class="option-circle"></div>
                <span>${opt.text}</span>
            `;
            
            optionsBox.appendChild(optionBtn);
        });
    }
}

// Handle Option selection and auto-advancing for choice questions
function selectOption(index, value) {
    // Save answer
    answers[currentStep] = { index, value };

    // Visually highlight selection
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
        if (idx === index) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });

    // Short delay for micro-feedback and auto-advance
    setTimeout(() => {
        nextStep();
    }, 250);
}

// Validate and process input for numeric steps
function submitNumericStep() {
    const question = testQuestions[currentStep];
    const stepAnswers = {};
    let hasError = false;

    question.inputs.forEach(input => {
        const inputEl = document.getElementById(`input-${input.id}`);
        const val = parseFloat(inputEl.value);
        
        if (isNaN(val) || val < input.min || val > input.max) {
            inputEl.classList.add('border-red-500', 'focus:ring-red-100');
            hasError = true;
        } else {
            inputEl.classList.remove('border-red-500', 'focus:ring-red-100');
            stepAnswers[input.id] = val;
        }
    });

    if (hasError) return;

    answers[currentStep] = stepAnswers;
    nextStep();
}

// Move to next step
function nextStep() {
    if (currentStep < testQuestions.length - 1) {
        currentStep++;
        renderStep();
    } else {
        // We reached the end, process results!
        finishTest();
    }
}

// Move to previous step
function prevStep() {
    if (currentStep > 0) {
        currentStep--;
        renderStep();
    }
}

// Finish the test: show loader or registration then display results
function finishTest() {
    // Show final progress
    document.getElementById('progress-bar').style.width = '100%';

    // Calculate results
    if (currentTest === 'iap') {
        const tg = answers[0].triglycerides;
        const hdl = answers[0].hdl;
        const tgMmol = tg / 88.57;
        const hdlMmol = hdl / 38.67;
        calculatedScore = Math.log10(tgMmol / hdlMmol);
    } else if (currentTest === 'tg-hdl') {
        const tg = answers[0].triglycerides;
        const hdl = answers[0].hdl;
        calculatedScore = tg / hdl;
    } else if (currentTest === 'apob-apoa1') {
        const apob = answers[0].apob;
        const apoa1 = answers[0].apoa1;
        calculatedScore = apob / apoa1;
    } else {
        calculatedScore = answers.reduce((acc, curr) => acc + curr.value, 0);
    }

    // Proceed directly to results, bypassing registration
    proceedToResults();
}

// Proceed to results loading and display
function proceedToResults() {
    const testWizard = document.getElementById('test-wizard');
    const regScreen = document.getElementById('registration-screen');
    const screenToHide = !testWizard.classList.contains('hidden') ? '#test-wizard' : '#registration-screen';

    gsap.to(screenToHide, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
            testWizard.classList.add('hidden');
            regScreen.classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            const testData = testsDatabase[currentTest];
            document.getElementById('loading-title').textContent = testData.loadingTitle || 'Processando Perfil Biológico...';
            document.getElementById('loading-subtitle').textContent = testData.loadingSubtitle || '';
            
            const loader = document.getElementById('loading-screen');
            loader.classList.remove('hidden');
            
            gsap.fromTo('#loading-screen', 
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );
            
            setTimeout(() => {
                showResults(calculatedScore);
            }, 1800);
        }
    });
}

// Format phone inputs
function formatPhone(value) {
    if (!value) return value;
    const phone = value.replace(/\D/g, '');
    if (phone.length <= 10) {
        return phone.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    }
    return phone.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

// Handle registration submission
function handleRegistrationSubmit(event) {
    event.preventDefault();

    const nome = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phoneEl = document.getElementById('reg-phone');
    const telefone = phoneEl ? phoneEl.value.trim() : '';
    const idade = document.getElementById('reg-age').value.trim();
    const cidade = document.getElementById('reg-city').value.trim();
    
    let sexo = '';
    const sexRadios = document.getElementsByName('reg-sex');
    sexRadios.forEach(radio => {
        if (radio.checked) sexo = radio.value;
    });

    let hasError = false;
    
    // Name validation (at least 2 words)
    const nameParts = nome.split(/\s+/);
    const errorName = document.getElementById('error-reg-name');
    if (nameParts.length < 2 || nameParts[1].length < 1) {
        document.getElementById('reg-name').classList.add('input-error');
        if (errorName) {
            errorName.textContent = 'Por favor, insira seu nome completo.';
            errorName.classList.remove('hidden');
        }
        hasError = true;
    } else {
        document.getElementById('reg-name').classList.remove('input-error');
        if (errorName) errorName.classList.add('hidden');
    }

    // Phone validation (min 10 digits)
    const rawPhone = telefone.replace(/\D/g, '');
    const errorPhone = document.getElementById('error-reg-phone');
    if (rawPhone.length < 10) {
        document.getElementById('reg-phone').classList.add('input-error');
        if (errorPhone) {
            errorPhone.textContent = 'Insira um telefone válido com DDD.';
            errorPhone.classList.remove('hidden');
        }
        hasError = true;
    } else {
        document.getElementById('reg-phone').classList.remove('input-error');
        if (errorPhone) errorPhone.classList.add('hidden');
    }

    if (hasError) return;

    // Save to LocalStorage
    const userData = { nome, email, telefone, idade, sexo, cidade };
    localStorage.setItem('sisant_user_data', JSON.stringify(userData));
    localStorage.setItem('sisant_user_registered', 'true');
    localStorage.setItem('sisant_user_email', email);

    // Show loading on submit button
    const submitBtn = document.getElementById('reg-submit-btn');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="loader-circle w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block mr-2 align-middle"></div>
        <span>Salvando dados...</span>
    `;

    const testTitle = testsDatabase[currentTest]?.title || currentTest;
    const formattedScore = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1') 
        ? calculatedScore.toFixed(2) 
        : calculatedScore;
    
    const payload = { nome, email, telefone, idade, sexo, cidade, teste: testTitle, resultado: formattedScore };

    sendLeadToGoogleSheets(payload, () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        proceedToResults();
    });
}

// Handle login submission
function handleLoginSubmit(event) {
    event.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const errorEmail = document.getElementById('error-login-email');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('login-email').classList.add('input-error');
        if (errorEmail) {
            errorEmail.textContent = 'Por favor, insira um e-mail válido.';
            errorEmail.classList.remove('hidden');
        }
        return;
    } else {
        document.getElementById('login-email').classList.remove('input-error');
        if (errorEmail) errorEmail.classList.add('hidden');
    }

    localStorage.setItem('sisant_user_registered', 'true');
    localStorage.setItem('sisant_user_email', email);

    const submitBtn = document.getElementById('login-submit-btn');
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <div class="loader-circle w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block mr-2 align-middle"></div>
        <span>Acessando...</span>
    `;

    let nome = 'Usuário Retornante';
    let telefone = '-';
    let idade = '-';
    let sexo = '-';
    let cidade = '-';

    const savedDataStr = localStorage.getItem('sisant_user_data');
    if (savedDataStr) {
        try {
            const savedData = JSON.parse(savedDataStr);
            if (savedData.email === email) {
                nome = savedData.nome || nome;
                telefone = savedData.telefone || telefone;
                idade = savedData.idade || idade;
                sexo = savedData.sexo || sexo;
                cidade = savedData.cidade || cidade;
            }
        } catch(e) {}
    }

    const testTitle = testsDatabase[currentTest]?.title || currentTest;
    const formattedScore = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1') 
        ? calculatedScore.toFixed(2) 
        : calculatedScore;

    const payload = { nome, email, telefone, idade, sexo, cidade, teste: testTitle, resultado: formattedScore };

    sendLeadToGoogleSheets(payload, () => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        proceedToResults();
    });
}

// Toggle between registration and login forms
function toggleRegMode(mode) {
    const regContainer = document.getElementById('reg-mode-container');
    const loginContainer = document.getElementById('login-mode-container');

    if (mode === 'login') {
        gsap.to(regContainer, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            onComplete: () => {
                regContainer.classList.add('hidden');
                loginContainer.classList.remove('hidden');
                gsap.fromTo(loginContainer, 
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.2 }
                );
            }
        });
    } else {
        gsap.to(loginContainer, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            onComplete: () => {
                loginContainer.classList.add('hidden');
                regContainer.classList.remove('hidden');
                gsap.fromTo(regContainer, 
                    { opacity: 0, y: 10 },
                    { opacity: 1, y: 0, duration: 0.2 }
                );
            }
        });
    }
}

// Send Lead Data to Google Sheets Web App
function sendLeadToGoogleSheets(payload, callback) {
    if (!GOOGLE_SHEET_URL) {
        console.warn('GOOGLE_SHEET_URL não configurada. Salvando localmente.');
        if (callback) callback();
        return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        return response.json();
    })
    .then(data => {
        console.log('Lead salvo com sucesso no Google Sheets:', data);
        if (callback) callback();
    })
    .catch(error => {
        clearTimeout(timeoutId);
        console.error('Erro ao salvar no Google Sheets:', error);
        if (callback) callback();
    });
}

// Helper to convert hex to rgba
function hexToRgba(hex, alpha) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})` : hex;
}

// Display results based on final score
function showResults(score) {
    // Find correct result band
    let resultBand;
    if (currentTest === 'iap') {
        resultBand = iapResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = iapResults[iapResults.length - 1];
    } else if (currentTest === 'pps') {
        resultBand = ppsResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = ppsResults[ppsResults.length - 1];
    } else if (currentTest === 'tg-hdl') {
        resultBand = tgHdlResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = tgHdlResults[tgHdlResults.length - 1];
    } else if (currentTest === 'apob-apoa1') {
        resultBand = apobApoa1Results.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = apobApoa1Results[apobApoa1Results.length - 1];
    } else {
        resultBand = adrenalResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = adrenalResults[adrenalResults.length - 1];
    }

    // Setup Results UI Text
    const testData = testsDatabase[currentTest];
    document.getElementById('result-title').textContent = testData.title;

    const displayScore = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1') ? score.toFixed(2) : score;
    document.getElementById('score-display').textContent = displayScore;
    document.getElementById('score-label').textContent = (currentTest === 'iap') ? 'ÍNDICE' : (currentTest === 'tg-hdl' || currentTest === 'apob-apoa1') ? 'RELAÇÃO' : 'PONTOS';
    document.getElementById('status-tag').textContent = resultBand.status;
    document.getElementById('result-interpretation').textContent = resultBand.interpretation;
    
    // Set Status Tag Colors
    const statusTag = document.getElementById('status-tag');
    statusTag.style.backgroundColor = resultBand.color;

    // Set dynamic interpretation box colors (alert-like matching background and border)
    const interpretationBox = document.getElementById('result-interpretation-box');
    if (interpretationBox) {
        interpretationBox.style.backgroundColor = hexToRgba(resultBand.color, 0.06);
        interpretationBox.style.borderColor = hexToRgba(resultBand.color, 0.25);
    }
    
    // Dynamically update gauge fill path and color
    const gaugeFillPath = document.getElementById('gauge-fill-path');
    if (gaugeFillPath) {
        gaugeFillPath.setAttribute('stroke', resultBand.color);
        gaugeFillPath.setAttribute('stroke-dashoffset', '113.1'); // Reset to empty
    }
    
    // Calculate percentage for the SVG gauge
    let percentage;
    if (currentTest === 'iap') {
        let targetAngle;
        if (score < 0.10) {
            // Map [-0.3, 0.10] to [0, 36] degrees
            const minS = -0.3;
            const maxS = 0.10;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 0.28) {
            // Map [0.10, 0.28] to [36, 72] degrees
            const minS = 0.10;
            const maxS = 0.28;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 0.33) {
            // Map [0.28, 0.33] to [72, 108] degrees
            const minS = 0.28;
            const maxS = 0.33;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 0.38) {
            // Map [0.33, 0.38] to [108, 144] degrees
            const minS = 0.33;
            const maxS = 0.38;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            // Map [0.38, 0.69] to [144, 180] degrees
            const minS = 0.38;
            const maxS = 0.69;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'pps') {
        let targetAngle;
        if (score < 22) {
            const minS = 12;
            const maxS = 22;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 32) {
            const minS = 22;
            const maxS = 32;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 42) {
            const minS = 32;
            const maxS = 42;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 52) {
            const minS = 42;
            const maxS = 52;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 52;
            const maxS = 60;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'tg-hdl') {
        let targetAngle;
        if (score < 1.0) {
            const minS = 0.0;
            const maxS = 1.0;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 2.0) {
            const minS = 1.0;
            const maxS = 2.0;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 3.0) {
            const minS = 2.0;
            const maxS = 3.0;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 4.0) {
            const minS = 3.0;
            const maxS = 4.0;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 4.0;
            const maxS = 6.0;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'apob-apoa1') {
        let targetAngle;
        if (score < 0.50) {
            const minS = 0.30;
            const maxS = 0.50;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 0.70) {
            const minS = 0.50;
            const maxS = 0.70;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 0.90) {
            const minS = 0.70;
            const maxS = 0.90;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 1.00) {
            const minS = 0.90;
            const maxS = 1.00;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 1.00;
            const maxS = 1.20;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'fadiga-adrenal') {
        let targetAngle;
        if (score < 7) {
            const minS = 0;
            const maxS = 7;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 13) {
            const minS = 7;
            const maxS = 13;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 19) {
            const minS = 13;
            const maxS = 19;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 25) {
            const minS = 19;
            const maxS = 25;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 25;
            const maxS = 32;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else {
        const maxScore = testsDatabase[currentTest].maxScore;
        percentage = score / maxScore;
    }
    
    const pathLength = 113.1;
    const targetOffset = pathLength - (percentage * pathLength);

    // Render Recommendations
    const recList = document.getElementById('recommendations-list');
    recList.innerHTML = '';
    resultBand.recommendations.forEach(rec => {
        const li = document.createElement('li');
        li.className = 'flex items-start gap-3 text-sm text-gray-600 leading-relaxed';
        li.innerHTML = `
            <i class="ph-bold ph-check text-blue-medium mt-1"></i>
            <span>${rec}</span>
        `;
        recList.appendChild(li);
    });

    // Render Dynamic Methodology Accordion
    document.getElementById('methodology-title').textContent = testData.methodologyTitle || 'Como funciona a metodologia deste teste?';
    document.getElementById('methodology-text').innerHTML = testData.methodologyText || '';

    // Hide loader and Show results
    gsap.to('#loading-screen', {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('loading-screen').classList.add('hidden');
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            const results = document.getElementById('results-screen');
            results.classList.remove('hidden');
            
            // Set initial score display
            document.getElementById('score-display').textContent = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1') ? '0.00' : '0';
            
            gsap.fromTo('#results-screen',
                { opacity: 0, y: 20 },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.5, 
                    ease: "power2.out",
                    onComplete: () => {
                        // Show the "Faça outro teste" button container
                        const backBtnContainer = document.getElementById('results-back-btn-container');
                        if (backBtnContainer) {
                            backBtnContainer.classList.remove('hidden');
                            gsap.fromTo(backBtnContainer, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
                        }

                        // Count up score display
                        const scoreObj = { val: 0 };
                        const isFloat = currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1';
                        
                        gsap.to(scoreObj, {
                            val: score,
                            duration: 1.2,
                            ease: "power2.out",
                            onUpdate: () => {
                                document.getElementById('score-display').textContent = isFloat ? scoreObj.val.toFixed(2) : Math.round(scoreObj.val);
                            }
                        });

                        // Animate SVG Gauge path
                        if (gaugeFillPath) {
                            gsap.to(gaugeFillPath, {
                                strokeDashoffset: targetOffset,
                                duration: 1.2,
                                ease: "power2.out"
                            });
                        }
                    }
                }
            );
        }
    });
}

// Reset test state and return to Hub
function restartTest() {
    // Reset methodology accordion state if open
    const content = document.getElementById('methodology-content');
    const arrow = document.getElementById('methodology-arrow');
    if (content) content.style.maxHeight = '0px';
    if (arrow) arrow.style.transform = 'rotate(0deg)';

    const backBtnContainer = document.getElementById('results-back-btn-container');
    if (backBtnContainer) backBtnContainer.classList.add('hidden');

    gsap.to('#results-screen', {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('results-screen').classList.add('hidden');
            // Re-open test to reset
            openTest(currentTest);
        }
    });
}

// Toggle expandable methodology accordion
function toggleMethodology() {
    const content = document.getElementById('methodology-content');
    const arrow = document.getElementById('methodology-arrow');
    
    if (content.style.maxHeight && content.style.maxHeight !== '0px') {
        content.style.maxHeight = '0px';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        content.style.maxHeight = content.scrollHeight + 'px';
        arrow.style.transform = 'rotate(180deg)';
    }
}

// Navigate back to the main Hub from any active state
function goToHub() {
    // Reset methodology accordion if open
    const content = document.getElementById('methodology-content');
    const arrow = document.getElementById('methodology-arrow');
    if (content) content.style.maxHeight = '0px';
    if (arrow) arrow.style.transform = 'rotate(0deg)';

    const backBtnContainer = document.getElementById('results-back-btn-container');
    if (backBtnContainer) backBtnContainer.classList.add('hidden');

    // Remove URL parameter
    try {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('test');
        window.history.pushState({}, '', newUrl.toString());
    } catch(e) {
        console.error(e);
    }

    const wizard = document.getElementById('test-wizard');
    const results = document.getElementById('results-screen');
    const hub = document.getElementById('hub-screen');

    if (!wizard.classList.contains('hidden')) {
        gsap.to('#test-wizard', {
            opacity: 0,
            y: 20,
            duration: 0.3,
            onComplete: () => {
                wizard.classList.add('hidden');
                window.scrollTo({ top: 0, behavior: 'instant' });
                hub.classList.remove('hidden');
                gsap.fromTo('#hub-screen', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 });
            }
        });
    } else if (!results.classList.contains('hidden')) {
        gsap.to('#results-screen', {
            opacity: 0,
            y: 20,
            duration: 0.3,
            onComplete: () => {
                results.classList.add('hidden');
                window.scrollTo({ top: 0, behavior: 'instant' });
                hub.classList.remove('hidden');
                gsap.fromTo('#hub-screen', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 });
            }
        });
    }
}

// Share test result
function shareResult() {
    const url = new URL(window.location.href);
    url.searchParams.set('test', currentTest);
    
    const testTitle = testsDatabase[currentTest].title;
    const shareText = `Fiz a autoavaliação de saúde "${testTitle}" do Dr. Gustavo Sisant. Faça o seu teste também!`;
    
    if (navigator.share) {
        navigator.share({
            title: testTitle,
            text: shareText,
            url: url.toString()
        }).catch(err => console.log('Erro ao compartilhar:', err));
    } else {
        // Fallback: Copy to Clipboard
        navigator.clipboard.writeText(url.toString()).then(() => {
            showToast('Link do teste copiado para a área de transferência!');
        }).catch(err => {
            console.error('Erro ao copiar link:', err);
        });
    }
}

// Show a temporary toast message
function showToast(message) {
    let toast = document.getElementById('health-hub-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'health-hub-toast';
        toast.className = 'fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-navy text-white text-xs md:text-sm font-bold py-3 px-6 rounded-xl shadow-premium border border-gray-800 transition-all duration-300 transform translate-y-10 opacity-0 flex items-center gap-2';
        document.body.appendChild(toast);
    }
    
    toast.innerHTML = `<i class="ph-bold ph-check-circle text-green-500 text-lg"></i> ${message}`;
    
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-10', 'opacity-0');
        toast.classList.add('translate-y-0', 'opacity-100');
    });
    
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-10', 'opacity-0');
    }, 3000);
}

// Immediately check URL params on module execution and attach event listeners
try {
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('test') || urlParams.get('teste');
    if (testId && testsDatabase[testId]) {
        setTimeout(() => openTest(testId), 150);
    }

    // Attach phone input formatting listener
    const phoneInput = document.getElementById('reg-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            const cleaned = e.target.value.replace(/\D/g, '');
            const truncated = cleaned.slice(0, 11);
            e.target.value = formatPhone(truncated);
        });
    }
} catch(e) {
    console.error(e);
}

// Expose functions globally for HTML onclick attributes compatibility under Vite ES Modules
window.openTest = openTest;
window.closeTest = closeTest;
window.goToHub = goToHub;
window.prevStep = prevStep;
window.restartTest = restartTest;
window.toggleMethodology = toggleMethodology;
window.submitNumericStep = submitNumericStep;
window.shareResult = shareResult;
window.handleRegistrationSubmit = handleRegistrationSubmit;
window.handleLoginSubmit = handleLoginSubmit;
window.toggleRegMode = toggleRegMode;
