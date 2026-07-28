import { getItemIconUrl, getItemFallbackEmoji } from '../../lib/item-icons'
import { GameIcon } from '../icons/game-icon'

export function ItemIcon({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} className="w-full h-full object-cover" alt={name} />
  }
  const url = getItemIconUrl(name)
  if (url) {
    return <GameIcon url={url} title={name} className="w-8 h-8 opacity-75" />
  }
  return <span className="text-lg opacity-40">{getItemFallbackEmoji(name)}</span>
}
