import { GUJARAT_OUTLINE, HUBS, Hub, MESH } from './gujarat-geo';

/**
 * Lightweight 3D "hologram" renderer for the Gujarat map, drawn on a plain 2D canvas with a hand-rolled
 * perspective projection. Chosen over Three.js on purpose: the scene is a flat extruded outline, a dot lattice,
 * arcs and particles — a few thousand primitives — so a WebGL dependency would add ~600 kB for no visual gain,
 * and a 2D canvas works on every device (no WebGL fallback needed).
 */

const LON0 = 71.25, LAT0 = 22.4, KX = Math.cos((23.2 * Math.PI) / 180);
const F = 9;                         // camera distance (perspective strength)
const SLAB = 0.15;                   // extrusion depth
const BASE_PITCH = 1.0;              // camera elevation above the map plane (rad)
const CAPITAL = 'gandhinagar';

interface Arc { pts: number[]; a: number; b: number; speed: number; phase: number; spoke: boolean }
interface Particle { x: number; y: number; n: number; v: number; ph: number }
export interface SceneHooks { onHover(id: string | null): void }

/** theme palette read from the CSS custom properties (refreshed when the colour theme changes) */
const K = { hl: '34,211,238', mid: '37,99,235', lt: '125,190,255', dk: '4,16,48', hi: '190,235,255' };
function readPalette() {
  const cs = getComputedStyle(document.documentElement);
  const rgb = (name: string, fb: string) => { const v = cs.getPropertyValue(name).trim(); return /^\d+\s*,\s*\d+\s*,\s*\d+$/.test(v) ? v.replace(/\s/g, '') : fb; };
  const hl = rgb('--cyan-rgb', '34,211,238'), mid = rgb('--brand-rgb', '37,99,235'), b2 = rgb('--brand-2-rgb', '47,128,255');
  const mix = (a: string, b: string, t: number) => { const x = a.split(',').map(Number), y = b.split(',').map(Number); return x.map((v, i) => Math.round(v * (1 - t) + y[i] * t)).join(','); };
  K.hl = hl; K.mid = mid;
  K.lt = mix(b2, '255,255,255', 0.45);
  K.dk = mix(mid, '0,0,0', 0.9);
  K.hi = mix(b2, '255,255,255', 0.75);
}

const smooth = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function chaikin(pts: [number, number][], rounds: number): [number, number][] {
  let p = pts;
  for (let r = 0; r < rounds; r++) {
    const out: [number, number][] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = out;
  }
  return p;
}

function inside(poly: [number, number][], x: number, n: number): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, ni] = poly[i], [xj, nj] = poly[j];
    if ((ni > n) !== (nj > n) && x < ((xj - xi) * (n - ni)) / (nj - ni) + xi) c = !c;
  }
  return c;
}

export class GujaratScene {
  private ctx: CanvasRenderingContext2D;
  private w = 0; private h = 0; private dpr = 1;
  private poly: [number, number][];
  private dots: Float32Array;                 // x, n, distance-from-capital triplets
  private hubs: { hub: Hub; x: number; n: number; sx: number; sy: number; sk: number }[];
  private arcs: Arc[] = [];
  private parts: Particle[] = [];
  private px = 0; private py = 0; private pk = 1;
  private yaw = 0; private pitch = BASE_PITCH; private tYaw = 0; private tPitch = BASE_PITCH;
  private cosY = 1; private sinY = 0; private cosP = 1; private sinP = 1; private unit = 100; private zoom = 1;
  private t = 0; private intro = 0;
  private raf = 0; private last = 0; private running = false;
  private lowQ = false; private slow = 0; private frames = 0;
  private pointer: { x: number; y: number } | null = null;
  private hover: string | null = null;
  private active: string | null = null;
  private tip: HTMLElement | null;
  private tipId: string | null = null;
  private capitalIdx: number;

