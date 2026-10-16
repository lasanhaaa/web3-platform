// Chess pieces in the badge material: the badge studio lighting (core.js, unchanged),
// steel satin + chrome linework, one glowing focus in the route colour.
import * as THREE from 'three';
import { studioEnvironment, addLights, extrude, canvasTexture } from '../bz/badgeweb3/src/badge/core.js';

const q = new URLSearchParams(location.search);
const PIECE = q.get('p') || 'pawn';
const TINT = q.get('tint') || '#4ade80';
const W = +q.get('w') || 1024, H = +q.get('h') || 1024;
const ROT = +(q.get('rot') ?? 0.35);
const GLOW = +(q.get('glow') ?? 1);

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.environment = studioEnvironment(renderer, TINT);
addLights(scene);

const cam = new THREE.PerspectiveCamera(+(q.get('fov') || 19), W / H, 0.1, 100);
cam.position.set(0, +(q.get('cy') || 4.2), 16);
cam.lookAt(0, +(q.get('ly') || 2.05), 0);

// ── materials (FINISHES.steel from model.js)
const grain = canvasTexture(256, (ctx, s) => {
  const img = ctx.createImageData(s, s);
  for (let i = 0; i < s * s; i++) {
    const v = 150 + (Math.random() - 0.5) * 80;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
});
grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
grain.repeat.set(3, 3);
const plateMap = canvasTexture(512, (ctx, s) => {
  const g = ctx.createLinearGradient(s * 0.15, s * 0.1, s * 0.85, s * 0.9);
  g.addColorStop(0, '#8c8e96');
  g.addColorStop(0.5, '#62646c');
  g.addColorStop(1, '#3c3d44');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}, { srgb: true });

const accent = new THREE.Color(TINT);
const M = {
  body: new THREE.MeshPhysicalMaterial({ color: 0xc9cbd3, metalness: 0.55, roughness: 0.34, clearcoat: 1, clearcoatRoughness: 0.15 }),
  chrome: new THREE.MeshPhysicalMaterial({ color: 0xd4d6de, metalness: 1, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.1 }),
  rim: new THREE.MeshPhysicalMaterial({ color: 0xc8cad3, metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.14, iridescenceIOR: 1.5, iridescenceThicknessRange: [180, 520] }),
  // brushed gunmetal, like the badge plates (satin enough to stay grey from above)
  plate: new THREE.MeshPhysicalMaterial({ color: +(q.get('pc') || 0x6a6e78), metalness: 1, roughness: +(q.get('pr') || 0.62), roughnessMap: grain, bumpMap: grain, bumpScale: 0.25 }),
  edge: new THREE.MeshPhysicalMaterial({ color: 0x7c7f89, metalness: 1, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
  accent: new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.85, roughness: 0.25, toneMapped: false }),
};
const glowTex = canvasTexture(256, (ctx, s) => {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.25, 'rgba(255,255,255,.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}, { srgb: true });
const glow = (size, op = 0.55) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: accent, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, opacity: op * GLOW }));
  sp.scale.set(size, size, 1);
  return sp;
};

// ── geometry helpers
const lathe = (path, seg = 128) => {
  const pts = path.getPoints(24).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y));
  const g = new THREE.LatheGeometry(pts, seg, Math.PI);
  g.computeVertexNormals();
  return g;
};
const ring = (r, tube, y, mat = M.chrome) => {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 32, 160), mat);
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
};
const rbox = (w, h, d, r = 0.035) => {
  const s = new THREE.Shape();
  const x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r;
  s.moveTo(x, y); s.lineTo(x + ww, y); s.lineTo(x + ww, y + hh); s.lineTo(x, y + hh); s.lineTo(x, y);
  return extrude(s, { depth: d - 2 * r, bevelThickness: r, bevelSize: r, bevelSegments: 6, curveSegments: 4 });
};

// The shared foot: a Staunton base (bevel, bead, concave stem) up to `top` with radius `neck`.
function foot(p, top, neck) {
  p.moveTo(0, 0);
  p.lineTo(0.92, 0);
  p.quadraticCurveTo(1.0, 0, 1.0, 0.08);
  p.lineTo(1.0, 0.16);
  p.quadraticCurveTo(1.0, 0.22, 0.92, 0.24);
  p.lineTo(0.84, 0.26);
  p.quadraticCurveTo(0.9, 0.31, 0.84, 0.37); // bead
  p.lineTo(0.74, 0.42);
  p.bezierCurveTo(0.5, 0.52, neck, top * 0.55, neck, top);
}

// ── pieces (units: base radius 1)
const group = new THREE.Group();
const glowAt = [];

function pawn() {
  const p = new THREE.Path();
  foot(p, 1.05, 0.36);
  p.lineTo(0.6, 1.08); p.quadraticCurveTo(0.66, 1.12, 0.62, 1.19); p.lineTo(0.38, 1.24);
  const R = 0.52, cy = 1.74, x0 = 0.3, a0 = -Math.acos(x0 / R);
  p.lineTo(x0, cy + Math.sin(a0) * R);
  p.absarc(0, cy, R, a0, Math.PI / 2, false);
  group.add(new THREE.Mesh(lathe(p), M.body));
  group.add(ring(0.6, 0.035, 1.15));
  // the Academy badge's planet: a chrome orbit around the head with one glowing moon
  const orbit = new THREE.Group();
  orbit.position.y = cy;
  orbit.rotation.set(1.18, 0, -0.32);
  orbit.add(new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.022, 24, 200), M.rim));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.085, 32, 16), M.accent);
  const a = 0.55 * Math.PI;
  moon.position.set(Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0);
  orbit.add(moon);
  group.add(orbit);
  orbit.updateMatrixWorld(true);
  glowAt.push([moon.getWorldPosition(new THREE.Vector3()), 0.9]);
}

