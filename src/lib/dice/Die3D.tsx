// @ts-nocheck
import React, { useRef, useMemo, useEffect } from 'react';
import { useBox, useConvexPolyhedron } from '@react-three/cannon';
import * as THREE from 'three';

/* ─── THEME CONFIG ─── */
const DICE_THEMES = {
    gold: {
        bg1: '#c8a45d', bg2: '#8B6914', bg3: '#3a2800',
        numColor: '#1a0c00',
        metalness: 0.88, roughness: 0.12,
        edgeColor: 0x3a2800,
        frameColor: '#3a2800', rivetHi: '#c8a45d', rivetLo: '#5a4000',
        filigree: 'rgba(100,70,10,.35)',
    },
    emerald: {
        bg1: '#2ecc71', bg2: '#1a8a4a', bg3: '#052010',
        numColor: '#021a08',
        metalness: 0.3, roughness: 0.25,
        edgeColor: 0x052010,
        frameColor: '#052010', rivetHi: '#5effa1', rivetLo: '#104020',
        filigree: 'rgba(10,80,30,.35)',
    },
    void: {
        bg1: '#1a1a2a', bg2: '#0a0a18', bg3: '#000005',
        numColor: '#4deeea',
        metalness: 0.6, roughness: 0.08,
        edgeColor: 0x001a1a,
        frameColor: '#0a0a18', rivetHi: '#4deeea', rivetLo: '#0a2020',
        filigree: 'rgba(20,100,100,.3)',
    },
};

/* ─── CANVAS FACE TEXTURE ─── */
function makeFaceTexture(label, themeKey, sz = 512) {
    const c = document.createElement('canvas');
    c.width = c.height = sz;
    const x = c.getContext('2d'), h = sz / 2;
    const t = DICE_THEMES[themeKey] || DICE_THEMES.gold;

    // Radial gradient background
    const g = x.createRadialGradient(h, h * 0.85, 0, h, h, sz * 0.78);
    g.addColorStop(0, t.bg1);
    g.addColorStop(0.5, t.bg2);
    g.addColorStop(1, t.bg3);
    x.fillStyle = g;
    x.fillRect(0, 0, sz, sz);

    // Outer frame
    x.strokeStyle = t.frameColor;
    x.lineWidth = sz * 0.055;
    x.strokeRect(sz * 0.026, sz * 0.026, sz * 0.948, sz * 0.948);

    // Inner frame
    x.strokeStyle = t.frameColor;
    x.lineWidth = sz * 0.02;
    x.globalAlpha = 0.5;
    x.strokeRect(sz * 0.08, sz * 0.08, sz * 0.84, sz * 0.84);
    x.globalAlpha = 1;

    // Corner rivets
    [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]].forEach(([px, py]) => {
        const cx = px * sz, cy = py * sz, r = sz * 0.032;
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
    x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(sz * 0.19, sz * 0.145); x.lineTo(sz * 0.81, sz * 0.145); x.stroke();
    x.beginPath(); x.moveTo(sz * 0.19, sz * 0.855); x.lineTo(sz * 0.81, sz * 0.855); x.stroke();

    if (label !== null) {
        const s = label.toString();
        const fs = s.length > 2 ? sz * 0.28 : s.length > 1 ? sz * 0.36 : sz * 0.5;
        x.font = `bold ${fs}px "Times New Roman", Georgia, serif`;
        x.textAlign = 'center';
        x.textBaseline = 'middle';
        x.fillStyle = t.numColor;
        x.shadowColor = 'rgba(0,0,0,.6)';
        x.shadowBlur = sz * 0.016;
        x.shadowOffsetX = sz * 0.005;
        x.shadowOffsetY = sz * 0.006;
        x.fillText(s, h, h);
        x.shadowBlur = 0;
        // Underline for 6/9 disambiguation
        if (label === 6 || label === 9) {
            x.fillStyle = t.numColor;
            x.fillRect(h - sz * 0.13, h + sz * 0.26, sz * 0.26, sz * 0.024);
        }
    } else {
        // Ornament for non-cube faces
        x.strokeStyle = t.filigree;
        x.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
            x.beginPath(); x.arc(h, h, sz * 0.07 * i, 0, Math.PI * 2); x.stroke();
        }
        x.fillStyle = t.filigree;
        x.beginPath();
        x.moveTo(h, h - sz * 0.14);
        x.lineTo(h + sz * 0.14, h);
        x.lineTo(h, h + sz * 0.14);
        x.lineTo(h - sz * 0.14, h);
        x.closePath();
        x.fill();
    }

    return new THREE.CanvasTexture(c);
}

