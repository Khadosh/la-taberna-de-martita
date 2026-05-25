export function getEnvironmentIconSvg(env: string, className = "w-4 h-4") {
  switch (env) {
    case 'Bosque':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22C12 22 20 18 20 9V4L12 2L4 4v5C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M12 5L7 11h3.5v4H8l4 5 4-5h-2.5v-4H17L12 5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 9l-3.5 5H8v3H6.5l3.5 4.5 3.5-4.5h-1.5v-3h2.5L9 9Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <path d="M6 19h12" strokeLinecap="round" opacity="0.5" />
          <path d="M8 20l1-2M15 20l-1-2" strokeLinecap="round" opacity="0.7" />
        </svg>
      )
    case 'Subterráneo':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M6 2l1 4 1-4M9 2l1.5 5L12 2M13 2l2 6 2-6M18 2l.5 3 .5-3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 22l1-4.5L7.5 22M8.5 22l3-6 3 6M15.5 22l2.5-7.5 2 7.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11.5" cy="10" r="0.75" fill="currentColor" />
          <path d="M14 11l1-2-1.5-1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M12 12v2" strokeLinecap="round" opacity="0.8" />
        </svg>
      )
    case 'Cripta':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 22V10a8 8 0 0116 0v12" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M7 22v-9a5 5 0 0110 0v9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 8v8M10 11h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 16h6" strokeLinecap="round" opacity="0.7" />
          <path d="M3 22h18" strokeLinecap="round" />
          <path d="M5 20h2M17 20h2" strokeLinecap="round" opacity="0.6" />
          <circle cx="12" cy="4.5" r="1.5" strokeLinecap="round" />
          <path d="M11 6h2" strokeLinecap="round" />
        </svg>
      )
    case 'Planicie':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M2 14c4-3 10-1 14 2s6-2 6-2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 17c6 2 12-2 20 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <circle cx="12" cy="8" r="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 3v2M7.5 5.5l1.5 1.5M16.5 5.5l-1.5 1.5M6 9h2M16 9h2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d="M5 19v-4M5 15l-1-1.5M5 16l1-1M19 19v-3M19 16l-1-1M19 17l1-1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
        </svg>
      )
    case 'Castillo':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22C12 22 20 18 20 9V4L12 2L4 4v5C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M5 20V9l1-1h2.5l1 1v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5 20V9l1-1H19l1 1v11" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 11v9h6v-9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 8h3.5M14.5 8h4.5" strokeLinecap="round" />
          <path d="M11 20v-4a1 1 0 012 0v4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 11V5l3 1.5L12 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'Averno':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" opacity="0.4" />
          <path d="M12 22C7.58 22 4 18.42 4 14c0-4.5 3-7.5 6-11 0 3 .5 5 1.5 6 1.8-2 3.3-5.5 5.5-6.5-.5 3.5 1 5.5 2 7 2.2 3.3 3 6.5 3 10.5 0 4.42-3.58 8-8 8Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 18c-2.21 0-4-1.79-4-4 0-2.5 2-4.5 4-7 0 2 1 3.5 2 4.5.5-1 1-2.5 1.5-3 .5 2 1 3.5 1 5 0 2.21-1.79 4-4.5 4Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d="M6 19h12" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'Costa':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M2 15c2-1 4-1 6 0s4 1 6 0 4-1 6 0" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 18c2.5-1.5 5-1.5 7.5 0s5 1.5 7.5 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
          <path d="M3 21c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <path d="M18 15V8l-3 4-2-6-1 9" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <circle cx="6" cy="7" r="2" strokeLinecap="round" />
          <path d="M6 3v2M3 7h2M8 7h2" strokeLinecap="round" opacity="0.6" />
        </svg>
      )
    case 'Montaña':
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22C12 22 20 18 20 9V4L12 2L4 4v5C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
          <path d="M12 4L3 19h18L12 4Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 4v15" strokeLinecap="round" opacity="0.5" />
          <path d="M7 11.5L14.5 19H12" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M17 12.5L11.5 19h4.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
          <path d="M9 8c2.5-1 3.5.5 5 0 .75 1.25 1.5 1.5.5 2.5-1-1-3-1.5-5.5-2.5Z" fill="currentColor" stroke="none" opacity="0.8" />
        </svg>
      )
    default:
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v20M2 12h20" />
        </svg>
      )
  }
}

