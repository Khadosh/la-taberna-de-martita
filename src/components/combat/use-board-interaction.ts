import { useEffect, useRef, useState } from 'react'
import type { TokenData, Pos } from './combat-types'
import { TOKEN_SIZE } from './combat-helpers'

export function useBoardInteraction({
  tokens,
  externalPositions,
  onTokenMoved,
  canDrag,
  onTokenTap,
}: {
  tokens: TokenData[]
  externalPositions?: Record<string, Pos>
  onTokenMoved?: (entityId: string, x: number, y: number) => void
  canDrag?: (tokenId: string) => boolean
  onTokenTap: (id: string, isOwnToken: boolean) => void
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Record<string, Pos>>({})
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const draggingRef = useRef<string | null>(null)
  const dragRef = useRef<{ id: string; mx: number; my: number; tx: number; ty: number; moved: boolean; draggable: boolean } | null>(null)
  const onTokenTapRef = useRef(onTokenTap)
  onTokenTapRef.current = onTokenTap

  const [boardSize, setBoardSize] = useState({ width: 800, height: 600 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0 })

  const [showGrid, setShowGrid] = useState(true)
  const [gridSize, setGridSize] = useState(60)
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 })

  useEffect(() => { draggingRef.current = dragging }, [dragging])

  useEffect(() => {
    const board = boardRef.current
    if (!board) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setBoardSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(board)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!externalPositions || Object.keys(externalPositions).length === 0) return
    const board = boardRef.current
    if (!board) return
    const { width, height } = board.getBoundingClientRect()
    if (width === 0) return
    setPositions(prev => {
      const next = { ...prev }
      for (const [id, pos] of Object.entries(externalPositions)) {
        if (draggingRef.current === id) continue
        next[id] = { x: pos.x * width, y: pos.y * height }
      }
      return next
    })
  }, [externalPositions])

  useEffect(() => {
    if (tokens.length === 0) {
      setPositions({})
      return
    }
    const init = () => {
      const board = boardRef.current
      if (!board) return
      const { width } = board.getBoundingClientRect()
      if (width === 0) { requestAnimationFrame(init); return }
      setPositions(prev => {
        const next = { ...prev }
        tokens.forEach((t, idx) => {
          if (!next[t.id]) {
            const cols = Math.max(4, Math.ceil(Math.sqrt(tokens.length)))
            const row = Math.floor(idx / cols)
            const col = idx % cols
            const padding = 20
            next[t.id] = { x: padding + col * (TOKEN_SIZE + 15), y: padding + row * (TOKEN_SIZE + 20) }
          }
        })
        return next
      })
    }
    requestAnimationFrame(init)
  }, [tokens])

  useEffect(() => {
    if (!activeDragId) return
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = (e.clientX - d.mx) / zoom
      const dy = (e.clientY - d.my) / zoom
      if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true
      if (d.moved && d.draggable) {
        const board = boardRef.current
        if (!board) return
        const rect = board.getBoundingClientRect()
        setPositions(prev => ({
          ...prev,
          [activeDragId]: {
            x: Math.max(0, Math.min(rect.width - TOKEN_SIZE, d.tx + dx)),
            y: Math.max(0, Math.min(rect.height - TOKEN_SIZE - 34, d.ty + dy)),
          },
        }))
      }
    }
    const handleUp = (e: PointerEvent) => {
      const d = dragRef.current
      if (d && !d.moved) {
        const isOwnToken = !canDrag || canDrag(d.id)
        onTokenTapRef.current(d.id, isOwnToken)
      } else if (d && d.moved && d.draggable && onTokenMoved) {
        const board = boardRef.current
        if (board) {
          const rect = board.getBoundingClientRect()
          const dx = (e.clientX - d.mx) / zoom
          const dy = (e.clientY - d.my) / zoom
          const x = Math.max(0, Math.min(rect.width - TOKEN_SIZE, d.tx + dx))
          const y = Math.max(0, Math.min(rect.height - TOKEN_SIZE - 34, d.ty + dy))
          onTokenMoved(d.id, x / rect.width, y / rect.height)
        }
      }
      setActiveDragId(null)
      setDragging(null)
      dragRef.current = null
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [activeDragId, zoom, canDrag, onTokenMoved])

  const clampPan = (newPan: { x: number; y: number }, currentZoom: number) => {
    const minX = boardSize.width * (1 - currentZoom)
    const minY = boardSize.height * (1 - currentZoom)
    return {
      x: currentZoom >= 1.0 ? Math.min(0, Math.max(minX, newPan.x)) : newPan.x,
      y: currentZoom >= 1.0 ? Math.min(0, Math.max(minY, newPan.y)) : newPan.y,
    }
  }

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const factor = 1 - e.deltaY * 0.0006
    const nextZoom = Math.min(Math.max(zoom * factor, 1.0), 4)
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const canvasMouseX = (mouseX - pan.x) / zoom
    const canvasMouseY = (mouseY - pan.y) / zoom
    const nextPan = clampPan({ x: mouseX - canvasMouseX * nextZoom, y: mouseY - canvasMouseY * nextZoom }, nextZoom)
    setZoom(nextZoom)
    setPan(nextPan)
  }

  const handleBgPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1
    const isSpacePan = e.button === 0 && (e.nativeEvent as any).spaceKey
    const isBackground = e.target === boardRef.current || (e.target as HTMLElement).id === 'map-canvas'
    const isAllowedPan = isMiddleClick || isSpacePan || (isBackground && (e.button === 0 || e.button === 2))
    if (isAllowedPan) {
      e.stopPropagation()
      setIsPanning(true)
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handleBgPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      e.stopPropagation()
      const nextPan = clampPan({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y }, zoom)
      setPan(nextPan)
    }
  }

  const handleBgPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      e.stopPropagation()
      setIsPanning(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return {
    boardRef,
    positions,
    setPositions,
    boardSize,
    pan,
    setPan,
    zoom,
    setZoom,
    isPanning,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    gridOffset,
    setGridOffset,
    dragging,
    setDragging,
    activeDragId,
    setActiveDragId,
    dragRef,
    handleWheel,
    handleBgPointerDown,
    handleBgPointerMove,
    handleBgPointerUp,
  }
}
