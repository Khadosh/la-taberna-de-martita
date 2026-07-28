import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ItemType } from '../../lib/custom-items'

type Props = {
  imageUrl: string
  itemType: ItemType
  onChange: (url: string) => void
}

const TYPE_GLYPH: Partial<Record<ItemType, string>> = { weapon: '⚔', armor: '🛡' }

export function CustomItemImagePanel({ imageUrl, itemType, onChange }: Props) {
  const [imagePrompt, setImagePrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const generateImage = async () => {
    if (!imagePrompt.trim()) return
    setGeneratingImage(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-portrait', {
        body: { prompt: imagePrompt },
      })
      if (!error && data?.url) {
        // Inlinamos como data URL para que la imagen sobreviva al vencimiento
        // del link temporal que devuelve el generador.
        try {
          const res = await fetch(data.url)
          const blob = await res.blob()
          const reader = new FileReader()
          reader.onload = () => onChange(reader.result as string)
          reader.readAsDataURL(blob)
        } catch {
          onChange(data.url)
        }
      }
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => onChange(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-square bg-stone-200 border border-stone-300 rounded-md overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-stone-400 text-5xl select-none">
            {TYPE_GLYPH[itemType] ?? '✦'}
          </span>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="text-xs border border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 rounded px-2 py-1.5 transition-colors text-center"
      >
        Subir imagen
      </button>

      <div className="flex flex-col gap-1.5 mt-1">
        <textarea
          value={imagePrompt}
          onChange={e => setImagePrompt(e.target.value)}
          placeholder="Descripción para la IA..."
          rows={3}
          className="bg-white border border-stone-300 text-stone-800 text-xs rounded px-2 py-1.5 focus:outline-none focus:border-amber-600/60 resize-none placeholder-stone-400"
        />
        <button
          type="button"
          onClick={generateImage}
          disabled={generatingImage || !imagePrompt.trim()}
          className="text-xs bg-amber-800/15 hover:bg-amber-800/25 text-amber-900 border border-amber-800/30 rounded px-2 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generatingImage ? 'Generando...' : 'Generar con IA'}
        </button>
        {imageUrl && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-stone-400 hover:text-red-500 transition-colors text-center"
          >
            Quitar imagen
          </button>
        )}
      </div>
    </div>
  )
}
