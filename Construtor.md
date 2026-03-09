# PROMPT PARA CRIAÇÃO DE LANDING PAGE - MENTORIA DR. GUSTAVO SISANT
## Antigravity - Google

## CONTEXTO DO PROJETO
Criar uma landing page premium de alta conversão para venda de mentoria médica high-ticket. O público-alvo são profissionais da saúde (médicos, nutricionistas) que buscam aprofundamento em análise funcional de exames e prescrição médica avançada.

**ABORDAGEM DE DESENVOLVIMENTO: MOBILE FIRST**
- Desenvolver primeiro para mobile (320px-768px)
- Expandir progressivamente para tablet e desktop
- Todos os elementos devem ser touch-friendly
- Priorizar performance em dispositivos móveis

---

## IDENTIDADE VISUAL

### Paleta de Cores
- **Azul escuro/Navy**: #1a273c (cor principal - títulos, backgrounds escuros)
- **Azul médio**: #2167b0ff (destaques, badges, elementos secundários e de conversão)
- **Bege**: #957854 (detalhes, elementos terciários)
- **Bege claro**: #e7e0d0 (backgrounds suaves, cards)
- **Cinza claro**: #f8f8f8 (backgrounds de seções alternadas)
- **Branco**: #FFFFFF (cards, textos em fundos escuros)

### Tipografia
- **Headings**: Poppins Bold (ou similar sans-serif moderna e limpa)
- **Subheadings**: Poppins Medium
- **Corpo de texto**: Poppins Regular/Light
- Hierarquia clara: H1 (32-40px), H2 (28-32px), H3 (20-24px), Body (16-18px)

### Estilo Visual
- Design minimalista e sofisticado
- Espaço em branco (breathing space)
- Cards com bordas arredondadas (border-radius: 12-16px)
- Sombras sutis (box-shadow: 0 4px 20px rgba(0,0,0,0.05))
- Ícones outline minimalistas (line-weight: 2px)
- Badges/tags pequenas para categorizar seções
- Alternância entre backgrounds claros e escuros

### Micro-Interações

Todos os botões devem ter uma sensação "magnética": sutil scale(1.03) no hover com cubic-bezier(0.25, 0.46, 0.45, 0.94).
Botões usam overflow-hidden com uma camada <span> deslizante de fundo para transições de cor no hover.
Links e elementos interativos recebem um efeito de elevação translateY(-1px) no hover.

### Ciclo de Vida de Animações

Use gsap.context() dentro de useEffect para TODAS as animações. Retorne ctx.revert() na função de cleanup.
Easing padrão: power3.out para entradas, power2.inOut para transformações.
Valor de stagger: 0.08 para texto, 0.15 para cards/containers.

---

## ESTRUTURA DA LANDING PAGE

