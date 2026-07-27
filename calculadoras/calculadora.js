import { supabase } from '../supabase.js';
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
    },
    'hdl-apoa1': {
        title: 'Relação HDL / Apo A1',
        category: 'Cardiovascular',
        maxScore: 1.0,
        loadingTitle: 'Calculando Relação HDL / Apo A1...',
        loadingSubtitle: 'Dividindo os níveis de HDL-Colesterol pela Apolipoproteína A1 para avaliar o risco cardiovascular por quartis.',
        methodologyTitle: 'Sobre a Relação HDL / Apo A1',
        methodologyText: `
            <p>A <strong>Relação HDL-C / Apo A-I</strong> é calculada dividindo a concentração de HDL-Colesterol pela de Apolipoproteína A1: <strong>HDL-C / Apo A-I</strong>. Ambos são medidos na mesma unidade (geralmente mg/dL).</p>
            <p class="mt-2">A <strong>Apolipoproteína A1 (Apo A-I)</strong> é a principal proteína estrutural do HDL. Um índice HDL-C/ApoA-I inferior a 0,28 está associado a um maior volume de gordura pericárdica, o que sugere um perfil cardiometabólico adverso, aterosclerose subclínica e calcificação coronária.</p>
            <p class="mt-2">A classificação por quartis de risco é dividida em:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Excelente (Q4 - maior que 0,38):</strong> Ótima proteção cardiovascular e menor risco metabólico.</li>
                <li><strong>Risco Moderado Leve (Q3 - de 0,33 a 0,38):</strong> Perfil equilibrado, próximo aos níveis ideais de proteção vascular.</li>
                <li><strong>Risco Moderado (Q2 - de 0,28 a 0,33):</strong> Alerta intermediário, indicando atenção a hábitos dietéticos e metabólicos.</li>
                <li><strong>Alto Risco (Q1 - de 0,10 a 0,28):</strong> Maior volume de gordura pericárdica, perfil cardiometabólico adverso e risco cardiovascular elevado.</li>
                <li><strong>Muito Alto Risco (menor que 0,10):</strong> Desequilíbrio severo com baixa funcionalidade de partículas protetoras.</li>
            </ul>
        `,
        questions: [
            {
                text: 'Insira os valores do seu painel lipídico:',
                type: 'numeric',
                inputs: [
                    { label: 'HDL-Colesterol (mg/dL)', id: 'hdl', placeholder: 'Ex: 50', min: 5, max: 150 },
                    { label: 'Apolipoproteína A1 (Apo A1) (mg/dL)', id: 'apoa1', placeholder: 'Ex: 130', min: 10, max: 300 }
                ]
            }
        ]
    },
    'phr': {
        title: 'Relação Plaquetas / HDL (PHR)',
        category: 'Cardiovascular',
        maxScore: 10.0,
        loadingTitle: 'Calculando Relação Plaquetas / HDL...',
        loadingSubtitle: 'Dividindo a contagem de plaquetas pelo nível de HDL-C para avaliar o risco tromboinflamatório.',
        methodologyTitle: 'Sobre a Relação Plaquetas / HDL (PHR)',
        methodologyText: `
            <p>A <strong>Relação Plaquetas / HDL (PHR - Platelet-to-HDL Ratio)</strong> é uma ferramenta emergente na avaliação do risco cardiovascular e inflamação sistêmica. Ela combina a contagem de plaquetas com o colesterol de lipoproteína de alta densidade (HDL-C) para refletir o equilíbrio entre o estado pró-trombótico/inflamatório (plaquetas) e o potencial cardioprotetor/anti-inflamatório (HDL-C).</p>
            <p class="mt-2">Plaquetas elevadas estão diretamente envolvidas no processo de trombose e na resposta inflamatória vascular. Por outro lado, o HDL-C exerce um papel protetor importante através do transporte reverso do colesterol e de suas propriedades antioxidantes. Portanto, um PHR elevado sinaliza um maior potencial tromboinflamatório nas artérias.</p>
            <p class="mt-2">Pesquisas recentes associam o PHR elevado com o risco de doença arterial coronariana, severidade de lesões vasculares, síndrome coronariana aguda e pior prognóstico pós-infarto.</p>
            <p class="mt-2">As faixas de referência e interpretação do PHR são descritas a seguir:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Excelente / Baixo Risco (menor que 2,00):</strong> Relação ideal. Equilíbrio saudável entre fatores pró-trombóticos e a proteção oferecida pelo HDL-C.</li>
                <li><strong>Alerta Inicial (de 2,00 a 3,00):</strong> Leve tendência ao desequilíbrio inflamatório, geralmente corrigível com ajustes simples na rotina de hábitos.</li>
                <li><strong>Risco Intermediário (de 3,00 a 4,50):</strong> Equilíbrio limítrofe. Sugere atenção redobrada aos fatores inflamatórios sistêmicos e metabólicos.</li>
                <li><strong>Risco Moderado Alto (de 4,50 a 6,00):</strong> Tendência pró-inflamatória e pró-trombótica evidente. Aconselha-se otimizar hábitos e monitorar a saúde vascular.</li>
                <li><strong>Risco Aumentado (maior ou igual a 6,00):</strong> Associação documentada com maior risco de doença coronariana, síndrome metabólica e eventos aterotrombóticos. Requer avaliação médica integrada.</li>
            </ul>
        `,
        questions: [
            {
                text: 'Insira os valores das suas plaquetas e HDL:',
                type: 'numeric',
                inputs: [
                    { label: 'Contagem de Plaquetas (mil/µL)', id: 'platelets', placeholder: 'Ex: 250', min: 50, max: 1000 },
                    { label: 'HDL-Colesterol (mg/dL)', id: 'hdl', placeholder: 'Ex: 50', min: 5, max: 150 }
                ]
            }
        ]
    },
    'ls7-demencia': {
        title: 'Predisposição à Demência <span class="block text-sm sm:text-base font-normal text-gray-500 mt-1">(Life\'s Simple 7 - LS7)</span>',
        category: 'Neurocognitivo',
        maxScore: 14,
        loadingTitle: 'Calculando Escore de Saúde Vascular & Cognitiva...',
        loadingSubtitle: 'Cruzando seus parâmetros clínicos e de estilo de vida com os critérios da American Heart Association (AHA).',
        methodologyTitle: 'Sobre o Protocolo Life\'s Simple 7 (LS7) e a Saúde Cerebral',
        methodologyText: `
            <p>O protocolo <strong>Life's Simple 7 (LS7)</strong> foi desenvolvido pela <em>American Heart Association (AHA)</em> para quantificar a saúde cardiovascular global através de 7 métricas essenciais (3 comportamentais e 4 biológicas/clínicas).</p>
            <p class="mt-2">Estudos epidemiológicos de grande porte — com destaque para o célebre estudo <strong>ARIC (Atherosclerosis Risk in Communities)</strong> — demonstraram que a saúde cardiovascular em idades jovens e de meia-idade dita diretamente o envelhecimento cerebral e o risco de demência vascular e Alzheimer no futuro. O fluxo sanguíneo cerebral e a integridade da microcirculação dependem diretamente desses 7 marcadores.</p>
            <p class="mt-2"><strong>Destaque Científico de Redução de Risco:</strong></p>
            <p class="mt-1 bg-blue-50/80 p-3 rounded-lg border border-blue-200 text-blue-900 text-xs sm:text-sm leading-relaxed">
                <strong>Diminuição de ~37,6% no Risco de Demência:</strong> Em estudos longitudinais com ~26 anos de acompanhamento, uma diferença de apenas <strong>5 pontos</strong> no escore LS7 (por exemplo, elevando a pontuação de 5 para 10 pontos) esteve associada a uma redução de aproximadamente <strong>37,6% no risco de desenvolver demência</strong>.
            </p>
            <p class="mt-2">A pontuação varia de 0 a 14 pontos (0 a 2 pontos por componente):</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Saúde Baixa (0 a 4 pontos):</strong> Elevado risco de complicação microvascular e declínio cognitivo futuro.</li>
                <li><strong>Saúde Intermediária (5 a 9 pontos):</strong> Presença de alguns fatores de proteção, porém com margem expressiva para otimização preventivo-clínica.</li>
                <li><strong>Saúde Ideal (10 a 14 pontos):</strong> Alta proteção vascular e neurocognitiva de longo prazo.</li>
            </ul>
        `,
        questions: [
            {
                text: '1. Tabagismo: Como é o seu histórico de consumo de tabaco ou nicotina?',
                options: [
                    { text: 'Nunca fumei ou parei de fumar há mais de 12 meses', value: 2 },
                    { text: 'Ex-fumante (parei de fumar há 12 meses ou menos)', value: 1 },
                    { text: 'Fumante atual (cigarro convencional, eletrônico ou derivados)', value: 0 }
                ]
            },
            {
                text: '2. Atividade Física: Qual é o seu nível semanal de exercícios?',
                options: [
                    { text: '≥ 150 min/semana de atividade moderada OU ≥ 75 min/semana de atividade vigorosa', value: 2 },
                    { text: 'Entre 1 e 149 min/semana de atividade moderada (ou equivalente)', value: 1 },
                    { text: 'Nenhuma atividade física praticada na semana (sedentarismo)', value: 0 }
                ]
            },
            {
                text: `
                    <div>3. Dieta: Quantos dos seguintes 5 hábitos alimentares saudáveis você cumpre na sua rotina?</div>
                    <ul class="mt-3 mb-2 space-y-1.5 text-sm text-gray-600 list-disc pl-5 font-normal">
                        <li><strong>Frutas e vegetais:</strong> consumo diário</li>
                        <li><strong>Peixe / Ômega-3:</strong> no mínimo 2 vezes por semana</li>
                        <li><strong>Fibras e grãos integrais:</strong> consumo diário</li>
                        <li><strong>Sódio:</strong> baixo consumo de sal e alimentos embutidos/processados</li>
                        <li><strong>Bebidas açucaradas:</strong> raras ou nulas (refrigerantes, sucos adoçados)</li>
                    </ul>
                `,
                options: [
                    { text: 'Cumpro de 4 a 5 hábitos alimentares saudáveis', value: 2 },
                    { text: 'Cumpro de 2 a 3 hábitos alimentares saudáveis', value: 1 },
                    { text: 'Cumpro 0 ou apenas 1 hábito alimentar saudável', value: 0 }
                ]
            },
            {
                text: '4. Índice de Massa Corporal (IMC):',
                options: [
                    { text: 'IMC menor que 25,0 kg/m² (peso saudável)', value: 2 },
                    { text: 'IMC entre 25,0 e 29,9 kg/m² (sobrepeso)', value: 1 },
                    { text: 'IMC maior ou igual a 30,0 kg/m² (obesidade)', value: 0 }
                ]
            },
            {
                text: '5. Nível de Colesterol Total:',
                options: [
                    { text: 'Menor que 200 mg/dL sem uso de medicação para colesterol', value: 2 },
                    { text: 'Entre 200 e 239 mg/dL, ou menor que 200 mg/dL em uso de medicação', value: 1 },
                    { text: 'Maior ou igual a 240 mg/dL', value: 0 }
                ]
            },
            {
                text: '6. Nível de Pressão Arterial Habitual:',
                options: [
                    { text: 'Menor que 120/80 mmHg sem medicação anti-hipertensiva', value: 2 },
                    { text: 'Entre 120-139 / 80-89 mmHg, ou tratada e controlada com medicação', value: 1 },
                    { text: 'Maior ou igual a 140/90 mmHg (hipertensão)', value: 0 }
                ]
            },
            {
                text: '7. Nível de Glicemia de Jejum:',
                options: [
                    { text: 'Menor que 100 mg/dL sem tratamento para diabetes', value: 2 },
                    { text: 'Entre 100 e 125 mg/dL (pré-diabetes), ou tratada e menor que 100 mg/dL', value: 1 },
                    { text: 'Maior ou igual a 126 mg/dL (diabetes)', value: 0 }
                ]
            }
        ]
    },
    'organizacao-pessoal': {
        title: 'Organização Pessoal e Saúde <span class="block text-xs sm:text-sm font-normal text-gray-500 mt-0.5">(Método GTD & Graduação)</span>',
        category: 'Comportamental',
        maxScore: 25,
        loadingTitle: 'Mapeando Nível de Organização & Saúde...',
        loadingSubtitle: 'Calculando sua pontuação nas 5 seções comportamentais e definindo sua graduação de faixa.',
        methodologyTitle: 'Sobre o Método GTD e a Graduação de Organização',
        methodologyText: `
            <p>Este instrumento avalia o seu <strong>Nível de Organização Pessoal e Saúde</strong> através de 25 indicadores distribuídos em 5 domínios fundamentais: Planejamento Pessoal, Gestão de Tarefas, Controle de Tempo e Foco, Saúde Física e Mental, e Organização Física e Digital.</p>
            <p class="mt-2">Inspirado na metodologia de produtividade <strong>Getting Things Done (GTD)</strong> de <em>David Allen</em> e em princípios de medicina integrativa, o teste mede a capacidade de converter intenções em rotinas claras sem gerar sobrecarga mental ou estresse.</p>
            <p class="mt-2">A pontuação total soma até <strong>25 pontos</strong> (0 a 5 pontos por seção) e classifica seu perfil em 5 níveis de graduação:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Faixa Branca (Nível 1 — 0 a 6 pts):</strong> Início da jornada de organização e criação de estrutura.</li>
                <li><strong>Faixa Azul (Nível 2 — 6,5 a 12 pts):</strong> Esforço evidente com necessidade de construir consistência.</li>
                <li><strong>Faixa Roxa (Nível 3 — 12,5 a 17 pts):</strong> Organização funcional com pontos de otimização.</li>
                <li><strong>Faixa Marrom (Nível 4 — 17,5 a 21 pts):</strong> Estrutura sólida, disciplina e bom controle de tempo e foco.</li>
                <li><strong>Faixa Preta (Nível 5 — 21,5 a 25 pts):</strong> Alta performance integrada à saúde e bem-estar.</li>
            </ul>
        `,
        questions: [
            // SEÇÃO 1: PLANEJAMENTO PESSOAL
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 1: Planejamento Pessoal</span>1. Tenho uma rotina diária com horários definidos para acordar, me alimentar, trabalhar e dormir.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 1: Planejamento Pessoal</span>2. Planejo meu dia com antecedência (na noite anterior ou pela manhã).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 1: Planejamento Pessoal</span>3. Uso uma agenda ou planner para acompanhar tarefas, compromissos e metas (envolvendo corpo físico, mente e espiritualidade).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 1: Planejamento Pessoal</span>4. Faço revisão semanal do que deu certo ou precisa melhorar.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 1: Planejamento Pessoal</span>5. Estabeleço metas de curto e longo prazo e acompanho meu progresso.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },

            // SEÇÃO 2: GESTÃO DE TAREFAS E PRIORIDADES
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 2: Gestão de Tarefas e Prioridades</span>6. Tenho uma lista clara de tarefas para o dia (em papel ou aplicativo).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 2: Gestão de Tarefas e Prioridades</span>7. Divido projetos ou tarefas maiores em etapas menores e específicas.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 2: Gestão de Tarefas e Prioridades</span>8. Identifico e priorizo tarefas importantes versus urgentes.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 2: Gestão de Tarefas e Prioridades</span>9. Cumpro prazos e raramente me atraso com minhas responsabilidades.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 2: Gestão de Tarefas e Prioridades</span>10. Sei dizer "não" ou adiar tarefas sem culpa quando necessário.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },

            // SEÇÃO 3: CONTROLE DO TEMPO E FOCO
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 3: Controle do Tempo e Foco</span>11. Planejo blocos de tempo para foco profundo e sem interrupções (tenho clareza do meu tempo de FLOW).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 3: Controle do Tempo e Foco</span>12. Faço pausas estratégicas para manter energia e clareza mental (vinculando pausas ao hábito de beber água).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 3: Controle do Tempo e Foco</span>13. Monitoro como gasto meu tempo ao longo do dia (através de aplicativos ou anotações).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 3: Controle do Tempo e Foco</span>14. Evito ou limito distrações digitais (celular, redes sociais) durante atividades importantes (menos de 3 acessos no período de trabalho).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 3: Controle do Tempo e Foco</span>15. Ajusto meu dia com flexibilidade, mas sem perder o ritmo geral (tenho tempo programado para urgências sem abalar meu planejamento).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },

            // SEÇÃO 4: SAÚDE FÍSICA E MENTAL
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 4: Saúde Física e Mental</span>16. Tenho uma rotina regular de sono (7 a 9 horas por noite).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 4: Saúde Física e Mental</span>17. Pratico alguma atividade física ao menos 150 minutos por semana.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 4: Saúde Física e Mental</span>18. Me alimento de forma consciente, evitando excessos e priorizando alimentos naturais.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 4: Saúde Física e Mental</span>19. Tiro momentos do dia para respirar, relaxar, praticar mindfulness ou meditação (tenho um momento reservado no dia ou na semana).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 4: Saúde Física e Mental</span>20. Reconheço sinais de cansaço ou estresse e me permito descansar sem culpa.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },

            // SEÇÃO 5: ORGANIZAÇÃO FÍSICA E DIGITAL
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 5: Organização Física e Digital</span>21. Meu espaço de trabalho é limpo, organizado e funcional (sou consciencioso).',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 5: Organização Física e Digital</span>22. Meus arquivos digitais estão organizados em pastas bem nomeadas.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 5: Organização Física e Digital</span>23. Faço revisões e limpezas frequentes no celular, computador e e-mails.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 5: Organização Física e Digital</span>24. Sei onde encontrar rapidamente documentos e informações importantes.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            },
            {
                text: '<span class="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">Seção 5: Organização Física e Digital</span>25. Mantenho objetos pessoais e materiais de estudo/trabalho com fácil acesso e ordem.',
                options: [
                    { text: 'Com regularidade (quase sempre)', value: 1 },
                    { text: 'Às vezes', value: 0.5 },
                    { text: 'Raramente ou nunca', value: 0 }
                ]
            }
        ]
    }
};