function makeFaceMat(n, themeKey) {
    const t = DICE_THEMES[themeKey] || DICE_THEMES.gold;
    return new THREE.MeshStandardMaterial({
        map: makeFaceTexture(n, themeKey),
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
        for (let i = 0; i < totalVerts; i += 3) {
            uv.setXY(i,     0.5, 0.93);
            uv.setXY(i + 1, 0.07, 0.07);
            uv.setXY(i + 2, 0.93, 0.07);
        }
    } else {
        const v = new THREE.Vector3();
        const center = new THREE.Vector3();
        const a = new THREE.Vector3(), b = new THREE.Vector3();
        const normal = new THREE.Vector3();
        const tangent = new THREE.Vector3(), bitangent = new THREE.Vector3();

        for (let f = 0; f < numFaces; f++) {
            const base = f * vertsPerFace;
            center.set(0, 0, 0);
            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base+i), pos.getY(base+i), pos.getZ(base+i));
                center.add(v);
            }
            center.divideScalar(vertsPerFace);

            a.set(pos.getX(base+1)-pos.getX(base), pos.getY(base+1)-pos.getY(base), pos.getZ(base+1)-pos.getZ(base));
            b.set(pos.getX(base+2)-pos.getX(base), pos.getY(base+2)-pos.getY(base), pos.getZ(base+2)-pos.getZ(base));
            normal.crossVectors(a, b).normalize();

            if (Math.abs(normal.y) < 0.99) tangent.crossVectors(normal, new THREE.Vector3(0,1,0)).normalize();
            else tangent.crossVectors(normal, new THREE.Vector3(1,0,0)).normalize();
            bitangent.crossVectors(normal, tangent).normalize();

            let maxR = 0;
            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base+i)-center.x, pos.getY(base+i)-center.y, pos.getZ(base+i)-center.z);
                const r = Math.max(Math.abs(v.dot(tangent)), Math.abs(v.dot(bitangent)));
                if (r > maxR) maxR = r;
            }

            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base+i)-center.x, pos.getY(base+i)-center.y, pos.getZ(base+i)-center.z);
                uv.setXY(base+i, v.dot(tangent)/(maxR*2.2)+0.5, v.dot(bitangent)/(maxR*2.2)+0.5);
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
        const tens = ['00','10','20','30','40','50','60','70','80','90'];
        return Array.from({length: 20}, (_, i) => tens[i % 10]);
    }
    if (sides === 10) return Array.from({length: 20}, (_, i) => (i % 10) + 1);
    return [1];
}

