import DiceArena from './DiceArena';
import UIOverlay from './UIOverlay';
export interface DiceResult {
  total: number;
  results: Record<string, number>;
  isCrit: boolean;
  isCritFail: boolean;
  vantage: 'advantage' | 'disadvantage' | 'none';
}

/**
 * Helper to parse a standard notation like "2d6" or "1d20"
 */
function parseNotation(notation: string) {
  const match = notation.toLowerCase().match(/^(\d*)d(\d+)/);
  if (!match) return null;
  const count = parseInt(match[1] || '1', 10);
  const sides = parseInt(match[2], 10);
  return { count, sides };
}

/**
 * Triggers a 3D roll if the arena is mounted.
 */
export function rollDice(notation: string, vantage: 'advantage' | 'disadvantage' | 'none' = 'none'): Promise<DiceResult> {
  return new Promise((resolve) => {
    const parsed = parseNotation(notation);
    if (!parsed) {
      console.error("Invalid dice notation:", notation);
      return resolve({ total: 0, results: {}, isCrit: false, isCritFail: false, vantage: 'none' });
    }

    const dicePool = Array.from({ length: parsed.count }, (_, i) => ({
      sides: parsed.sides,
      isPercentile: false,
      id: `${Date.now()}_${i}`
    }));

    const handleFinished = (e: any) => {
      window.removeEventListener('roll-finished', handleFinished);
      resolve(e.detail);
    };

    window.addEventListener('roll-finished', handleFinished);

    window.dispatchEvent(new CustomEvent('start-roll', {
      detail: { dicePool, vantage, theme: 'gold' }
    }));
  });
}

/**
 * The main component to mount in Character Sheet / Session Panel.
 * Shows the 3D dice arena and the UI overlay.
 */
export function DiceModule({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void
}) {
  // Canvas siempre montado (display:none cuando cerrado) para que WebGL se inicialice
  // en el background al cargar la página y no bloquee el hilo cuando el usuario abre los dados.
  return (
    <div
      className="fixed inset-0 z-[9999] bg-stone-950/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto p-4"
      style={{ display: isOpen ? 'flex' : 'none' }}
    >
      <div className="relative w-full max-w-3xl h-[600px] bg-stone-900 border-2 border-amber-900/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">

        <div className="absolute inset-0 pointer-events-none">
          <DiceArena />
        </div>

        <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
          <UIOverlay onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
