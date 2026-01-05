'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  Search, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  Loader2,
  Link as LinkIcon,
  FileText,
  Image as ImageIcon,
  X,
  Shield,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react'

type VerdictType = 'VERDADEIRO' | 'FALSO' | 'ENGANOSO' | 'SEM_EVIDENCIAS' | null

interface VerificationResult {
  verdict: VerdictType
  confidence: number
  summary: string
  explanation: string
  context?: string
  sources?: string[]
  tips?: string[]
}

const verdictConfig = {
  VERDADEIRO: {
    icon: CheckCircle2,
    color: 'bg-emerald-500',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Verdadeiro',
    description: 'A informação é factualmente correta'
  },
  FALSO: {
    icon: XCircle,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Falso',
    description: 'A informação é factualmente incorreta'
  },
  ENGANOSO: {
    icon: AlertTriangle,
    color: 'bg-amber-500',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'Enganoso',
    description: 'Contém elementos verdadeiros mas distorce a realidade'
  },
  SEM_EVIDENCIAS: {
    icon: HelpCircle,
    color: 'bg-slate-500',
    textColor: 'text-slate-700',
    bgLight: 'bg-slate-50',
    borderColor: 'border-slate-200',
    label: 'Sem Evidências',
    description: 'Não há informações suficientes para verificar'
  }
}