// Results mapping for Personal Organization & Health (GTD Belt Ranking)
const organizacaoResults = [
    {
        min: 0,
        max: 6.5,
        status: 'Faixa Branca (Nível 1) — Iniciante',
        color: '#94a3b8', // slate-400
        gaugeClass: 'border-t-slate-400 border-r-slate-400',
        interpretation: 'Você está iniciando sua jornada de organização. Ainda não possui estrutura sólida ou rotinas bem estabelecidas, mas reconhecer este estado é o primeiro passo para construir uma vida mais previsível, produtiva e saudável.',
        recommendations: [
            'Comece definindo apenas 1 a 2 rotinas fixas por semana (como horário para dormir e uma lista simples de 3 tarefas por dia).',
            'Utilize uma ferramenta básica (bloco de notas ou aplicativo simples) para descarregar a mente e não confiar apenas na memória.',
            'Elimine o excesso de bagunça física no seu local de trabalho para reduzir a carga cognitiva imediata.'
        ]
    },
    {
        min: 6.5,
        max: 12.5,
        status: 'Faixa Azul (Nível 2) — Em Construção',
        color: '#3b82f6', // blue-500
        gaugeClass: 'border-t-blue-500 border-r-blue-500',
        interpretation: 'Há sinais evidentes de esforço e boas intenções na sua rotina, mas a consistência diária ainda precisa ser construída. Este é o momento ideal para transformar ações isoladas em hábitos duradouros.',
        recommendations: [
            'Implemente uma revisão semanal fixa de 15 minutos para planejar os compromissos e metas dos próximos 7 dias.',
            'Pratique o método de blocos de tempo (Time-blocking) separando horários específicos para trabalho focado e pausas.',
            'Reforce a disciplina no controle do tempo digital, limitando o uso de redes sociais nos horários de produção.'
        ]
    },
    {
        min: 12.5,
        max: 17.5,
        status: 'Faixa Roxa (Nível 3) — Funcional',
        color: '#a855f7', // purple-500
        gaugeClass: 'border-t-purple-500 border-r-purple-500',
        interpretation: 'Sua organização é funcional, contando com bons hábitos e uma estrutura equilibrada de tarefas e saúde. No entanto, ainda há pontos a otimizar para evitar sobrecargas e momentos de distração.',
        recommendations: [
            'Aprimore a diferenciação entre tarefas importantes e urgentes, aprendendo a delegar ou dizer "não" com mais firmeza.',
            'Integre pausas ativas vinculadas à hidratação e momentos de respiração para manter o nível de energia ao longo do dia.',
            'Organize seus arquivos digitais e caixas de entrada para reduzir a fricção na busca por informações.'
        ]
    },
    {
        min: 17.5,
        max: 21.5,
        status: 'Faixa Marrom (Nível 4) — Avançado',
        color: '#b45309', // amber-700
        gaugeClass: 'border-t-amber-700 border-r-amber-700',
        interpretation: 'Você possui excelente estrutura, disciplina e boa consciência do tempo, saúde e foco. Consegue priorizar responsabilidades, manter prazos e gerenciar imprevistos com serenidade. Parabéns!',
        recommendations: [
            'Mantenha o acompanhamento de metas de longo prazo associando o desenvolvimento profissional ao bem-estar pessoal.',
            'Proteja seus momentos de descanso e lazer sem culpa, garantindo a sustentabilidade da sua alta performance.',
            'Refine seus momentos de estado de FLOW para atingir o máximo potencial criativo sem exaustão.'
        ]
    },
    {
        min: 21.5,
        max: 999,
        status: 'Faixa Preta (Nível 5) — Alta Performance',
        color: '#1e293b', // slate-800
        gaugeClass: 'border-t-slate-800 border-r-slate-800',
        interpretation: 'Você é altamente organizado e equilibrado. Integra produtividade, gestão de tempo, clareza mental e saúde de forma impecável, sendo uma inspiração e referência de consistência para os outros.',
        recommendations: [
            'Compartilhe suas práticas e metodologias com sua equipe e pessoas ao redor para inspirar uma cultura mais saudável.',
            'Continue revisando e adaptando seus sistemas à medida que novos desafios e projetos surgirem.',
            'Desfrute da liberdade e clareza mental conquistadas através do domínio da autogestão.'
        ]
    }
];

