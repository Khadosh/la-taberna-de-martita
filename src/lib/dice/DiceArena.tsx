// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import Die3D from './Die3D';

export default function DiceArena() {
    const [dice, setDice] = useState([]);
    const [rolling, setRolling] = useState(false);
    const [circleState, setCircleState] = useState('idle'); // idle | rolling | success | failure | crit | critfail

    const resultsRef = useRef({});
    const expectedCountRef = useRef(0);
    const vantageRef = useRef('none');
    const originalPoolRef = useRef([]);
    const rollIdRef = useRef(0);

    const handleDieStop = (id, value, dieRollId) => {
        // Only accept results from the current roll session
        if (dieRollId !== rollIdRef.current) return;

        resultsRef.current[id] = value;
        const settledDice = Object.keys(resultsRef.current).length;

        if (settledDice === expectedCountRef.current && expectedCountRef.current > 0) {
            const allResults = resultsRef.current;
            const vantage = vantageRef.current;
            const originalPool = originalPoolRef.current;

            let total = 0, isCrit = false, isCritFail = false;

            if (vantage !== 'none' && originalPool.length > 0) {
                // Advantage/Disadvantage: group results by original die index
                for (let i = 0; i < originalPool.length; i++) {
                    const baseId = originalPool[i].id;
                    const v1 = allResults[`${baseId}_0`];
                    const v2 = allResults[`${baseId}_1`];

                    // Safety check: ensure we have both values
                    if (v1 === undefined || v2 === undefined) continue;

                    const picked = vantage === 'advantage' ? Math.max(v1, v2) : Math.min(v1, v2);
                    total += picked;

                    // Check for nat 20 / nat 1 on d20
                    if (originalPool[i].sides === 20) {
                        if (picked === 20) isCrit = true;
                        if (picked === 1) isCritFail = true;
                    }
                }
            } else {
                total = Object.values(allResults).reduce((a, b) => a + (Number(b) || 0), 0);

                // Check nat 20 / nat 1 on d20
                originalPool.forEach((d) => {
                    if (d.sides === 20) {
                        const val = allResults[d.id];
                        if (val === 20) isCrit = true;
                        if (val === 1) isCritFail = true;
                    }
                });
            }

            window.dispatchEvent(new CustomEvent('roll-finished', {
                detail: { total, results: allResults, isCrit, isCritFail, vantage }
            }));

            // Clear state for next roll
            resultsRef.current = {};
            expectedCountRef.current = 0;
        }
    };

    // Listen for result state from UI (success/failure)
    useEffect(() => {
        const handler = (e) => {
            setCircleState(e.detail.state);
            // Auto-reset after 3.5s
            const t = setTimeout(() => setCircleState('idle'), 3500);
            return () => clearTimeout(t);
        };
        window.addEventListener('circle-state', handler);
        return () => window.removeEventListener('circle-state', handler);
    }, []);

    useEffect(() => {
        const handleRoll = (e) => {
            const { dicePool, vantage, theme } = e.detail;

            // Increment roll session ID
            rollIdRef.current += 1;
            const currentRollId = rollIdRef.current;

            resultsRef.current = {};
            vantageRef.current = vantage || 'none';
            originalPoolRef.current = dicePool;

            setDice([]);
            setRolling(true);
            setCircleState('rolling');

            setTimeout(() => {
                // If a new roll started during this timeout, abort
                if (currentRollId !== rollIdRef.current) return;

                let actualDice;

                if (vantage && vantage !== 'none') {
                    actualDice = [];
                    dicePool.forEach((d) => {
                        for (let copy = 0; copy < 2; copy++) {
                            actualDice.push({
                                ...d,
                                id: `${d.id}_${copy}`,
                            });
                        }
                    });
                } else {
                    actualDice = [...dicePool];
                }

                const count = actualDice.length;
                const cols = Math.min(count, 4);
                const spacing = 2.0;

                const newDice = actualDice.map((d, i) => {
                    const col = i % cols;
                    const row = Math.floor(i / cols);
                    // Narrower spawn area (from 6x6 to 4x4)
                    const x = (Math.random() - 0.5) * 4;
                    const z = (Math.random() - 0.5) * 4;
                    const y = 6 + i * 1.2;

                    // Randomized rotation
                    const rotation = [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];

                    // Slight impulse towards the center (0,0,0)
                    const impulse = [
                        -x * (0.5 + Math.random() * 2),
                        -3, // downward nudge
                        -z * (0.5 + Math.random() * 2)
                    ];

                    return { ...d, position: [x, y, z], rotation, rollId: currentRollId, velocity: impulse, theme: theme || 'gold' };
                });

                expectedCountRef.current = newDice.length;
                setDice(newDice);
                setTimeout(() => {
                    if (currentRollId === rollIdRef.current) setRolling(false);
                }, 3500);
            }, 50);
        };

        window.addEventListener('start-roll', handleRoll);
        return () => window.removeEventListener('start-roll', handleRoll);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full">
            <Canvas
                style={{ width: '100%', height: '60%' }}
                shadows={{ type: THREE.PCFShadowMap }}
                dpr={[1, 2]}
            >
                <CameraControl rolling={rolling} />
                <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.5} />

                <ambientLight intensity={0.7} />
                <spotLight position={[10, 20, 10]} angle={0.4} penumbra={1} intensity={5} castShadow color="#4deeea" />
                <pointLight position={[-10, -5, -10]} intensity={1.5} color="#c8a45d" />
                <Environment preset="sunset" />

                <Physics gravity={[0, -28, 0]}>
                    <Floor />
                    <RitualCircle3D state={circleState} />
                    <Walls />

                    {dice.map((d) => (
                        <Die3D
                            key={d.id}
                            sides={d.sides}
                            theme={d.theme}
                            isPercentile={d.isPercentile}
                            position={d.position}
                            rotation={d.rotation}
                            velocity={d.velocity}
                            rollId={d.rollId}
                            onStop={(val, rId) => handleDieStop(d.id, val, rId)}
                        />
                    ))}
                </Physics>

                <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={20} blur={2} far={4.5} />
            </Canvas>
        </div>
    );
}

