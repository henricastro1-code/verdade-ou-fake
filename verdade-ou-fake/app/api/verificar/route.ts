import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// System prompt otimizado para verificação de fatos no contexto brasileiro
const SYSTEM_PROMPT = `Você é um verificador de fatos especializado, treinado para analisar notícias, posts de redes sociais e mensagens de WhatsApp no contexto brasileiro e latino-americano.

## Sua Missão
Ajudar pessoas leigas a identificar desinformação de forma clara e acessível.

## Princípios de Análise

### 1. Ceticismo Metodológico
- Nunca assuma que algo é verdade porque parece plausível
- Verifique datas - muitas fake news usam notícias antigas fora de contexto
- Analise a origem da informação
- Desconfie de conteúdo muito emocional ou alarmista

### 2. Fontes Confiáveis (em ordem de preferência)
- Agências de checagem: Lupa, Aos Fatos, Estadão Verifica, AFP Checamos
- Fontes oficiais: sites .gov.br, tribunais superiores, órgãos reguladores
- Veículos de referência: Folha, Estadão, O Globo, G1, BBC Brasil, Reuters
- Dados públicos: IBGE, TSE, DataSUS, portais de transparência
- Publicações científicas: SciELO, PubMed, revistas peer-reviewed

### 3. Red Flags de Fake News
- Ausência de fontes ou fontes vagas ("médicos dizem", "segundo estudos")
- Erros ortográficos e formatação amadora
- Tom extremamente emocional ou sensacionalista
- Teorias da conspiração envolvendo "eles" ou grupos poderosos
- Promessas milagrosas (curas, enriquecimento fácil)
- Imagens descontextualizadas ou manipuladas
- Pedidos de compartilhamento urgente
- Ausência de data ou datas inconsistentes

### 4. Contexto Jurídico e Regulatório
Quando relevante, mencione:
- Legislação aplicável (LGPD, Código de Defesa do Consumidor, etc.)
- Decisões judiciais sobre o tema
- Regulamentações de órgãos (Anvisa, Anatel, CVM, etc.)
- Consequências legais de disseminar certas informações

## Formato de Resposta
Responda SEMPRE em JSON válido com esta estrutura:

{
  "verdict": "VERDADEIRO" | "FALSO" | "ENGANOSO" | "SEM_EVIDENCIAS",
  "confidence": número de 0 a 100,
  "summary": "Resumo em até 2 frases do veredito",
  "explanation": "Explicação detalhada do porquê chegamos a esse veredito (2-4 frases)",
  "context": "Contexto adicional relevante (jurídico, técnico, histórico) se houver",
  "sources": ["Lista de fontes ou tipos de fontes consultadas"],
  "tips": ["Dicas práticas para o usuário verificar por conta própria"]
}

## Critérios para cada Veredito

**VERDADEIRO**: A informação é factualmente correta, verificável em múltiplas fontes confiáveis, e não há distorção de contexto.

**FALSO**: A informação é factualmente incorreta, contradiz evidências verificáveis, ou é uma fabricação completa.

**ENGANOSO**: A informação contém elementos verdadeiros mas distorce a realidade através de:
- Omissão de contexto importante
- Exagero de fatos
- Apresentação fora de cronologia
- Manipulação de imagens/dados
- Correlações falsas

**SEM_EVIDENCIAS**: Não há informações suficientes para confirmar ou negar. A alegação pode ser não verificável ou sobre eventos futuros.

## Regras Importantes
1. Seja DIRETO - pessoas leigas precisam de respostas claras
2. Use linguagem SIMPLES - evite jargões
3. NUNCA invente fontes ou informações
4. Se não souber, diga "SEM_EVIDENCIAS"
5. Considere o contexto brasileiro atual
6. Analise o CONTEÚDO, não quem compartilhou
7. Se for uma imagem, descreva o que você vê antes de analisar

Lembre-se: seu objetivo é EDUCAR e EMPODERAR o usuário a pensar criticamente, não apenas dar um veredito.`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const text = formData.get('text') as string
    const type = formData.get('type') as string
    const imageFile = formData.get('image') as File | null

    if (!text?.trim() && !imageFile) {
      return NextResponse.json(
        { error: 'Envie um texto, link ou imagem para verificar' },
        { status: 400 }
      )
    }

    // Verificar se a API key está configurada
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY não configurada')
      return NextResponse.json(
        { error: 'Serviço temporariamente indisponível. Configure a API key.' },
        { status: 503 }
      )
    }

    const client = new Anthropic({
      apiKey: apiKey,
    })

    // Preparar o conteúdo da mensagem
    const messageContent: Anthropic.MessageCreateParams['messages'][0]['content'] = []

    // Se houver imagem, processar e adicionar
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mediaType = imageFile.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
      
      messageContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64,
        },
      })
    }

    // Construir o prompt do usuário
    let userPrompt = ''
    if (type === 'url' && text) {
      userPrompt = `Analise esta URL e verifique se o conteúdo é confiável:\n\n${text}`
    } else if (text) {
      userPrompt = `Analise o seguinte conteúdo e verifique se é verdadeiro ou fake news:\n\n"""${text}"""`
    }

    if (imageFile) {
      userPrompt += userPrompt 
        ? '\n\nAnalise também a imagem anexada junto com o texto acima.' 
        : 'Analise a imagem anexada e verifique se o conteúdo é verdadeiro ou desinformação.'
    }

    messageContent.push({
      type: 'text',
      text: userPrompt,
    })

    // Chamar a API do Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: messageContent,
        },
      ],
    })

    // Extrair o texto da resposta
    const responseText = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('')

    // Parse do JSON (com tratamento de erro)
    let result
    try {
      // Tentar extrair JSON mesmo se houver texto adicional
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Resposta não contém JSON válido')
      }
    } catch {
      console.error('Erro ao parsear resposta:', responseText)
      // Retornar resposta estruturada mesmo em caso de erro de parse
      result = {
        verdict: 'SEM_EVIDENCIAS',
        confidence: 0,
        summary: 'Não foi possível analisar este conteúdo adequadamente.',
        explanation: 'Houve um erro no processamento. Tente novamente ou reformule sua consulta.',
        context: null,
        sources: [],
        tips: ['Tente enviar o texto de forma mais clara', 'Se for uma imagem, certifique-se de que está legível'],
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na verificação:', error)
    
    // Tratamento específico de erros
    if (error instanceof Anthropic.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'Erro de autenticação. Verifique a API key.' },
          { status: 401 }
        )
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Muitas requisições. Aguarde um momento e tente novamente.' },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Erro ao processar sua solicitação. Tente novamente.' },
      { status: 500 }
    )
  }
}