// Results mapping for Life's Simple 7 (LS7) Dementia Risk Score
const ls7Results = [
    {
        min: 0,
        max: 4,
        status: 'Saúde Baixa / Risco Muito Elevado',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Sua pontuação no Life\'s Simple 7 (LS7) indica saúde cardiovascular e vascular cerebral baixa (0 a 3 pontos). Múltiplos fatores metabolicamente desfavoráveis (como hipertensão, dislipidemia, hiperglicemia ou sedentarismo) estão presentes simultaneamente. Estudos longitudinais (como o estudo ARIC) indicam que perfis nesta faixa apresentam maior suscetibilidade ao declínio cognitivo e desenvolvimento de demência ao longo das décadas.',
        recommendations: [
            'Consulte um médico para uma avaliação metabólica e cardiovascular completa, com controle rigoroso da pressão, glicemia e lipídios.',
            'Inicie modificações imediatas de estilo de vida: cessações do tabagismo, reeducação alimentar e rotina progressiva de exercícios.',
            'Priorize a redução de carboidratos refinados e açúcares para combater a resistência insulínica e a neuroinflamação.'
        ]
    },
    {
        min: 4,
        max: 7,
        status: 'Alerta Preventivo / Risco Elevado',
        color: '#f43f5e', // rose-500
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua pontuação no LS7 está na faixa de alerta preventivo (4 a 6 pontos). Há espaço significativo para otimização dos parâmetros cardiovasculares. Ajustar esses marcadores para faixas ideais pode proporcionar uma redução drástica no risco futuro de demência vascular e Alzheimer.',
        recommendations: [
            'Foque em transicionar os marcadores intermediários (como pressão ou glicemia) para os níveis ideais.',
            'Aumente a prática diária de atividade física aeróbica e de resistência para melhorar a perfusão cerebral e vascular.',
            'Adote uma dieta cardioprotetora e neuroprotetora rica em antioxidantes, sementes e vegetais folhosos.'
        ]
    },
    {
        min: 7,
        max: 10,
        status: 'Saúde Intermediária / Risco Moderado',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Sua pontuação situa-se na faixa de saúde cardiovascular e cognitiva intermediária (7 a 9 pontos). Você já possui alguns pilares bem consolidados, mas ainda há margem para alcançar o patamar protetor ideal. Elevar seu escore em 5 pontos está associado a uma redução de aproximadamente 37,6% no risco de demência ao longo do tempo.',
        recommendations: [
            'Identifique os pontos que receberam 0 ou 1 ponto (como dieta, IMC ou pressão) e trace metas específicas de melhoria.',
            'Garanta uma rotina semanal com pelo menos 150 minutos de exercícios físicos moderados.',
            'Mantenha acompanhamento médico preventivo periódico para otimizar exames de glicemia e colesterol.'
        ]
    },
    {
        min: 10,
        max: 13,
        status: 'Saúde Elevada / Boa Proteção Cognitiva',
        color: '#84cc16', // lime-500
        gaugeClass: 'border-t-lime-500 border-r-lime-500',
        interpretation: 'Excelente! Sua pontuação atinge o patamar de saúde cardiovascular e cognitiva elevada (10 a 12 pontos). Com base no estudo ARIC, manter um escore alto no LS7 reduz em quase 38% a predisposição à demência em um acompanhamento de longo prazo (~26 anos), preservando a saúde microvascular do cérebro.',
        recommendations: [
            'Parabéns pela consistência! Continue mantendo os hábitos alimentares e de atividade física atuais.',
            'Monitore anualmente os marcadores séricos para assegurar que glicemia e pressão sigam nas metas ideais.',
            'Associe o bom perfil vascular a estímulos de reserva cognitiva (estudos, leitura, desafios mentais e boa qualidade de sono).'
        ]
    },
    {
        min: 13,
        max: 999,
        status: 'Saúde Ideal / Máxima Proteção Cognitiva',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Parabéns! Sua pontuação é máxima ou praticamente perfeita no protocolo Life\'s Simple 7 (13 a 14 pontos). Você apresenta um perfil cardiovascular e metabólico impecável, o que confere a máxima proteção conhecida contra lesões microvasculares cerebrais, declínio cognitivo e demência.',
        recommendations: [
            'Sua disciplina e estilo de vida são exemplares. Mantenha essa estrutura de hábitos no longo prazo.',
            'Refaça seu painel médico e metabólico anualmente para garantir a estabilidade dos excelentes parâmetros.',
            'Compartilhe esse estilo de vida preventivo com sua família e comunidade.'
        ]
    }
];

