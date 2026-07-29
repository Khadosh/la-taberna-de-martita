import { LOCALES, useI18n, type Locale } from '../i18n'

/**
 * Alterna el idioma de la interfaz. Deliberadamente no toca el idioma de los
 * términos de reglas: el contenido del SRD llega en inglés desde la API y una
 * mesa hispanohablante suele jugar con los términos originales.
 */
export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n()

  return (
    <div className={`flex items-center gap-0.5 ${className}`} role="group" aria-label="Idioma / Language">
      {(Object.keys(LOCALES) as Locale[]).map(code => {
        const active = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            lang={code}
            aria-pressed={active}
            title={LOCALES[code].label}
            className={`px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-colors ${
              active
                ? 'bg-tavern-gold/20 text-tavern-gold'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
