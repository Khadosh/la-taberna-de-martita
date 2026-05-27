import type { Archetype } from '../../data/encounter-archetypes'
import { ARCHETYPES } from '../../data/encounter-archetypes'
import type { LootProfile } from '../types'

import {
  EMBOSCADA_GOBLIN_LOOT,
  PATRULLA_BOSQUE_LOOT,
  NIDO_ARANAS_LOOT,
  MANADA_LOBOS_LOOT,
  DEPREDADORES_BOSQUE_LOOT,
} from './bosque'
import {
  TRIBU_KOBOLD_LOOT,
  GUARDIA_DUERGAR_LOOT,
  GUARDIA_ORCO_LOOT,
  CUEVA_ABERRANTE_LOOT,
  NIDO_MURCIELAGOS_LOOT,
} from './subterraneo'
import {
  PATRULLA_NO_MUERTA_LOOT,
  GUARDIA_CRIPTA_LOOT,
  HORDA_ZOMBIES_LOOT,
  CULTO_OSCURO_LOOT,
  ESPECTROS_UMBRAL_LOOT,
} from './cripta'
import {
  BANDA_BANDOLEROS_LOOT,
  TRIBU_ORCO_LOOT,
  RASTREADORES_GNOLL_LOOT,
  JINETES_LOBOS_LOOT,
  MERCENARIOS_ELITE_LOOT,
} from './planicie'
import {
  GUARDIA_REAL_LOOT,
  ESPIAS_INFILTRADOS_LOOT,
  CULTISTAS_TORRE_LOOT,
  GUARDIANES_MAGICOS_LOOT,
} from './castillo'
import {
  ELEMENTALES_FUEGO_LOOT,
  LEGIONES_INFERNALES_LOOT,
} from './averno'
import {
  PIRATAS_CORSARIOS_LOOT,
  SAHUAGIN_RAID_LOOT,
} from './costa'
import {
  GIGANTES_COLINAS_LOOT,
  VUELO_GRIFFONS_LOOT,
} from './montana'

const LOOT_BY_ARCHETYPE_ID: Record<string, LootProfile> = {
  'emboscada-goblin':   EMBOSCADA_GOBLIN_LOOT,
  'patrulla-bosque':    PATRULLA_BOSQUE_LOOT,
  'nido-aranas':        NIDO_ARANAS_LOOT,
  'manada-lobos':       MANADA_LOBOS_LOOT,
  'depredadores-bosque': DEPREDADORES_BOSQUE_LOOT,
  'tribu-kobold':       TRIBU_KOBOLD_LOOT,
  'guardia-duergar':    GUARDIA_DUERGAR_LOOT,
  'guardia-orco':       GUARDIA_ORCO_LOOT,
  'cueva-aberrante':    CUEVA_ABERRANTE_LOOT,
  'nido-murcielagos':   NIDO_MURCIELAGOS_LOOT,
  'patrulla-no-muerta': PATRULLA_NO_MUERTA_LOOT,
  'guardia-cripta':     GUARDIA_CRIPTA_LOOT,
  'horda-zombies':      HORDA_ZOMBIES_LOOT,
  'culto-oscuro':       CULTO_OSCURO_LOOT,
  'espectros-umbral':   ESPECTROS_UMBRAL_LOOT,
  'banda-bandoleros':   BANDA_BANDOLEROS_LOOT,
  'tribu-orco':         TRIBU_ORCO_LOOT,
  'rastreadores-gnoll': RASTREADORES_GNOLL_LOOT,
  'jinetes-lobos':      JINETES_LOBOS_LOOT,
  'mercenarios-elite':  MERCENARIOS_ELITE_LOOT,
  'guardia-real':       GUARDIA_REAL_LOOT,
  'espias-infiltrados': ESPIAS_INFILTRADOS_LOOT,
  'cultistas-torre':    CULTISTAS_TORRE_LOOT,
  'guardianes-magicos': GUARDIANES_MAGICOS_LOOT,
  'elementales-fuego':  ELEMENTALES_FUEGO_LOOT,
  'legiones-infernales': LEGIONES_INFERNALES_LOOT,
  'piratas-corsarios':  PIRATAS_CORSARIOS_LOOT,
  'sahuagin-raid':      SAHUAGIN_RAID_LOOT,
  'gigantes-colinas':   GIGANTES_COLINAS_LOOT,
  'vuelo-griffons':     VUELO_GRIFFONS_LOOT,
}

export function getArchetypesWithLoot(): Archetype[] {
  return ARCHETYPES.map(a => ({
    ...a,
    loot: LOOT_BY_ARCHETYPE_ID[a.id],
  }))
}
