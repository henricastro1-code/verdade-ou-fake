import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// System prompt otimizado para fact-checking
const SYSTEM_PROMPT = `Você é um verificador de fatos especializado, cético e rigoroso. Seu trabalho é analisar textos, URLs, imagens e afirmações para determinar sua veracidade.

## PRINCÍPIOS DE ANÁLISE:

1. **Ceticismo Metodológico**: Parta do princípio de que qualquer afirmação extraordinária requer evidências extraordinárias.

2. **Verificação Temporal**: Analise se a informação está desatualizada ou se refere a eventos antigos apresentados como novos.

3. **Análise de Fonte**: Considere a credibilidade da fonte. Prefira fontes primárias (documentos oficiais, estudos científicos, comunicados institucionais).

4. **Detecção de Manipulação**: Identifique:
   - Citações fora de contexto
   - Imagens manipuladas ou descontextualizadas
   - Estatísticas distorcidas
   - Apelos emocionais sem base factual
   - Teorias conspiratórias

5. **Contexto Jurídico/Técnico**: Quando relevante, explique implicações legais ou técnicas de forma simples.

6. **Viés Político**: Seja absolutamente neutro. Não favoreça nenhum lado político.

## FORMATO DE RESPOSTA:

Você DEVE responder EXCLUSIVAMENTE em formato JSON válido, sem nenhum texto adicional antes ou depois:

{
  "veredito": "VERDADEIRO" | "FALSO" | "ENGANOSO" | "SEM_EVIDENCIAS",
  "confianca": número de 1 a 100,
  "resumo": "Explicação de no máximo 2 frases curtas sobre o veredito",
  "analise": "Análise mais detalhada em 2-4 frases, incluindo contexto relevante",
  "fontes_consultadas": ["lista de fontes ou bases de conhecimento usadas"],
  "dicas": "Dica prática sobre como o usuário pode verificar isso sozinho no futuro",
  "contexto_juridico": "Se houver implicações legais relevantes, explique brevemente. Caso contrário, null"
}

## DEFINIÇÕES DOS VEREDITOS:

- **VERDADEIRO**: Informação factualmente correta, verificável e em contexto adequado.
- **FALSO**: Informação comprovadamente incorreta ou fabricada.
- **ENGANOSO**: Contém elementos verdadeiros mas apresentados de forma distorcida, fora de contexto ou com conclusões incorretas.
- **SEM_EVIDENCIAS**: Não é possível confirmar ou refutar com as informações disponíveis.

## IMPORTANTE:

- Seja direto e claro. Evite jargões.
- Se a informação for sobre saúde, sempre recomende consultar profissionais.
- Se envolver questões jurídicas, indique a necessidade de consulta especializada.
- NUNCA invente fatos ou fontes.
- Se não souber, admita. Prefira "SEM_EVIDENCIAS" a chutar.`

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
      // Modo demo sem API key
      return NextResponse.json({
        veredito: 'SEM_EVIDENCIAS',
        confianca: 0,
        resumo: 'API não configurada. Configure a variável ANTHROPIC_API_KEY para usar o verificador.',
        analise: 'Esta é uma resposta de demonstração. Para funcionar de verdade, você precisa adicionar sua chave de API da Anthropic nas variáveis de ambiente do projeto.',
        fontes_consultadas: ['Nenhuma - modo demo'],
        dicas: 'Configure a API key seguindo as instruções do README.',
        contexto_juridico: null,
        modo_demo: true
      })
    }

    const client = new Anthropic({ apiKey })

    // Preparar conteúdo para a API
    const content: Anthropic.MessageParam['content'] = []

    // Se houver imagem, processar primeiro
    if (imageFile) {
      const bytes = await imageFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      
      // Determinar media type
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
      ? `Analise e verifique a seguinte informação:\n\n"${text}"\n\nResponda APENAS com o JSON no formato especificado.`
      : 'Analise a imagem enviada e verifique se o conteúdo apresentado é verdadeiro. Transcreva o texto visível e faça a verificação. Responda APENAS com o JSON no formato especificado.'

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
      // Tentar extrair JSON de markdown code block se necessário
      let jsonText = assistantMessage.text.trim()
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim()
      }
      result = JSON.parse(jsonText)
    } catch {
      // Se falhar o parse, retornar erro estruturado
      return NextResponse.json({
        veredito: 'SEM_EVIDENCIAS',
        confianca: 0,
        resumo: 'Erro ao processar a resposta. Tente novamente.',
        analise: assistantMessage.text,
        fontes_consultadas: [],
        dicas: 'Tente reformular sua pergunta ou enviar um conteúdo mais claro.',
        contexto_juridico: null,
      })
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Erro na verificação:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar sua solicitação. Tente novamente.',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