export default function HomePage() {
  const [inputText, setInputText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)

  const detectInputType = useCallback((text: string) => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
    if (urlPattern.test(text.trim())) {
      setInputType('url')
    } else {
      setInputType('text')
    }
  }, [])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setInputText(value)
    detectInputType(value)
    setError(null)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo: 10MB')
        return
      }
      setImageFile(file)
      setInputType('image')
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setInputType(inputText ? 'text' : 'text')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleVerify = async () => {
    if (!inputText.trim() && !imageFile) {
      setError('Cole um texto, link ou envie uma imagem para verificar')
      return
    }

    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('text', inputText)
      formData.append('type', inputType)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const response = await fetch('/api/verificar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao verificar')
      }

      const data = await response.json()
      setResult(data)
      
      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar sua solicitação')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleVerify()
    }
  }

  const clearAll = () => {
    setInputText('')
    setImageFile(null)
    setImagePreview(null)
    setResult(null)
    setError(null)
    setInputType('text')
  }

  return (
    <main className="min-h-screen noise-bg">
      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-trust-800/5 rounded-full text-trust-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            <span>Ferramenta anti-desinformação</span>
          </div>
          
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-trust-900 mb-4 tracking-tight">
            Verdade <span className="italic text-trust-600">ou</span> Fake<span className="text-trust-400">?</span>
          </h1>
          
          <p className="text-trust-600 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Cole aquele texto suspeito, link duvidoso ou print de WhatsApp. 
            <span className="font-medium text-trust-700"> Vamos verificar juntos.</span>
          </p>
        </div>
      </header>

      {/* Main Content */}
      <section className="relative z-10 px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Input Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-trust-900/5 border border-trust-100 overflow-hidden">
            {/* Input Type Indicator */}
            <div className="flex items-center gap-2 px-5 py-3 bg-trust-50 border-b border-trust-100">
              {inputType === 'url' && (
                <>
                  <LinkIcon className="w-4 h-4 text-trust-500" />
                  <span className="text-sm text-trust-600 font-medium">Link detectado</span>
                </>
              )}
              {inputType === 'text' && !imageFile && (
                <>
                  <FileText className="w-4 h-4 text-trust-500" />
                  <span className="text-sm text-trust-600 font-medium">Texto para análise</span>
                </>
              )}
              {inputType === 'image' && (
                <>
                  <ImageIcon className="w-4 h-4 text-trust-500" />
                  <span className="text-sm text-trust-600 font-medium">Imagem para análise</span>
                </>
              )}
            </div>

            {/* Text Input */}
            <div className="p-5">
              <textarea
                value={inputText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder="Cole aqui o texto, notícia ou link que você quer verificar..."
                className="w-full h-40 text-trust-800 placeholder:text-trust-400 text-lg leading-relaxed focus:outline-none resize-none"
                disabled={isAnalyzing}
              />
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="px-5 pb-4">
                <div className="relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-48 rounded-lg border border-trust-200 shadow-sm"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-trust-800 text-white rounded-full hover:bg-trust-700 transition-colors"
                    aria-label="Remover imagem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between px-5 py-4 bg-trust-50/50 border-t border-trust-100">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2.5 text-trust-600 hover:text-trust-800 hover:bg-trust-100 rounded-xl cursor-pointer transition-all text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar print</span>
                </label>
                
                {(inputText || imageFile) && (
                  <button
                    onClick={clearAll}
                    className="px-4 py-2.5 text-trust-500 hover:text-trust-700 hover:bg-trust-100 rounded-xl transition-all text-sm font-medium"
                  >
                    Limpar
                  </button>
                )}
              </div>

              <button
                onClick={handleVerify}
                disabled={isAnalyzing || (!inputText.trim() && !imageFile)}
                className="flex items-center gap-2 px-6 py-3 bg-trust-800 hover:bg-trust-900 disabled:bg-trust-300 text-white rounded-xl font-semibold transition-all disabled:cursor-not-allowed shadow-lg shadow-trust-800/20 hover:shadow-xl hover:shadow-trust-800/30"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analisando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Verificar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-3 animate-fade-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <div className="mt-8 text-center animate-fade-in">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-trust-200 pulse-ring" />
                <div className="relative w-16 h-16 rounded-full bg-trust-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-trust-600 animate-pulse" />
                </div>
              </div>
              <p className="mt-4 text-trust-600 font-medium">
                Analisando conteúdo
                <span className="loading-dots ml-1">
                  <span className="inline-block">.</span>
                  <span className="inline-block">.</span>
                  <span className="inline-block">.</span>
                </span>
              </p>
              <p className="mt-1 text-trust-400 text-sm">Verificando fontes e checando fatos</p>
            </div>
          )}

          {/* Result */}
          {result && result.verdict && (
            <div ref={resultRef} className="mt-8 verdict-card">
              {(() => {
                const config = verdictConfig[result.verdict]
                const Icon = config.icon
                
                return (
                  <div className={`${config.bgLight} ${config.borderColor} border rounded-2xl overflow-hidden`}>
                    {/* Verdict Header */}
                    <div className={`${config.color} px-6 py-5 text-white`}>
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                          <Icon className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-white/80 text-sm font-medium uppercase tracking-wide">Veredito</p>
                          <h2 className="text-3xl font-display font-bold">{config.label}</h2>
                        </div>
                        {result.confidence > 0 && (
                          <div className="ml-auto text-right">
                            <p className="text-white/80 text-sm">Confiança</p>
                            <p className="text-2xl font-bold">{result.confidence}%</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                      {/* Summary */}
                      <div>
                        <h3 className={`text-sm font-semibold ${config.textColor} uppercase tracking-wide mb-2`}>
                          Resumo
                        </h3>
                        <p className="text-trust-800 text-lg leading-relaxed">
                          {result.summary}
                        </p>
                      </div>

                      {/* Explanation */}
                      <div>
                        <h3 className={`text-sm font-semibold ${config.textColor} uppercase tracking-wide mb-2`}>
                          Por que chegamos a esse veredito
                        </h3>
                        <p className="text-trust-700 leading-relaxed">
                          {result.explanation}
                        </p>
                      </div>

                      {/* Context */}
                      {result.context && (
                        <div className="p-4 bg-white rounded-xl border border-trust-200">
                          <div className="flex items-start gap-3">
                            <Info className="w-5 h-5 text-trust-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <h3 className="text-sm font-semibold text-trust-700 mb-1">
                                Contexto importante
                              </h3>
                              <p className="text-trust-600 text-sm leading-relaxed">
                                {result.context}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sources */}
                      {result.sources && result.sources.length > 0 && (
                        <div>
                          <h3 className={`text-sm font-semibold ${config.textColor} uppercase tracking-wide mb-2`}>
                            Fontes consultadas
                          </h3>
                          <ul className="space-y-2">
                            {result.sources.map((source, index) => (
                              <li key={index} className="flex items-center gap-2 text-trust-600 text-sm">
                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                <span>{source}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Tips */}
                      {result.tips && result.tips.length > 0 && (
                        <div className="pt-4 border-t border-trust-200">
                          <h3 className="text-sm font-semibold text-trust-700 mb-3 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            Dicas para verificar você mesmo
                          </h3>
                          <ul className="space-y-2">
                            {result.tips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2 text-trust-600 text-sm">
                                <ArrowRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-trust-400" />
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Tips Section */}
          {!result && !isAnalyzing && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: LinkIcon,
                  title: 'Links',
                  description: 'Cole links de notícias ou posts para verificar'
                },
                {
                  icon: FileText,
                  title: 'Textos',
                  description: 'Cole mensagens de WhatsApp ou textos suspeitos'
                },
                {
                  icon: ImageIcon,
                  title: 'Imagens',
                  description: 'Envie prints de posts ou mensagens'
                }
              ].map((item, index) => (
                <div 
                  key={index}
                  className="p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-trust-100 text-center hover:bg-white hover:shadow-md transition-all"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-trust-100 text-trust-600 mb-3">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-trust-800 mb-1">{item.title}</h3>
                  <p className="text-trust-500 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-trust-200/50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-trust-500 text-sm">
            Esta ferramenta usa IA para auxiliar na verificação de fatos. 
            <span className="font-medium text-trust-600"> Sempre confirme informações importantes com fontes oficiais.</span>
          </p>
          <p className="text-trust-400 text-xs mt-2">
            Powered by Claude AI • Desenvolvido para combater a desinformação
          </p>
        </div>
      </footer>
    </main>
  )
}