// Results mapping for Platelet / HDL Ratio (PHR)
const phrResults = [
    {
        min: 0,
        max: 2.0,
        status: 'Excelente / Baixo Risco',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Sua Relação Plaquetas/HDL (PHR) está na faixa ideal (baixo risco). Isso indica um excelente equilíbrio entre a contagem de plaquetas e o HDL-C, refletindo um ambiente vascular estável, baixo potencial tromboinflamatório e boa proteção cardiovascular contra aterogênese.',
        recommendations: [
            'Mantenha sua rotina regular de exercícios físicos para apoiar a função protetora do HDL.',
            'Conserve hábitos dietéticos limpos, ricos em gorduras saudáveis e antioxidantes naturais.',
            'Repita seus exames periódicos de rotina para acompanhar a manutenção deste excelente equilíbrio.'
        ]
    },
    {
        min: 2.0,
        max: 3.0,
        status: 'Alerta Inicial',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Sua relação PHR aponta para um nível de alerta inicial. Embora ainda esteja próximo das faixas de menor risco, sugere uma tendência inicial de aumento no potencial inflamatório subclínico ou leve redução na proteção oferecida pelo HDL-C.',
        recommendations: [
            'Avalie a qualidade das gorduras da sua alimentação, priorizando azeite de oliva e reduzindo óleos vegetais refinados.',
            'Evite o sedentarismo, praticando atividade física regular para otimizar os níveis e a qualidade do HDL.',
            'Considere refazer exames preventivos a cada 6 meses para acompanhar este marcador.'
        ]
    },
    {
        min: 3.0,
        max: 4.5,
        status: 'Risco Intermediário',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Seu PHR encontra-se em uma faixa de risco intermediário. Indica que o balanço entre os processos inflamatórios/trombóticos e de proteção vascular está limítrofe. Recomenda-se adotar ajustes preventivos estruturados no estilo de vida.',
        recommendations: [
            'Reduza o consumo de alimentos ultraprocessados e refinados que estimulam a inflamação subclínica sistêmica.',
            'Adicione exercícios de força e de resistência aeróbica à sua rotina para otimizar o perfil lipídico e controlar as plaquetas.',
            'Investigue outros marcadores de inflamação e metabolismo, como PCR-ultrassensível e insulina de jejum.'
        ]
    },
    {
        min: 4.5,
        max: 6.0,
        status: 'Risco Moderado Alto',
        color: '#f43f5e', // rose-500
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua pontuação de PHR está classificada como risco moderado alto. Sinaliza uma tendência pró-inflamatória e pró-trombótica mais evidente nas artérias. Há um maior estímulo plaquetário ou uma redução acentuada da atividade protetora do HDL.',
        recommendations: [
            'Restrinja açúcares e carboidratos refinados que favorecem a inflamação vascular e a agregação plaquetária.',
            'Pratique exercícios físicos de forma supervisionada e consistente para estimular a depuração de lipoproteínas.',
            'Realize uma análise médica integrada dos seus fatores de risco cardiovascular globais.'
        ]
    },
    {
        min: 6.0,
        max: 999,
        status: 'Risco Aumentado',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Seu PHR está elevado (risco aumentado). Estudos clínicos correlacionam valores elevados deste índice com um maior risco de doença arterial coronariana, severidade de lesões vasculares e síndrome metabólica. Indica um ambiente propício à inflamação endotelial.',
        recommendations: [
            'Consulte um médico de forma integrada para avaliar a saúde vascular geral e estimar o risco cardiovascular global.',
            'Foque na melhora da sensibilidade à insulina e no controle da inflamação através de estratégias de estilo de vida saudáveis.',
            'Monitore de perto os níveis plaquetários e lipídicos sob supervisão médica.'
        ]
    }
];

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

