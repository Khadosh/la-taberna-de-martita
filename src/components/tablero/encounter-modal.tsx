import { useEffect } from 'react'
import { type useEncounterGenerator } from './use-encounter-generator'
import { CornerBracket } from '../combat/combat-helpers'
import { EncounterGeneratorPanel } from './encounter-generator-panel'

export function EncounterModal({ encounterGen }: { encounterGen: ReturnType<typeof useEncounterGenerator> }) {
  const { closeEncounterGenerator } = encounterGen

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeEncounterGenerator() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeEncounterGenerator])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={closeEncounterGenerator} />
      <div
        className="relative w-full max-w-3xl flex flex-col shadow-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 50%, #2f1d13 0%, #150c07 100%)',
          border: '8px solid #23140a',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.9), inset 0 0 25px rgba(0,0,0,0.95), 0 0 0 1.5px #120a05',
        }}
      >
        <style>{`
          .no-spinners::-webkit-outer-spin-button,
          .no-spinners::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
          .no-spinners { -moz-appearance: textfield; }
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: rgba(26,15,7,0.4); border-left: 1px solid #23140a; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: #3c2414; border: 2px solid rgba(26,15,7,0.4); border-radius: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8a6b3e; }
          .parchment-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
          .parchment-card:hover { transform: translateY(-2px); border-color: #bc9434; box-shadow: 0 10px 25px rgba(188,148,52,0.35), inset 0 0 14px rgba(188,148,52,0.2); }
          .parchment-card .card-image { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
          .parchment-card:hover .card-image { opacity: 1; }
        `}</style>
        <CornerBracket rotation={0} />
        <CornerBracket rotation={270} />
        <CornerBracket rotation={90} />
        <CornerBracket rotation={180} />

        <div
          className="flex items-center gap-4 px-5 pt-4 pb-3 border-b z-10"
          style={{ borderBottomColor: '#23140a', background: 'rgba(21,12,7,0.4)', backdropFilter: 'blur(4px)' }}
        >
          <span
            className="text-sm tracking-widest uppercase font-serif font-semibold shrink-0"
            style={{ color: '#d5b88a', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
          >
            Generador Procedural de Encuentros
          </span>
          <div className="flex-1 h-px bg-[#3c2414]" />
          <button
            onClick={closeEncounterGenerator}
            className="hover:text-stone-300 font-serif text-base leading-none transition-colors shrink-0 cursor-pointer"
            style={{ color: '#bc9434' }}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto max-h-[80vh] custom-scrollbar">
          <EncounterGeneratorPanel encounterGen={encounterGen} />
        </div>
      </div>
    </div>
  )
}