function CameraControl({ rolling }) {
    const { camera, size } = useThree();
    useFrame(() => {
        const aspect = size.width / size.height;
        if (rolling) {
            // During roll, zoom in slightly
            const rollDist = aspect < 0.6 ? 13 : 8;
            camera.position.lerp(new THREE.Vector3(0, 10, rollDist), 0.1);
        } else {
            // Idle: pull back so the full circle fits in frame
            const idleDist = aspect < 1 ? Math.max(12, 6 / aspect) : 10;
            camera.position.lerp(new THREE.Vector3(0, 12, idleDist), 1);
            // lookAt y=-1: baja el punto de mira -> el círculo queda en la mitad inferior del modal
            camera.lookAt(0, 1, 0);
        }
    });
    return <PerspectiveCamera makeDefault position={[0, 15, 15]} fov={40} />;
}

function Floor() {
    const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, 0, 0] }));
    return (
        <mesh ref={ref} receiveShadow>
            <planeGeometry args={[100, 100]} />
            <shadowMaterial opacity={0.2} color="#000000" />
        </mesh>
    );
}

/* ─── ANIMATED RITUAL CIRCLE ─── */
const CIRCLE_COLORS = {
    idle: { inner: '#4deeea', outer: '#c8a45d', iOpacity: 0.5, oOpacity: 0.3 },
    rolling: { inner: '#4deeea', outer: '#c8a45d', iOpacity: 0.5, oOpacity: 0.3 },
    success: { inner: '#2ecc71', outer: '#c8a45d', iOpacity: 0.9, oOpacity: 0.4 },
    failure: { inner: '#ff4b2b', outer: '#c8a45d', iOpacity: 0.9, oOpacity: 0.4 },
    crit: { inner: '#2ecc71', outer: '#2ecc71', iOpacity: 1.0, oOpacity: 0.9 },
    critfail: { inner: '#ff4b2b', outer: '#ff4b2b', iOpacity: 1.0, oOpacity: 0.9 },
};

function RitualCircle3D({ state = 'idle' }) {
    const innerRef = useRef();
    const outerRef = useRef();

    const innerColor = useRef(new THREE.Color('#4deeea'));
    const outerColor = useRef(new THREE.Color('#c8a45d'));
    const innerOpacity = useRef(0.5);
    const outerOpacity = useRef(0.3);

    useFrame((_, delta) => {
        const tc = CIRCLE_COLORS[state] || CIRCLE_COLORS.idle;
        const speed = 4 * delta;

        innerColor.current.lerp(new THREE.Color(tc.inner), speed);
        outerColor.current.lerp(new THREE.Color(tc.outer), speed);
        innerOpacity.current += (tc.iOpacity - innerOpacity.current) * speed;
        outerOpacity.current += (tc.oOpacity - outerOpacity.current) * speed;

        if (innerRef.current) {
            innerRef.current.material.color.copy(innerColor.current);
            innerRef.current.material.opacity = innerOpacity.current;
        }
        if (outerRef.current) {
            outerRef.current.material.color.copy(outerColor.current);
            outerRef.current.material.opacity = outerOpacity.current;
        }
    });

    return (
        <group position={[0, 0.01, 0]}>
            <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[4.0, 4.15, 64]} />
                <meshBasicMaterial color="#4deeea" transparent opacity={0.5} />
            </mesh>
            <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[4.5, 4.6, 64]} />
                <meshBasicMaterial color="#c8a45d" transparent opacity={0.3} />
            </mesh>
        </group>
    );
}

function Walls() {
    // Tall invisible walls to keep dice in the arena
    useBox(() => ({ position: [0, 10, -4.5], args: [12, 20, 0.5] }));
    useBox(() => ({ position: [0, 10, 4.5], args: [12, 20, 0.5] }));
    useBox(() => ({ position: [-4.5, 10, 0], args: [0.5, 20, 12] }));
    useBox(() => ({ position: [4.5, 10, 0], args: [0.5, 20, 12] }));
    return null;
}