export function getArchetypeIcon(id: string, className = "w-3.5 h-3.5") {
  switch (id) {
    case 'emboscada-goblin':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 20l4-4 12-12-3-3L5 13l-4 4 3 3z" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 5l4 4M2 22l2-2" strokeLinecap="round" /><path d="M9 11l-3 3" strokeLinecap="round" opacity="0.6" /></svg>)
    case 'patrulla-bosque':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18c3-3 3-9 0-12" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 6l12 6-12 6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /><path d="M4 12h16M17 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>)
    case 'nido-aranas':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l18 18M21 3L3 21M12 2v20M2 12h20" strokeLinecap="round" opacity="0.4" /><path d="M12 6c3 0 6 3 6 6s-3 6-6 6-6-3-6-6 3-6 6-6z" strokeLinecap="round" /><path d="M12 9c1.5 0 3 1.5 3 3s-1.5 3-3 3-3-1.5-3-3 1.5-3 3-3z" strokeLinecap="round" opacity="0.7" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>)
    case 'manada-lobos':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 20c-2-2-4-2-6-4-1.5-1.5-2.5-3.5-2.5-5.5 0-2.5.5-3.5 2.5-5 1.5-1 3-2.5 3-2.5s-2 .5-3 1.5c-2 2-3 4-5.5 3-1.5-.5-3.5 0-3.5 0s1.5 1.5 1 3c-.5 1-1.5 1-2 2s-.5 2 1.5 2.5c1.5.5 2.5 2 2.5 3.5s1 3.5 3 4.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="14" cy="7" r="1" fill="currentColor" stroke="none" /></svg>)
    case 'depredadores-bosque':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 3c0 4 2 9 4 14M11 4c0 5 1 10 3 14M16 3c0 6 0 11 1 15" strokeLinecap="round" strokeLinejoin="round" /><path d="M7 19l1 2M12 20l1 2M16 20l1 2" strokeLinecap="round" opacity="0.6" /></svg>)
    case 'tribu-kobold':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 14V8a3 3 0 016 0v6M9 10H6l-2-2M15 10h3l2-2" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 14c0 1.5 1 3 3 3s3-1.5 3-3" strokeLinecap="round" strokeLinejoin="round" /><path d="M11 17v3M13 17v3" strokeLinecap="round" /></svg>)
    case 'guardia-duergar':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 9h12v4H6V9z" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 13v9M12 9V2" strokeLinecap="round" /><path d="M18 11h2M4 11h2" strokeLinecap="round" /><path d="M9 9l3-4 3 4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>)
    case 'guardia-orco':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2v20" strokeLinecap="round" /><path d="M12 5c-3-2-6-1-7 2s1 6 7 4M12 5c3-2 6-1 7 2s-1 6-7 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 21h4" strokeLinecap="round" /></svg>)
    case 'cueva-aberrante':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><path d="M8 8C6 6 3 7 3 7M16 8c2-2 5-1 5-1M8 16c-2 2-5 1-5 1M16 16c2 2 5 1 5 1" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 4C12 2 10 2 10 2M12 20c0 2 2 2 2 2" strokeLinecap="round" strokeLinejoin="round" /></svg>)
    case 'nido-murcielagos':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 10c-2-2-5-2-7 0 1 2 3 3 7 1.5 4 1.5 6 .5 7-1.5-2-2-5-2-7 0z" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 14c-1-1-3-1-4 0 .5 1 1.5 1.5 4 1 2.5 1.5 3.5 1 4 0-1-1-3-1-4 0z" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>)
    case 'patrulla-no-muerta':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 15l4-4 4 4M8 13l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /><path d="M12 2v9M10 5h4" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 11l-3 6M12 11l3 6M12 15h-4M12 15h4" strokeLinecap="round" /></svg>)
    case 'guardia-cripta':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 21V8a7 7 0 0114 0v13" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 13h6M12 10v6" strokeLinecap="round" /><path d="M3 21h18" strokeLinecap="round" /></svg>)
    case 'horda-zombies':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M5 22v-6l-2-2 1-3 3 1v10" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 22v-8l-2-3 2-2 2 2v11" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 22v-5l-1-2 1-3 2 1v9" strokeLinecap="round" strokeLinejoin="round" /></svg>)
    case 'culto-oscuro':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4C9.5 4 8 6 8 8.5c0 3.5 2.5 5.5 4 7.5 1.5-2 4-4 4-7.5C16 6 14.5 4 12 4z" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 21c0-5 3-7 6-7s6 2 6 7" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 9v3" strokeLinecap="round" opacity="0.8" /></svg>)
    case 'espectros-umbral':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 12c-2-2-4 0-4 3 0 4 4 6 4 6M15 10c-2-2-4 0-4 3 0 4 4 6 4 6" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12V6c0-2 2-3 3-3s3 1 3 3v6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>)
    case 'banda-bandoleros':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 20L20 4M20 20L4 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M14 6l4-4M6 14l-4 4M10 6l4 4M8 10l2-2" strokeLinecap="round" opacity="0.7" /></svg>)
    case 'tribu-orco':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M6 9V7M18 9V7" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10c0 4 3 7 6 7s6-3 6-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10h14" strokeLinecap="round" /><path d="M8 17l-2 4M16 17l2 4" strokeLinecap="round" /></svg>)
    case 'rastreadores-gnoll':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6" strokeLinecap="round" /><circle cx="5" cy="19" r="1.5" fill="currentColor" /><path d="M18 6c1 1.5 2.5 1.5 3 0s-.5-2.5-3-0z" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 4l-2 2M20 8l2-2" strokeLinecap="round" /></svg>)
    case 'jinetes-lobos':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 21L21 3" strokeLinecap="round" /><path d="M17 3l4 4M15 5l2 2" strokeLinecap="round" /><path d="M9 13c-2 0-4 1-5 3M11 11c1 2 0 4-3 5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /></svg>)
    case 'mercenarios-elite':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 4a5 5 0 00-5 5v5h10V9a5 5 0 00-5-5z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 9h6M8 12h8" strokeLinecap="round" /><path d="M5 21l3-3M19 21l-3-3" strokeLinecap="round" /></svg>)
    case 'guardia-real':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 8h6M10 11h4M12 8v5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" /></svg>)
    case 'espias-infiltrados':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 3a6 6 0 00-6 6c0 4.5 3.5 6 6 9 2.5-3 6-4.5 6-9a6 6 0 00-6-6z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="9.5" cy="9.5" r="1" fill="currentColor" stroke="none" /><circle cx="14.5" cy="9.5" r="1" fill="currentColor" stroke="none" /><path d="M8 21l8-4" strokeLinecap="round" opacity="0.7" /></svg>)
    case 'cultistas-torre':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 22V10l2-2h2l2 2v12" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="5" r="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 5h8M12 3v4" strokeLinecap="round" opacity="0.7" /><path d="M11 14h2" strokeLinecap="round" /></svg>)
    case 'guardianes-magicos':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v12M10 5h4" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 8l6 6M5 10l3-1" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /><path d="M18 8l-6 6M19 10l-3-1" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /></svg>)
    case 'elementales-fuego':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2C9 5 8 9 8 13a4 4 0 008 0c0-4-1-8-4-11z" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 7c-2 2-3 4-3 6a3 3 0 006 0c0-2-1-4-3-6z" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" /></svg>)
    case 'legiones-infernales':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2v17M8 5V2h8v3M12 22a2 2 0 11-2-2" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 5c1 3 7 3 8 0" strokeLinecap="round" /></svg>)
    case 'piratas-corsarios':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2v15M6 10c0 4 3 7 6 7s6-3 6-7" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 10h4M16 10h4M9 5h6" strokeLinecap="round" /><circle cx="12" cy="4" r="1.5" strokeLinecap="round" /></svg>)
    case 'sahuagin-raid':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M8 6h8M8 6V3M16 6V3" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 18c3-2 6-2 9 0s6 2 9 0" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" /></svg>)
    case 'gigantes-colinas':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 3c-4.5 0-9 2-9 6.5s3.5 5.5 8 5.5 10-2 10-6.5S16.5 3 12 3z" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 8a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM16 12a1 1 0 110-2 1 1 0 010 2z" strokeLinecap="round" opacity="0.6" /><path d="M8 21l8-4" strokeLinecap="round" /></svg>)
    case 'vuelo-griffons':
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 8c4.5-2 6 .5 8 2.5 2-2 3.5-4.5 8-2.5-.5 3.5-2.5 6-8 7.5-5.5-1.5-7.5-4-8-7.5z" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 14v5M10 21l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" /></svg>)
    default:
      return (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2v20M2 12h20" /></svg>)
  }
}

function CrossedSwordsIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M4 20 L20 4 M20 20 L4 4" />
      <path d="M15 3 L21 6 L18 9 L15 6 Z" fill="currentColor" />
      <path d="M9 3 L3 6 L6 9 L9 6 Z" fill="currentColor" />
    </svg>
  )
}

function RangedBowIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18 L18 6" />
      <path d="M18 6 H13 M18 6 V11" />
      <path d="M18 18 A 12 12 0 0 1 18 6" />
    </svg>
  )
}

function MagicStaffIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L12 22" />
      <circle cx="12" cy="4" r="2.5" fill="currentColor" />
      <path d="M9.5 4 C 8.5 7, 15.5 7, 14.5 4" />
    </svg>
  )
}

function SupportShieldIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22 s8-4 8-10 V5 l-8-3-8 3 v7 c0 6 8 10 8 10 z" />
      <path d="M12 6 v10 M8 11 h8" />
    </svg>
  )
}

export const ROLE_ICONS = {
  melee: <CrossedSwordsIcon className="w-3.5 h-3.5 text-red-400 shrink-0" />,
  ranged: <RangedBowIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  magic: <MagicStaffIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />,
  support: <SupportShieldIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
}

export function SkullIcon({ className = "w-3.5 h-3.5", color = "#bc9434" }: { className?: string; color?: string }) {
  return (
    <svg className={className} style={{ color }} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2c-4.963 0-9 4.037-9 9 0 2.223.82 4.25 2.164 5.823l.016.015c.162.19.4.305.654.305h.332c.553 0 1-.447 1-1v-1c0-.553.447-1 1-1h6c.553 0 1 .447 1 1v1c0 .553.447 1 1 1h.332c.254 0 .492-.115.654-.305l.016-.015C21.18 15.25 22 13.223 22 11c0-4.963-4.037-9-9-9zm-3.5 10c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
    </svg>
  )
}
