import type { TokenData, AttackEntity, BoardCharacter, Pos } from './combat/combat-types'
import { TOKEN_SIZE } from './combat/combat-helpers'
import { CombatToken } from './combat/combat-token'
import { CombatPopup } from './combat/combat-popup'
import { useCombatBoard } from './combat/use-combat-board'

export type { TokenData, AttackEntity, BoardCharacter }

export function CombatBoard({
  tokens,
  allEntities,
  mapUrl,
  externalPositions,
  onTokenMoved,
  canDrag,
  onAttackConfirm,
  characters = [],
  isPlayer = false,
  externalTargeting = null,
  onSelectionChange,
}: {
  tokens: TokenData[]
  allEntities: AttackEntity[]
  mapUrl?: string | null
  externalPositions?: Record<string, Pos>
  onTokenMoved?: (entityId: string, x: number, y: number) => void
  canDrag?: (tokenId: string) => boolean
  onAttackConfirm?: (
    attackerId: string,
    targetId: string,
    hit: boolean,
    damage?: number,
    isHealing?: boolean,
    spellLevel?: number
  ) => void
  characters?: BoardCharacter[]
  isPlayer?: boolean
  externalTargeting?: {
    attackFrom: string | null
    attackTo: string | null
    selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
    selectedSpellIndex: string | null
    aoeActive: boolean
    aoeType: 'circle' | 'cube' | 'cone' | 'line'
    aoeRadius: number
    aoePosition: Pos | null
    groundTargetPos: Pos | null
    attackerName?: string
  } | null
  onSelectionChange?: (state: {
    attackFrom: string | null
    attackTo: string | null
    selectedMode: 'melee' | 'ranged' | 'thrown' | 'spell'
    selectedSpellIndex: string | null
    aoeActive: boolean
    aoeType: 'circle' | 'cube' | 'cone' | 'line'
    aoeRadius: number
    aoePosition: Pos | null
    groundTargetPos: Pos | null
  }) => void
}) {
  const {
    boardRef,
    positions,
    boardSize,
    pan,
    zoom,
    showGrid,
    setShowGrid,
    gridSize,
    setGridSize,
    gridOffset,
    setGridOffset,
    setAttackFrom,
    setAttackTo,
    setGroundTargetPos,
    selectedMode,
    setSelectedMode,
    selectedWeaponId,
    setSelectedWeaponId,
    selectedSpellIndex,
    setSelectedSpellIndex,
    aoeActive,
    setAoeActive,
    aoeType,
    setAoeType,
    aoeRadius,
    setAoeRadius,
    aoePosition,
    setAoePosition,
    effAttackFrom,
    effAttackTo,
    effAoeActive,
    effAoeType,
    effAoePosition,
    fromPos,
    toPos,
    midX,
    midY,
    distanceFtGrid,
    distancePx,
    calcResult,
    rangeConfig,
    checkTokenInAoE,
    targetsInAoE,
    handleWheel,
    handleBgPointerDown,
    handleBgPointerMove,
    handleBgPointerUp,
    handleBoardClick,
    setDragging,
    setActiveDragId,
    dragRef,
    attackerChar,
    attackerInventory,
    attackerNpcSpells,
    isExternalActive,
    aoeRadiusPixels,
  } = useCombatBoard({
    tokens,
    allEntities,
    mapUrl,
    externalPositions,
    onTokenMoved,
    canDrag,
    characters,
    isPlayer,
    externalTargeting,
    onSelectionChange,
  })

  const bgUrl = mapUrl ?? '/assets/images/mapa_combate.png'

  return (
    <div
      ref={boardRef}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        touchAction: 'none', userSelect: 'none',
      }}
      onWheel={handleWheel}
      onPointerDown={handleBgPointerDown}
      onPointerMove={handleBgPointerMove}
      onPointerUp={handleBgPointerUp}
      onClick={handleBoardClick}
    >
      {/* Zoomed Canvas */}
      <div
        id="map-canvas"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          backgroundImage: `url('${bgUrl}')`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          pointerEvents: 'none',
        }}
      >
        {/* Grid Pattern overlay */}
        {showGrid && (
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `
                linear-gradient(to right, rgba(213, 184, 138, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(213, 184, 138, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize}px ${gridSize}px`,
              backgroundPosition: `${gridOffset.x}px ${gridOffset.y}px`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* SVGs (arrows, templates) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
          <defs>
            <marker id="cb-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="rgba(251,191,36,0.95)" />
            </marker>
          </defs>

          {/* Attack Arrow */}
          {fromPos && toPos && (
            <g>
              <line
                x1={fromPos.x + TOKEN_SIZE / 2} y1={fromPos.y + TOKEN_SIZE / 2}
                x2={toPos.x + TOKEN_SIZE / 2} y2={toPos.y + TOKEN_SIZE / 2}
                stroke="rgba(251,191,36,0.8)" strokeWidth="2.5" strokeDasharray="10 5"
                markerEnd="url(#cb-arrow)"
              />
              {/* Distance badge inline */}
              <rect
                x={midX - 52} y={midY - 10} width="104" height="20" rx="3"
                fill="rgba(10, 5, 2, 0.88)" stroke="#8a6b3e" strokeWidth="1"
              />
              <text
                x={midX} y={midY + 4}
                fontFamily="monospace" fontSize="9" fontWeight="bold" fill="#d5b88a"
                textAnchor="middle"
              >
                {distanceFtGrid} ft ({Math.round(distancePx / gridSize)} c)
              </text>
            </g>
          )}

          {/* AoE visual template overlay */}
          {effAoeActive && effAoePosition && (
            <g>
              {effAoeType === 'circle' && (
                <circle
                  cx={effAoePosition.x} cy={effAoePosition.y} r={aoeRadiusPixels}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {effAoeType === 'cube' && (
                <rect
                  x={effAoePosition.x - aoeRadiusPixels} y={effAoePosition.y - aoeRadiusPixels}
                  width={aoeRadiusPixels * 2} height={aoeRadiusPixels * 2}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {effAoeType === 'cone' && (
                <circle
                  cx={effAoePosition.x} cy={effAoePosition.y} r={aoeRadiusPixels}
                  fill="rgba(239, 68, 68, 0.22)" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 3"
                />
              )}
              {effAoeType === 'line' && fromPos && (
                <line
                  x1={fromPos.x + TOKEN_SIZE/2} y1={fromPos.y + TOKEN_SIZE/2}
                  x2={effAoePosition.x} y2={effAoePosition.y}
                  stroke="#ef4444" strokeWidth={gridSize} strokeLinecap="round" opacity="0.35"
                />
              )}
            </g>
          )}
        </svg>

        {/* Tokens Container */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {tokens.map(token => {
            const pos = positions[token.id]
            if (!pos) return null

            const isFrom = effAttackFrom === token.id
            const isTo = effAttackTo === token.id
            const inAoE = checkTokenInAoE(pos)

            return (
              <CombatToken
                key={token.id}
                data={token}
                pos={pos}
                isFrom={isFrom}
                isTo={isTo}
                inAoE={inAoE}
                onPointerDown={e => {
                  if (e.button === 2) {
                    e.stopPropagation()
                    return
                  }
                  if (e.button !== 0) return
                  e.stopPropagation()
                  const p = positions[token.id] ?? { x: 0, y: 0 }
                  const draggable = !canDrag || canDrag(token.id)
                  if (draggable) {
                    setDragging(token.id)
                  }
                  setActiveDragId(token.id)
                  dragRef.current = { id: token.id, mx: e.clientX, my: e.clientY, tx: p.x, ty: p.y, moved: false, draggable }
                }}
                onContextMenu={e => {
                  if (isPlayer) {
                    // Check if they own this token (players can only start targeting from their own character)
                    const isOwnToken = !canDrag || canDrag(token.id)
                    if (!isOwnToken) {
                      e.preventDefault()
                      return
                    }
                  }
                  e.preventDefault()
                  e.stopPropagation()
                  setAttackFrom(token.id)
                  setAttackTo('ground')
                  setGroundTargetPos({ x: pos.x, y: pos.y })
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Grid Overlay Controls (Top-Right overlay) */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 30,
        background: 'rgba(10,5,2,0.85)', border: '1px solid #8a6b3e', borderRadius: 4,
        padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', pointerEvents: 'auto',
      }}>
        <button
          onClick={() => setShowGrid(g => !g)}
          style={{
            background: showGrid ? '#5c4322' : 'transparent', border: '1px solid #8a6b3e',
            color: '#d5b88a', fontSize: 10, padding: '3px 8px', borderRadius: 3, cursor: 'pointer', outline: 'none'
          }}
        >
          {showGrid ? 'Ocultar Rejilla' : 'Mostrar Rejilla'}
        </button>

        {showGrid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, opacity: 0.7 }}>Celda:</span>
            <input
              type="number" value={gridSize}
              onChange={e => setGridSize(Math.max(20, Math.min(200, parseInt(e.target.value) || 60)))}
              style={{ width: 38, background: 'rgba(0,0,0,0.6)', border: '1px solid #3c2414', color: '#d5b88a', fontSize: 10, textAlign: 'center', fontFamily: 'monospace', outline: 'none', padding: '2px 0' }}
            />
            <span style={{ fontSize: 9, opacity: 0.7 }}>px</span>

            <div style={{ display: 'flex', gap: 2, marginLeft: 6 }}>
              <button onClick={() => setGridOffset(o => ({ ...o, x: o.x - 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>◀</button>
              <button onClick={() => setGridOffset(o => ({ ...o, y: o.y - 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>▲</button>
              <button onClick={() => setGridOffset(o => ({ ...o, y: o.y + 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>▼</button>
              <button onClick={() => setGridOffset(o => ({ ...o, x: o.x + 5 }))} style={{ background: '#2d1808', border: '1px solid #3c2414', color: '#d5b88a', padding: '1px 4px', fontSize: 8, cursor: 'pointer' }}>▶</button>
            </div>
          </div>
        )}
      </div>

      {/* Attack calculation popup */}
      {calcResult && fromPos && toPos && (
        <CombatPopup
          key={`${calcResult.attackerId}-${calcResult.defenderId}`}
          isPlayer={isPlayer}
          isExternalActive={isExternalActive}
          externalTargeting={externalTargeting}
          calcResult={calcResult}
          fromPos={fromPos}
          toPos={toPos}
          midX={midX}
          midY={midY}
          zoom={zoom}
          pan={pan}
          boardSize={boardSize}
          distanceFtGrid={distanceFtGrid}
          distancePx={distancePx}
          gridSize={gridSize}
          attackerChar={attackerChar}
          attackerInventory={attackerInventory}
          attackerNpcSpells={attackerNpcSpells}
          selectedMode={selectedMode}
          setSelectedMode={setSelectedMode}
          selectedWeaponId={selectedWeaponId}
          setSelectedWeaponId={setSelectedWeaponId}
          selectedSpellIndex={selectedSpellIndex}
          setSelectedSpellIndex={setSelectedSpellIndex}
          aoeActive={aoeActive}
          setAoeActive={setAoeActive}
          aoeType={aoeType as any}
          setAoeType={setAoeType as any}
          aoeRadius={aoeRadius}
          setAoeRadius={setAoeRadius}
          aoePosition={aoePosition}
          setAoePosition={setAoePosition}
          targetsInAoE={targetsInAoE}
          tokens={tokens}
          onClose={() => {
            setAttackFrom(null)
            setAttackTo(null)
          }}
          onAttackConfirm={onAttackConfirm}
          rangeConfig={rangeConfig}
        />
      )}
    </div>
  )
}
