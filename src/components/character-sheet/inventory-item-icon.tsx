import { getItemIconUrl, getItemFallbackEmoji } from '../../lib/item-icons'

export function ItemIcon({ name, imageUrl }: { name: string; imageUrl?: string }) {
  if (imageUrl) {
    return <img src={imageUrl} className="w-full h-full object-cover" alt={name} />
  }
  const url = getItemIconUrl(name)
  if (url) {
    return (
      <img src={url} className="w-8 h-8 object-contain opacity-75" alt={name}
        onError={e => {
          const t = e.currentTarget
          t.style.display = 'none'
          const span = document.createElement('span')
          span.className = 'text-lg opacity-40'
          span.textContent = getItemFallbackEmoji(name)
          t.parentElement?.appendChild(span)
        }}
      />
    )
  }
  return <span className="text-lg opacity-40">{getItemFallbackEmoji(name)}</span>
}
