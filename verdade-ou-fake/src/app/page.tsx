'use client'

import { useState, useRef, useCallback } from 'react'
import { 
  Search, 
  Upload, 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Loader2,
  Shield,
  Link2,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Lightbulb,
  Scale
} from 'lucide-react'

type Veredito = 'VERDADEIRO' | 'FALSO' | 'ENGANOSO' | 'SEM_EVIDENCIAS'

interface VerificationResult {
  veredito: Veredito
  confianca: number
  resumo: string
  analise: string
  fontes_consultadas: string[]
  dicas: string
  contexto_juridico: string | null
  modo_demo?: boolean
  error?: string
}

const veredictoConfig = {
  VERDADEIRO: {
    icon: CheckCircle2,
    label: 'Verdadeiro',
    className: 'verdict-true',
    textColor: 'text-emerald-700',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  FALSO: {
    icon: XCircle,
    label: 'Falso',
    className: 'verdict-false',
    textColor: 'text-red-700',
    bgLight: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  ENGANOSO: {
    icon: AlertTriangle,
    label: 'Enganoso',
    className: 'verdict-misleading',
    textColor: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  SEM_EVIDENCIAS: {
    icon: HelpCircle,
    label: 'Sem Evidências',
    className: 'verdict-unverified',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
}

export default function Home() {
  const [text, setText] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Imagem muito grande. Máximo de 10MB.')
        return
      }
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }, [])

  const removeImage = useCallback(() => {
    setImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim() && !image) {
      setError('Cole um texto, link ou envie uma imagem para verificar.')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      if (text.trim()) {
        formData.append('text', text.trim())
      }
      if (image) {
        formData.append('image', image)
      }

      const response = await fetch('/api/verify', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao verificar.')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar sua solicitação.')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setText('')
    setImage(null)
    setImagePreview(null)
    setResult(null)
    setError(null)
  }

  const detectInputType = (value: string): 'url' | 'text' | null => {
    if (!value.trim()) return null
    try {
      new URL(value.trim())
      return 'url'
    } catch {
      return 'text'
    }
  }

  const inputType = detectInputType(text)

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-6 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy-800 to-navy-900 flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-navy-900 tracking-tight">
                Verdade ou Fake?
              </h1>
              <p className="text-xs text-slate-500">Verificador de Fatos</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">
            Ferramenta anti-desinformação
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          {/* Hero Section */}
          {!result && (
            <div className="text-center mb-8 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-3">
                Verifique antes de compartilhar
              </h2>
              <p className="text-slate-600 text-lg">
                Cole o texto, link ou envie um print da notícia suspeita
              </p>
            </div>
          )}

          {/* Input Form */}
          {!result && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
              {/* Main Input Card */}
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
                {/* Text Input */}
                <div className="relative">
                  <textarea
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value)
                      setError(null)
                    }}
                    placeholder="Cole aqui o texto, link ou corrente de WhatsApp..."
                    className="w-full min-h-[160px] p-5 text-lg text-navy-800 placeholder:text-slate-400 resize-none border-0 focus:ring-0"
                    disabled={isLoading}
                  />
                  
                  {/* Input Type Indicator */}
                  {inputType && (
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        inputType === 'url' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {inputType === 'url' ? (
                          <>
                            <Link2 className="w-3 h-3" />
                            Link detectado
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3" />
                            Texto
                          </>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {/* Divider with OR */}
                <div className="relative px-5">
                  <div className="absolute inset-0 flex items-center px-5">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-sm text-slate-400">ou</span>
                  </div>
                </div>

                {/* Image Upload Area */}
                <div className="p-5">
                  {imagePreview ? (
                    <div className="relative image-preview">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full max-h-64 object-contain rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-navy-300 hover:bg-slate-50/50 transition-all group">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-navy-100 transition-colors">
                        <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-navy-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-600">
                        Envie um print ou foto
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        PNG, JPG ou WebP até 10MB
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || (!text.trim() && !image)}
                className="w-full py-4 px-6 bg-gradient-to-r from-navy-800 to-navy-900 hover:from-navy-700 hover:to-navy-800 text-white font-semibold rounded-xl shadow-lg shadow-navy-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Verificar Fato
                  </>
                )}
              </button>

              {/* Helper text */}
              <p className="text-center text-xs text-slate-400">
                Esta ferramenta usa IA para análise. Sempre verifique em fontes oficiais.
              </p>
            </form>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6 animate-slide-up">
              {/* Verdict Card */}
              <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200 overflow-hidden">
                {/* Verdict Badge */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {(() => {
                        const config = veredictoConfig[result.veredito]
                        const Icon = config.icon
                        return (
                          <>
                            <div className={`w-14 h-14 rounded-2xl ${config.className} flex items-center justify-center`}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <span className="text-sm font-medium text-slate-500 block">
                                Veredito
                              </span>
                              <span className={`text-2xl font-bold ${config.textColor}`}>
                                {config.label}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                    
                    {/* Confidence */}
                    <div className="text-right">
                      <span className="text-sm text-slate-500 block">Confiança</span>
                      <span className="text-2xl font-bold text-navy-800">
                        {result.confianca}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-semibold text-navy-800 mb-2">Resumo</h3>
                  <p className="text-slate-600 leading-relaxed">{result.resumo}</p>
                </div>

                {/* Analysis */}
                <div className="p-6 border-b border-slate-100">
                  <h3 className="font-semibold text-navy-800 mb-2">Análise</h3>
                  <p className="text-slate-600 leading-relaxed">{result.analise}</p>
                </div>

                {/* Tips */}
                {result.dicas && (
                  <div className={`p-6 border-b border-slate-100 ${veredictoConfig[result.veredito].bgLight}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-800 mb-1">Dica</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{result.dicas}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legal Context */}
                {result.contexto_juridico && (
                  <div className="p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Scale className="w-4 h-4 text-navy-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-800 mb-1">Contexto Jurídico</h3>
                        <p className="text-slate-600 text-sm leading-relaxed">{result.contexto_juridico}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sources */}
                {result.fontes_consultadas && result.fontes_consultadas.length > 0 && (
                  <div className="p-6">
                    <h3 className="font-semibold text-navy-800 mb-3">Fontes de Referência</h3>
                    <ul className="space-y-2">
                      {result.fontes_consultadas.map((fonte, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{fonte}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Demo Mode Warning */}
                {result.modo_demo && (
                  <div className="p-4 bg-amber-50 border-t border-amber-200">
                    <p className="text-sm text-amber-700 text-center">
                      ⚠️ Modo demonstração. Configure a API key para verificações reais.
                    </p>
                  </div>
                )}
              </div>

              {/* New Verification Button */}
              <button
                onClick={resetForm}
                className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-navy-800 font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Verificar outro conteúdo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full py-4 px-6 border-t border-slate-200 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-slate-400">
            Esta ferramenta usa inteligência artificial e pode cometer erros. 
            Sempre verifique informações importantes em fontes oficiais.
          </p>
        </div>
      </footer>
    </main>
  )
}