  constructor(private canvas: HTMLCanvasElement, tip: HTMLElement | null, private hooks: SceneHooks, private animated: boolean) {
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.tip = tip;
    this.poly = chaikin(GUJARAT_OUTLINE.map(([lo, la]) => [(lo - LON0) * KX, la - LAT0] as [number, number]), 0);
    this.hubs = HUBS.map((hub) => ({ hub, x: (hub.lon - LON0) * KX, n: hub.lat - LAT0, sx: 0, sy: 0, sk: 1 }));
    this.capitalIdx = this.hubs.findIndex((h) => h.hub.id === CAPITAL);
    const cap = this.hubs[this.capitalIdx];

    const ds: number[] = [];
    const step = 0.13;
    for (let x = -3.1; x <= 2.7; x += step) {
      const row = Math.round((x + 3.1) / step) % 2;
      for (let n = -2.4; n <= 2.5; n += step) {
        const nn = n + row * step * 0.5;
        if (inside(this.poly, x, nn)) ds.push(x, nn, Math.hypot(x - cap.x, nn - cap.n));
      }
    }
    this.dots = Float32Array.from(ds);

    const mk = (a: number, b: number, spoke: boolean) => {
      const A = this.hubs[a], B = this.hubs[b];
      const dist = Math.hypot(B.x - A.x, B.n - A.n);
      const lift = spoke ? 0.22 + dist * 0.2 : 0.1 + dist * 0.12;
      const pts: number[] = [];
      for (let i = 0; i <= 28; i++) {
        const u = i / 28;
        pts.push(A.x + (B.x - A.x) * u, Math.sin(Math.PI * u) * lift, A.n + (B.n - A.n) * u);
      }
      this.arcs.push({ pts, a, b, speed: 0.1 + ((a * 7 + b * 3) % 5) * 0.018, phase: ((a * 13 + b * 5) % 10) / 10, spoke });
    };
    this.hubs.forEach((_, i) => { if (i !== this.capitalIdx) mk(this.capitalIdx, i, true); });
    for (const [p, q] of MESH) {
      const a = this.hubs.findIndex((h) => h.hub.id === p), b = this.hubs.findIndex((h) => h.hub.id === q);
      if (a >= 0 && b >= 0) mk(a, b, false);
    }

    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) this.parts.push({ x: -3.4 + rnd() * 6.4, y: rnd() * 1.4, n: -2.6 + rnd() * 5.2, v: 0.03 + rnd() * 0.05, ph: rnd() * 6.28 });

