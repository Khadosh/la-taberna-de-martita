import { Link } from '@tanstack/react-router'
import { Swords, Skull, BookOpen, Users, Scroll, Sparkles } from 'lucide-react'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-stone-tavern text-stone-100 flex flex-col selection:bg-amber-900/50 selection:text-amber-200">
      {/* React 19 SEO Metadata Hoisting */}
      <title>La Taberna de Martita — Tu Tablero de D&D 5e en Tiempo Real</title>
      <meta name="description" content="Gestioná tus campañas de Dungeons & Dragons 5e. Combate interactivo en tiempo real, hojas de personajes, bestiario completo y compendio de hechizos." />
      <meta property="og:title" content="La Taberna de Martita — Tu Tablero de D&D 5e en Tiempo Real" />
      <meta property="og:description" content="Tablero de combate interactivo, bestiario, libro de conjuros y gestión de campañas en tiempo real." />

      {/* Hero Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-[60vh] bg-tavern-fire pointer-events-none opacity-50 z-0" />

      {/* Header */}
      <header className="relative z-10 border-b border-stone-900/60 bg-stone-950/40 backdrop-blur-sm px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="La Taberna de Martita Logo" className="w-9 h-9 drop-shadow-[0_0_10px_rgba(245,217,168,0.3)]" />
          <div>
            <h2 className="font-display text-amber-200 text-lg leading-tight tracking-wide">La Taberna</h2>
            <p className="font-display text-amber-500/80 text-[0.6rem] tracking-[0.3em] uppercase leading-none">de Martita</p>
          </div>
        </div>
        <div>
          <Link
            to="/login"
            className="px-5 py-2 font-display text-xs tracking-wider text-amber-200 hover:text-amber-100 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-800/40 hover:border-amber-600/60 transition-all rounded-[2px]"
          >
            Entrar a la Taberna
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 sm:px-12 pt-12 sm:pt-24 pb-16 flex-grow flex flex-col md:flex-row items-center gap-12">
        {/* Left Column (Content) */}
        <div className="flex-1 text-center md:text-left space-y-8">
          {/* Decorative Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-amber-900/40 bg-amber-950/20 text-amber-400 text-xs font-serif italic tracking-wide rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mesa de juego optimizada para D&D 5e</span>
          </div>

          {/* Hero Title */}
          <div className="space-y-3">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-amber-100 tracking-wider leading-tight drop-shadow-md">
              LA TABERNA DE MARTITA
            </h1>
            <p className="font-display text-amber-500/90 text-xs sm:text-sm tracking-[0.45em] uppercase">
              Tu mesa virtual de aventuras
            </p>
          </div>

          {/* Description */}
          <p className="text-stone-400 font-serif text-sm sm:text-base leading-relaxed max-w-lg mx-auto md:mx-0">
            Un espacio digital interactivo diseñado para Dungeon Masters y Aventureros. Combates tácticos en tiempo real, gestión de hojas de personaje, consulta veloz de conjuros y bestias, y bitácora de campaña.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-center md:justify-start items-center gap-4">
            <Link
              to="/login"
              style={primaryBtnStyle}
              className="w-full sm:w-auto px-8 py-3.5 font-display text-xs tracking-wider shadow-tavern-glow hover:brightness-110 active:scale-[0.98] transition-all text-center rounded-[2px]"
            >
              Empezar la Aventura
            </Link>
            <a
              href="#caracteristicas"
              className="w-full sm:w-auto px-8 py-3.5 font-serif text-xs text-stone-400 hover:text-stone-200 border border-stone-800 hover:border-stone-700 bg-stone-900/10 hover:bg-stone-900/30 transition-all text-center rounded-[2px]"
            >
              Explorar características
            </a>
          </div>
        </div>

        {/* Right Column (Artwork) */}
        <div className="w-full md:w-5/12 max-w-sm sm:max-w-md md:max-w-none mx-auto shrink-0 relative">
          <div style={artFrameStyle} className="group overflow-hidden rounded-[2px] shadow-2xl transition-all duration-500 hover:scale-[1.02] aspect-square relative">
            <img 
              src="/assets/images/landing_bg.png" 
              alt="La Taberna de Martita" 
              className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100 transition-all duration-500" 
            />
            {/* Ambient inner shadow/vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
            {/* Elegant double border frame inside the image */}
            <div className="absolute inset-3 border border-amber-500/15 pointer-events-none group-hover:border-amber-500/30 transition-colors" />
            <div className="absolute inset-3.5 border border-amber-900/35 pointer-events-none" />
          </div>
          {/* Decorative visual glow behind the image */}
          <div className="absolute -inset-4 bg-amber-500/5 blur-3xl rounded-full pointer-events-none -z-10 group-hover:bg-amber-500/8 transition-all" />
        </div>
      </section>

      {/* Features Section */}
      <section id="caracteristicas" className="relative z-10 bg-stone-950/60 border-y border-stone-900/60 py-20 px-6 sm:px-12">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl text-amber-200 tracking-wide">
              Todo lo que tu mesa necesita
            </h2>
            <p className="text-stone-500 font-serif text-sm italic">
              Herramientas ágiles para no interrumpir el flujo de la partida
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div style={cardStyle} className="p-6 space-y-4 hover:border-amber-900/50 hover:bg-stone-900/10 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-950/30 border border-amber-900/30 rounded-[2px] text-amber-400">
                <Swords className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg text-amber-200 tracking-wide">Tablero de Combate Activo</h3>
              <p className="text-stone-400 font-serif text-sm leading-relaxed">
                Posicionamiento y movimiento interactivo bidireccional en tiempo real entre el DM y los jugadores. Olvidate de compartir pantalla para la grilla de combate.
              </p>
            </div>

            {/* Feature 2 */}
            <div style={cardStyle} className="p-6 space-y-4 hover:border-amber-900/50 hover:bg-stone-900/10 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-950/30 border border-amber-900/30 rounded-[2px] text-amber-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg text-amber-200 tracking-wide">Hojas de Personaje</h3>
              <p className="text-stone-400 font-serif text-sm leading-relaxed">
                Fichas digitales optimizadas para D&D 5e con cálculo automático de modificadores, vida máxima, ranuras de conjuros y visualización limpia de tus estadísticas.
              </p>
            </div>

            {/* Feature 3 */}
            <div style={cardStyle} className="p-6 space-y-4 hover:border-amber-900/50 hover:bg-stone-900/10 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-950/30 border border-amber-900/30 rounded-[2px] text-amber-400">
                <Skull className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg text-amber-200 tracking-wide">Bestiario Integrado</h3>
              <p className="text-stone-400 font-serif text-sm leading-relaxed">
                Consultá bloques de estadísticas completos de criaturas oficiales de la SRD 5e. Acciones, resistencias, salvaciones e iniciativas con un solo click.
              </p>
            </div>

            {/* Feature 4 */}
            <div style={cardStyle} className="p-6 space-y-4 hover:border-amber-900/50 hover:bg-stone-900/10 transition-all duration-300">
              <div className="w-10 h-10 flex items-center justify-center bg-amber-950/30 border border-amber-900/30 rounded-[2px] text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-display text-lg text-amber-200 tracking-wide">Grimorio Completo</h3>
              <p className="text-stone-400 font-serif text-sm leading-relaxed">
                Compendio de hechizos filtrable por nivel, escuela mágica y clase. No vuelvas a perder minutos hojeando manuales para resolver una regla.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Atmospheric Footer CTA */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-20 text-center space-y-6">
        <Scroll className="w-8 h-8 text-amber-500/60 mx-auto" />
        <h3 className="font-display text-xl sm:text-2xl text-amber-100">¿Preparado para tu próxima sesión?</h3>
        <p className="text-stone-400 font-serif text-sm max-w-md mx-auto">
          Unite a los Dungeon Masters y jugadores que ya gestionan sus aventuras desde la comodidad de La Taberna.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            style={primaryBtnStyle}
            className="inline-block px-10 py-3.5 font-display text-sm tracking-wider shadow-tavern-glow hover:brightness-110 transition-all rounded-[2px]"
          >
            Entrar al Salón
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-900/60 bg-stone-950/80 px-6 sm:px-12 py-8 text-center text-stone-600 text-xs font-serif space-y-4">
        <p className="tracking-wide">✦ LA TABERNA DE MARTITA ✦</p>
        <p className="max-w-md mx-auto">
          Herramienta complementaria de rol no oficial compatible con el sistema D&D 5e de Wizards of the Coast.
        </p>
        <p className="text-stone-700">
          La Taberna de Martita © {new Date().getFullYear()}. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'linear-gradient(170deg, #120b05 0%, #0a0603 100%)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(120,70,20,0.1)',
  border: '1px solid rgba(120,70,20,0.2)',
  borderRadius: '2px',
}

const primaryBtnStyle: React.CSSProperties = {
  background: 'linear-gradient(180deg, #9B4A10 0%, #7B3408 100%)',
  color: '#f5d9a8',
  border: '1px solid #6B2C06',
  letterSpacing: '0.1em',
}

const artFrameStyle: React.CSSProperties = {
  background: '#0c0a09',
  border: '1px solid rgba(120,70,20,0.35)',
  boxShadow: '0 20px 40px rgba(0,0,0,0.85), 0 0 50px rgba(155,74,16,0.1)',
}

