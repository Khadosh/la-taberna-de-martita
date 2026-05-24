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

  const addLootItem = () =>
    setNpcFormItems(prev => [...prev, { id: crypto.randomUUID(), name: '', qty: 1 }])

  const updateLootItem = (id: string, patch: Partial<NpcItem>) =>
    setNpcFormItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))

  const removeLootItem = (id: string) =>
    setNpcFormItems(prev => prev.filter(i => i.id !== id))

  const resetNpcForm = () => {
    setShowNpcForm(false)
    setNpcFormName('')
    setNpcFormHp(10)
    setNpcFormAc(10)
    setNpcFormAttack(0)
    setNpcFormDamage('')
    setNpcFormType('humanoide')
    setNpcFormItems([])
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
    addLootItem, updateLootItem, removeLootItem,
    resetNpcForm,
  }
}