/* ─── DIE COMPONENT ─── */
export default function Die3D({ sides, position, rotation, theme = 'gold', onStop, isPercentile = false, rollId, velocity = [0, -12, 0] }) {
    // Generate geometry with per-face groups and UVs
    const geometry = useMemo(() => {
        let geo;
        switch (sides) {
            case 4:
                geo = new THREE.TetrahedronGeometry(0.85);
                setupFaceGroups(geo, 4, 1);
                setupPerFaceUVs(geo, 1);
                break;
            case 6:
                geo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
                break;
            case 8:
                geo = new THREE.OctahedronGeometry(1.0);
                setupFaceGroups(geo, 8, 1);
                setupPerFaceUVs(geo, 1);
                break;
            case 10:
                geo = new THREE.IcosahedronGeometry(1.0, 0);
                setupFaceGroups(geo, 20, 1);
                setupPerFaceUVs(geo, 1);
                break;
            case 12:
                geo = new THREE.DodecahedronGeometry(1.0);
                setupFaceGroups(geo, 12, 3);
                setupPerFaceUVs(geo, 3);
                break;
            case 20:
                geo = new THREE.IcosahedronGeometry(1.0);
                setupFaceGroups(geo, 20, 1);
                setupPerFaceUVs(geo, 1);
                break;
            default:
                geo = new THREE.BoxGeometry(1, 1, 1);
        }
        return geo;
    }, [sides]);

    // Build per-face materials
    const materials = useMemo(() => {
        if (sides === 6) return [1, 6, 2, 5, 3, 4].map(n => makeFaceMat(n, theme));
        const labels = getFaceLabels(sides, isPercentile);
        return labels.map(n => makeFaceMat(n, theme));
    }, [sides, theme, isPercentile]);

    // Precompute face normals for top-face detection
    const faceNormals = useMemo(() => {
        const labels = sides === 6
            ? [1, 6, 2, 5, 3, 4]
            : getFaceLabels(sides, isPercentile);

        if (sides === 6) {
            // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
            return [
                { normal: new THREE.Vector3(1, 0, 0), label: 1 },
                { normal: new THREE.Vector3(-1, 0, 0), label: 6 },
                { normal: new THREE.Vector3(0, 1, 0), label: 2 },
                { normal: new THREE.Vector3(0, -1, 0), label: 5 },
                { normal: new THREE.Vector3(0, 0, 1), label: 3 },
                { normal: new THREE.Vector3(0, 0, -1), label: 4 },
            ];
        }

        // For polyhedra: face normal ≈ normalized centroid direction
        const pos = geometry.attributes.position;
        const info = getDieInfo(sides);
        const vertsPerFace = info.trisPerFace * 3;
        const result = [];
        for (let f = 0; f < info.numFaces; f++) {
            const base = f * vertsPerFace;
            let cx = 0, cy = 0, cz = 0;
            for (let i = 0; i < vertsPerFace; i++) {
                cx += pos.getX(base + i);
                cy += pos.getY(base + i);
                cz += pos.getZ(base + i);
            }
            cx /= vertsPerFace; cy /= vertsPerFace; cz /= vertsPerFace;
            const len = Math.sqrt(cx * cx + cy * cy + cz * cz) || 1;
            result.push({
                normal: new THREE.Vector3(cx / len, cy / len, cz / len),
                label: labels[f],
            });
        }
        return result;
    }, [geometry, sides, isPercentile]);

    // Extract unique vertices and faces for stable convex physics
    const convexArgs = useMemo(() => {
        if (sides === 6) return null;

        const posAttr = geometry.attributes.position;
        const uniqueVertices = [];
        const vertexMap = new Map();
        const faces = [];

        // Helper to get index of unique vertex
        const getVertexIndex = (x, y, z) => {
            const precision = 4;
            const key = `${x.toFixed(precision)},${y.toFixed(precision)},${z.toFixed(precision)}`;
            if (vertexMap.has(key)) return vertexMap.get(key);
            
            const index = uniqueVertices.length;
            uniqueVertices.push([x, y, z]);
            vertexMap.set(key, index);
            return index;
        };

        if (geometry.index) {
            for (let i = 0; i < geometry.index.count; i += 3) {
                const i1 = geometry.index.getX(i);
                const i2 = geometry.index.getX(i + 1);
                const i3 = geometry.index.getX(i + 2);

                const v1 = getVertexIndex(posAttr.getX(i1), posAttr.getY(i1), posAttr.getZ(i1));
                const v2 = getVertexIndex(posAttr.getX(i2), posAttr.getY(i2), posAttr.getZ(i2));
                const v3 = getVertexIndex(posAttr.getX(i3), posAttr.getY(i3), posAttr.getZ(i3));

                // Only add if not degenerate
                if (v1 !== v2 && v2 !== v3 && v3 !== v1) {
                    faces.push([v1, v2, v3]);
                }
            }
        } else {
            for (let i = 0; i < posAttr.count; i += 3) {
                const v1 = getVertexIndex(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
                const v2 = getVertexIndex(posAttr.getX(i + 1), posAttr.getY(i + 1), posAttr.getZ(i + 1));
                const v3 = getVertexIndex(posAttr.getX(i + 2), posAttr.getY(i + 2), posAttr.getZ(i + 2));

                if (v1 !== v2 && v2 !== v3 && v3 !== v1) {
                    faces.push([v1, v2, v3]);
                }
            }
        }

        return { vertices: uniqueVertices, faces };
    }, [geometry, sides]);

    // Physics
    const physicsOptions = {
        mass: 1,
        position,
        rotation,
        velocity: velocity,
        angularVelocity: [
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
            (Math.random() - 0.5) * 12,
        ],
        linearDamping: 0.5,
        angularDamping: 0.5,
    };

    const [boxRef, boxApi] = useBox(() => ({ ...physicsOptions, args: [1.0, 1.0, 1.0] }), useRef(), [sides === 6]);
    const [convexRef, convexApi] = useConvexPolyhedron(() => ({
        ...physicsOptions,
        args: convexArgs ? [convexArgs.vertices, convexArgs.faces, [], []] : undefined
    }), useRef(), [!!convexArgs]);

    const ref = sides === 6 ? boxRef : convexRef;
    const api = sides === 6 ? boxApi : convexApi;

    const hasReported = useRef(false);
    const quatRef = useRef([0, 0, 0, 1]);

    // Subscribe to quaternion for top-face reading
    useEffect(() => {
        if (!api) return;
        return api.quaternion.subscribe(q => { quatRef.current = q; });
    }, [api]);

    // Detect when die settles and read top face
    useEffect(() => {
        if (!api) return;
        const unsubscribe = api.velocity.subscribe((v) => {
            const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
            if (speed < 0.08 && !hasReported.current) {
                setTimeout(() => {
                    if (hasReported.current) return;
                    hasReported.current = true;
                    if (onStop) {
                        // Read actual top face from quaternion
                        const q = quatRef.current;
                        const quat = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
                        let maxDot = -Infinity;
                        let topLabel = 1;

                        for (const { normal, label } of faceNormals) {
                            const rotated = normal.clone().applyQuaternion(quat);
                            if (rotated.y > maxDot) {
                                maxDot = rotated.y;
                                topLabel = label;
                            }
                        }

                        // For string labels (percentile), convert to number
                        const result = typeof topLabel === 'string' ? parseInt(topLabel) : topLabel;
                        onStop(result, rollId);
                    }
                }, 500);
            }
        });
        return unsubscribe;
    }, [sides, onStop, api, isPercentile, faceNormals, rollId]);

    // Edge lines
    const edgesAdded = useRef(false);
    const meshRef = useRef();

    useEffect(() => {
        if (meshRef.current && !edgesAdded.current) {
            const t = DICE_THEMES[theme] || DICE_THEMES.gold;
            const edgeMat = new THREE.LineBasicMaterial({ color: t.edgeColor });
            const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMat);
            edges.scale.setScalar(1.004);
            meshRef.current.add(edges);
            edgesAdded.current = true;
        }
    }, [geometry, theme]);

    return (
        <group ref={ref}>
            <mesh ref={meshRef} castShadow receiveShadow geometry={geometry} material={materials} />
        </group>
    );
}

function getDieInfo(sides) {
    switch (sides) {
        case 4: return { numFaces: 4, trisPerFace: 1 };
        case 8: return { numFaces: 8, trisPerFace: 1 };
        case 10: return { numFaces: 20, trisPerFace: 1 };
        case 12: return { numFaces: 12, trisPerFace: 3 };
        case 20: return { numFaces: 20, trisPerFace: 1 };
        default: return { numFaces: 6, trisPerFace: 2 };
    }
}
