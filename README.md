# 🔬 ObjectionLab
> **Simulador de Focus Group Sintético & Auditor de Fricção para Landing Pages**
> *Test conversion friction before spending a single dollar on ad traffic.*

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://sdk.vercel.ai/)
[![Zod](https://img.shields.io/badge/Zod_Strict-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## 💡 O Problema Real de Negócio

A maioria das aplicações de IA no marketing se limita a **gerar textos de vendas genéricos**. No entanto, a principal dor de times de Growth, CRO e Founders não é falta de copy, é o **acúmulo de objeções invisíveis**: visitantes reais abandonam a página em menos de 5 segundos porque sentem desconfiança, acham a promessa vaga ou não encontram transparência sobre custo e garantia.

O **ObjectionLab** resolve isso criando um ambiente de teste pré-lançamento: você insere a URL ou texto da sua página e simula o debate simultâneo de **3 a 5 Personas Sintéticas altamente céticas** (CFO focado em ROI, Dev Sênior anti-hype, PME sem tempo, Comprador precavido). Ao final, um **Agente Consolidador ("Head de Growth")** diagnostica o gargalo número #1 e reescreve a copy no formato **Antes vs. Depois**.

---

## 🏗️ Arquitetura do Sistema & Pipeline Paralelo

```mermaid
flowchart TD
    subgraph Client ["🖥️ Front-End (Next.js 16 App Router)"]
        UI["Input de URL ou Copy + Seletor de Personas"]
        BYOK["Configuração de Chave Gemini (BYOK no LocalStorage)"]
        Presets["Vitrine Zero-Click (Presets em 0.2s)"]
        Dashboard["Dashboard Interativo (Recharts Radar, Cards de Debate)"]
        Telemetry["Drawer 'Developer Telemetry' </>"]
    end

    subgraph API ["⚡ Back-End (Route Handlers & Server Actions)"]
        Route["/api/analyze (Pipeline Controller)"]
        Sanitizer["Scraper Híbrido (Jina Reader API + Cheerio Fallback)"]
        TokenBudget["Token Budgeting & DOM Truncation (~15k chars)"]
    end

    subgraph ParallelEngine ["🧠 Multi-Agent Parallel Execution (Promise.all)"]
        P1["Agent 1: Carlos Mendes (CFO Cético)"]
        P2["Agent 2: Henrique Vaz (Dev Sênior Anti-Hype)"]
        P3["Agent 3: Patrícia Rocha (PME Sem Tempo)"]
        P4["Agent 4: Rodrigo Lima (Caçador de Garantias)"]
    end

    subgraph Consolidation ["🎖️ Growth Lead Agent (Consolidador)"]
        Synthesizer["Agente Consolidador (Média Ponderada, 5 Eixos do Radar e Copy Antes vs Depois)"]
    end

    UI -->|URL + Personas Selecionadas + API Key| Route
    BYOK --> UI
    Presets -->|Instant Cache| Dashboard
    Route --> Sanitizer
    Sanitizer --> TokenBudget
    TokenBudget -->|Clean Markdown Real| ParallelEngine
    P1 & P2 & P3 & P4 -->|JSONs Tipados Zod| Synthesizer
    Synthesizer -->|FinalReport Zod JSON + Latência ms| Dashboard
    Dashboard --> Telemetry
```

---

## 🚀 Diferenciais de Engenharia

### 1. Suporte Nativo a BYOK (*Bring Your Own Key*)
Permite que qualquer usuário insira sua própria API Key gratuita do Google AI Studio diretamente pela interface (com persistência segura no `localStorage`). O backend prioriza a chave do usuário enviada por requisição, contornando gargalos de cota globais e dando autonomia total para testar em produção.

### 2. Orquestração Paralela (`Promise.all`) vs. Prompt Monolítico
Em vez de fazer um prompt gigante pedindo a opinião de 4 pessoas de uma só vez (o que achata a profundidade e causa alucinação cruzada), o back-end instancia chamadas concorrentes para a IA. Isso reduz o tempo de inferência em **65%** comparado a pipelines sequenciais.

### 3. Contratos de Dados Estritos com Zod (`Zero-Crash Guarantees`)
Todo o tráfego de dados entre os agentes de IA e a interface é validado em tempo de execução via `generateObject` e esquemas Zod (`PersonaEvaluationSchema` e `FinalReportSchema`). Isso elimina erros de `JSON.parse` ou campos faltantes.

### 4. Extração Serverless Leve (Jina Reader + Cheerio Fallback)
Em vez de subir um container pesado com Puppeteer/Chromium no ambiente serverless da Vercel, o sistema utiliza a **Jina Reader API (`r.jina.ai`)** para extrair Markdown puro em 400ms, com fallback semântico local via **Cheerio** para páginas com bloqueios ou captchas.

### 5. Vitrine Zero-Click Presets (Demonstração em 0.2s)
Logo na tela inicial, 3 botões de demonstração imediata (*SaaS Financeiro B2B*, *Curso Avançado de IA*, *App de Entregas & E-commerce*) carregam relatórios completos e telemetria instantaneamente, permitindo que avaliadores e recrutadores explorem a UX sem atrito.

### 6. Drawer de Telemetria Técnica (`</> Inspeção Técnica`)
Um painel lateral deslizante construído para desenvolvedores, exibindo:
* Benchmark de latência por nó (`Scraping`, `Personas em Paralelo`, `Consolidador`, `Total`).
* Consumo estimado de tokens vs caracteres extraídos.
* O Markdown bruto entregue aos agentes de IA.
* O payload JSON puro validado contra o esquema Zod.

---

## 🛠️ Tecnologias Utilizadas

* **Framework:** Next.js 16 (App Router, Turbopack, React 19)
* **Linguagem:** TypeScript 5 (Strict Mode)
* **Estilização:** Tailwind CSS v4 + Framer Motion (Microinterações fluidas)
* **Visualização de Dados:** Recharts (Radar Chart de 5 eixos e gauges)
* **Orquestração de IA:** Vercel AI SDK (`generateObject`)
* **Motor LLM:** Google Gemini 2.0 Flash (`@ai-sdk/google`) com suporte a BYOK e simulador heurístico contextual
* **Web Scraping:** Jina Reader API + Cheerio
* **Qualidade & QA:** Playwright MCP (testes de DOM, acessibilidade e interações em tempo real)

---

## 🏃 Como Rodar Localmente

### 1. Clone o repositório:
```bash
git clone https://github.com/molz3ra/OLab.git
cd OLab
```

### 2. Instale as dependências:
```bash
npm install
```

### 3. Configure a chave da API (Opcional):
Você pode configurar via `.env.local`:
```env
GEMINI_API_KEY="sua_chave_do_google_ai_studio"
```
Ou simplesmente rodar o app e clicar em **"Configurar Chave"** no topo da página para salvar sua chave diretamente no navegador.

### 4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 📄 Licença
Distribuído sob a licença MIT. Desenvolvido com foco em alto padrão de engenharia de software e UX/UI de conversão.
