// main.js - Core Logic for Health Calculators & Test Wizard

// Global State
let currentTest = null;
let currentStep = 0;
let answers = [];
let testQuestions = [];

// Questions Database
const testsDatabase = {
    'fadiga-adrenal': {
        title: 'Avaliação de Fadiga Adrenal',
        category: 'Hormonal',
        maxScore: 32,
        methodologyTitle: 'Como funciona a pontuação deste teste?',
        methodologyText: `
            <p>Este questionário baseia-se na escala de sintomas clínicos de sobrecarga de estresse e fadiga biológica. As perguntas avaliam parâmetros-chave do ritmo circadiano, como a curva de energia diária, a qualidade do sono e a dependência de estimulantes.</p>
            <p class="mt-2">A pontuação é dividida de acordo com as fases de resposta ao estresse adaptativo:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>0 a 6 pontos:</strong> Fase de Equilíbrio (Homeostase adaptativa).</li>
                <li><strong>7 a 14 pontos:</strong> Fase de Alarme (Resposta adrenérgica ativa).</li>
                <li><strong>15 a 24 pontos:</strong> Fase de Resistência (Instabilidade do cortisol).</li>
                <li><strong>25+ pontos:</strong> Fase de Exaustão (Esgotamento da capacidade compensatória).</li>
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
        methodologyTitle: 'Como funciona a pontuação deste teste?',
        methodologyText: `
            <p>O Índice Aterogênico do Plasma (IAP ou AIP) é uma relação matemática avançada entre os Triglicerídeos e o HDL-Colesterol, calculada através do logaritmo de sua proporção molar: <strong>log10(Triglicerídeos / HDL-C)</strong>.</p>
            <p class="mt-2">Diferente de analisar o colesterol isoladamente, o IAP reflete o diâmetro das partículas de lipoproteínas. Valores elevados de IAP indicam que as partículas de LDL-Colesterol são predominantemente pequenas, densas e altamente propensas à oxidação, o que acelera o acúmulo de placas de gordura (aterogênese) nas artérias.</p>
            <p class="mt-2">A classificação de risco cardiovascular é dividida em:</p>
            <ul class="list-disc pl-5 mt-2 space-y-1">
                <li><strong>Baixo Risco (menor que 0.11):</strong> Predomínio de partículas de LDL maiores e menos aterogênicas.</li>
                <li><strong>Risco Moderado (entre 0.11 e 0.24):</strong> Perfil intermediário que requer atenção preventiva e ajustes de hábitos.</li>
                <li><strong>Alto Risco (maior que 0.24):</strong> Forte associação com risco de infarto, aterosclerose e resistência à insulina.</li>
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
    }
};

// Results mapping for Adrenal Fatigue (Non-diagnostic, patient-friendly language)
const adrenalResults = [
    {
        min: 0,
        max: 6,
        status: 'Bom Equilíbrio e Resiliência ao Estresse',
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
        max: 14,
        status: 'Alerta Inicial de Sobrecarga de Estresse',
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
        min: 15,
        max: 24,
        status: 'Sobrecarga Moderada e Instabilidade de Energia',
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
        min: 25,
        max: 32,
        status: 'Sobrecarga Acentuada / Sinais de Exaustão',
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
        max: 0.109,
        status: 'Baixo Risco Cardiovascular',
        color: '#22c55e', // green-500
        gaugeClass: 'border-t-green-500 border-r-green-500',
        interpretation: 'Seu Índice Aterogênico do Plasma (IAP) está na faixa de baixo risco. Isso indica uma proporção saudável e equilibrada entre Triglicerídeos e HDL-C, sugerindo que suas partículas de LDL-Colesterol são predominantemente grandes e flutuantes, apresentando baixo potencial inflamatório e de aderência nas artérias.',
        recommendations: [
            'Mantenha uma dieta limpa, rica em gorduras monoinsaturadas (azeite de oliva extra virgem, abacate, sementes).',
            'Continue praticando atividade física regular para dar suporte metabólico à função do HDL.',
            'Refaça seu painel lipídico anualmente para acompanhamento clínico preventivo.'
        ]
    },
    {
        min: 0.11,
        max: 0.24,
        status: 'Risco Cardiovascular Moderado',
        color: '#eab308', // yellow-500
        gaugeClass: 'border-t-yellow-500 border-r-yellow-500',
        interpretation: 'Seu IAP está em uma faixa intermediária de alerta. Isto indica um desequilíbrio metabólico inicial com presença moderada de partículas de LDL menores e mais densas (mais propensas à oxidação). É um excelente momento para intervenções preventivas focadas no estilo de vida.',
        recommendations: [
            'Reduza o consumo de açúcares refinados, farinhas e bebidas açucaradas para diminuir os Triglicerídeos.',
            'Incremente exercícios físicos de resistência e treinos aeróbicos (cardio) para otimizar os níveis e a qualidade do HDL.',
            'Considere avaliar outros fatores metabólicos, como a insulina e a glicose de jejum.'
        ]
    },
    {
        min: 0.241,
        max: 999,
        status: 'Alto Risco Cardiovascular',
        color: '#ef4444', // red-500
        gaugeClass: 'border-t-red-500 border-r-red-500',
        interpretation: 'Seu IAP está elevado. Este padrão tem forte associação clínica com a presença de partículas de LDL pequenas e densas, que penetram facilmente na parede das artérias e causam aterogênese. É um forte sinalizador de resistência insulínica e disfunção metabólica.',
        recommendations: [
            'Consulte um médico integrativo para avaliar marcadores vasculares avançados (como ApoB, PCR-ultrassensível e homocisteína).',
            'Adote uma estratégia nutricional de baixo índice glicêmico (como alimentação Low Carb ou de baixo índice glicêmico) para reduzir a trigliceridemia.',
            'Priorize a melhora da sensibilidade à insulina com atividade física regular e suporte nutricional direcionado.'
        ]
    }
];

