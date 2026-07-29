import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { es, type TranslationKey } from './es'
import { en } from './en'

export type Locale = 'es' | 'en'

export const LOCALES: Record<Locale, { label: string; flag: string }> = {
  es: { label: 'Español', flag: '🇦🇷' },
  en: { label: 'English', flag: '🇬🇧' },
}

const CATALOGS: Record<Locale, Record<TranslationKey, string>> = { es, en }
const STORAGE_KEY = 'taberna-locale'

type Values = Record<string, string | number>

/** Reemplaza `{clave}` por su valor. Sin valores, devuelve la plantilla tal cual. */
function interpolate(template: string, values?: Values): string {
  if (!values) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  )
}

/**
 * Elige entre `clave` y `clave_other` según `count`.
 *
 * Español e inglés comparten la misma regla (uno vs. resto), así que dos formas
 * alcanzan. Un idioma con reglas de plural más ricas —ruso, polaco, árabe—
 * necesitaría reemplazar esto por `Intl.PluralRules`.
 */
function resolveKey(key: TranslationKey, values: Values | undefined, catalog: Record<string, string>): string {
  if (values && typeof values.count === 'number' && values.count !== 1) {
    const pluralKey = `${key}_other`
    if (pluralKey in catalog) return catalog[pluralKey]
  }
  return catalog[key]
}

function detectLocale(): Locale {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  if (stored === 'es' || stored === 'en') return stored
  const nav = typeof navigator !== 'undefined' ? navigator.language.slice(0, 2) : 'es'
  return nav === 'en' ? 'en' : 'es'
}

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, values?: Values) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  // El atributo `lang` no es cosmético: los lectores de pantalla eligen la voz
  // y la pronunciación a partir de él.
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLocaleState(next)
  }, [])

  const t = useCallback(
    (key: TranslationKey, values?: Values) => {
      const catalog = CATALOGS[locale]
      return interpolate(resolveKey(key, values, catalog), values)
    },
    [locale]
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>')
  return ctx
}

/** Atajo para el caso más común: solo traducir. */
export function useT() {
  return useI18n().t
}

export type { TranslationKey }
