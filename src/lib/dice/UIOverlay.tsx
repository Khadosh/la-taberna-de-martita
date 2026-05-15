// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Palette, ChevronUp } from 'lucide-react';
import * as THREE from 'three';

/* ─── THEME CONFIG ─── */
const THEMES = {
    gold: {
        primary: [0xc8, 0xa4, 0x5d],
        bg1: '#c8a45d', bg2: '#8B6914', bg3: '#3a2800',
        numColor: '#1a0c00',
        metalness: 0.88, roughness: 0.12,
        edgeColor: 0x3a2800,
        emissive: 0x4a3010, emissiveI: 0.15,
        frameColor: '#3a2800', rivetHi: '#c8a45d', rivetLo: '#5a4000',
        filigree: 'rgba(100,70,10,.35)',
    },
    emerald: {
        primary: [0x2e, 0xcc, 0x71],
        bg1: '#2ecc71', bg2: '#1a8a4a', bg3: '#052010',
        numColor: '#021a08',
        metalness: 0.3, roughness: 0.25,
        edgeColor: 0x052010,
        emissive: 0x105030, emissiveI: 0.2,
        frameColor: '#052010', rivetHi: '#5effa1', rivetLo: '#104020',
        filigree: 'rgba(10,80,30,.35)',
    },
    void: {
        primary: [0x1a, 0x1a, 0x2a],
        bg1: '#1a1a2a', bg2: '#0a0a18', bg3: '#000005',
        numColor: '#4deeea',
        metalness: 0.6, roughness: 0.08,
        edgeColor: 0x001a1a,
        emissive: 0x002222, emissiveI: 0.4,
        frameColor: '#0a0a18', rivetHi: '#4deeea', rivetLo: '#0a2020',
        filigree: 'rgba(20,100,100,.3)',
    },
};

/* ─── CANVAS TEXTURE GENERATOR (inspired by Dragon Bones) ─── */
function makeFaceTexture(label, theme, sz = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = sz;
    const x = c.getContext('2d'), h = sz / 2;
    const t = THEMES[theme] || THEMES.gold;

    // Radial gradient background
    const g = x.createRadialGradient(h, h * 0.85, 0, h, h, sz * 0.78);
    g.addColorStop(0, t.bg1);
    g.addColorStop(0.5, t.bg2);
    g.addColorStop(1, t.bg3);
    x.fillStyle = g;
    x.fillRect(0, 0, sz, sz);

    // Outer frame
    x.strokeStyle = t.frameColor;
    x.lineWidth = sz * 0.05;
    x.strokeRect(sz * 0.025, sz * 0.025, sz * 0.95, sz * 0.95);

    // Inner frame
    x.strokeStyle = t.frameColor;
    x.lineWidth = sz * 0.018;
    x.globalAlpha = 0.5;
    x.strokeRect(sz * 0.08, sz * 0.08, sz * 0.84, sz * 0.84);
    x.globalAlpha = 1;

    // Corner rivets
    [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]].forEach(([px, py]) => {
        const cx = px * sz, cy = py * sz, r = sz * 0.03;
        const rg = x.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r);
        rg.addColorStop(0, t.rivetHi);
        rg.addColorStop(1, t.rivetLo);
        x.beginPath();
        x.arc(cx, cy, r, 0, Math.PI * 2);
        x.fillStyle = rg;
        x.fill();
    });

    // Filigree lines
    x.strokeStyle = t.filigree;
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(sz * 0.18, sz * 0.14); x.lineTo(sz * 0.82, sz * 0.14); x.stroke();
    x.beginPath(); x.moveTo(sz * 0.18, sz * 0.86); x.lineTo(sz * 0.82, sz * 0.86); x.stroke();

    if (label === '00') {
        // Special: percentile die "00" marker
        const fs = sz * 0.36;
        x.font = `bold ${fs}px "Times New Roman", Georgia, serif`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = t.numColor;
        x.shadowColor = 'rgba(0,0,0,.5)';
        x.shadowBlur = sz * 0.015;
        x.fillText('00', h, h);
        x.shadowBlur = 0;
    } else if (label !== null) {
        const s = label.toString();
        const fs = s.length > 1 ? sz * 0.34 : sz * 0.48;
        x.font = `bold ${fs}px "Times New Roman", Georgia, serif`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = t.numColor;
        x.shadowColor = 'rgba(0,0,0,.5)';
        x.shadowBlur = sz * 0.015;
        x.shadowOffsetX = sz * 0.004;
        x.shadowOffsetY = sz * 0.005;

        // Special handling for 6/9 to balance the disambiguation line
        if (label === 6 || label === 9) {
            // Shift number slightly up to make room for the line
            x.fillText(s, h, h - sz * 0.04);
            x.shadowBlur = 0;
            x.fillStyle = t.numColor;
            // Draw a tighter underline
            x.fillRect(h - sz * 0.1, h + sz * 0.18, sz * 0.2, sz * 0.02);
        } else {
            // Absolute mathematical center for all other numbers
            x.fillText(s, h, h);
            x.shadowBlur = 0;
        }
    } else {
        // Ornament for non-numbered faces
        x.strokeStyle = t.filigree;
        x.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            x.beginPath(); x.arc(h, h, sz * 0.07 * i, 0, Math.PI * 2); x.stroke();
        }
        x.fillStyle = t.filigree;
        x.beginPath();
        x.moveTo(h, h - sz * 0.12);
        x.lineTo(h + sz * 0.12, h);
        x.lineTo(h, h + sz * 0.12);
        x.lineTo(h - sz * 0.12, h);
        x.closePath();
        x.fill();
    }

    return new THREE.CanvasTexture(c);
}

