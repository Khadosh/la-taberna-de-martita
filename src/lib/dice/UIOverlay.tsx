// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette } from 'lucide-react';
import * as THREE from 'three';
import { buildDieMesh } from './dice-geometry';

/* ─── VANILLA THREE.JS MINI CANVAS ─── */
function DiceMiniCanvas({ sides, theme, isHovered, isPercentile }) {
    const containerRef = useRef(null);
    const internals = useRef(null);
    const [webglError, setWebglError] = useState(false);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const w = 70, h = 80;
        const scene = new THREE.Scene();
        scene.background = null;

        const cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
        cam.position.set(0, 0, 3.8);

        let renderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch (err) {
            console.warn('WebGL Renderer creation failed, falling back to static presentation:', err);
            setWebglError(true);
            return;
        }

        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);
        renderer.domElement.style.pointerEvents = 'none';

        scene.add(new THREE.AmbientLight(0xffffff, 2.5));
        const dl = new THREE.DirectionalLight(0xfff5e0, 5);
        dl.position.set(3, 5, 4);
        scene.add(dl);
        const pl = new THREE.PointLight(0xffffff, 2.5, 20);
        pl.position.set(-3, -2, 3);
        scene.add(pl);

        const die = buildDieMesh(sides, theme, isPercentile);
        scene.add(die);

        internals.current = { scene, cam, renderer, die, raf: 0, startTime: performance.now() };

        let raf;
        const animate = () => {
            raf = requestAnimationFrame(animate);
            const int = internals.current;
            if (!int) return;

            const t = (performance.now() - int.startTime) / 1000;
            const speed = int.hovered ? 2.5 : 0.5;
            int.die.rotation.y += 0.008 * speed;
            int.die.rotation.x += 0.003 * speed;
            int.die.position.y = Math.sin(t * 2) * 0.06;

            const target = int.hovered ? 1.22 : 1;
            int.die.scale.x += (target - int.die.scale.x) * 0.12;
            int.die.scale.y += (target - int.die.scale.y) * 0.12;
            int.die.scale.z += (target - int.die.scale.z) * 0.12;

            int.renderer.render(int.scene, int.cam);
        };
        animate();
        internals.current.raf = raf;

        return () => {
            cancelAnimationFrame(raf);
            renderer.dispose();
            if (el.contains(renderer.domElement)) {
                el.removeChild(renderer.domElement);
            }
        };
    }, [sides, theme, isPercentile]);

    useEffect(() => {
        if (internals.current) {
            internals.current.hovered = isHovered;
        }
    }, [isHovered]);

    if (webglError) {
        return (
            <div className="w-12 h-12 rounded-lg bg-stone-900 border border-amber-900/30 flex items-center justify-center text-amber-500/70 font-serif font-bold text-xs shadow-inner">
                {isPercentile ? 'D10%' : `D${sides}`}
            </div>
        );
    }

    return <div ref={containerRef} className="flex items-center justify-center" />;
}

