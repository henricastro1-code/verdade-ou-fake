import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// System prompt otimizado para fact-checking
const SYSTEM_PROMPT = `Você é um verificador de fatos. Analise a informação e responda APENAS com JSON válido neste formato exato:

{"veredito":"FALSO","confianca":95,"resumo":"Breve explicação","analise":"Análise detalhada","fontes_consultadas":["fonte1"],"dicas":"Dica para verificar","contexto_juridico":null}

Vereditos possíveis: VERDADEIRO, FALSO, ENGANOSO, SEM_EVIDENCIAS
Confiança: número de 1 a 100
contexto_juridico: string ou null

IMPORTANTE: Responda SOMENTE o JSON, sem texto antes ou depois, sem markdown.`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const text = formData.get('text') as string | null
    const imageFile = formData.get('image') as File | null

    if (!text && !imageFile) {
      return NextResponse.json(
        { error: 'Envie um texto, link ou imagem para verificar.' },
        { status: 400 }
      )
    }

    // Verificar se a API key está configurada
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        veredito: 'SEM_EVIDENCIAS',
        confianca: 0,
        resumo: 'API não configurada.',
        analise: 'Configure a variável ANTHROPIC_API_KEY para usar o verificador.',
        fontes_consultadas: [],
        dicas: 'Configure a API key nas configurações do projeto na Vercel.',
        contexto_juridico: null,
      })
    }

    const client = new Anthropic({ apiKey })

    // Preparar conteúdo para a API
    const content: Anthropic.MessageParam['content'] = []

    // Se houver imagem, processar primeiro
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      
      let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
      if (imageFile.type === 'image/png') mediaType = 'image/png'
      else if (imageFile.type === 'image/gif') mediaType = 'image/gif'
      else if (imageFile.type === 'image/webp') mediaType = 'image/webp'

      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64,
        },
      })
    }

    // Adicionar texto
    const userMessage = text 
      ? `Verifique: "${text}"`
      : 'Verifique o conteúdo desta imagem.'

    content.push({
      type: 'text',
      text: userMessage,
    })

    // Fazer chamada para a API
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
    })

    // Extrair resposta
    const assistantMessage = response.content[0]
    if (assistantMessage.type !== 'text') {
      throw new Error('Resposta inválida da API')
    }

    // Parsear JSON da resposta
    let result
    try {
      let jsonText = assistantMessage.text.trim()
      
      // Remover possíveis markdown code blocks
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
      
      // Tentar encontrar o JSON na resposta
      const jsonStart = jsonText.indexOf('{')
      const jsonEnd = jsonText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
      }
      
      result = JSON.parse(jsonText)
      
      // Validar campos obrigatórios
      if (!result.veredito || !['VERDADEIRO', 'FALSO', 'ENGANOSO', 'SEM_EVIDENCIAS'].includes(result.veredito)) {
        result.veredito = 'SEM_EVIDENCIAS'
      }
      if (typeof result.confianca !== 'number') {
        result.confianca = 50
      }
      if (!result.resumo) result.resumo = 'Análise realizada.'
      if (!result.analise) result.analise = assistantMessage.text
      if (!result.fontes_consultadas) result.fontes_consultadas = []
      if (!result.dicas) result.dicas = 'Verifique sempre em fontes oficiais.'
      
    } catch (parseError) {
      // Se falhar o parse, criar resposta estruturada com o texto original
      result = {
        veredito: 'SEM_EVIDENCIAS',
        confianca: 50,
        resumo: 'Análise realizada mas formato de resposta inesperado.',
        analise: assistantMessage.text.substring(0, 500),
        fontes_consultadas: [],
        dicas: 'Tente novamente ou reformule a pergunta.',
        contexto_juridico: null,
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na verificação:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    // Retornar resultado estruturado mesmo em caso de erro
    return NextResponse.json({
      veredito: 'SEM_EVIDENCIAS',
      confianca: 0,
      resumo: 'Erro ao processar. Tente novamente.',
      analise: `Erro técnico: ${errorMessage}`,
      fontes_consultadas: [],
      dicas: 'Se o erro persistir, tente mais tarde.',
      contexto_juridico: null,
    })
  }
}
