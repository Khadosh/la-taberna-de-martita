// Default spells for spellcasting monsters, keyed by monster index.
// Spell indices from dnd5eapi.co/api/2014/spells/{index}
export const MONSTER_DEFAULT_SPELLS: Record<string, string[]> = {
  'mage': [
    'fire-bolt',
    'mage-hand',
    'prestidigitation',
    'shocking-grasp',
    'magic-missile',
    'shield',
    'misty-step',
    'counterspell',
    'fireball',
    'lightning-bolt',
    'cone-of-cold',
  ],
  'priest': [
    'sacred-flame',
    'thaumaturgy',
    'cure-wounds',
    'guiding-bolt',
    'inflict-wounds',
    'command',
    'hold-person',
    'spiritual-weapon',
    'dispel-magic',
  ],
  'cult-fanatic': [
    'sacred-flame',
    'command',
    'inflict-wounds',
    'hold-person',
    'spiritual-weapon',
  ],
  'druid': [
    'produce-flame',
    'shillelagh',
    'entangle',
    'thunderwave',
    'heat-metal',
    'spike-growth',
    'call-lightning',
    'sleet-storm',
  ],
  'archmage': [
    'fire-bolt',
    'mage-hand',
    'prestidigitation',
    'shocking-grasp',
    'detect-magic',
    'magic-missile',
    'shield',
    'counterspell',
    'fireball',
    'lightning-bolt',
    'cone-of-cold',
    'time-stop',
    'wish',
  ],
  'warlock': [
    'eldritch-blast',
    'mage-hand',
    'minor-illusion',
    'hex',
    'misty-step',
    'hunger-of-hadar',
  ],
}

export function getMonsterSpells(monsterIndex: string): string[] {
  return MONSTER_DEFAULT_SPELLS[monsterIndex] ?? []
}