### 1. HERO SECTION (Acima da dobra)
**Background**: Gradiente sutil do bege claro (#e7e0d0) para branco, ou fundo cinza claro (#f8f8f8)

**Elementos**:
- Logo do Dr. Gustavo Sisant centralizada no topo
- Badge pequeno: "FORMAÇÃO 2026" (cor azul médio #2167b0ff, texto branco, bordas arredondadas)
- Título principal (H1, centralizado):
  ```
  MENTORIA EM ANÁLISES DE EXAMES LABORATORIAIS
  Com Abordagem Funcional e Prescrição
  ```
  - Primeira linha em azul escuro (#1a273c), bold, 36-40px
  - Segunda linha em azul médio (#37608c), regular, 20-24px

- **Card principal destacado** (card branco com sombra sutil, linha azul no topo de 4px):
  - Duração: 6 meses | Encontros semanais ao vivo
  - **INVESTIMENTO em destaque**: R$ 11.997,00 (azul médio #2167b0ff, bold, 28-32px)
  - Data de início: 06/04/2026

- **Gancho emocional** (texto centralizado, 18-20px):
  "Você já se sentiu inseguro(a) ao interpretar exames ou ao elaborar uma prescrição realmente assertiva?"

- **CTA primário** (botão grande, azul médio #2167b0ff, texto branco, hover com leve darkening):
  "GARANTIR MINHA VAGA AGORA"

**Nota visual**: Incluir ondas suaves como divisor de seção (estilo das referências)

---

### 2. PROBLEMA + AGITAÇÃO
**Background**: Branco

**Badge**: "O DESAFIO" (azul médio)

**Estrutura**:
- Título (H2): "O problema da formação tradicional"
- Card destacado com borda azul:
  ```
  Um exemplo simples: Você saberia dizer qual seria o nível ideal da homocisteína, 
  mas sabe dizer qual seria a relação com obesidade ou disfunção tireoidiana?
  ```

- **Card destaque navy** (#1a273c, texto branco, centralizado):
  ```
  A maioria dos profissionais aprende a observar números isolados.
  Poucos aprendem a identificar padrões biológicos integrados.
  ```

- Lista com bullet points (ícones de X ou • vermelhos):
  - Aprende-se o número, mas não se entende o mecanismo
  - Aprende-se o protocolo, mas não se domina o raciocínio
  - Prescrições incoerentes e sem fundamento bioquímico sólido
  - Ausência de individualização clínica

---

### 3. TRANSFORMAÇÃO + SOLUÇÃO
**Background**: Cinza claro (#f8f8f8)

**Badge**: "A SOLUÇÃO" (azul médio #2167b0ff)

**Título (H2)**: "Raciocínio clínico refinado — não reprodução automática"

**Grid de cards 2x2** (cards brancos com linha colorida no topo):
Cada card contém:
- Ícone outline minimalista no topo
- Título em negrito
- Texto explicativo curto

**Cards**:
1. **Entender o mecanismo antes da conduta**
   - Ícone: cérebro/neurônios outline
   
2. **Compreender a fisiologia antes da suplementação**
   - Ícone: DNA/molécula outline

3. **Correlacionar sistemas antes de prescrever**
   - Ícone: conexões/rede outline

4. **Individualizar antes de intervir**
   - Ícone: pessoa/paciente outline

**Card destaque final** (azul médio #2167b0ff, texto branco):
```
Você não sairá apenas com protocolos.
Você sairá com raciocínio clínico refinado.
```

---

### 4. O QUE VOCÊ VAI DESENVOLVER
**Background**: Branco

**Badge**: "COMPETÊNCIAS" (azul médio)

**Título (H2)**: "O que você vai desenvolver"

**Grid 2 colunas** de cards (5 cards no total, o último pode ficar centralizado):
1. Leitura funcional além dos valores de referência
2. Identificação de inflamação subclínica
3. Análise de padrões metabólicos e hormonais
4. Correlação entre sistemas (intestino, imunidade, metabolismo e eixo hormonal)
5. Prescrição estratégica baseada em evidências

**Estilo dos cards**: Fundo branco, borda arredondada, linha azul no topo (4px), ícone outline, texto em azul escuro

---

### 5. ESTRUTURA DA MENTORIA
**Background**: Azul escuro/Navy (#1a273c) - TODA A SEÇÃO EM FUNDO ESCURO

**Badge**: "PROGRAMA" (branco com texto navy)

**Título (H2, branco)**: "Estrutura da Mentoria"

**Lista em duas colunas** (texto branco, checkmarks azuis):
- Aulas ao vivo semanais (60 min) ou quinzenais (120 min)
- Interpretação funcional baseada em evidências
- Discussão prática de casos clínicos reais (inclusive os seus)
- Elaboração de protocolos personalizados
- Prescrição oral e injetável com segurança
- Acesso aos protocolos validados pelo Dr. Gustavo há mais de 10 anos
- Grupo exclusivo de networking
- 2 aulas online com o estrategista Dr. Anderson Freitas
- Aplicação supervisionada na sua rotina clínica

**Cards destacados** (fundo levemente mais claro que o navy, ou com bordas):

**Card 1**: HANDS-ON EM TERAPIA INJETÁVEL E IMPLANTES HORMONAIS
- Terapias injetáveis
- Planejamento e execução de protocolos hormonais
- Implantes hormonais
- Técnica, segurança e manejo de intercorrências

**Card 2**: 1 FINAL DE SEMANA DE VIVÊNCIA CLÍNICA
- Acompanhar atendimentos reais
- Observar análise funcional de exames ao vivo
- Entender a tomada de decisão clínica
- Vivenciar protocolos injetáveis e implantes hormonais
- Consolidar o raciocínio funcional na prática

**Card 3**: 2 SESSÕES INDIVIDUAIS ESTRATÉGICAS
- Discussão aprofundada de casos próprios
- Ajuste fino de prescrição
- Correção de raciocínio clínico
- Refinamento de posicionamento profissional
- Segurança em casos complexos

---

### 6. DIFERENCIAIS / FORMAÇÃO vs MERCADO
**Background**: Cinza claro (#f8f8f8)

**Badge**: "DIFERENCIAIS" (azul médio)

**Título (H2)**: "Uma formação estruturada para quem deseja atuar em alto nível"

**Card com problema do mercado**:
```
O mercado da saúde está saturado de cursos fragmentados:
Cursos de análise laboratorial que não conversam com prescrição.
Treinamentos em hormonioterapia desconectados da bioquímica.
Capacitações técnicas isoladas.

O resultado? Profissionais com informações soltas e insegurança clínica.
```

**Card destaque** (azul escuro):
```
Esta formação integra tudo em uma linha lógica, progressiva e coerente.
```

**Seção**: "Do Fundamento à Alta Complexidade"
Texto:
```
Você inicia compreendendo profundamente os mecanismos fisiológicos.
Avança para leitura funcional estratégica.
E evolui para prescrições complexas — incluindo terapias injetáveis e implantes hormonais — 
sustentadas por raciocínio clínico sólido e prática supervisionada.
```

**O objetivo é desenvolver:**
(Lista com checkmarks azuis)
- Capacidade analítica
- Segurança na tomada de decisão
- Coerência bioquímica
- Domínio técnico progressivo
- Aplicação prática supervisionada

---

### 7. PARA QUEM É
**Background**: Branco

**Badge**: "PÚBLICO" (azul escuro)

**Título (H2)**: "Para quem é"

**Card destacado** (fundo bege claro ou azul suave):
```
Profissionais da saúde que desejam:
```
- Atuar com profundidade técnica
- Prescrever com segurança
- Trabalhar com medicina integrativa
- Diferenciar-se no mercado

---

### 8. SOBRE O DR. GUSTAVO SISANT (opcional, mas recomendado)
**Background**: Cinza claro

**Badge**: "MENTOR" (azul médio)

**Layout**: Imagem do Dr. Gustavo à esquerda, texto à direita (ou centralizado se não houver foto)

**Texto**:
```
Dr. Gustavo Sisant
Médico há 12 anos, pesquisador em medicina da longevidade
Formação em Tecnologia e Ciência, pós-graduação pela PUC
Professor e fundador da Clinic Sisant em Salvador (BA)

Especialista em saúde hormonal, metabolismo, envelhecimento e medicina integrativa.

Criador da metodologia "Visão Funcional" — abordagem que integra dados laboratoriais, 
fatores genéticos, estilo de vida e rotina emocional para estratégias médicas personalizadas.
```

**Frase destaque**:
```
"Medicina com propósito: investigar a causa, tratar a raiz, restaurar o equilíbrio."
```

---

### 9. INVESTIMENTO + CTA FINAL
**Background**: Navy (#1a273c) - SEÇÃO ESCURA FINAL

**Título (H2, branco, centralizado)**: "Garanta sua vaga"

**Card central grande** (pode ter leve transparência ou borda destacada):

**Preço em destaque**: R$ 11.997,00
(Bege claro #e7e0d0, fonte grande 40-48px, bold)

**Detalhes**:
- Duração: 6 meses
- Início: 06/04/2026
- Vagas limitadas para garantir acompanhamento individualizado

**CTA principal** (botão grande, azul médio #2167b0ff):
"QUERO ME INSCREVER AGORA"

**Nota adicional** (texto pequeno, bege claro):
"Parcele em até 12x ou receba desconto à vista"
(se aplicável, ou remover se não for o caso)

---

### 10. FOOTER
**Background**: Azul escuro (#1a273c)

**Informações**:
- Logo do Dr. Gustavo Sisant
- Endereço: Rua Arthur de Azevêdo Machado, 1459 – Sala 1108 – STIEP, Salvador – BA
- WhatsApp: (71) 99994-5001
- Site: drgustavosisant.com

**Social proof** (se disponível):
"122 avaliações no Google"
Estrelas: ⭐⭐⭐⭐⭐

**Links úteis**:
- Política de Privacidade
- Termos de Uso

---

## ELEMENTOS DE DESIGN ESSENCIAIS

### Cards
- Bordas arredondadas: 12-16px
- Sombra sutil: `box-shadow: 0 4px 20px rgba(0,0,0,0.05)`
- Padding interno generoso: 30-40px
- Linha colorida no topo: 4px sólida
- Hover: leve elevação (aumentar sombra)

### Badges/Tags
- Bordas arredondadas: 20px (formato pill)
- Padding: 8px 16px
- Font-size: 11-12px
- Font-weight: Bold
- Letra uppercase

### Ícones
- Estilo: Outline/line icons
- Stroke-width: 2px
- Tamanho: 40-48px
- Cores: azul médio ou verde

### Botões CTA
- Primário (azul médio #2167b0ff): texto branco, bold, padding 16px 40px
- Hover: escurecer 10%, adicionar leve sombra
- Border-radius: 8px
- Font-size: 16-18px

### Espaçamento
- Entre seções: 100-120px
- Entre elementos dentro de seção: 40-60px
- Padding lateral das seções: 10-15% da largura (max-width: 1200px)

### Responsividade
- Mobile: grid 1 coluna, espaçamentos reduzidos 30-50%
- Tablet: 2 colunas quando aplicável
- Desktop: layout completo

### Animações (sutis)
- Scroll reveal: elementos aparecem com fade-in ao rolar
- Hover em cards: leve elevação
- Botões: transição suave de cor

---

## REFERÊNCIAS VISUAIS

### Estilo geral
Landing pages high-ticket com:
- Muito espaço em branco
- Cards com sombras sutis
- Alternância de backgrounds (claro/escuro)
- Tipografia limpa e hierárquica
- Ícones minimalistas outline
- CTAs destacados em azul

### Inspirações visuais
- Design clean e profissional (não corporativo demais)
- Sofisticação médica (evitar clichês de saúde)
- Premium sem ser ostentador
- Confiança e autoridade científica

---

## COPYWRITING - TOM E VOZ

### Tom
- Forte, claro e intencional
- Científico, mas acessível
- Sem rodeios — cada frase tem função
- Educativo, não promocional agressivo

### Evitar
- Linguagem clínica hermética
- Tom genérico de "saúde e bem-estar"
- Exageros ou promessas milagrosas
- Emojis em excesso

### Priorizar
- Títulos que despertam curiosidade ou identificação
- Abertura que prende atenção
- Desenvolvimento progressivo do raciocínio
- Ênfases estratégicas nos conceitos importantes

---

## CONVERSÃO E OTIMIZAÇÃO

### CTAs principais
1. "GARANTIR MINHA VAGA AGORA" (hero)
2. "QUERO DESENVOLVER RACIOCÍNIO CLÍNICO" (meio da página)
3. "QUERO ME INSCREVER AGORA" (final)

### Elementos de trust
- Selo/badge "122 avaliações Google" com estrelas
- "Vagas limitadas" (escassez)
- Data de início específica (urgência sutil)
- Informações completas de contato

### Social proof (se disponível, adicionar seção)
- Depoimentos em cards (estilo das referências enviadas)
- Fotos circulares dos alunos
- Citações curtas e impactantes

---

## INSTRUÇÕES TÉCNICAS PARA IMPLEMENTAÇÃO

### Tecnologia sugerida
- HTML5 semântico
- CSS3 com Flexbox/Grid
- Framework: Tailwind CSS ou Bootstrap 5
- JavaScript vanilla para animações sutis
- Responsivo mobile-first

### Performance
- Imagens otimizadas (WebP quando possível)
- Lazy loading para imagens abaixo da dobra
- Fontes do Google Fonts (Poppins)
- CSS e JS minificados

### SEO
- Title: "Mentoria em Análises de Exames Laboratoriais | Dr. Gustavo Sisant"
- Meta description: Texto persuasivo com foco em raciocínio clínico e medicina funcional
- H1 único, estrutura hierárquica correta
- Alt text em todas as imagens

---

## ENTREGÁVEL ESPERADO

Uma landing page moderna, clean e premium que:
1. Comunique claramente o valor da mentoria
2. Estabeleça autoridade e confiança do Dr. Gustavo
3. Diferencie a formação de cursos fragmentados do mercado
4. Conduza naturalmente para a conversão
5. Seja responsiva e performática
6. Reflita sofisticação adequada ao ticket de R$ 11.997,00

**Prioridade visual**: Inspirar-se nas referências de landing pages high-ticket com cards brancos, alternância de backgrounds, ícones outline e design minimalista premium.