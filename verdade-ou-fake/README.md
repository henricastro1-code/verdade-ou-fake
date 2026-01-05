# Verdade ou Fake? 🔍

Ferramenta simples para verificar notícias, posts de redes sociais e correntes de WhatsApp usando IA.

## 🎯 O que faz?

- Analisa textos, links e imagens
- Retorna um veredito: **Verdadeiro**, **Falso**, **Enganoso** ou **Sem Evidências**
- Explica o raciocínio de forma simples
- Dá dicas de como verificar sozinho no futuro

## 🚀 Deploy Rápido na Vercel (5 minutos)

### Opção 1: Deploy Direto (Recomendado)

1. **Faça fork** deste repositório no GitHub

2. **Acesse [vercel.com](https://vercel.com)** e faça login com GitHub

3. **Clique em "Add New Project"** e selecione o repositório

4. **Configure a variável de ambiente**:
   - Nome: `ANTHROPIC_API_KEY`
   - Valor: sua chave da API (pegue em [console.anthropic.com](https://console.anthropic.com/))

5. **Clique em "Deploy"** - pronto!

### Opção 2: Via CLI

```bash
# Instale a Vercel CLI
npm i -g vercel

# Na pasta do projeto
vercel

# Siga as instruções e adicione a env var quando perguntado
```

## 💻 Rodando Localmente

### Pré-requisitos

- Node.js 18+ instalado
- Chave de API da Anthropic

### Passos

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/verdade-ou-fake.git
cd verdade-ou-fake

# 2. Instale as dependências
npm install

# 3. Configure a API key
cp .env.example .env.local
# Edite .env.local e adicione sua ANTHROPIC_API_KEY

# 4. Rode o projeto
npm run dev

# 5. Acesse http://localhost:3000
```

## 📁 Estrutura do Projeto

```
verdade-ou-fake/
├── src/
│   └── app/
│       ├── api/
│       │   └── verify/
│       │       └── route.ts    # Backend - processa verificações
│       ├── globals.css         # Estilos globais
│       ├── layout.tsx          # Layout base
│       └── page.tsx            # Página principal
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 🔧 Configuração da API

A aplicação usa a API da Anthropic (Claude). Você precisa:

1. Criar conta em [console.anthropic.com](https://console.anthropic.com/)
2. Gerar uma API key
3. Adicionar no ambiente como `ANTHROPIC_API_KEY`

**Custo estimado:** ~$0.01-0.03 por verificação (modelo claude-sonnet-4-20250514)

## 🛡️ Limitações

- A IA pode cometer erros - sempre verifique informações críticas
- Não substitui verificação de fatos profissional
- Funciona melhor com conteúdo em português
- Imagens muito pesadas (>10MB) são rejeitadas

## 📝 Customizações Possíveis

### Mudar o modelo

Em `src/app/api/verify/route.ts`, altere:
```typescript
model: 'claude-sonnet-4-20250514', // para outro modelo
```

### Ajustar o System Prompt

O prompt de análise está em `src/app/api/verify/route.ts` na constante `SYSTEM_PROMPT`. Você pode ajustar para:
- Ser mais ou menos rigoroso
- Focar em tipos específicos de desinformação
- Adicionar contexto regional

## 📄 Licença

MIT - use como quiser.

---

Feito para combater a desinformação. 🇧🇷