// Results mapping for Systemic Immune-Inflammation Index (SII)
const siiResults = [
    {
        min: 0,
        max: 355,
        status: 'Baixo Risco / Baixa Inflamação (< 355)',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Seu Índice de Inflamação Imune Sistêmica (SII) está na faixa ideal (< 355). Isso reflete um excelente equilíbrio entre a imunidade inata (neutrófilos), a regulação hemostática (plaquetas) e a imunidade adaptativa (linfócitos).',
        recommendations: [
            'Mantenha seu padrão alimentar anti-inflamatório rico em antioxidantes, fibras e gorduras saudáveis (ex: ômega-3).',
            'Continue praticando atividade física regular e promovendo uma boa higiene do sono.',
            'Realize exames de rotina anuais para monitorar a consistência dos seus marcadores biológicos.'
        ]
    },
    {
        min: 355,
        max: 655,
        status: 'Inflamação Moderada / Atenção Preventiva (355 a 655)',
        color: '#f59e0b', // amber-500
        gaugeClass: 'border-t-amber-500 border-r-amber-500',
        interpretation: 'Seu SII encontra-se na faixa intermediária/moderada (entre 355 e 655). Indica uma resposta imunoinflamatória subclínica ativada. É recomendável avaliar estilo de vida, sono e fatores de estresse oxidativo.',
        recommendations: [
            'Avalie e reduza o consumo de alimentos ultraprocessados, açúcares refinados e gorduras trans.',
            'Otimize o manejo do estresse crônico através de técnicas de modulação autonômica e descanso adequado.',
            'Considere refazer o hemograma em 60 a 90 dias com acompanhamento médico integrativo.'
        ]
    },
    {
        min: 655,
        max: 99999,
        status: 'Inflamação Elevada / Risco Cardiovascular Aumentado (> 655)',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Seu SII está em patamar elevado (> 655). Na literatura científica (Xia et al., Journal of Clinical Medicine 2023), valores elevados de SII associam-se a maior atividade inflamatória crônica vascular e maior risco cardiovascular.',
        recommendations: [
            'Agende uma avaliação médica detalhada para investigar possíveis focos inflamatórios e endoteliais.',
            'Investigue marcadores complementares como PCR ultra-sensível, homocisteína e perfil lipídico completo.',
            'Adote um protocolo intensivo de estilo de vida focado na redução da inflamação sistêmica.'
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

// Results mapping for HDL / Apo A1 Ratio
const hdlApoa1Results = [
    {
        min: 0,
        max: 0.10,
        status: 'Muito Alto Risco',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Sua relação HDL/ApoA1 é inferior a 0,10, configurando um Muito Alto Risco cardiovascular. Existe uma desproporção crítica de partículas de HDL funcionais, sugerindo deficiência extrema nos mecanismos de proteção e depuração do colesterol.',
        recommendations: [
            'Consulte seu médico para uma avaliação cardiovascular detalhada e investigação de aterosclerose.',
            'Adote uma estratégia nutricional anti-inflamatória rigorosa e reduza gorduras trans e açúcares.',
            'Pratique exercícios físicos regulares sob supervisão médica para estimular a funcionalidade das lipoproteínas.'
        ]
    },
    {
        min: 0.10,
        max: 0.28,
        status: 'Alto Risco',
        color: '#f43f5e', // rose-500
        gaugeClass: 'border-t-rose-500 border-r-rose-500',
        interpretation: 'Sua relação HDL/ApoA1 está na faixa de Alto Risco (Q1, inferior a 0,28). Níveis nessa faixa estão estatisticamente associados a um maior volume de gordura pericárdica e maior risco de calcificação coronária e aterosclerose subclínica.',
        recommendations: [
            'Consulte um profissional de saúde integrativo para monitorar marcadores inflamatórios.',
            'Aumente a ingestão de antioxidantes naturais e gorduras saudáveis (como azeite de oliva e abacate).',
            'Realize atividades aeróbicas regulares para otimizar os níveis e a qualidade do HDL-C.'
        ]
    },
    {
        min: 0.28,
        max: 0.33,
        status: 'Risco Moderado',
        color: '#f97316', // orange-500
        gaugeClass: 'border-t-orange-500 border-r-orange-500',
        interpretation: 'Sua relação HDL/ApoA1 está na faixa de Risco Moderado (Q2, entre 0,28 e 0,33). É uma faixa de alerta intermediária que indica uma tendência a um perfil metabólico adverso, exigindo pequenos ajustes no estilo de vida.',
        recommendations: [
            'Otimize o consumo de gorduras insaturadas e evite carboidratos refinados.',
            'Incremente a prática de exercícios resistidos (musculação) para melhorar a flexibilidade metabólica.',
            'Repita exames periódicos a cada 6 meses para avaliar a evolução deste marcador.'
        ]
    },
    {
        min: 0.33,
        max: 0.38,
        status: 'Risco Moderado Leve',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Sua relação HDL/ApoA1 está na faixa de Risco Moderado Leve (Q3, entre 0,33 e 0,38). Seu perfil de proteção vascular está próximo aos níveis ideais, demonstrando boa estabilidade e bom transporte de colesterol.',
        recommendations: [
            'Mantenha uma rotina consistente de atividade física combinando treinos de força e aeróbicos.',
            'Priorize comida de verdade e uma dieta rica em fibras vegetais.',
            'Continue monitorando o marcador anualmente de forma preventiva.'
        ]
    },
    {
        min: 0.38,
        max: 999,
        status: 'Excelente',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Sua relação HDL/ApoA1 é Excelente (Q4, superior a 0,38). Isso indica ótima eficácia na proteção do sistema cardiovascular, menor propensão ao acúmulo de gordura pericárdica e alta funcionalidade no transporte reverso do colesterol.',
        recommendations: [
            'Parabéns! Mantenha seus ótimos hábitos de estilo de vida e de nutrição.',
            'Continue praticando atividade física com regularidade para sustentar esse perfil protetor.',
            'Refaça seu painel lipídico anualmente como parte do check-up de rotina.'
        ]
    }
];

// Generic screen transition helper: ultra-smooth, 60fps GPU acceleration
function transitionScreen(fromScreen, toScreen, onPrepare, onComplete) {
    if (!fromScreen || !toScreen || fromScreen === toScreen) {
        if (onPrepare) onPrepare();
        if (onComplete) onComplete();
        return;
    }

    const isEnteringWizardOrResults = toScreen.id === 'test-wizard' || toScreen.id === 'results-screen';
    const exitY = isEnteringWizardOrResults ? -10 : 10;
    const enterY = isEnteringWizardOrResults ? 10 : -10;

    if (typeof gsap === 'undefined') {
        fromScreen.classList.add('hidden');
        if (onPrepare) onPrepare();
        toScreen.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'instant' });
        if (onComplete) onComplete();
        return;
    }

    // Smooth GPU fade-out
    gsap.to(fromScreen, {
        opacity: 0,
        y: exitY,
        duration: 0.18,
        ease: "power1.out",
        onComplete: () => {
            fromScreen.classList.add('hidden');
            gsap.set(fromScreen, { clearProps: "all" });

            if (onPrepare) onPrepare();

            window.scrollTo({ top: 0, behavior: 'instant' });

            toScreen.classList.remove('hidden');
            gsap.fromTo(toScreen,
                { opacity: 0, y: enterY },
                { 
                    opacity: 1, 
                    y: 0, 
                    duration: 0.22, 
                    ease: "power2.out",
                    clearProps: "transform,opacity",
                    onComplete: () => {
                        if (onComplete) onComplete();
                    }
                }
            );
        }
    });
}

// Open a test from the Hub
function openTest(testId) {
    if (!testId || !testsDatabase[testId]) {
        console.error("Test not found:", testId);
        return;
    }
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

    const fromScreen = document.getElementById('hub-screen');
    const toScreen = document.getElementById('test-wizard');

    if (!fromScreen || !toScreen) {
        console.error("Screen elements not found in DOM");
        return;
    }

    transitionScreen(fromScreen, toScreen, () => {
        // Setup Wizard UI Text
        const catEl = document.getElementById('test-category');
        if (catEl) catEl.innerHTML = testsDatabase[testId].title;
        renderStep();
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

    const fromScreen = document.getElementById('test-wizard');
    const toScreen = document.getElementById('hub-screen');

    transitionScreen(fromScreen, toScreen);
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
    document.getElementById('question-text').innerHTML = question.text;

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
    } else if (currentTest === 'hdl-apoa1') {
        const hdl = answers[0].hdl;
        const apoa1 = answers[0].apoa1;
        calculatedScore = hdl / apoa1;
    } else if (currentTest === 'phr') {
        const platelets = answers[0].platelets;
        const hdl = answers[0].hdl;
        calculatedScore = platelets / hdl;
    } else if (currentTest === 'sii') {
        let plaq = Number(answers[0].plaquetas);
        let neutro = Number(answers[0].neutrofilos);
        let linfo = Number(answers[0].linfocitos);
        if (plaq > 1000) plaq = plaq / 1000;
        calculatedScore = (plaq * neutro) / linfo;
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
    const fromScreen = !testWizard.classList.contains('hidden') ? testWizard : regScreen;
    const toScreen = document.getElementById('loading-screen');

    transitionScreen(fromScreen, toScreen, () => {
        const testData = testsDatabase[currentTest];
        document.getElementById('loading-title').textContent = testData.loadingTitle || 'Processando Perfil Biológico...';
        document.getElementById('loading-subtitle').textContent = testData.loadingSubtitle || '';
    });

    setTimeout(() => {
        showResults(calculatedScore);
    }, 1800);
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
    const formattedScore = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1' || currentTest === 'hdl-apoa1' || currentTest === 'phr') 
        ? calculatedScore.toFixed(2) 
        : calculatedScore;
    
    const payload = { nome, email, telefone, idade, sexo, cidade, teste: testTitle, resultado: formattedScore };

    // Salvar lead no Supabase de forma assíncrona
    saveLeadToSupabase(nome, email, telefone);

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
    const formattedScore = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1' || currentTest === 'hdl-apoa1' || currentTest === 'phr') 
        ? calculatedScore.toFixed(2) 
        : calculatedScore;

    const payload = { nome, email, telefone, idade, sexo, cidade, teste: testTitle, resultado: formattedScore };

    // Salvar lead no Supabase de forma assíncrona
    saveLeadToSupabase(nome, email, telefone);

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

// Save Lead Data to Supabase PostgreSQL Database
async function saveLeadToSupabase(nome, email, telefone) {
    if (!supabase) return;
    try {
        const { error } = await supabase.from('leads').insert([
            { name: nome, email: email, phone: telefone }
        ]);
        if (error) {
            // Se o lead já existir (erro 23505 de e-mail duplicado), atualiza os dados
            if (error.code === '23505') {
                console.log('Lead com este e-mail já existe. Atualizando nome/telefone...');
                await supabase.from('leads').update({ name: nome, phone: telefone }).eq('email', email);
            } else {
                throw error;
            }
        } else {
            console.log('Lead gravado com sucesso no Supabase.');
        }
    } catch (err) {
        console.error('Erro ao gravar lead no Supabase:', err);
    }
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
    } else if (currentTest === 'hdl-apoa1') {
        resultBand = hdlApoa1Results.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = hdlApoa1Results[hdlApoa1Results.length - 1];
    } else if (currentTest === 'phr') {
        resultBand = phrResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = phrResults[phrResults.length - 1];
    } else if (currentTest === 'ls7-demencia') {
        resultBand = ls7Results.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = ls7Results[ls7Results.length - 1];
    } else if (currentTest === 'organizacao-pessoal') {
        resultBand = organizacaoResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = organizacaoResults[organizacaoResults.length - 1];
    } else if (currentTest === 'sii') {
        resultBand = siiResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = siiResults[siiResults.length - 1];
    } else {
        resultBand = adrenalResults.find(band => score >= band.min && score < band.max);
        if (!resultBand) resultBand = adrenalResults[adrenalResults.length - 1];
    }

    // Setup Results UI Text
    const testData = testsDatabase[currentTest];
    document.getElementById('result-title').innerHTML = testData.title;

    const displayScore = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1' || currentTest === 'hdl-apoa1' || currentTest === 'phr' || currentTest === 'sii') ? score.toFixed(2) : (currentTest === 'organizacao-pessoal' ? (Number.isInteger(score) ? score : score.toFixed(1)) : score);
    document.getElementById('score-display').textContent = displayScore;
    document.getElementById('score-label').textContent = (currentTest === 'iap' || currentTest === 'sii') ? 'ÍNDICE' : (currentTest === 'tg-hdl' || currentTest === 'apob-apoa1' || currentTest === 'hdl-apoa1' || currentTest === 'phr') ? 'RELAÇÃO' : 'PONTOS';
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
    } else if (currentTest === 'hdl-apoa1') {
        let targetAngle;
        if (score < 0.10) {
            const minS = 0.0;
            const maxS = 0.10;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 0.28) {
            const minS = 0.10;
            const maxS = 0.28;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 0.33) {
            const minS = 0.28;
            const maxS = 0.33;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 0.38) {
            const minS = 0.33;
            const maxS = 0.38;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 0.38;
            const maxS = 0.69;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'phr') {
        let targetAngle;
        if (score < 2.0) {
            const minS = 0.0;
            const maxS = 2.0;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 3.0) {
            const minS = 2.0;
            const maxS = 3.0;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 4.5) {
            const minS = 3.0;
            const maxS = 4.5;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 6.0) {
            const minS = 4.5;
            const maxS = 6.0;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 6.0;
            const maxS = 10.0;
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
    } else if (currentTest === 'ls7-demencia') {
        let targetAngle;
        if (score < 4) {
            const minS = 0;
            const maxS = 4;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 7) {
            const minS = 4;
            const maxS = 7;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 10) {
            const minS = 7;
            const maxS = 10;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 13) {
            const minS = 10;
            const maxS = 13;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 13;
            const maxS = 14;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'organizacao-pessoal') {
        let targetAngle;
        if (score < 6.5) {
            const minS = 0;
            const maxS = 6.5;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 36;
        } else if (score < 12.5) {
            const minS = 6.5;
            const maxS = 12.5;
            targetAngle = 36 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 17.5) {
            const minS = 12.5;
            const maxS = 17.5;
            targetAngle = 72 + ((score - minS) / (maxS - minS)) * 36;
        } else if (score < 21.5) {
            const minS = 17.5;
            const maxS = 21.5;
            targetAngle = 108 + ((score - minS) / (maxS - minS)) * 36;
        } else {
            const minS = 21.5;
            const maxS = 25;
            const clamped = Math.min(maxS, score);
            targetAngle = 144 + ((clamped - minS) / (maxS - minS)) * 36;
        }
        percentage = targetAngle / 180;
    } else if (currentTest === 'sii') {
        let targetAngle;
        if (score < 355) {
            const minS = 0;
            const maxS = 355;
            const clamped = Math.max(minS, score);
            targetAngle = ((clamped - minS) / (maxS - minS)) * 60;
        } else if (score < 655) {
            const minS = 355;
            const maxS = 655;
            targetAngle = 60 + ((score - minS) / (maxS - minS)) * 60;
        } else {
            const minS = 655;
            const maxS = 1500;
            const clamped = Math.min(maxS, score);
            targetAngle = 120 + ((clamped - minS) / (maxS - minS)) * 60;
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
    const fromScreen = document.getElementById('loading-screen');
    const toScreen = document.getElementById('results-screen');

    transitionScreen(fromScreen, toScreen, () => {
        // Set initial score display
        document.getElementById('score-display').textContent = (currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1' || currentTest === 'hdl-apoa1' || currentTest === 'phr') ? '0.00' : '0';
        
        const backBtnContainer = document.getElementById('results-back-btn-container');
        if (backBtnContainer) backBtnContainer.classList.add('hidden');
    }, () => {
        // Show the "Faça outro teste" button container
        const backBtnContainer = document.getElementById('results-back-btn-container');
        if (backBtnContainer) {
            backBtnContainer.classList.remove('hidden');
            gsap.fromTo(backBtnContainer, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
        }

        // Count up score display
        const scoreObj = { val: 0 };
        const isFloat = currentTest === 'iap' || currentTest === 'tg-hdl' || currentTest === 'apob-apoa1' || currentTest === 'hdl-apoa1' || currentTest === 'phr';
        
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

    const fromScreen = document.getElementById('results-screen');
    const toScreen = document.getElementById('test-wizard');

    transitionScreen(fromScreen, toScreen, () => {
        currentStep = 0;
        answers = [];
        document.getElementById('test-category').textContent = testsDatabase[currentTest].title;
        renderStep();
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
        transitionScreen(wizard, hub);
    } else if (!results.classList.contains('hidden')) {
        transitionScreen(results, hub);
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

const categoryColors = {
    'todos': {
        inactive: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-navy hover:border-navy',
        active: 'bg-navy text-white border-navy shadow-sm'
    },
    'comportamental': {
        inactive: 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100/70',
        active: 'bg-purple-600 text-white border-purple-600 shadow-sm'
    },
    'cardiovascular': {
        inactive: 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100/70',
        active: 'bg-red-600 text-white border-red-600 shadow-sm'
    },
    'neurocognitivo': {
        inactive: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100/70',
        active: 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
    },
    'hormonal': {
        inactive: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/70',
        active: 'bg-amber-600 text-white border-amber-600 shadow-sm'
    },
    'metabólico': {
        inactive: 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100',
        active: 'bg-gray-600 text-white border-gray-600 shadow-sm'
    }
};

const fallbackColors = {
    inactive: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100/70',
    active: 'bg-blue-600 text-white border-blue-600 shadow-sm'
};

// Register GSAP Flip plugin
try {
    gsap.registerPlugin(Flip);
} catch (e) {
    console.warn("GSAP Flip Plugin registration failed:", e);
}

function filterCategory(category) {
    const cards = document.querySelectorAll('.calculator-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    // Update button states
    buttons.forEach(btn => {
        const cat = btn.getAttribute('data-cat');
        const color = categoryColors[cat.toLowerCase()] || fallbackColors;
        if (cat === category) {
            btn.className = `filter-btn rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-all duration-200 border cursor-pointer ${color.active}`;
        } else {
            btn.className = `filter-btn rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-all duration-200 border cursor-pointer ${color.inactive}`;
        }
    });

    // Update card visibility smoothly without heavy layout thrashing
    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        const matches = (category === 'Todos' || cat === category);

        if (matches) {
            if (card.classList.contains('hidden')) {
                card.classList.remove('hidden');
                if (typeof gsap !== 'undefined') {
                    gsap.fromTo(card,
                        { opacity: 0, scale: 0.96 },
                        { opacity: 1, scale: 1, duration: 0.2, ease: "power1.out", clearProps: "transform,opacity" }
                    );
                }
            }
        } else {
            card.classList.add('hidden');
        }
    });
}

function attachCardClickListeners() {
    const cards = document.querySelectorAll('.calculator-card');
    cards.forEach(card => {
        const onclickAttr = card.getAttribute('onclick') || '';
        const match = onclickAttr.match(/openTest\('([^']+)'\)/);
        const testId = match ? match[1] : card.getAttribute('data-test');
        if (testId) {
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
                e.preventDefault();
                openTest(testId);
            };
        }
    });
}

function initFilters() {
    attachCardClickListeners();

    const cards = document.querySelectorAll('.calculator-card');
    const categories = new Set();
    categories.add('Todos');

    cards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (cat) {
            categories.add(cat);
        }
    });

    const container = document.getElementById('filter-container');
    if (!container) return;

    container.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.setAttribute('data-cat', cat);
        btn.onclick = () => filterCategory(cat);
        btn.textContent = cat;

        const color = categoryColors[cat.toLowerCase()] || fallbackColors;
        if (cat === 'Todos') {
            btn.className = `filter-btn rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-all duration-300 border cursor-pointer ${color.active}`;
        } else {
            btn.className = `filter-btn rounded-full px-5 py-2 text-xs md:text-sm font-bold transition-all duration-300 border cursor-pointer ${color.inactive}`;
        }

        container.appendChild(btn);
    });
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
window.filterCategory = filterCategory;
window.initFilters = initFilters;

// Initialize category filters & listeners
try {
    initFilters();
} catch (e) {
    console.error(e);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initFilters();
        checkUrlParams();
    });
} else {
    checkUrlParams();
}

window.addEventListener('load', () => {
    initFilters();
});

function checkUrlParams() {
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
}