function bishop() {
  const p = new THREE.Path();
  foot(p, 1.55, 0.3);
  p.lineTo(0.58, 1.6); p.quadraticCurveTo(0.64, 1.65, 0.6, 1.72); p.lineTo(0.42, 1.76);
  p.quadraticCurveTo(0.4, 1.8, 0.28, 1.84);
  // the mitre: an egg rising to a point
  p.bezierCurveTo(0.6, 2.05, 0.58, 2.5, 0.12, 2.88);
  p.lineTo(0.09, 2.9);
  const R = 0.12, cy = 3.0;
  p.absarc(0, cy, R, -Math.PI / 2 + 0.5, Math.PI / 2, false);
  // glowing slit across the mitre: an emissive stripe in the lathe UVs (front is u = .5)
  const slit = canvasTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = s * 0.016;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // v runs bottom (0) to top (1) of the whole profile; the mitre is roughly v .74–.9
    const vy = (v) => s * (1 - v);
    ctx.moveTo(s * 0.445, vy(0.69));
    ctx.lineTo(s * 0.555, vy(0.84));
    ctx.stroke();
  }, { srgb: true });
  const mat = M.body.clone();
  mat.emissiveMap = slit;
  mat.emissive = accent.clone();
  mat.emissiveIntensity = 1.5;
  const g = lathe(p);
  // map v to height, so the stripe sits where it is drawn
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setY(i, pos.getY(i) / 3.12);
  group.add(new THREE.Mesh(g, mat));
  group.add(ring(0.58, 0.035, 1.66));
  glowAt.push([new THREE.Vector3(0, 2.38, -0.7), 1.6]);
}

function crownCup(p, base, top, rTop) {
  p.lineTo(0.6, base + 0.03); p.quadraticCurveTo(0.66, base + 0.08, 0.62, base + 0.15); p.lineTo(0.42, base + 0.19);
  p.quadraticCurveTo(0.32, base + 0.22, 0.3, base + 0.3);
  p.bezierCurveTo(0.32, top - 0.4, rTop * 0.8, top - 0.15, rTop, top);
}

function queen() {
  const p = new THREE.Path();
  foot(p, 1.95, 0.32);
  crownCup(p, 1.95, 3.05, 0.6);
  p.quadraticCurveTo(0.64, 3.1, 0.56, 3.12);
  p.quadraticCurveTo(0.3, 3.16, 0.24, 3.3);
  p.quadraticCurveTo(0.2, 3.36, 0.06, 3.38);
  p.lineTo(0, 3.38);
  group.add(new THREE.Mesh(lathe(p), M.body));
  group.add(ring(0.6, 0.035, 2.05));
  group.add(ring(0.6, 0.03, 3.08, M.rim));
  // the coronet: chrome beads round the rim
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 32, 16), M.body);
    b.position.set(Math.sin(a) * 0.55, 3.17, Math.cos(a) * 0.55);
    group.add(b);
  }
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.17, 48, 24), M.accent);
  orb.position.y = 3.52;
  group.add(orb);
  glowAt.push([orb.position.clone(), 1.5]);
}

function king() {
  const p = new THREE.Path();
  foot(p, 2.05, 0.33);
  crownCup(p, 2.05, 3.15, 0.58);
  p.quadraticCurveTo(0.62, 3.2, 0.54, 3.22);
  p.quadraticCurveTo(0.24, 3.26, 0.2, 3.36);
  p.lineTo(0.16, 3.44);
  p.lineTo(0, 3.44);
  group.add(new THREE.Mesh(lathe(p), M.body));
  group.add(ring(0.6, 0.035, 2.15));
  group.add(ring(0.58, 0.03, 3.18, M.rim));
  const cross = new THREE.Group();
  const v = new THREE.Mesh(rbox(0.17, 0.62, 0.17), M.accent);
  v.position.y = 3.72;
  const h = new THREE.Mesh(rbox(0.5, 0.17, 0.17), M.accent);
  h.position.y = 3.8;
  cross.add(v, h);
  group.add(cross);
  glowAt.push([new THREE.Vector3(0, 3.76, -0.3), 1.7]);
}

({ pawn, bishop, queen, king })[PIECE]();

// ── plinth: a gunmetal plate with a polished rim, and a thin line of route light round the piece
const PL = 0.26;
{
  const s = new THREE.Shape();
  s.absarc(0, 0, 1.42, 0, Math.PI * 2, false);
  const g = extrude(s, { depth: PL - 0.08, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 8, curveSegments: 96 });
  const plate = new THREE.Mesh(g, [M.plate, M.edge]);
  plate.rotation.x = -Math.PI / 2;
  plate.position.y = -PL / 2;
  scene.add(plate);
  const rim = ring(1.42, 0.06, 0, M.rim);
  scene.add(rim);
  const line = ring(1.16, 0.014, 0.005, M.accent);
  scene.add(line);
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(1.0, 1.32, 128),
    new THREE.MeshBasicMaterial({ map: canvasTexture(256, (ctx, z) => {
      const gr = ctx.createRadialGradient(z / 2, z / 2, z * 0.38, z / 2, z / 2, z / 2);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.45, 'rgba(255,255,255,.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, z, z);
    }, { srgb: true }), color: accent, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0.5 * GLOW }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.01;
  scene.add(halo);
}

group.rotation.y = ROT;
scene.add(group);
group.updateMatrixWorld(true);
for (const [pos, size] of glowAt) {
  const g = glow(size);
  g.position.copy(pos.clone().applyMatrix4(group.matrixWorld));
  scene.add(g);
}

renderer.render(scene, cam);
window.__png = canvas.toDataURL('image/png');
window.__done = true;
