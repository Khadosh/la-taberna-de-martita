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

/**
 * Texto de contenido traducido, declarado junto al dato que describe.
 *
 * El catálogo (`es.ts`) es para el chrome de la interfaz: etiquetas cortas y
 * reutilizables. La prosa del juego —descripciones de bebidas, flavor de clases,
 * trasfondos— vive con su dato porque no se reutiliza y porque mantener cientos
 * de párrafos en un archivo plano vuelve imposible revisarlos contra su contexto.
 */
export type Localized = Record<Locale, string>

type I18nContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey, values?: Values) => string
  /** Resuelve un `Localized` al idioma activo. */
  loc: (value: Localized) => string
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

  const loc = useCallback((value: Localized) => value[locale], [locale])

  const value = useMemo(() => ({ locale, setLocale, t, loc }), [locale, setLocale, t, loc])

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

/** Atajo para resolver contenido `Localized`. */
export function useLoc() {
  return useI18n().loc
}

export type { TranslationKey }
