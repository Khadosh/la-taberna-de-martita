export type InventoryItem = {
  id: string
  name: string
  quantity: number
  weight_lbs: number | null
  notes: string | null
  image_url?: string
}
