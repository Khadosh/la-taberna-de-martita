import rogueData from '../data/rogue-subclasses.json'
import type { SubclassDetail, FeatureDetail, ApiRef } from './dnd-api'

// Built once at module load — O(1) lookup for all downstream queries

export const localSubclassMap = new Map<string, SubclassDetail>()
export const localFeatureMap = new Map<string, FeatureDetail>()
export const localSubclassFeaturesMap = new Map<string, { results: ApiRef[] }>()

for (const sc of rogueData.subclasses) {
  localSubclassMap.set(sc.index, {
    index: sc.index,
    name: sc.name,
    subclass_flavor: sc.subclass_flavor,
    class: sc.class,
    desc: sc.desc[0] ?? '',
  })

  const featureRefs: ApiRef[] = []
  for (const lvl of sc.levels) {
    for (const feat of lvl.features) {
      featureRefs.push({ index: feat.index, name: feat.name, url: '' })
      localFeatureMap.set(feat.index, {
        index: feat.index,
        name: feat.name,
        level: feat.level,
        desc: feat.desc,
        class: sc.class,
        subclass: { index: sc.index, name: sc.name, url: '' },
      })
    }
  }

  localSubclassFeaturesMap.set(sc.index, { results: featureRefs })
}