// Open a test from the Hub
function openTest(testId) {
    currentTest = testId;
    testQuestions = testsDatabase[testId].questions;
    currentStep = 0;
    answers = [];

    // Setup Wizard UI Text
    document.getElementById('test-category').textContent = testsDatabase[testId].category;
    
    // Hide Hub Screen and Show Wizard with GSAP transition
    gsap.to('#hub-screen', {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('hub-screen').classList.add('hidden');
            
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
    gsap.to('#test-wizard', {
        opacity: 0,
        y: 20,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('test-wizard').classList.add('hidden');
            
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
        actionBtn.className = 'w-full bg-blue-medium hover:bg-opacity-95 text-white font-bold py-4.5 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4 hover:shadow-lg active:scale-[0.98]';
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

// Finish the test: show loader then display results
function finishTest() {
    // Show final progress
    document.getElementById('progress-bar').style.width = '100%';

    // Animate transition to loading screen
    gsap.to('#test-wizard', {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('test-wizard').classList.add('hidden');
            
            const loader = document.getElementById('loading-screen');
            loader.classList.remove('hidden');
            
            gsap.fromTo('#loading-screen', 
                { opacity: 0 },
                { opacity: 1, duration: 0.3 }
            );

            // Calculate results during loading delay (simulate processing)
            let score;
            if (currentTest === 'iap') {
                const tg = answers[0].triglycerides;
                const hdl = answers[0].hdl;
                const tgMmol = tg / 88.57;
                const hdlMmol = hdl / 38.67;
                score = Math.log10(tgMmol / hdlMmol);
            } else {
                score = answers.reduce((acc, curr) => acc + curr.value, 0);
            }
            
            setTimeout(() => {
                showResults(score);
            }, 1800); // 1.8s delay for professional medical-science feel
        }
    });
}

// Display results based on final score
function showResults(score) {
    // Find correct result band
    let resultBand;
    if (currentTest === 'iap') {
        resultBand = iapResults.find(band => score >= band.min && score <= band.max);
        if (!resultBand) resultBand = iapResults[iapResults.length - 1];
    } else {
        resultBand = adrenalResults.find(band => score >= band.min && score <= band.max);
        if (!resultBand) resultBand = adrenalResults[adrenalResults.length - 1];
    }

    // Setup Results UI Text
    const displayScore = (currentTest === 'iap') ? score.toFixed(2) : score;
    document.getElementById('score-display').textContent = displayScore;
    document.getElementById('score-label').textContent = (currentTest === 'iap') ? 'ÍNDICE' : 'PONTOS';
    document.getElementById('status-tag').textContent = resultBand.status;
    document.getElementById('result-interpretation').textContent = resultBand.interpretation;
    
    // Set Status Tag Colors
    const statusTag = document.getElementById('status-tag');
    statusTag.style.backgroundColor = resultBand.color;
    
    // Dynamically update gauge fill rotation and color
    const gaugeFill = document.getElementById('gauge-fill');
    // Clear previous color borders
    gaugeFill.className = "absolute inset-0 rounded-t-full border-8 border-transparent transition-all duration-1000 origin-bottom";
    
    // Calculate angle: standard rotation. 
    // Since full rotation is 180deg for semicircle:
    let angle;
    if (currentTest === 'iap') {
        // Clamp and scale [-0.3, 0.5] range to 180 degrees
        const clampedScore = Math.max(-0.3, Math.min(0.5, score));
        angle = ((clampedScore + 0.3) / 0.8) * 180;
    } else {
        const maxScore = testsDatabase[currentTest].maxScore;
        angle = (score / maxScore) * 180;
    }
    
    // Set colors & rotation
    gaugeFill.style.borderTopColor = resultBand.color;
    gaugeFill.style.borderRightColor = resultBand.color;
    gaugeFill.style.transform = `rotate(${angle - 90}deg)`; // Offset rotation to start from left (-90deg) to right (90deg)

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
    const testData = testsDatabase[currentTest];
    document.getElementById('methodology-title').textContent = testData.methodologyTitle || 'Como funciona a metodologia deste teste?';
    document.getElementById('methodology-text').innerHTML = testData.methodologyText || '';

    // Hide loader and Show results
    gsap.to('#loading-screen', {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
            document.getElementById('loading-screen').classList.add('hidden');
            
            const results = document.getElementById('results-screen');
            results.classList.remove('hidden');
            
            gsap.fromTo('#results-screen',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
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
                hub.classList.remove('hidden');
                gsap.fromTo('#hub-screen', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 });
            }
        });
    }
}

// Expose functions globally for HTML onclick attributes compatibility under Vite ES Modules
window.openTest = openTest;
window.closeTest = closeTest;
window.goToHub = goToHub;
window.prevStep = prevStep;
window.restartTest = restartTest;
window.toggleMethodology = toggleMethodology;
window.submitNumericStep = submitNumericStep;