function makeFaceMat(n, theme) {
    const t = THEMES[theme] || THEMES.gold;
    return new THREE.MeshStandardMaterial({
        map: makeFaceTexture(n, theme),
        metalness: t.metalness,
        roughness: t.roughness,
    });
}

/* ─── PER-FACE UV + GROUP SETUP ─── */
function setupPerFaceUVs(geometry, trisPerFace) {
    const uv = geometry.attributes.uv;
    const pos = geometry.attributes.position;
    const totalVerts = pos.count;
    const vertsPerFace = trisPerFace * 3;
    const numFaces = totalVerts / vertsPerFace;

    if (trisPerFace === 1) {
        // Triangular faces: map each triangle to show center of texture
        for (let i = 0; i < totalVerts; i += 3) {
            uv.setXY(i,     0.5, 0.93);
            uv.setXY(i + 1, 0.07, 0.07);
            uv.setXY(i + 2, 0.93, 0.07);
        }
    } else {
        // Multi-triangle faces (D12 pentagons): project onto face plane
        const v = new THREE.Vector3();
        const center = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const a = new THREE.Vector3(), b = new THREE.Vector3();
        const tangent = new THREE.Vector3(), bitangent = new THREE.Vector3();

        for (let f = 0; f < numFaces; f++) {
            const base = f * vertsPerFace;
            center.set(0, 0, 0);
            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base + i), pos.getY(base + i), pos.getZ(base + i));
                center.add(v);
            }
            center.divideScalar(vertsPerFace);

            // Face normal from first triangle
            a.set(pos.getX(base+1) - pos.getX(base), pos.getY(base+1) - pos.getY(base), pos.getZ(base+1) - pos.getZ(base));
            b.set(pos.getX(base+2) - pos.getX(base), pos.getY(base+2) - pos.getY(base), pos.getZ(base+2) - pos.getZ(base));
            normal.crossVectors(a, b).normalize();

            // Build tangent frame
            if (Math.abs(normal.y) < 0.99) tangent.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
            else tangent.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
            bitangent.crossVectors(normal, tangent).normalize();

            // Find max radius for normalization
            let maxR = 0;
            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base+i) - center.x, pos.getY(base+i) - center.y, pos.getZ(base+i) - center.z);
                const r = Math.max(Math.abs(v.dot(tangent)), Math.abs(v.dot(bitangent)));
                if (r > maxR) maxR = r;
            }

            // Map to UV
            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base+i) - center.x, pos.getY(base+i) - center.y, pos.getZ(base+i) - center.z);
                const u2d = v.dot(tangent) / (maxR * 2.2) + 0.5;
                const v2d = v.dot(bitangent) / (maxR * 2.2) + 0.5;
                uv.setXY(base + i, u2d, v2d);
            }
        }
    }
    uv.needsUpdate = true;
}

function setupFaceGroups(geometry, numFaces, trisPerFace) {
    geometry.clearGroups();
    const indicesPerFace = trisPerFace * 3;
    for (let i = 0; i < numFaces; i++) {
        geometry.addGroup(i * indicesPerFace, indicesPerFace, i);
    }
}

