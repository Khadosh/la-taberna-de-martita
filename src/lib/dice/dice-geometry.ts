// @ts-nocheck
import * as THREE from 'three';

/* ─── THEME CONFIG ─── */
export const THEMES = {
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

/* ─── CANVAS TEXTURE GENERATOR ─── */
function makeFaceTexture(label, theme, sz = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = sz;
    const x = c.getContext('2d'), h = sz / 2;
    const t = THEMES[theme] || THEMES.gold;

    const g = x.createRadialGradient(h, h * 0.85, 0, h, h, sz * 0.78);
    g.addColorStop(0, t.bg1);
    g.addColorStop(0.5, t.bg2);
    g.addColorStop(1, t.bg3);
    x.fillStyle = g;
    x.fillRect(0, 0, sz, sz);

    x.strokeStyle = t.frameColor;
    x.lineWidth = sz * 0.05;
    x.strokeRect(sz * 0.025, sz * 0.025, sz * 0.95, sz * 0.95);

    x.strokeStyle = t.frameColor;
    x.lineWidth = sz * 0.018;
    x.globalAlpha = 0.5;
    x.strokeRect(sz * 0.08, sz * 0.08, sz * 0.84, sz * 0.84);
    x.globalAlpha = 1;

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

    x.strokeStyle = t.filigree;
    x.lineWidth = 1;
    x.beginPath(); x.moveTo(sz * 0.18, sz * 0.14); x.lineTo(sz * 0.82, sz * 0.14); x.stroke();
    x.beginPath(); x.moveTo(sz * 0.18, sz * 0.86); x.lineTo(sz * 0.82, sz * 0.86); x.stroke();

    if (label === '00') {
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

        if (label === 6 || label === 9) {
            x.fillText(s, h, h - sz * 0.04);
            x.shadowBlur = 0;
            x.fillStyle = t.numColor;
            x.fillRect(h - sz * 0.1, h + sz * 0.18, sz * 0.2, sz * 0.02);
        } else {
            x.fillText(s, h, h);
            x.shadowBlur = 0;
        }
    } else {
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
        for (let i = 0; i < totalVerts; i += 3) {
            uv.setXY(i,     0.5, 0.93);
            uv.setXY(i + 1, 0.07, 0.07);
            uv.setXY(i + 2, 0.93, 0.07);
        }
    } else {
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

            a.set(pos.getX(base+1) - pos.getX(base), pos.getY(base+1) - pos.getY(base), pos.getZ(base+1) - pos.getZ(base));
            b.set(pos.getX(base+2) - pos.getX(base), pos.getY(base+2) - pos.getY(base), pos.getZ(base+2) - pos.getZ(base));
            normal.crossVectors(a, b).normalize();

            if (Math.abs(normal.y) < 0.99) tangent.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
            else tangent.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize();
            bitangent.crossVectors(normal, tangent).normalize();

            let maxR = 0;
            for (let i = 0; i < vertsPerFace; i++) {
                v.set(pos.getX(base+i) - center.x, pos.getY(base+i) - center.y, pos.getZ(base+i) - center.z);
                const r = Math.max(Math.abs(v.dot(tangent)), Math.abs(v.dot(bitangent)));
                if (r > maxR) maxR = r;
            }

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

/* ─── DIE GEOMETRY BUILDER ─── */
export function buildDieMesh(sides, theme, isPercentile = false) {
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

    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat);
    edges.scale.setScalar(1.003);
    mesh.add(edges);

    return mesh;
}
