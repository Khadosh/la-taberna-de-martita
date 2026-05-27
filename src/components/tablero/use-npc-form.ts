import { useState } from 'react'
import { type NpcItem } from './tablero-types'

export function useNpcForm() {
  const [showNpcForm, setShowNpcForm] = useState(false)
  const [npcFormName, setNpcFormName] = useState('')
  const [npcFormHp, setNpcFormHp] = useState(10)
  const [npcFormAc, setNpcFormAc] = useState(10)
  const [npcFormAttack, setNpcFormAttack] = useState(0)
  const [npcFormDamage, setNpcFormDamage] = useState('')
  const [npcFormType, setNpcFormType] = useState('humanoide')
  const [npcFormItems, setNpcFormItems] = useState<NpcItem[]>([])
  
  // Custom NPC extensions: spells, weapons, equipment notes
  const [npcFormSpells, setNpcFormSpells] = useState<string[]>([])
  const [npcFormWeapons, setNpcFormWeapons] = useState<{ id: string; name: string; damage: string }[]>([])
  const [npcFormEquipment, setNpcFormEquipment] = useState('')

  const addLootItem = () =>
    setNpcFormItems(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: 1 }])

  const updateLootItem = (id: string, patch: Partial<NpcItem>) =>
    setNpcFormItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))

  const removeLootItem = (id: string) =>
    setNpcFormItems(prev => prev.filter(i => i.id !== id))

  const addFormWeapon = () =>
    setNpcFormWeapons(prev => [...prev, { id: crypto.randomUUID(), name: '', damage: '' }])

  const updateFormWeapon = (id: string, patch: Partial<{ name: string; damage: string }>) =>
    setNpcFormWeapons(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w))

  const removeFormWeapon = (id: string) =>
    setNpcFormWeapons(prev => prev.filter(w => w.id !== id))

  const addFormSpell = (spell: string) =>
    setNpcFormSpells(prev => prev.includes(spell) ? prev : [...prev, spell])

  const removeFormSpell = (spell: string) =>
    setNpcFormSpells(prev => prev.filter(x => x !== spell))

  const resetNpcForm = () => {
    setShowNpcForm(false)
    setNpcFormName('')
    setNpcFormHp(10)
    setNpcFormAc(10)
    setNpcFormAttack(0)
    setNpcFormDamage('')
    setNpcFormType('humanoide')
    setNpcFormItems([])
    setNpcFormSpells([])
    setNpcFormWeapons([])
    setNpcFormEquipment('')
  }

  return {
    showNpcForm, setShowNpcForm,
    npcFormName, setNpcFormName,
    npcFormHp, setNpcFormHp,
    npcFormAc, setNpcFormAc,
    npcFormAttack, setNpcFormAttack,
    npcFormDamage, setNpcFormDamage,
    npcFormType, setNpcFormType,
    npcFormItems,
    npcFormSpells, setNpcFormSpells,
    npcFormWeapons, setNpcFormWeapons,
    npcFormEquipment, setNpcFormEquipment,
    addLootItem, updateLootItem, removeLootItem,
    addFormWeapon, updateFormWeapon, removeFormWeapon,
    addFormSpell, removeFormSpell,
    resetNpcForm,
  }
}