function getFaceLabels(sides, isPercentile) {
    if (sides === 4)  return [4, 3, 1, 2];
    if (sides === 8)  return [1, 2, 3, 4, 5, 6, 7, 8];
    if (sides === 12) return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    if (sides === 20) return Array.from({length: 20}, (_, i) => i + 1);
    if (sides === 10 && isPercentile) {
        const tens = ['00', '10', '20', '30', '40', '50', '60', '70', '80', '90'];
        return Array.from({length: 20}, (_, i) => tens[i % 10]);
    }
    if (sides === 10) return Array.from({length: 20}, (_, i) => (i % 10) + 1);
    return [1];
}

/* ─── DIE GEOMETRY BUILDERS ─── */
function buildDieMesh(sides, theme, isPercentile = false) {
    const t = THEMES[theme] || THEMES.gold;
    const edgeMat = new THREE.LineBasicMaterial({ color: t.edgeColor });

    let geo, mesh;
    switch (sides) {
        case 4: {
            geo = new THREE.TetrahedronGeometry(0.9, 0);
            setupFaceGroups(geo, 4, 1);
            setupPerFaceUVs(geo, 1);
            const labels = getFaceLabels(4);
            mesh = new THREE.Mesh(geo, labels.map(n => makeFaceMat(n, theme)));
            break;
        }
        case 6: {
            geo = new THREE.BoxGeometry(1.1, 1.1, 1.1);
            mesh = new THREE.Mesh(geo, [1, 6, 2, 5, 3, 4].map(n => makeFaceMat(n, theme)));
            break;
        }
        case 8: {
            geo = new THREE.OctahedronGeometry(0.9, 0);
            setupFaceGroups(geo, 8, 1);
            setupPerFaceUVs(geo, 1);
            const labels = getFaceLabels(8);
            mesh = new THREE.Mesh(geo, labels.map(n => makeFaceMat(n, theme)));
            break;
        }
        case 10: {
            geo = new THREE.IcosahedronGeometry(0.9, 0);
            setupFaceGroups(geo, 20, 1);
            setupPerFaceUVs(geo, 1);
            const labels = getFaceLabels(10, isPercentile);
            mesh = new THREE.Mesh(geo, labels.map(n => makeFaceMat(n, theme)));
            break;
        }
        case 12: {
            geo = new THREE.DodecahedronGeometry(0.9, 0);
            setupFaceGroups(geo, 12, 3);
            setupPerFaceUVs(geo, 3);
            const labels = getFaceLabels(12);
            mesh = new THREE.Mesh(geo, labels.map(n => makeFaceMat(n, theme)));
            break;
        }
        case 20: {
            geo = new THREE.IcosahedronGeometry(0.9, 0);
            setupFaceGroups(geo, 20, 1);
            setupPerFaceUVs(geo, 1);
            const labels = getFaceLabels(20);
            mesh = new THREE.Mesh(geo, labels.map(n => makeFaceMat(n, theme)));
            break;
        }
        default: {
            geo = new THREE.BoxGeometry(1, 1, 1);
            mesh = new THREE.Mesh(geo, makeFaceMat(1, theme));
        }
    }

    // Edge lines
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    edges.scale.setScalar(1.003);
    mesh.add(edges);

    return mesh;
}

/* ─── VANILLA THREE.JS MINI CANVAS ─── */
function DiceMiniCanvas({ sides, theme, isHovered, isPercentile }) {
    const containerRef = useRef(null);
    const internals = useRef(null);

    // Init scene once
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const w = 70, h = 80;
        const scene = new THREE.Scene();
        scene.background = null; // transparent

        const cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 50);
        cam.position.set(0, 0, 3.8);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);
        renderer.domElement.style.pointerEvents = 'none';

        // Lights
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

        // Animation loop
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

            // Scale lerp
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
    }, [sides, theme, isPercentile]); // Recreate on theme/sides/percentile change

    // Update hover state without re-creating the scene
    useEffect(() => {
        if (internals.current) {
            internals.current.hovered = isHovered;
        }
    }, [isHovered]);

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
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowThemeMenu(!showThemeMenu);
                    }}
                >
                    <Palette size={18} className="text-amber-200" />
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

    // Auto-dismiss result after 4 seconds
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

            // Dispatch circle color state to arena
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
            {/* Close button - Top Right */}
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

            {/* Controls & Tray */}
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

                {/* Tray */}
                <TrayArea diceTypes={diceTypes} addToPool={addToPool} theme={theme} setTheme={setTheme} />
            </div>

            {/* Result Banner */}
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