    this.intro = animated ? 0 : 1;
    readPalette();
    this.mo = new MutationObserver(() => { readPalette(); if (!this.running) this.draw(); });
    this.mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  }
  private mo?: MutationObserver;

  /* ---------- lifecycle ---------- */
  resize(cssW: number, cssH: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, cssW < 520 ? 1.5 : 2);
    this.w = Math.max(1, cssW); this.h = Math.max(1, cssH);
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.unit = Math.min(this.w / 6.7, this.h / 5.0);
    if (!this.running) this.draw();
  }
  start() {
    if (this.running || !this.animated) { if (!this.animated) this.draw(); return; }
    this.running = true; this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }
  stop() { this.running = false; cancelAnimationFrame(this.raf); }
  destroy() { this.stop(); this.mo?.disconnect(); }

  setPointer(p: { x: number; y: number } | null) {
    this.pointer = p;
    if (p) { this.tYaw = (p.x / this.w - 0.5) * 0.55; this.tPitch = BASE_PITCH - (p.y / this.h - 0.5) * 0.16; }
    else { this.tYaw = 0; this.tPitch = BASE_PITCH; }
    if (!this.running) this.draw();
  }
  setActive(id: string | null) { this.active = id; if (!this.running) this.draw(); }
  hoveredId() { return this.hover; }

  /* ---------- projection ---------- */
  private proj(x: number, y: number, n: number) {
    const xr = x * this.cosY + n * this.sinY, nr = -x * this.sinY + n * this.cosY;
    const yr = y * this.cosP + nr * this.sinP, zr = -y * this.sinP + nr * this.cosP;
    const k = F / (F + zr), u = this.unit * this.zoom;
    this.px = this.w / 2 + xr * u * k; this.py = this.h * 0.5 - yr * u * k; this.pk = k;
  }

  private frame = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    this.t += dt;
    if (this.intro < 1) this.intro = Math.min(1, this.intro + dt / 3);
    // adaptive quality: step down once if frames are consistently slow
    if (!this.lowQ && dt > 0) { this.frames++; if (dt > 0.034) this.slow++; if (this.frames >= 90) { if (this.slow > 55) this.lowQ = true; this.frames = 0; this.slow = 0; } }
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  /* ---------- drawing ---------- */
  private draw() {
    const c = this.ctx, W = this.w, H = this.h;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const e = smooth(this.intro), t = this.animated ? this.t : 3.2;
    const ease = this.animated ? 0.04 : 1;
    this.yaw += (this.tYaw + (this.animated ? 0.2 * Math.sin(t * 0.13) + (1 - e) * 0.7 : 0) - this.yaw) * ease;
    this.pitch += (this.tPitch - this.pitch) * ease;
    this.zoom = 0.9 + 0.1 * e;
    this.cosY = Math.cos(this.yaw); this.sinY = Math.sin(this.yaw); this.cosP = Math.cos(this.pitch); this.sinP = Math.sin(this.pitch);

    this.grid(c, e);
    this.slab(c, e);
    this.surface(c, e, t);
    this.links(c, e, t);
    if (!this.lowQ) this.particles(c, e, t);
    this.nodes(c, e, t);
    this.updateTip();
  }

  private path(c: CanvasRenderingContext2D, y: number) {
    c.beginPath();
    for (let i = 0; i < this.poly.length; i++) {
      this.proj(this.poly[i][0], y, this.poly[i][1]);
      i ? c.lineTo(this.px, this.py) : c.moveTo(this.px, this.py);
    }
    c.closePath();
  }

  private grid(c: CanvasRenderingContext2D, e: number) {
    const y = -0.55, ext = 4.6, step = this.lowQ ? 0.9 : 0.6;
    c.lineWidth = 1;
    for (let v = -ext; v <= ext + 0.01; v += step) {
      const fade = 1 - Math.abs(v) / (ext + 0.4);
      c.strokeStyle = `rgba(${K.lt},${(0.14 * fade * e).toFixed(3)})`;
      c.beginPath();
      this.proj(v, y, -ext); c.moveTo(this.px, this.py); this.proj(v, y, ext); c.lineTo(this.px, this.py);
      this.proj(-ext, y, v); c.moveTo(this.px, this.py); this.proj(ext, y, v); c.lineTo(this.px, this.py);
      c.stroke();
    }
  }

  private slab(c: CanvasRenderingContext2D, e: number) {
    // depth: soft shadow plate + stacked outlines + vertical edges
    this.path(c, -SLAB); c.fillStyle = `rgba(${K.dk},${0.7 * e})`; c.fill();
    c.strokeStyle = `rgba(${K.lt},${0.28 * e})`; c.lineWidth = 1;
    c.beginPath();
    for (let i = 0; i < this.poly.length; i += 14) {
      this.proj(this.poly[i][0], 0, this.poly[i][1]); c.moveTo(this.px, this.py);
      this.proj(this.poly[i][0], -SLAB, this.poly[i][1]); c.lineTo(this.px, this.py);
    }
    c.stroke();
    for (const [y, a] of [[-SLAB, 0.4], [-SLAB * 0.5, 0.22]] as const) { this.path(c, y); c.strokeStyle = `rgba(${K.lt},${a * e})`; c.stroke(); }
  }

  private surface(c: CanvasRenderingContext2D, e: number, t: number) {
    this.path(c, 0);
    // bounding box for the face gradient
    let top = 1e9, bot = -1e9;
    for (let i = 0; i < this.poly.length; i += 6) { this.proj(this.poly[i][0], 0, this.poly[i][1]); top = Math.min(top, this.py); bot = Math.max(bot, this.py); }
    const g = c.createLinearGradient(0, top, 0, bot);
    g.addColorStop(0, `rgba(${K.hl},${0.2 * e})`); g.addColorStop(1, `rgba(${K.mid},${0.3 * e})`);
    c.fillStyle = g; c.fill();

    c.save();
    c.clip();
    // connectivity wave radiating from the capital
    const cap = this.hubs[this.capitalIdx];
    const wave = (t * 0.55) % 7.5;
    const dots = this.dots, step = this.lowQ ? 2 : 1;
    const sweep = ((t * 0.28) % 1.4) * 5.6 - 2.8;     // slow horizontal scan band
    for (let i = 0; i < dots.length; i += 3 * step) {
      const d = dots[i + 2];
      const wv = Math.exp(-Math.pow((d - wave) / 0.5, 2)) * 0.8;
      const sc = Math.exp(-Math.pow((dots[i + 1] - sweep) / 0.25, 2)) * 0.28;
      const b = Math.min(1, wv + sc);
      this.proj(dots[i], 0, dots[i + 1]);
      const r = (0.8 + b * 0.55) * this.pk;
      c.fillStyle = b > 0.06 ? `rgba(${K.hi},${((0.3 + b * 0.55) * e).toFixed(3)})` : `rgba(${K.lt},${(0.26 * e).toFixed(3)})`;
      c.fillRect(this.px - r, this.py - r, r * 2, r * 2);
    }
    // soft pulse rings on the surface
    for (let j = 0; j < 1; j++) {
      const r = ((t * 0.3 + j * 0.5) % 1) * 3.6;
      c.strokeStyle = `rgba(${K.hl},${(0.28 * (1 - r / 3.6) * e).toFixed(3)})`; c.lineWidth = 1;
      c.beginPath();
      for (let s = 0; s <= 48; s++) {
        const a = (s / 48) * Math.PI * 2;
        this.proj(cap.x + Math.cos(a) * r, 0, cap.n + Math.sin(a) * r);
        s ? c.lineTo(this.px, this.py) : c.moveTo(this.px, this.py);
      }
      c.stroke();
    }
    c.restore();

    // glowing rim, drawn on progressively during the intro
    this.path(c, 0);
    let perim = 0, lx = 0, ly = 0;
    for (let i = 0; i <= this.poly.length; i++) { this.proj(this.poly[i % this.poly.length][0], 0, this.poly[i % this.poly.length][1]); if (i) perim += Math.hypot(this.px - lx, this.py - ly); lx = this.px; ly = this.py; }
    if (this.intro < 1) c.setLineDash([perim * e, perim]);
    c.lineJoin = 'round';
    if (!this.lowQ) { c.strokeStyle = `rgba(${K.hl},0.12)`; c.lineWidth = 6; c.stroke(); }
    c.strokeStyle = `rgba(${K.lt},0.9)`; c.lineWidth = 1.1; c.stroke();
    c.setLineDash([]);
  }

  private links(c: CanvasRenderingContext2D, e: number, t: number) {
    const frac = Math.min(1, Math.max(0, e * 1.6 - 0.35));
    if (frac <= 0) return;
    const hot = this.active ?? this.hover;
    for (const a of this.arcs) {
      const isHot = !!hot && (this.hubs[a.a].hub.id === hot || this.hubs[a.b].hub.id === hot);
      const n = Math.max(2, Math.round(29 * frac));
      c.beginPath();
      for (let i = 0; i < n; i++) {
        this.proj(a.pts[i * 3], a.pts[i * 3 + 1], a.pts[i * 3 + 2]);
        i ? c.lineTo(this.px, this.py) : c.moveTo(this.px, this.py);
      }
      c.strokeStyle = isHot ? `rgba(${K.lt},0.95)` : a.spoke ? `rgba(${K.lt},0.17)` : `rgba(${K.lt},0.24)`;
      c.lineWidth = isHot ? 1.6 : 0.9;
      c.stroke();
      if (frac < 1) continue;
      // data packets
      const packets = (a.a + a.b) % 2 === 0 ? 1 : 0;
      for (let p = 0; p < packets; p++) {
        const u = (t * a.speed + a.phase + p / packets) % 1, idx = Math.min(27, Math.floor(u * 28)), f = u * 28 - idx;
        const i0 = idx * 3, i1 = i0 + 3;
        this.proj(a.pts[i0] + (a.pts[i1] - a.pts[i0]) * f, a.pts[i0 + 1] + (a.pts[i1 + 1] - a.pts[i0 + 1]) * f, a.pts[i0 + 2] + (a.pts[i1 + 2] - a.pts[i0 + 2]) * f);
        const al = Math.sin(u * Math.PI);
        c.fillStyle = `rgba(${K.hl},${0.22 * al})`; c.beginPath(); c.arc(this.px, this.py, 3.8 * this.pk, 0, 6.283); c.fill();
        c.fillStyle = `rgba(235,250,255,${0.9 * al})`; c.beginPath(); c.arc(this.px, this.py, 1.4 * this.pk, 0, 6.283); c.fill();
      }
    }
  }

  private particles(c: CanvasRenderingContext2D, e: number, t: number) {
    for (const p of this.parts) {
      const y = (p.y + t * p.v) % 1.5;
      this.proj(p.x + Math.sin(t * 0.3 + p.ph) * 0.12, 0.1 + y, p.n);
      const al = Math.sin((y / 1.5) * Math.PI) * 0.55 * e;
      const s = 1.6 * this.pk;
      c.fillStyle = `rgba(${K.lt},${al.toFixed(3)})`;
      c.fillRect(this.px - s / 2, this.py - s / 2, s, s);
    }
  }

  private nodes(c: CanvasRenderingContext2D, e: number, t: number) {
    const narrow = this.w < 560;
    const hot = this.active ?? this.hover;
    let best: string | null = null, bd = 22 * 22;
    c.font = '600 11.5px Inter, system-ui, sans-serif'; c.textBaseline = 'middle';
    // far nodes first so near ones overlap them
    const order = this.hubs.map((h, i) => { this.proj(h.x, 0, h.n); return { i, z: this.pk }; }).sort((a, b) => a.z - b.z);
    for (const { i } of order) {
      const h = this.hubs[i], cap = i === this.capitalIdx;
      this.proj(h.x, 0.0, h.n);
      h.sx = this.px; h.sy = this.py; h.sk = this.pk;
      if (this.pointer) { const d = (this.pointer.x - h.sx) ** 2 + (this.pointer.y - h.sy) ** 2; if (d < bd) { bd = d; best = h.hub.id; } }
      const isHot = hot === h.hub.id;
      const grow = Math.min(1, Math.max(0, e * 2 - 0.5 - i * 0.02));
      if (grow <= 0) continue;
      const base = (cap ? 4 : h.hub.major ? 3 : 2.1) * this.pk * (isHot ? 1.5 : 1) * grow;
      // stem lifting the marker off the surface
      this.proj(h.x, 0.16, h.n);
      const topX = this.px, topY = this.py;
      c.strokeStyle = `rgba(${K.lt},${0.4 * grow})`; c.lineWidth = 0.8; c.beginPath(); c.moveTo(h.sx, h.sy); c.lineTo(topX, topY); c.stroke();
      // ground ring (pulses)
      const ph = (t * 0.7 + i * 0.37) % 1;
      if (cap || h.hub.major || isHot) {
        c.strokeStyle = `rgba(${K.hl},${(0.4 * (1 - ph) * grow).toFixed(3)})`; c.lineWidth = 1;
        c.beginPath(); c.ellipse(h.sx, h.sy, (3 + ph * (cap ? 20 : 11)) * this.pk, (3 + ph * (cap ? 20 : 11)) * this.pk * this.sinP, 0, 0, 6.283); c.stroke();
      }
      // glow + core
      c.fillStyle = `rgba(${K.hl},${isHot ? 0.4 : 0.16})`; c.beginPath(); c.arc(topX, topY, base * 2.4, 0, 6.283); c.fill();
      c.fillStyle = cap ? '#ffffff' : '#bff3ff'; c.beginPath(); c.arc(topX, topY, base, 0, 6.283); c.fill();
      c.strokeStyle = `rgba(${K.mid},0.9)`; c.lineWidth = 1.2; c.stroke();
      // label
      const show = isHot || (!narrow && h.hub.label) || (narrow && cap);
      if (show) {
        const side = h.hub.label === 'l' ? -1 : 1;
        c.textAlign = side < 0 ? 'right' : 'left';
        const tx = topX + side * (base + 9);
        c.lineWidth = 3; c.strokeStyle = `rgba(${K.dk},0.85)`; c.strokeText(h.hub.name, tx, topY - 1);
        c.fillStyle = isHot ? '#ffffff' : 'rgba(226,240,255,0.92)'; c.fillText(h.hub.name, tx, topY - 1);
      }
      h.sx = topX; h.sy = topY;
    }
    if (best !== this.hover) { this.hover = best; this.hooks.onHover(best); }
  }

  private updateTip() {
    const tip = this.tip; if (!tip) return;
    const id = this.active ?? this.hover;
    if (!id) { if (this.tipId !== null) { tip.hidden = true; this.tipId = null; } return; }
    const h = this.hubs.find((x) => x.hub.id === id); if (!h) return;
    if (this.tipId !== id) {
      this.tipId = id; tip.hidden = false;
      (tip.children[0] as HTMLElement).textContent = h.hub.name; (tip.children[1] as HTMLElement).textContent = h.hub.role;
    }
    const x = Math.min(this.w - 120, Math.max(120, h.sx)), flip = h.sy < 90;
    tip.style.transform = `translate(${x.toFixed(1)}px, ${(flip ? h.sy + 26 : h.sy - 18).toFixed(1)}px) translate(-50%, ${flip ? '0' : '-100%'})`;
  }
}