/* ─── TRAY AREA ─── */
function TrayArea({ diceTypes, addToPool, theme, setTheme }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [showThemeMenu, setShowThemeMenu] = useState(false);

    const themes = [
        { id: 'gold', label: 'Áureo', color: 'bg-amber-600' },
        { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-600' },
        { id: 'void', label: 'Vacío', color: 'bg-indigo-900' }
    ];

    return (
        <div className="flex items-center gap-4 bg-stone-900/90 border border-amber-900/40 p-2 rounded-xl backdrop-blur-md shadow-2xl pointer-events-auto" onClick={() => showThemeMenu && setShowThemeMenu(false)}>
            <div className="relative">
                <button
                    className="flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors"
                    aria-label="Cambiar apariencia de los dados"
                    aria-expanded={showThemeMenu}
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowThemeMenu(!showThemeMenu);
                    }}
                >
                    <Palette size={18} className="text-amber-200" aria-hidden />
                </button>

                <AnimatePresence>
                    {showThemeMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full left-0 mb-2 w-32 bg-stone-800 border border-stone-700 rounded-lg shadow-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-stone-700 transition-colors ${theme === t.id ? 'bg-stone-700 text-amber-300' : 'text-stone-300'}`}
                                    onClick={() => {
                                        setTheme(t.id);
                                        setShowThemeMenu(false);
                                    }}
                                >
                                    <div className={`w-3 h-3 rounded-full ${t.color}`} />
                                    <span>{t.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="w-px h-8 bg-stone-700" />

            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
                {diceTypes.map((dt, i) => (
                    <button
                        key={`btn-${dt.label}`}
                        className="relative flex flex-col items-center justify-center w-16 h-16 rounded-lg hover:bg-white/5 transition-colors group"
                        onClick={() => addToPool(dt)}
                        onMouseEnter={() => setHoveredIdx(i)}
                        onMouseLeave={() => setHoveredIdx(null)}
                    >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-4 opacity-80 group-hover:opacity-100 transition-opacity">
                            <DiceMiniCanvas
                                sides={dt.sides}
                                theme={theme}
                                isHovered={hoveredIdx === i}
                                isPercentile={dt.isPercentile}
                            />
                        </div>
                        <span className="absolute bottom-1 text-[10px] font-bold text-amber-200/60 group-hover:text-amber-200 font-serif tracking-widest">{dt.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

/* ─── MAIN UI OVERLAY ─── */
export default function UIOverlay({ onClose }) {
    const [dicePool, setDicePool] = useState([]);
    const [vantage, setVantage] = useState('none');
    const [isRolling, setIsRolling] = useState(false);
    const [theme, setTheme] = useState('gold');
    const [rollResult, setRollResult] = useState(null);

    const diceTypes = [
        { sides: 4, label: 'D4' },
        { sides: 6, label: 'D6' },
        { sides: 8, label: 'D8' },
        { sides: 10, label: 'D10' },
        { sides: 12, label: 'D12' },
        { sides: 20, label: 'D20' },
        { sides: 10, label: 'D10%', isPercentile: true },
    ];

    const addToPool = (diceType) => {
        if (isRolling) return;
        setDicePool([...dicePool, {
            sides: diceType.sides,
            isPercentile: diceType.isPercentile || false,
            id: Date.now() + Math.random()
        }]);
    };

    const clearPool = () => {
        if (isRolling) return;
        setDicePool([]);
    };

    const handleRoll = () => {
        if (dicePool.length === 0 || isRolling) return;
        setIsRolling(true);
        setRollResult(null);
        window.dispatchEvent(new CustomEvent('start-roll', { detail: { dicePool, vantage, theme } }));
    };

    useEffect(() => {
        if (rollResult !== null) {
            const t = setTimeout(() => setRollResult(null), 4000);
            return () => clearTimeout(t);
        }
    }, [rollResult]);

    useEffect(() => {
        const handleFinished = (e) => {
            const { total, isCrit, isCritFail, vantage: usedVantage } = e.detail;
            setIsRolling(false);
            setRollResult({ total, isCrit, isCritFail, vantage: usedVantage });

            let circleState;
            if (isCrit) circleState = 'crit';
            else if (isCritFail) circleState = 'critfail';
            else circleState = 'success';
            window.dispatchEvent(new CustomEvent('circle-state', { detail: { state: circleState } }));
        };

        window.addEventListener('roll-finished', handleFinished);
        return () => window.removeEventListener('roll-finished', handleFinished);
    }, []);

    return (
        <div className="w-full h-full flex flex-col pointer-events-none">
            <div className="absolute top-4 right-4 z-50 pointer-events-auto">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-stone-900/80 border border-amber-900/50 text-amber-500 hover:text-amber-300 hover:bg-stone-800 transition-colors shadow-lg"
                    title="Cerrar dados"
                >
                    <X size={24} />
                </button>
            </div>

            <div className="flex-1" />

            <div className="pb-6 px-4 flex flex-col items-center gap-4">
                <AnimatePresence>
                    {dicePool.length > 0 && !isRolling && rollResult === null && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex flex-col items-center gap-3 pointer-events-auto"
                        >
                            <div className="flex bg-stone-900/80 rounded-lg border border-stone-700 overflow-hidden shadow-xl backdrop-blur-sm">
                                <button
                                    className={`px-4 py-2 text-xs font-bold font-serif tracking-wider transition-colors ${vantage === 'advantage' ? 'bg-emerald-900/60 text-emerald-300' : 'text-stone-400 hover:bg-stone-800'}`}
                                    onClick={() => setVantage(vantage === 'advantage' ? 'none' : 'advantage')}
                                >
                                    VENTAJA
                                </button>
                                <div className="w-px bg-stone-700" />
                                <button
                                    className={`px-4 py-2 text-xs font-bold font-serif tracking-wider transition-colors ${vantage === 'disadvantage' ? 'bg-red-900/60 text-red-300' : 'text-stone-400 hover:bg-stone-800'}`}
                                    onClick={() => setVantage(vantage === 'disadvantage' ? 'none' : 'disadvantage')}
                                >
                                    DESVENTAJA
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    className="px-6 py-2 bg-gradient-to-b from-amber-600 to-amber-800 hover:from-amber-500 hover:to-amber-700 text-amber-50 font-serif font-bold tracking-widest rounded-lg shadow-[0_0_15px_rgba(200,164,93,0.3)] border border-amber-400/30 transition-all"
                                    onClick={handleRoll}
                                >
                                    {`LANZAR ${dicePool.length > 1 ? dicePool.length + ' DADOS' : 'DADO'}`}
                                    {vantage !== 'none' && ' (×2)'}
                                </button>
                                <button
                                    className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200 font-serif tracking-wider"
                                    onClick={clearPool}
                                >
                                    VACIAR
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <TrayArea diceTypes={diceTypes} addToPool={addToPool} theme={theme} setTheme={setTheme} />
            </div>

            <AnimatePresence>
                {rollResult !== null && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                        <motion.div
                            initial={{ opacity: 0, y: -40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -40, scale: 0.9 }}
                            className={`flex flex-col items-center px-12 py-6 rounded-2xl border-2 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md ${
                                rollResult.isCrit ? 'bg-amber-900/80 border-amber-400 text-amber-200' :
                                rollResult.isCritFail ? 'bg-red-950/80 border-red-600 text-red-200' :
                                'bg-stone-900/80 border-stone-600 text-stone-200'
                            }`}
                        >
                            <span className="text-7xl font-bold font-serif drop-shadow-lg" style={{ fontFamily: 'Georgia, serif' }}>
                                {rollResult.total}
                            </span>
                            {(rollResult.isCrit || rollResult.isCritFail) && (
                                <span className="text-xl font-bold font-serif tracking-widest mt-2 uppercase">
                                    {rollResult.isCrit ? '¡Crítico!' : '¡Fallo Crítico!'}
                                </span>
                            )}
                            {rollResult.vantage && rollResult.vantage !== 'none' && (
                                <span className="text-sm opacity-80 mt-2 font-serif tracking-wider uppercase">
                                    {rollResult.vantage === 'advantage' ? '⬆ Ventaja' : '⬇ Desventaja'}
                                </span>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
