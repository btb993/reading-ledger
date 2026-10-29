// ===== Companion art v3 prototype: shared rendering style, species-specific anatomy =====
// Stage: viewBox 0 0 200 220, ground at y=214, key light from the upper left.
const ART3 = (() => {
  let UID = 0;
  const rgb = h => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
  const hex = a => "#" + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v + (B[i] - v) * t)); };
  const warmLight = "#FFF4E2", warmShade = "#2A1420", coolRim = "#CFE0FF";
  const lit = (c, t) => mix(c, warmLight, t), shd = (c, t) => mix(c, warmShade, t);
  function Ctx(){
    const u = ++UID, defs = []; let n = 0;
    const id = p => `${p}${u}_${n++}`;
    const C = {
      u, defs,
      // linear gradient, default: light from upper left
      lin(stops, a = [.1, 0, .9, 1]){ const i = id("l"); defs.push(`<linearGradient id="${i}" x1="${a[0]}" y1="${a[1]}" x2="${a[2]}" y2="${a[3]}">${stops.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ""}/>`).join("")}</linearGradient>`); return `url(#${i})`; },
      rad(stops, o = {}){ const i = id("r"); defs.push(`<radialGradient id="${i}" cx="${o.cx ?? .5}" cy="${o.cy ?? .5}" r="${o.r ?? .5}" fx="${o.fx ?? o.cx ?? .5}" fy="${o.fy ?? o.cy ?? .5}"${o.user ? ` gradientUnits="userSpaceOnUse"` : ""}>${stops.map(([of, c, op]) => `<stop offset="${of}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ""}/>`).join("")}</radialGradient>`); return `url(#${i})`; },
      // the shared volume recipe: a soft radial light upper-left, base colour, warm shadow lower-right
      vol(base, o = {}){ return C.rad([[0, lit(base, o.hi ?? .32)], [.45, base], [1, shd(base, o.lo ?? .3)]], { cx: o.cx ?? .36, cy: o.cy ?? .3, r: o.r ?? .78 }); },
      clip(d){ const i = id("c"); defs.push(`<clipPath id="${i}"><path d="${d}"/></clipPath>`); return `url(#${i})`; },
      // soft blur, used sparingly (ambient occlusion, glows)
      blur(sd = 2){ const i = id("f"); defs.push(`<filter id="${i}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`); return `url(#${i})`; },
    };
    return C;
  }
  // ink: a fill with a living outline — heavier on the shadow side (lower right), lighter where the light hits
  const ink = (C, d, fill, line, o = {}) => `<path d="${d}" fill="${line}" stroke="${line}" stroke-width="${o.heavy ?? 2.2}" stroke-linejoin="round" transform="translate(${o.dx ?? .55} ${o.dy ?? .75})"${o.op ? ` opacity="${o.op}"` : ""}/>`
    + `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${o.w ?? .9}" stroke-linejoin="round"${o.cls ? ` class="${o.cls}"` : ""}/>`;
  // a soft shadow region painted inside a shape (ambient occlusion / form shadow)
  const shade = (C, clipD, d, col, op, sd = 2.4) => `<g clip-path="${C.clip(clipD)}"><path d="${d}" fill="${col}" opacity="${op}" filter="${C.blur(sd)}"/></g>`;
  // fur strokes: short tapered hairs along a direction
  const tufts = (pts, col, w = .8, op = .7) => pts.map(([x, y, dx, dy]) => `<path d="M${x} ${y}q${dx * .5 + dy * .15} ${dy * .5 - dx * .15} ${dx} ${dy}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`).join("");
  // the house style, shared by every companion:
  //  outline weights — W.major for head/body silhouettes, W.minor for limbs/clothing, W.fine for interior detail
  //  shading — one C.vol() volume per form, one shade() occlusion on the lower right, one soft sheen upper left
  //  eyes — always ART3.eye(); species only change shape, size, iris colours and pupil
  const W = { major: 2.3, minor: 1.6, fine: .9 };
  const sheen = (cx, cy, rx, ry, rot = -24, op = .28) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#FFFFFF" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
  const bashful = (C, cx, cy, r = 7, col = "#F07AA4", op = .75, hatch = true) => `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * .5}" fill="${col}" opacity="${op}" filter="${C.blur(1.4)}"/>`
    + (hatch ? [-1, 0, 1].map(i => `<path d="M${cx + i * r * .36 - 1.1} ${cy + 1.4}l2.2 -2.8" stroke="${shd(col, .35)}" stroke-width=".8" stroke-linecap="round" opacity=".85"/>`).join("") : "");
  return { Ctx, ink, shade, tufts, mix, lit, shd, coolRim, W, sheen, bashful };
})();
// a tapered, organic limb/tail: sample cubic segments, offset by a varying half-width, close smoothly
ART3.tube = function(segs, widths){
  const pts = [];
  const cub = (p0, p1, p2, p3, t) => [0, 1].map(i => (1 - t) ** 3 * p0[i] + 3 * (1 - t) ** 2 * t * p1[i] + 3 * (1 - t) * t * t * p2[i] + t ** 3 * p3[i]);
  segs.forEach(([p0, p1, p2, p3], si) => { for (let i = si ? 1 : 0; i <= 12; i++) pts.push(cub(p0, p1, p2, p3, i / 12)); });
  const N = pts.length, W = t => { const k = t * (widths.length - 1), i = Math.min(widths.length - 2, Math.floor(k)); return widths[i] + (widths[i + 1] - widths[i]) * (k - i); };
  const L = [], R = [];
  pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1, w = W(i / (N - 1)) / 2;
    L.push([p[0] - dy / len * w, p[1] + dx / len * w]); R.push([p[0] + dy / len * w, p[1] - dx / len * w]); });
  const ring = [...L, ...R.reverse()];
  // smooth closed curve through the ring (Catmull-Rom → Bézier)
  let d = `M${ring[0][0].toFixed(1)} ${ring[0][1].toFixed(1)}`;
  for (let i = 0; i < ring.length; i++) { const p0 = ring[(i - 1 + ring.length) % ring.length], p1 = ring[i], p2 = ring[(i + 1) % ring.length], p3 = ring[(i + 2) % ring.length];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`; }
  return d + "Z";
};

// assemble: defs are filled in last, so helpers called inside the final template still register their gradients
// wardrobe mount points: empty groups that future wardrobe items are placed into.
//  back  — behind the body (capes, wings, quivers), inside whatever moves the body
//  body  — over the torso and default clothing (torso, neck, aura items), inside whatever moves the body
//  head  — last child of the head group (hats, ear and face items), so it follows tilt, lift and head scale
ART3.mount = name => `<g class="mount mount-${name}" data-mount="${name}"></g>`;
ART3.fin = (C, svg) => {
  svg = svg.replace("@@DEFS@@", C.defs.join(""));
  if (svg.includes("mount-head")) return svg;
  const i = svg.indexOf('<g class="head"'); if (i < 0) return svg;
  // walk to the head group's matching </g> and add the head mount just inside it
  const re = /<g\b[^>]*?(\/?)>|<\/g>/g; re.lastIndex = i; let depth = 0, m;
  while ((m = re.exec(svg))) { if (m[0] === "</g>") { if (--depth === 0) return svg.slice(0, m.index) + ART3.mount("head") + svg.slice(m.index); } else if (!m[1]) depth++; }
  return svg;
};

// arm rig: characters build their arm tubes through it, so wardrobe arm items (gloves, bracers, warmers) can follow the pose
ART3.armRig = (o, C) => { const S = {}; return {
  tube: (side, segs, w) => { S[side] = [segs, w]; return ART3.tube(segs, w); },
  wear: side => (o.armWear && S[side] ? o.armWear(C, S[side][0], S[side][1], side) : "") };
};
// sub-range of a chain of cubic segments (t0..t1 over the whole chain), for sleeves that cover only the forearm
ART3.subSegs = (segs, t0, t1) => {
  const split = (p, t) => { const L = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const a = L(p[0], p[1]), b = L(p[1], p[2]), c = L(p[2], p[3]), d = L(a, b), e = L(b, c), f = L(d, e); return [[p[0], a, d, f], [f, e, c, p[3]]]; };
  const n = segs.length, out = [];
  segs.forEach((sg, i) => { const s0 = i / n, s1 = (i + 1) / n; if (s1 <= t0 || s0 >= t1) return;
    let seg = sg; const a = Math.max(0, (t0 - s0) * n), b = Math.min(1, (t1 - s0) * n);
    if (b < 1) seg = split(seg, b)[0]; if (a > 0) seg = split(seg, a / (b || 1))[1]; out.push(seg); });
  return out;
};

// ===== a shared eye: same construction for everyone, shaped per species =====
// o: cx, cy, w, h, side ("L"|"R"), tilt (outer corner lift), shape ("almond"|"round"), iris [rim, mid, light], pupil ("slit"|"round"), dil (pupil size 0..1),
//    look [dx, dy], up (upper lid drop 0..1), low (lower lid raise 0..1), skin (lid colour), line, lash (0..3), wet, w2 (lid line weight)
ART3.eye = function(C, o){
  const { cx, cy, w, h } = o, s = o.side === "L" ? -1 : 1, t = o.tilt || 0;
  const x0 = cx - w / 2, x1 = cx + w / 2, yIn = cy + (o.side === "L" ? -t : t) * 0 , yOutL = cy - (s < 0 ? t : 0), yOutR = cy - (s > 0 ? t : 0);
  const almond = o.shape !== "round";
  const topY = cy - h * (almond ? 1.05 : 1.0), botY = cy + h * (almond ? .75 : 1.0);
  const lx = x0, ly = yOutL, rx = x1, ry = yOutR;
  const peak = cx + s * w * (almond ? .08 : 0);
  const open = almond ? `M${lx} ${ly}C${lx + w * .12} ${topY} ${peak} ${topY - h * .05} ${rx} ${ry}C${rx - w * .14} ${botY} ${cx - s * w * .1} ${botY + h * .05} ${lx} ${ly}Z`
    : `M${lx} ${cy}C${lx} ${cy - h * 1.32} ${rx} ${cy - h * 1.32} ${rx} ${cy}C${rx} ${cy + h * 1.32} ${lx} ${cy + h * 1.32} ${lx} ${cy}Z`;
  const up = Math.max(0, Math.min(1, o.up ?? 0)), low = Math.max(0, Math.min(1, o.low ?? 0));
  const line = o.line || "#1A1014", skin = o.skin || "#C9A88C";
  const clip = C.clip(open);
  const ir = h * (o.irisR ?? .78), [lookX, lookY] = o.look || [0, 0], ix = cx + lookX * w * .14, iy = cy + lookY * h * .2 + h * .05;
  const [rim, mid, light] = o.iris;
  const irisFill = C.rad([[0, light], [.55, mid], [.86, rim], [1, ART3.shd(rim, .4)]], { cx: .5, cy: .62, r: .55 });
  const dil = o.dil ?? .5;
  const pupil = o.pupil === "slit" ? `<ellipse cx="${ix}" cy="${iy}" rx="${(ir * (.16 + dil * .5)).toFixed(2)}" ry="${(ir * .84).toFixed(2)}" fill="#07060A"/>` : `<circle cx="${ix}" cy="${iy}" r="${(ir * (.32 + dil * .3)).toFixed(2)}" fill="#07060A"/>`;
  // where the lids sit: the upper lid curve slides down, the lower lid slides up
  const upY = topY + (botY - topY) * up, lowY = botY - (botY - topY) * low * .6;
  const upperLid = up > .02 ? `<path d="M${lx - 4} ${ly - 1}L${lx - 4} ${topY - h}L${rx + 4} ${topY - h}L${rx + 4} ${ry - 1}C${rx - w * .2} ${upY + h * .1} ${lx + w * .25} ${upY} ${lx - 4} ${ly - 1}Z" fill="${skin}"/>` : "";
  const lowerLid = low > .02 ? `<path d="M${lx - 4} ${ly}L${lx - 4} ${botY + h}L${rx + 4} ${botY + h}L${rx + 4} ${ry}C${rx - w * .2} ${lowY} ${lx + w * .2} ${lowY} ${lx - 4} ${ly}Z" fill="${skin}"/>` : "";
  // lid lines follow the lids
  const upLine = up > .02 ? `M${lx} ${ly}C${lx + w * .25} ${upY - h * .05} ${rx - w * .2} ${upY + h * .05} ${rx} ${ry}` : (almond ? `M${lx} ${ly}C${lx + w * .12} ${topY} ${peak} ${topY - h * .05} ${rx} ${ry}` : `M${lx} ${cy}C${lx} ${cy - h * 1.32} ${rx} ${cy - h * 1.32} ${rx} ${cy}`);
  const lowLine = low > .02 ? `M${lx + w * .15} ${ly + h * .1}C${lx + w * .35} ${lowY + h * .05} ${rx - w * .3} ${lowY + h * .05} ${rx - w * .1} ${ry + h * .05}` : (almond ? `M${lx + w * .2} ${ly + h * .25}C${cx - s * w * .1} ${botY + h * .02} ${rx - w * .25} ${botY - h * .05} ${rx - w * .05} ${ry + h * .1}` : `M${lx + w * .15} ${cy + h * .55}C${cx - w * .2} ${cy + h * 1.25} ${cx + w * .2} ${cy + h * 1.25} ${rx - w * .15} ${cy + h * .55}`);
  const outX = s > 0 ? rx : lx, outY = s > 0 ? ry : ly;
  const lashes = Array.from({ length: o.lash || 0 }, (_, i) => { const a = (i + 1) * .9; return `<path d="M${outX - s * i * w * .09} ${outY - h * .1 * i - (up > .02 ? (upY - topY) * (1 - i * .25) : 0)}q${s * (2.6 + i)} ${-a} ${s * (4.4 + i * .8)} ${-a * 2.6}" stroke="${line}" stroke-width="${1.1 - i * .15}" fill="none" stroke-linecap="round"/>`; }).join("");
  const closed = up >= .97;
  if (closed) return `<g class="eye3"><path d="M${lx} ${ly}C${lx + w * .25} ${botY - h * .2} ${rx - w * .2} ${botY - h * .15} ${rx} ${ry}" stroke="${line}" stroke-width="${o.w2 ?? 2}" fill="none" stroke-linecap="round"/>${lashes}</g>`;
  return `<g class="eye3">
    <g clip-path="${clip}">
      <path d="${open}" fill="${C.lin([[0, "#D9DCE8"], [.35, "#FFFFFF"], [1, "#E6E2EA"]], [0, 0, 0, 1])}"/>
      <circle cx="${ix}" cy="${iy}" r="${ir}" fill="${irisFill}"/>
      <circle cx="${ix}" cy="${iy}" r="${ir}" fill="none" stroke="${ART3.shd(rim, .5)}" stroke-width="${(ir * .1).toFixed(2)}" opacity=".7"/>
      ${pupil}
      <path d="M${ix - ir * .7} ${iy + ir * .35}A${ir * .78} ${ir * .78} 0 0 0 ${ix + ir * .7} ${iy + ir * .35}" stroke="${light}" stroke-width="${(ir * .16).toFixed(2)}" fill="none" opacity=".55"/>
      <rect x="${lx - 4}" y="${topY - 2}" width="${w + 8}" height="${h * .8}" fill="${C.lin([[0, "#1A0E18", .38], [1, "#1A0E18", 0]], [0, 0, 0, 1])}"/>
      <ellipse cx="${ix - ir * .38}" cy="${iy - ir * .42}" rx="${(ir * .3).toFixed(2)}" ry="${(ir * .24).toFixed(2)}" fill="#fff" opacity=".95"/>
      <circle cx="${ix + ir * .36}" cy="${iy + ir * .3}" r="${(ir * .12).toFixed(2)}" fill="#fff" opacity=".85"/>
      ${o.wet ? `<path d="M${lx + w * .2} ${botY - h * .25}Q${cx} ${botY + h * .05} ${rx - w * .2} ${botY - h * .25}" stroke="#E8F4FF" stroke-width="1.2" fill="none" opacity=".9"/>` : ""}
      ${upperLid}${lowerLid}
      <rect class="a3lid" transform="scale(1 0)" x="${(lx - 5).toFixed(2)}" y="${(topY - h * 1.2).toFixed(2)}" width="${(w + 10).toFixed(2)}" height="${(botY - topY + h * 1.45).toFixed(2)}" fill="${skin}"/>
    </g>
    <path class="a3lidl" d="M${lx} ${ly}C${lx + w * .25} ${botY - h * .2} ${rx - w * .2} ${botY - h * .15} ${rx} ${ry}" stroke="${line}" stroke-width="${o.w2 ?? 2}" fill="none" stroke-linecap="round" opacity="0"/>
    <path d="${lowLine}" stroke="${line}" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".6"/>
    <path d="${upLine}" stroke="${line}" stroke-width="${o.w2 ?? 2.1}" fill="none" stroke-linecap="round"/>
    ${o.wing ? `<path d="M${outX} ${outY - (up > .02 ? (upY - topY) * .4 : 0)}q${s * 4} -1 ${s * 6.4} -4.4" stroke="${line}" stroke-width="${(o.w2 ?? 2.1) * .8}" fill="none" stroke-linecap="round"/>` : ""}
    ${lashes}</g>`;
};

// ===== Natasha — a glamorous seal-point Siamese =====
// anatomy: slender upright feline in a relaxed contrapposto (weight on one hip, paw on the other),
// soft heart-shaped face with high cheekbones, tall ears, a long S-curved tail with a curled tip
ART3.natasha = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const cream = "#F4E6D0", creamDk = "#E2CBAE", seal = "#4A3028", sealDk = "#2C1A16", line = "#3A2218", emerald = "#127A58";
  const E = {
    neutral:   { up: .36, low: .14, dil: .3, look: [.45, 0], brow: [.4, -2.4], mouth: "smirk", ear: 0, tail: "n", blush: .2, tilt: -3, arm: "clutch" },
    happy:     { up: .4, low: .34, dil: .36, look: [.55, 0], brow: [.6, -2.8], mouth: "knowing", ear: -4, tail: "h", blush: .35, tilt: -7, arm: "clutch" },
    sad:       { up: .44, low: 0, dil: .62, look: [-.2, .45], brow: [2.6, -2.6], mouth: "sad", ear: 18, tail: "s", blush: .1, tilt: 6, wet: 1, arm: "chest" },
    surprised: { up: 0, low: 0, dil: .95, look: [0, -.1], brow: [-4, -4], mouth: "o", ear: -9, tail: "x", blush: .14, tilt: -1, arm: "chest" },
    love:      { up: .9, low: .3, dil: .5, look: [0, 0], brow: [-1, -1], mouth: "content", ear: 6, tail: "l", blush: .8, tilt: -9, arm: "clutch" },
  }[expr] || {};
  // ---- tail: a long, even feline tail in an S-curve, rounded tip; its pose follows the mood
  const T = {
    n: [[[118, 176], [140, 196], [162, 196], [166, 176]], [[166, 176], [170, 158], [158, 146], [162, 128]], [[162, 128], [164, 118], [176, 116], [178, 125]]],
    h: [[[118, 176], [146, 188], [160, 170], [158, 148]], [[158, 148], [156, 128], [164, 112], [174, 104]], [[174, 104], [183, 99], [190, 106], [184, 113]]],
    s: [[[118, 178], [134, 198], [152, 208], [170, 208]], [[170, 208], [180, 208], [187, 205], [190, 199]]],
    x: [[[118, 176], [140, 178], [150, 160], [150, 136]], [[150, 136], [150, 118], [151, 104], [154, 92]]],
    l: [[[118, 176], [142, 196], [166, 196], [170, 178]], [[170, 178], [174, 162], [164, 150], [156, 155]], [[156, 155], [150, 160], [152, 168], [159, 168]]],
  }[E.tail];
  const puff = E.tail === "x" ? 1.5 : 1;
  const tailD = ART3.tube(T, [9, 8.8, 8.4, 8, 7.4, 6.6, 5.2].map(w => w * puff));
  const tail = `<g class="tail">${ink(C, tailD, C.lin([[0, "#6E4C3E"], [.4, seal], [1, sealDk]], [0, 0, 1, 1]), line, { heavy: W.minor + .3 })}
    ${puff > 1 ? tufts([[146, 130, -3, -1], [155, 118, 3, -1], [147, 150, -3, 0], [154, 104, 3, -2]], "#6E4E40", .8, .8) : ""}</g>`;
  // ---- body: a slender torso with a soft waist and a hip shifted to her right
  const torso = "M93 98C86 101 82 108 82 118C82 128 87 135 90 142C92 150 85 160 86 172C87 185 92 194 99 196L114 196C122 194 128 186 127 173C126 160 118 151 117 143C117 135 122 128 121 118C120 108 116 101 109 98Z";
  const legFill = C.lin([[0, cream], [.6, creamDk], [1, seal]], [0, 0, 0, 1]);
  const legL = ART3.tube([[[95, 188], [96, 196], [98, 203], [99, 209]]], [11, 8.6, 7.4]);
  const legR = ART3.tube([[[116, 188], [117, 196], [117, 203], [116, 208]]], [11, 8.6, 7.4]);
  const PAW = (x, y, r) => ink(C, `M${x - r} ${y + 1}C${x - r} ${y - 3} ${x - r * .6} ${y - 5} ${x - r * .34} ${y - 4.4}C${x - r * .2} ${y - 6} ${x + r * .2} ${y - 6} ${x + r * .34} ${y - 4.4}C${x + r * .6} ${y - 5} ${x + r} ${y - 3} ${x + r} ${y + 1}C${x + r} ${y + 4} ${x - r} ${y + 4} ${x - r} ${y + 1}Z`, C.vol(seal, { hi: .22 }), line, { heavy: 1.4 }) + `<path d="M${x - r * .34} ${y - 3.6}v2.6M${x + r * .34} ${y - 3.6}v2.6" stroke="${sealDk}" stroke-width=".8" stroke-linecap="round"/>`;
  const body = `<g class="body">
    ${ink(C, legR, legFill, line, { heavy: W.minor })}${PAW(116.4, 210.4, 7.6)}
    ${ink(C, legL, legFill, line, { heavy: W.minor })}${PAW(99.6, 211.2, 8)}
    ${ink(C, torso, C.vol(cream, { cx: .35, cy: .2, lo: .22 }), line, { heavy: W.major })}
    ${shade(C, torso, "M110 104C126 120 128 160 122 198L136 198L136 100Z", "#8A6A54", .35, 3)}
    <path d="M90 100C92 106 96 108 98 106C99 112 103 112 104 106C106 109 110 106 112 100C113 112 109 122 105 128L102 132L99 128C94 122 90 112 90 100Z" fill="#FFF9F0"/>
    ${tufts([[95, 120, -1.6, 3.4], [101, 126, 0, 4], [107, 120, 1.6, 3.4], [92, 112, -2, 2.4], [110, 112, 2, 2.4]], "#E2CCB0", .8, .9)}
    <path d="M107 182C106 188 106 192 107 195" stroke="${line}" stroke-width=".8" fill="none" opacity=".4"/></g>`;
  // ---- the default outfit: an emerald evening gown — corseted sweetheart bodice, jewelled waist, flowing skirt with a train
  const bodiceD = "M84 119C85 114 90 112 94 114C97 115 99 118 101.5 121C104 118 106 115 109 114C114 112 118 115 119 119C121 128 120 136 117 144L89 144C85 136 82 128 84 119Z";
  const skirtD = "M88 142C83 152 81 164 84 176C85 183 80 191 68 200Q64 210 77 208Q89 213 100 209Q111 214 123 209Q137 214 152 207Q166 210 176 202C156 198 132 190 126 179C128 166 125 152 118 142Z";
  const silk = C.lin([[0, lit(emerald, .32)], [.4, emerald], [.75, shd(emerald, .3)], [1, shd(emerald, .55)]], [0, 0, 1, .7]);
  const dress = o.bare ? "" : `<g class="outfit dress">
    ${ink(C, skirtD, silk, "#063A28", { heavy: W.minor + .4 })}
    <g clip-path="${C.clip(skirtD)}">
      <path d="M86 148C83 162 84 174 86 182C80 192 72 200 66 210L78 212C84 200 92 190 92 180C90 170 89 160 91 148Z" fill="#A6F4D4" opacity=".3" filter="${C.blur(1.4)}"/>
      ${[[94, 150, 82, 210], [102, 150, 100, 212], [110, 150, 120, 212], [116, 150, 142, 210], [120, 150, 162, 206]].map(([x0, y0, x1, y1], i) => `<path d="M${x0} ${y0}C${x0 - 1 + i} ${y0 + 24} ${x1 - 6 + i * 2} ${y1 - 30} ${x1} ${y1}" stroke="#04301F" stroke-width="${1.6 - i * .15}" fill="none" opacity=".5"/><path d="M${x0 - 2.4} ${y0 + 4}C${x0 - 3 + i} ${y0 + 26} ${x1 - 9 + i * 2} ${y1 - 28} ${x1 - 3} ${y1 - 2}" stroke="#8AF0C8" stroke-width=".9" fill="none" opacity=".3"/>`).join("")}
      ${shade(C, skirtD, "M120 146C134 168 160 194 178 204L180 214L120 214Z", "#021A10", .45, 3)}
      <path d="M89 150C86 160 86 170 88 178" stroke="#C8FFE6" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/>
      <path d="M84 178Q100 184 125 178" stroke="#04301F" stroke-width="1" fill="none" opacity=".45"/></g>
    ${ink(C, bodiceD, C.lin([[0, lit(emerald, .2)], [.5, shd(emerald, .12)], [1, shd(emerald, .45)]], [0, 0, 1, 1]), "#063A28", { heavy: W.minor })}
    <g clip-path="${C.clip(bodiceD)}">
      <path d="M93 122C92 130 93 138 94 144M101.5 123V144M110 122C111 130 110 138 109 144" stroke="#04301F" stroke-width=".9" fill="none" opacity=".6"/>
      <path d="M86 116C85 124 85 134 87 142" stroke="#A6F4D4" stroke-width="1.6" fill="none" opacity=".4" stroke-linecap="round"/></g>
    <path d="M84.4 118.6C85.4 114.4 90 112.4 94 114C97 115.2 99 118 101.5 121C104 118 106 115.2 109 114C113.6 112.4 117.8 114.8 118.8 118.8" stroke="#E2BE6A" stroke-width="1.2" fill="none"/>
    ${ink(C, "M88 141Q102 145 117 141L118 146Q102 150 87 146Z", C.lin([[0, "#FFE6A0"], [.5, "#D9A84A"], [1, "#8A6420"]], [0, 0, 0, 1]), "#5A3E10", { heavy: 1 })}
    ${[90, 94, 98, 106, 110, 114].map(x => `<circle cx="${x}" cy="${143.6 + Math.abs(x - 102) * -.02}" r=".7" fill="#FFF4D0"/>`).join("")}
    <path d="M102 140.4L105 144L102 148.6L99 144Z" fill="${C.rad([[0, "#BFE6FF"], [.5, "#3A82D8"], [1, "#0C2E6A"]], { cx: .4, cy: .35 })}" stroke="#5A3E10" stroke-width=".6"/></g>`;
  // ---- signature jewellery: a strand of pearls with a sapphire teardrop
  const pearls = Array.from({ length: 11 }, (_, i) => { const t = i / 10, x = 89 + t * 26, y = 104 + Math.sin(t * Math.PI) * 6.4; return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.45" fill="${C.rad([[0, "#FFFFFF"], [.6, "#F2EAF0"], [1, "#B8A8B8"]], { cx: .35, cy: .3 })}" stroke="#8A7A8A" stroke-width=".3"/>`; }).join("");
  const necklace = o.bare ? "" : `<g class="outfit necklace">${pearls}
    <path d="M102 110.6C99.4 113.6 98.6 116.4 99.4 118.4C100.4 120.6 103.6 120.6 104.6 118.4C105.4 116.4 104.6 113.6 102 110.6Z" fill="${C.rad([[0, "#D8F0FF"], [.45, "#3A86DA"], [1, "#0A2A66"]], { cx: .4, cy: .55 })}" stroke="#1A2A5A" stroke-width=".6"/>
    <path d="M100.8 115.4l.8 -1.6" stroke="#fff" stroke-width=".8" stroke-linecap="round"/><circle cx="102" cy="110.4" r="1" fill="#E2BE6A"/></g>`;
  // ---- arms: one paw rises to her pearls; the other hangs softly, a ruby evening clutch dangling from its chain.
  //      when sad, the near arm falls loose and the other paw comes to her chest.
  const armFill = C.lin([[0, lit(cream, .2)], [.7, creamDk], [1, mix(creamDk, seal, .55)]], [0, 0, 0, 1]);
  const sad = E.arm === "chest";
  const rig = ART3.armRig(o, C);
  const armL = sad ? rig.tube("L", [[[88, 110], [81, 118], [79, 132], [81, 146]]], [9.5, 8.2, 7, 6.2])
    : rig.tube("L", [[[88, 110], [80, 116], [76, 126], [79, 134]], [[79, 134], [83, 139], [91, 128], [95, 118]]], [9.5, 8.4, 7.2, 6.4, 5.8]);
  const pawL = sad ? [81, 148, 0] : [95.6, 115.4, -30];
  const armR = sad ? rig.tube("R", [[[115, 110], [126, 116], [130, 128], [124, 133]], [[124, 133], [119, 136], [112, 130], [110, 122]]], [9.5, 8.4, 7.4, 6.8, 6.4])
    : rig.tube("R", [[[115, 110], [123, 117], [127, 130], [127, 142]], [[127, 142], [127, 150], [125, 156], [124, 160]]], [9.5, 8.4, 7.4, 6.6, 6]);
  const pawR = sad ? [110, 120, 0] : [124, 161.4, 8];
  // a small paw seen from the back, toes curled delicately; rot turns it to follow the wrist
  const HAND = ([x, y, rot], r) => `<g transform="rotate(${rot} ${x} ${y})">${ink(C, `M${x - r} ${y - 1}C${x - r} ${y - 5} ${x + r} ${y - 5} ${x + r} ${y - 1}C${x + r} ${y + 2.6} ${x + r * .5} ${y + 4.4} ${x} ${y + 4.4}C${x - r * .5} ${y + 4.4} ${x - r} ${y + 2.6} ${x - r} ${y - 1}Z`, C.vol(seal, { hi: .25 }), line, { heavy: 1.2 })}
    <path d="M${x - r * .4} ${y + 1.2}v2.6M${x} ${y + 1.6}v2.8M${x + r * .4} ${y + 1.2}v2.6" stroke="${sealDk}" stroke-width=".7" stroke-linecap="round"/></g>`;
  const clutch = o.bare || sad ? "" : `<g class="outfit clutch">
    <path d="M124 163C123 167 122.4 170 122.8 173M124 163C126 167 128.6 170 130.6 172.6" stroke="#E2BE6A" stroke-width=".9" fill="none" stroke-dasharray="1.2 .8"/>
    ${ink(C, "M114.6 176C114.6 171 120 168.6 126.6 168.6C133.2 168.6 138.6 171 138.6 176L137.6 183.4C136.8 187.4 116.4 187.4 115.6 183.4Z", C.lin([[0, "#F25A6E"], [.45, "#B0122E"], [1, "#5A0614"]], [0, 0, 1, 1]), "#3A0410", { heavy: W.minor })}
    <path d="M115 176.6C122 178.4 131 178.4 138.2 176.6" stroke="#E2BE6A" stroke-width="1.5" fill="none"/>
    <circle cx="124.4" cy="175.2" r="1.3" fill="#FFE6A0" stroke="#8A6420" stroke-width=".4"/><circle cx="128.8" cy="175.2" r="1.3" fill="#FFE6A0" stroke="#8A6420" stroke-width=".4"/>
    <path d="M126.6 180.2l2 2.4l-2 2.4l-2 -2.4Z" fill="${C.rad([[0, "#FFD0D8"], [.5, "#E0203E"], [1, "#6A0414"]], { cx: .4, cy: .35 })}" stroke="#8A6420" stroke-width=".4"/>
    <path d="M118 172.6C120 170.8 124 170 127 170" stroke="#FFFFFF" stroke-width="1.1" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
  const bangles = o.bare ? "" : `<g transform="rotate(${pawR[2]} ${pawR[0]} ${pawR[1]})"><path d="M${pawR[0] - 4.4} ${pawR[1] - 5.4}q4.4 2 8.8 0" stroke="#E2BE6A" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M${pawR[0] - 4} ${pawR[1] - 7.6}q4 1.8 8 0" stroke="#C9A04A" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
  const arms = `<g class="arm armR">${ink(C, armR, armFill, line, { heavy: W.minor })}${HAND(pawR, 5)}${rig.wear("R")}${bangles}${clutch}</g>
    <g class="arm armL">${ink(C, armL, armFill, line, { heavy: W.minor })}${HAND(pawL, 4.8)}${rig.wear("L")}</g>`;
  // ---- head: softened heart-shaped face, smoky lids, long lashes, a hint of rouge on the lips, a beauty mark
  const head = "M70 64C70 46 84 36 100 36C116 36 130 44 132 60C134 68 138 74 139 81C139 87 132 92 122 97C114 101 107 102 101 101C93 100 84 97 76 92C70 89 64 86 63 81C63 75 69 70 70 64Z";
  const earL = "M73 57C65 41 61 25 65 8C76 17 86 28 93 41Z", earLin = "M75 51C70 39 68 27 69 16C76 24 82 31 87 40Z";
  const earR = "M107 39C115 27 125 18 136 11C137 25 135 38 131 53Z", earRin = "M110 40C117 31 124 24 132 19C133 29 131 39 128 48Z";
  const earFill = C.lin([[0, sealDk], [.6, seal], [1, "#8A6656"]], [.3, 0, .6, 1]), innerFill = C.lin([[0, "#C88A8E"], [1, "#E8B4B4"]], [0, 0, 0, 1]);
  const ears = `<g transform="rotate(${-E.ear} 84 48)">${ink(C, earL, earFill, line, { heavy: W.major })}<path d="${earLin}" fill="${innerFill}" opacity=".9"/>${tufts([[76, 46, 4, -3], [77, 42, 5, -4], [78, 38, 4, -4]], "#F6E8D8", .7, .8)}</g>
    <g transform="rotate(${E.ear} 120 46)">${ink(C, earR, earFill, line, { heavy: W.major })}<path d="${earRin}" fill="${innerFill}" opacity=".85"/>${tufts([[127, 44, -4, -3], [126, 40, -4, -4]], "#F6E8D8", .7, .7)}</g>`;
  const mask = C.rad([[0, "#3E2820", .92], [.3, "#5E4234", .8], [.6, "#A88672", .3], [1, cream, 0]], { cx: 103, cy: 86, r: 32, user: 1 });
  const eyeO = { skin: mix(cream, "#9C7C66", .45), line: "#1E120E", shape: "almond", iris: ["#123E86", "#3B86D6", "#A8DCFF"], pupil: "slit", dil: E.dil, look: E.look, up: E.up, low: E.low, lash: 3, wing: 1, wet: E.wet, w2: 2.3 };
  const brows = `<path d="M80 ${56 + E.brow[0]}Q88 ${52.4 + E.brow[0] * .6} 96 ${56 + E.brow[0] * .2}" stroke="#6E4E40" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M109 ${55 + E.brow[1] * .2}Q117 ${51.4 + E.brow[1] * .6} 124 ${55 + E.brow[1]}" stroke="#6E4E40" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".65"/>`;
  const rouge = "#A3283A";
  const mouths = {
    knowing: `<path d="M104 87.5v2.2" stroke="${line}" stroke-width="1"/><path d="M97.8 90.6C100 92.4 102.8 92.2 104 89.9C106 92.6 110 92.6 112.8 88.2" stroke="${rouge}" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M112.8 88.2q1.2 -.4 1.6 -1.6" stroke="${line}" stroke-width=".7" fill="none" stroke-linecap="round"/><path d="M100.6 92.2C102.6 93.6 106 93.8 108.6 92.6" stroke="${rouge}" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>`,
    smirk: `<path d="M104 87.5v2.2" stroke="${line}" stroke-width="1"/><path d="M97.6 90.4C99.6 92.8 102.6 92.6 104 89.9C105.8 92.8 109.6 92.2 111.4 89" stroke="${rouge}" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M100 92C101.8 93.6 105.6 93.8 107.6 92.2" stroke="${rouge}" stroke-width="1" fill="none" opacity=".55" stroke-linecap="round"/>`,
    smile: `<path d="M104 87.5v2.2" stroke="${line}" stroke-width="1"/><path d="M97 89.6C99 94.8 109 94.8 111.6 89.4Q104 91.6 97 89.6Z" fill="#7A2A32" stroke="${rouge}" stroke-width="1.3" stroke-linejoin="round"/><path d="M101.4 93.2Q104 94.8 107 93.2Q104 92.2 101.4 93.2Z" fill="#E8828E"/>`,
    sad: `<path d="M104 87.5v2.6" stroke="${line}" stroke-width="1"/><path d="M98.6 93.2C100.6 90.6 107.6 90.6 109.8 93.2" stroke="${rouge}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    o: `<path d="M104 87.5v1.8" stroke="${line}" stroke-width="1"/><ellipse cx="104" cy="92.4" rx="2.6" ry="3.2" fill="#5A1E26" stroke="${rouge}" stroke-width="1.3"/>`,
    content: `<path d="M104 87.5v2.2" stroke="${line}" stroke-width="1"/><path d="M98 90C99.4 91.8 102.2 92 104 89.7C106 92 109 91.8 110.4 90" stroke="${rouge}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  };
  const face = `
    ${ink(C, head, C.vol(cream, { cx: .34, cy: .28, lo: .16 }), line, { heavy: W.major })}
    <path d="${head}" fill="${mask}"/>
    ${shade(C, head, "M118 60C136 64 142 84 134 96L146 96L146 50Z", "#5A3A2E", .3, 3)}
    ${tufts([[63, 80, -3, 1], [65, 84, -3, 2.4], [139, 82, 3, 1.4], [136, 87, 2.6, 2.6]], "#F6E8D8", .8, .8)}
    ${sheen(80, 45, 9, 4.6)}
    <ellipse cx="87" cy="64" rx="11" ry="4.6" fill="#6A3A5A" opacity=".32" filter="${C.blur(1.6)}"/><ellipse cx="117" cy="62.6" rx="9" ry="4" fill="#6A3A5A" opacity=".28" filter="${C.blur(1.6)}"/>
    ${ART3.eye(C, { ...eyeO, cx: 87.5, cy: 69, w: 20, h: 8.8, side: "L", tilt: 2.4 })}
    ${ART3.eye(C, { ...eyeO, cx: 117, cy: 67.5, w: 16.6, h: 8, side: "R", tilt: 2.2 })}
    ${brows}
    <ellipse cx="86" cy="83" rx="${7 * E.blush + .01}" ry="${3 * E.blush + .01}" fill="#E8798F" opacity="${.5 * E.blush + .12}" filter="${C.blur(1.4)}"/>
    <ellipse cx="121" cy="81" rx="${6 * E.blush + .01}" ry="${2.6 * E.blush + .01}" fill="#E8798F" opacity="${.45 * E.blush + .1}" filter="${C.blur(1.4)}"/>
    <path d="M100.4 82.6Q104 81 107.6 82.6Q106.6 86.2 104 87.2Q101.4 86.2 100.4 82.6Z" fill="${C.lin([[0, "#B07A74"], [1, "#6A3A36"]], [0, 0, 0, 1])}" stroke="${line}" stroke-width=".6"/>
    <ellipse cx="102.8" cy="83.1" rx="1.2" ry=".6" fill="#fff" opacity=".7"/>
    ${mouths[E.mouth]}
    <circle cx="113.6" cy="93" r=".8" fill="#2A1612"/>
    <path d="M94 88C84 86 74 87 66 90M94 90.6C85 91 77 93 70 97M114 87C123 85 132 86 140 89M114 89.6C122 90 129 92 136 96" stroke="#FFF8EE" stroke-width=".55" fill="none" opacity=".8"/>`;
  const headG = `<g class="head" transform="rotate(${E.tilt} 101 98)">${ears}${face}</g>`;
  const ground = `<ellipse cx="108" cy="212" rx="${o.bare ? 34 : 60}" ry="4.6" fill="#000" opacity=".28" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 natasha" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}
    ${tail}${ART3.mount("back")}${body}${dress}${necklace}${ART3.mount("body")}${arms}${headG}</svg>`);
};

// ===== Corvin the Undefeated — a small, swaggering raven warrior =====
// anatomy: puffed teardrop chest, layered folded wings with long primaries, wedge tail, heavy hooked beak, scaled legs
ART3.corvin = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W } = ART3;
  const ink0 = "#0A0B12", base = "#1D2134", sheen = "#5464A0", violet = "#5A4A86", beakC = "#3A3B44", gold = "#E8B23A";
  const E = {
    neutral:   { up: .18, low: .12, look: [.4, 0], brow: 3, crest: 0, beak: 0, wing: 0, puff: 1, tilt: 0, dy: 0, helm: 0 },
    happy:     { up: .36, low: .3, look: [.5, -.1], brow: 2.6, crest: -6, beak: 0, wing: -10, puff: 1.09, tilt: -5, dy: -1, helm: -.5, smug: 1 },
    sad:       { up: .5, low: 0, look: [-.2, .5], brow: -4, crest: 18, beak: 0, wing: 9, puff: .95, tilt: 10, dy: 5, wet: 1, helm: 2.6 },
    surprised: { up: 0, low: 0, look: [0, -.1], brow: -3, crest: -16, beak: 11, wing: -16, puff: 1.03, tilt: -3, dy: -1, helm: -2.6 },
    love:      { up: .3, low: .2, look: [-.7, .45], brow: -2.6, crest: 8, beak: 0, wing: 5, puff: .97, tilt: 6, dy: 2, blush: 1, helm: 1.2 },
  }[expr] || {};
  const featherFill = C.vol(base, { hi: .22, lo: .45, cx: .32, cy: .25 });
  const sheenStroke = (d, w = 1.4, op = .55) => `<path d="${d}" stroke="${sheen}" stroke-width="${w}" fill="none" stroke-linecap="round" opacity="${op}"/>`;
  // ---- tail: a wedge of long feathers behind the legs
  const tailF = `<g transform="rotate(16 100 176)">` + [-12, -4, 4, 12].map((a, i) => { const x = 100 + a * .5, tip = [100 + a * 1.4, 212 - Math.abs(a) * .35];
    return ink(C, `M${x - 5} 176C${x - 6} 190 ${tip[0] - 4} 204 ${tip[0]} ${tip[1]}C${tip[0] + 4} 204 ${x + 6} 190 ${x + 5} 176Z`, C.lin([[0, "#232842"], [1, "#12141E"]], [0, 0, 0, 1]), ink0, { heavy: W.minor }) + sheenStroke(`M${x} 182C${x + a * .1} 192 ${tip[0]} 200 ${tip[0]} ${tip[1] - 4}`, .7, .45); }).join("") + `</g>`;
  // ---- legs: thin, scaled, with three toes forward and talons
  const leg = (x, dx) => `${ink(C, `M${x - 2.6} 184L${x - 2.2} 206L${x + 2.2} 206L${x + 2.6} 184Z`, C.lin([[0, "#4A4C58"], [1, "#24252E"]], [0, 0, 1, 0]), ink0, { heavy: 1.4 })}
    ${[188, 193, 198, 203].map(y => `<path d="M${x - 2.4} ${y}h4.8" stroke="#15161C" stroke-width=".6"/>`).join("")}
    ${[[-9, 1.6], [0, 2.4], [9, 1.6]].map(([t, l]) => `<path d="M${x} 206.4Q${x + t * .5 + dx} 207.6 ${x + t + dx} 210.4" stroke="#2E2F38" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M${x + t + dx} 210.4l${t > 0 ? 1.6 : t < 0 ? -1.6 : .6} 1.4" stroke="#C9B48A" stroke-width="1.2" stroke-linecap="round"/>`).join("")}
    <path d="M${x} 206.4l-4 1" stroke="#2E2F38" stroke-width="2.4" stroke-linecap="round"/>`;
  // ---- the body: a proud, puffed teardrop chest
  const bodyD = "M100 90C79 93 66 110 66 133C66 158 79 177 100 186C120 179 133 160 133 136C133 112 120 94 100 90Z";
  const chestRows = Array.from({ length: 6 }, (_, r) => { const n = 5 - Math.abs(r - 2) % 3; return Array.from({ length: n }, (_, i) => { const x = 100 + (i - (n - 1) / 2) * 9 + (r % 2) * 2, y = 112 + r * 11;
    return `<path d="M${x - 5.4} ${y}Q${x} ${y + 6.4} ${x + 5.4} ${y}" stroke="${ink0}" stroke-width=".9" fill="none" opacity=".55"/><path d="M${x - 3.6} ${y + 1.4}Q${x} ${y + 4.4} ${x + 3.4} ${y + 1.2}" stroke="${sheen}" stroke-width=".8" fill="none" opacity=".45"/>`; }).join(""); }).join("");
  const body = `<g class="body"><g class="chest">
    ${ink(C, bodyD, featherFill, ink0, { heavy: W.major })}
    <g clip-path="${C.clip(bodyD)}">${chestRows}</g>
    ${shade(C, bodyD, "M118 100C140 120 138 168 112 188L140 190L140 96Z", "#05060C", .55, 3)}
    ${sheenStroke("M80 112C76 124 76 140 80 152", 2, .45)}${sheenStroke("M88 100C82 104 79 110 78 116", 1.4, .5)}</g></g>`;
  // ---- wings: the near wing folded along the side (coverts → secondaries → long primaries); the far wing half-raised
  const wingD = "M84 100C70 104 62 122 62 142C62 162 68 182 76 196C80 198 82 194 82 190C84 196 88 198 90 194C90 186 92 170 92 156C92 136 92 116 84 100Z";
  const wingNear = `<g class="wing wingL" transform="rotate(${E.wing} 84 102)">${ink(C, wingD, C.lin([[0, "#2A3050"], [.5, "#1A1E30"], [1, "#0E1018"]], [0, 0, .4, 1]), ink0, { heavy: W.major })}
    <g clip-path="${C.clip(wingD)}">
      ${[0, 1, 2].map(r => [0, 1, 2].map(i => { const x = 70 + i * 7.4 + r * 1.2, y = 112 + r * 8; return `<path d="M${x - 4.6} ${y - 2}Q${x} ${y + 5} ${x + 4.6} ${y - 2}" fill="#2E3558" stroke="${ink0}" stroke-width=".7"/>`; }).join("")).join("")}
      ${[0, 1, 2, 3].map(i => `<path d="M${66 + i * 6.2} 138C${66 + i * 6.4} 158 ${70 + i * 5.4} 178 ${74 + i * 4.4} 196" stroke="${ink0}" stroke-width="1" fill="none" opacity=".75"/>`).join("")}
      ${sheenStroke("M68 140C68 160 72 178 76 192", 1.2, .5)}</g>${o.armWear ? o.armWear(C, null, null, "wing") : ""}</g>`;
  const wingFarD = "M118 100C128 100 140 108 144 120C148 132 146 142 140 148C136 144 134 140 136 136C132 138 130 134 132 130C126 130 120 120 118 100Z";
  const wingFar = `<g class="wing wingR" transform="rotate(${-E.wing} 120 102)">${ink(C, wingFarD, C.lin([[0, "#262B46"], [1, "#0E1018"]], [0, 0, 1, 1]), ink0, { heavy: W.minor })}
    <path d="M124 108C132 114 138 124 140 140M122 116C128 122 132 130 134 138" stroke="${ink0}" stroke-width=".9" fill="none" opacity=".7"/>${sheenStroke("M122 104C130 106 136 112 140 120", 1.1, .45)}</g>`;
  // ---- default outfit: a simple breastplate, a crimson cape, a small sword
  const capeD = "M80 98C64 116 56 150 52 200Q100 212 148 200C144 150 136 116 120 98Q100 106 80 98Z";
  const cape = o.bare ? "" : `<g class="outfit cape">${ink(C, capeD, C.lin([[0, "#C2283A"], [.5, "#8E1424"], [1, "#4A0A14"]], [0, 0, 1, 1]), "#2A0408", { heavy: W.minor })}
    <path d="M70 140C68 160 66 180 64 200M130 140C132 160 134 180 136 200" stroke="#5A0A16" stroke-width="1.4" fill="none" opacity=".6"/></g>`;
  const steel = c => C.lin([[0, "#EEF2F8"], [.3, "#A8B4C6"], [.7, "#647086"], [1, "#3A4254"]], c || [0, 0, 1, 1]);
  const plateD = "M83 103Q100 95 117 103C124 118 122 136 115 149Q100 157 85 149C78 136 76 118 83 103Z";
  const lame = (y, w) => `M${100 - w} ${y}Q100 ${y + 8} ${100 + w} ${y}L${100 + w - 1.4} ${y + 7}Q100 ${y + 15} ${100 - w + 1.4} ${y + 7}Z`;
  const armor = o.bare ? "" : `<g class="outfit armor">
    ${ink(C, lame(158, 13), steel(), "#1A202C", { heavy: W.minor })}${ink(C, lame(150, 15), steel(), "#1A202C", { heavy: W.minor })}
    ${[[89, 155], [111, 155], [90, 163], [110, 163]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#D9AE52"/>`).join("")}
    ${ink(C, plateD, steel(), "#1A202C", { heavy: W.minor + .3 })}
    <path d="${plateD}" fill="none" stroke="#D9AE52" stroke-width="1.3" transform="translate(100 125) scale(.86) translate(-100 -125)"/>
    <path d="M100 99C99 116 99 136 100 154" stroke="#3E4658" stroke-width="1.4" fill="none"/><path d="M98.6 100C97.6 116 97.6 136 98.6 152" stroke="#FFFFFF" stroke-width=".9" fill="none" opacity=".75"/>
    <path d="M89 114L100 123L111 114L109 125L100 132L91 125Z" fill="${C.lin([[0, "#FFE6A0"], [.5, "#D9A84A"], [1, "#8A6420"]], [0, 0, 0, 1])}" stroke="#5A3E10" stroke-width=".7"/>
    <path d="M100 123V131" stroke="#5A3E10" stroke-width=".6"/><circle cx="100" cy="135.6" r="2.1" fill="${C.rad([[0, "#FF8A8A"], [1, "#9A1020"]], { cx: .35, cy: .3 })}" stroke="#5A3E10" stroke-width=".6"/>
    <path d="M86 108Q89 104 95 102.6" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".8" stroke-linecap="round"/>
    ${shade(C, plateD, "M110 104C126 120 124 150 104 158L126 160L126 100Z", "#0A0E18", .45, 2.4)}</g>`;
  // the pauldron sits over the near wing's shoulder
  const pauldron = o.bare ? "" : `<g class="outfit pauldron" transform="rotate(${E.wing} 84 102)">
    ${[[0, 13], [6, 11.4], [12, 9.4]].map(([dy, r]) => ink(C, `M${78 - r} ${104 + dy}C${78 - r} ${96 + dy} ${78 + r} ${96 + dy} ${78 + r} ${104 + dy}C${78 + r * .4} ${100 + dy} ${78 - r * .4} ${100 + dy} ${78 - r} ${104 + dy}Z`, steel(), "#1A202C", { heavy: W.minor })).reverse().join("")}
    <path d="M67 102C70 98 76 96 82 97" stroke="#FFFFFF" stroke-width="1.1" fill="none" opacity=".7" stroke-linecap="round"/>
    <path d="M66 103.6C70 99.4 86 99.4 90 103.6" stroke="#D9AE52" stroke-width="1" fill="none"/></g>`;
  const sword = o.bare ? "" : `<g class="outfit sword" transform="translate(144 152) rotate(${26 + E.wing * .6})">
    ${ink(C, "M-3 -6L-3 -70L0 -78L3 -70L3 -6Z", C.lin([[0, "#FFFFFF"], [.45, "#C8D2DE"], [1, "#6A7488"]], [0, 0, 1, 0]), "#1E2430", { heavy: 1.2 })}
    <path d="M0 -10L0 -70" stroke="#7A8698" stroke-width="1"/><path d="M-1.6 -12L-1.6 -68" stroke="#FFFFFF" stroke-width=".7" opacity=".8"/>
    ${ink(C, "M-13 -7C-9 -4 -4 -5 0 -6C4 -5 9 -4 13 -7C13 -4 12 -2 10 -1.6C6 -1 3 -2 0 -2C-3 -2 -6 -1 -10 -1.6C-12 -2 -13 -4 -13 -7Z", C.lin([[0, "#FFE6A0"], [.5, gold], [1, "#8A6420"]], [0, 0, 0, 1]), "#5A3E10", { heavy: 1 })}
    <rect x="-2" y="-2" width="4" height="12" rx="1.4" fill="#4A2A18" stroke="#24120A" stroke-width=".6"/>
    <path d="M-2 1h4M-2 4h4M-2 7h4" stroke="#7A4A2A" stroke-width=".6"/>
    <circle cy="12.6" r="2.8" fill="${C.rad([[0, "#FF9A9A"], [1, "#9A1020"]], { cx: .35, cy: .3 })}" stroke="#5A3E10" stroke-width=".8"/></g>
    <path d="M137 148C141 144 147 144 149 148C148 152 143 154 138 153Z" fill="#161A28" stroke="${ink0}" stroke-width=".8"/>`;
  const hackD = "M80 80C86 88 92 92 100 92C110 92 118 88 122 82L124 92L118 96L121 104L112 102L110 112L103 104L98 114L94 104L86 110L87 100L78 102L82 94L76 90Z";
  const hackles = `<g class="hackles" transform="translate(0 ${E.dy * .5 + 3})">${ink(C, hackD, C.lin([[0, "#2A3050"], [1, "#151826"]], [0, 0, .3, 1]), ink0, { heavy: W.minor })}
    ${tufts([[90, 96, -2, 8], [98, 98, 0, 9], [106, 97, 2, 8], [114, 94, 3, 7]], sheen, .8, .5)}</g>`;
  const horn = (d, ridge) => ink(C, d, C.lin([[0, "#FFFFFF"], [.35, "#C8D2DE"], [.75, "#7A8698"], [1, "#3E4658"]], [0, 0, 1, 1]), "#1A202C", { heavy: W.minor }) + `<path d="${ridge}" stroke="#FFFFFF" stroke-width=".8" fill="none" opacity=".7" stroke-linecap="round"/>`;
  // winged helm: three overlapping steel feather-blades sweeping back from a gold boss on each side
  const crestWing = (far, sc) => { const ox = far ? 102 : 75, oy = far ? 27 : 40;
    const blades = [[-62, 38, 9.4], [-44, 31, 8.4], [-26, 24, 7.2]];
    return `<g transform="translate(${ox} ${oy}) scale(${sc})">${blades.map(([ang, len, w], i) => { const a = (ang - 90) * Math.PI / 180 - (far ? .1 : 0), ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const tip = [ux * len - 6, uy * len], m1 = [ux * len * .55 + nx * w, uy * len * .55 + ny * w], m2 = [ux * len * .55 - nx * w * .4, uy * len * .55 - ny * w * .4];
      const d = `M0 0Q${m1[0].toFixed(1)} ${m1[1].toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}Q${m2[0].toFixed(1)} ${m2[1].toFixed(1)} 2 1Z`;
      return ink(C, d, C.lin([[0, "#FFFFFF"], [.4, "#C8D2DE"], [1, "#5A6476"]], [0, 0, 1, 1]), "#1A202C", { heavy: W.fine + .5 }) + `<path d="M0 0Q${(m1[0] * .6 + m2[0] * .4).toFixed(1)} ${(m1[1] * .6 + m2[1] * .4).toFixed(1)} ${tip[0].toFixed(1)} ${tip[1].toFixed(1)}" stroke="#7A8698" stroke-width=".6" fill="none"/>`; }).reverse().join("")}
      <circle r="3.6" fill="${C.lin([[0, "#FFE6A0"], [1, "#8A6420"]], [0, 0, 0, 1])}" stroke="#5A3E10" stroke-width=".7"/><circle r="1.4" fill="${C.rad([[0, "#FF9A9A"], [1, "#9A1020"]], { cx: .35, cy: .3 })}"/></g>`; };
  const helmD = "M70 49C68 33 82 22 100 22C118 22 130 32 131 46C125 43 113 41 100 41C88 41 77 44 70 49Z";
  const helmet = o.bare ? "" : `<g class="outfit helm" transform="translate(0 ${E.helm})">
    ${crestWing(1, .78)}${crestWing(0, 1)}
    ${ink(C, helmD, steel([.2, 0, .8, 1]), "#1A202C", { heavy: W.major })}
    <path d="M100 23C98 29 98 35 100 41" stroke="#3E4658" stroke-width="1.2" fill="none"/>
    <path d="M78 34C82 28 90 25 97 25" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".75" stroke-linecap="round"/>
    ${ink(C, "M70 49C77 44 88 41 100 41C113 41 125 43 131 46L131 49.4C125 46.6 113 44.6 100 44.6C88 44.6 77 47.4 70 52.4Z", C.lin([[0, "#FFE6A0"], [.5, gold], [1, "#8A6420"]], [0, 0, 0, 1]), "#5A3E10", { heavy: 1 })}
    ${[78, 88, 112, 122].map(x => `<circle cx="${x}" cy="${x < 100 ? 47.4 - (x - 70) * .09 : 44.6 + (x - 112) * .08}" r=".9" fill="#FFF0C0"/>`).join("")}
    ${ink(C, "M104.6 43.6L109.4 43.6L108.4 54L106.6 56.4L105.4 54Z", steel([0, 0, 1, 0]), "#1A202C", { heavy: 1 })}</g>`;
  // ---- head: smooth crown, swept-back crest, heavy hooked beak, fierce brow
  const headD = "M70 66C69 46 83 32 101 32C118 32 129 43 130 58C131 72 124 86 108 90C95 93 80 89 74 81C71 77 70 72 70 66Z";
  const crest = `<g transform="rotate(${E.crest} 80 40)">${[[78, 38, -16, -14], [84, 34, -8, -18], [90, 32, 0, -16]].map(([x, y, dx, dy]) => ink(C, `M${x - 4} ${y + 4}C${x - 3} ${y} ${x + dx * .6} ${y + dy * .7} ${x + dx} ${y + dy}C${x + dx * .4 + 4} ${y + dy * .5} ${x + 5} ${y} ${x + 5} ${y + 5}Z`, C.lin([[0, "#2A3050"], [1, base]], [0, 0, 1, 1]), ink0, { heavy: W.minor })).join("")}</g>`;
  const beakOpen = E.beak;
  const beak = `<g class="beak">
    <g transform="rotate(${beakOpen * .9} 120 74)">${ink(C, "M117 72C128 72 139 73 146 75C139 79 128 80 118 78Z", C.lin([[0, "#4A4B56"], [1, "#22232A"]], [0, 0, 0, 1]), ink0, { heavy: 1.4 })}</g>
    ${beakOpen > 2 ? `<path d="M120 74C130 75 140 76 146 78L144 ${78 + beakOpen * .4}C136 ${78 + beakOpen * .6} 128 ${77 + beakOpen * .6} 120 ${76 + beakOpen * .3}Z" fill="#5A1E2A"/>` : ""}
    ${ink(C, "M115 58C127 53 145 59 155 70C157 74 154 77 151 75C142 70 130 70 118 73C115 68 114 62 115 58Z", C.lin([[0, "#6A6C78"], [.35, beakC], [1, "#18191F"]], [0, 0, .3, 1]), ink0, { heavy: W.minor })}
    <path d="M118 60C130 57 144 62 152 69" stroke="#9A9CAA" stroke-width="1" fill="none" opacity=".7"/>
    <path d="M126 64q2 -1 4 0" stroke="${ink0}" stroke-width="1" fill="none"/>
    ${tufts([[116, 60, 6, 1], [116, 63, 6.6, 1.4], [116, 66, 6, 2]], "#2A3050", 1.1, .9)}</g>`;
  const eyeO = { skin: "#20253A", line: "#05060A", shape: "round", iris: ["#7A4A08", "#E0A020", "#FFE08A"], pupil: "round", dil: .55, look: E.look, up: E.up, low: E.low, w2: 1.8, wet: E.wet };
  const browL = `<path d="M${85} ${47 - E.brow * .3}Q${95} ${45 + E.brow * .6} ${105} ${49 + E.brow}" stroke="${ink0}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
  const browR = `<path d="M${111} ${48 + E.brow}Q${115} ${45 + E.brow * .5} ${120} ${45}" stroke="${ink0}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  const head = `<g class="head" transform="translate(0 ${E.dy + 5}) rotate(${E.tilt} 100 92) translate(100 92) scale(1.1) translate(-100 -92)">${crest}
    ${ink(C, headD, featherFill, ink0, { heavy: W.major })}
    ${shade(C, headD, "M112 40C134 50 134 80 116 94L136 96L136 36Z", "#05060C", .5, 3)}
    ${sheenStroke("M78 50C82 42 90 37 99 36", 2, .6)}${sheenStroke("M74 64C74 58 76 54 78 51", 1.2, .4)}
    <path d="M78 76C82 82 90 86 100 87" stroke="${violet}" stroke-width="1.2" fill="none" opacity=".45"/>
    ${ART3.eye(C, { ...eyeO, cx: 96, cy: 61, w: 16, h: 7.6, side: "L" })}
    ${ART3.eye(C, { ...eyeO, cx: 117, cy: 59, w: 11, h: 5.8, side: "R" })}
    ${helmet}${browL}${browR}
    <path d="M90 46l4 7M92.6 45.6l1.2 2" stroke="#C8B8AC" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>
    ${E.blush ? ART3.bashful(C, 95, 72, 7, "#D86A8E", .6) : ""}${E.smug ? `<path d="M120 77.6C126 79.4 134 79 140 77" stroke="#5A1E2A" stroke-width="1" fill="none" opacity=".6"/>` : ""}
    ${beak}</g>`;
  const ground = `<ellipse cx="100" cy="213" rx="34" ry="4" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 corvin" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}${cape}${ART3.mount("back")}${tailF}${leg(93, -1)}${leg(108, 1)}<g class="rig" style="transform-origin:100px 186px;transform:scale(${E.puff})">${wingFar}${sword}${body}${armor}${ART3.mount("body")}${wingNear}${pauldron}${hackles}</g>${head}</svg>`);
};

// ===== Nyx the Starling — a tiny, shy lavender fruit bat =====
// anatomy: chibi — a big soft round head on a small round bean body; wide ears with rounded tips,
// a short button muzzle, a small fluffy collar, wing membranes on finger bones that spread, rest or wrap around her
// (o: -1 wrap … 0 rest … 1 spread). She always hugs her little heart book.
ART3.nyx = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const line = "#2E2046", fur = "#9A86CC", furD = "#5E4A92", belly = "#D6CAF0", ruffC = "#F2EAF8", memb = "#5C4890", membL = "#A894DA", innerEar = "#F0A8C8";
  const E = {
    neutral:   { up: .06, low: .12, look: [.35, .4], dil: .92, ear: 8, wing: -.18, brow: 2.4, mouth: "shy", dy: 0, tilt: 6, blush: .7 },
    happy:     { up: 0, low: .5, look: [0, .05], dil: .95, ear: -10, wing: .75, brow: -.6, mouth: "smile", dy: -3, tilt: -4, blush: .9 },
    sad:       { up: .1, low: .1, look: [-.15, .6], dil: .98, ear: 36, wing: -1, brow: 4.4, mouth: "sad", dy: 3, tilt: 9, wet: 1, blush: .45 },
    surprised: { up: 0, low: 0, look: [0, -.15], dil: .6, ear: -18, wing: 1, brow: -2.6, mouth: "o", dy: -5, tilt: 0, blush: .4 },
    love:      { up: 1, low: 0, look: [0, 0], dil: .9, ear: 20, wing: -.78, brow: 2.4, mouth: "shy", dy: 2, tilt: -12, blush: 1.6, bash: 1 },
  }[expr] || {};
  const L = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const pose = (rest, spread, wrap) => E.wing >= 0 ? L(rest, spread, E.wing) : L(rest, wrap, -E.wing);
  // ---- one wing (her right, drawn on the left); the other is its mirror
  const wing = side => {
    const S = [82, 168], Wr = pose([60, 154], [40, 128], [98, 174]);
    const F = [pose([38, 178], [8, 138], [72, 192]), pose([46, 198], [12, 172], [84, 204]), pose([66, 206], [38, 198], [98, 207])];
    const B = pose([86, 198], [84, 196], [82, 200]);
    const sc = (a, b) => { const m = L(a, b, .5), c = L(m, Wr, .2); return `Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`; };
    const d = `M${S[0]} ${S[1]}Q${(S[0] + Wr[0]) / 2} ${Math.min(S[1], Wr[1]) - 7} ${Wr[0]} ${Wr[1]}L${F[0][0]} ${F[0][1]}${sc(F[0], F[1])}${sc(F[1], F[2])}${sc(F[2], B)}Q${(B[0] + S[0]) / 2 + 2} ${(B[1] + S[1]) / 2} ${S[0]} ${S[1]}Z`;
    const g = C.rad([[0, membL], [.55, memb], [1, shd(memb, .3)]], { cx: .3, cy: .75, r: .9 });
    const bones = F.map((f, i) => `<path d="M${Wr[0]} ${Wr[1]}Q${(Wr[0] + f[0]) / 2 + (i - 1) * 3} ${(Wr[1] + f[1]) / 2 - 3} ${f[0]} ${f[1]}" stroke="${furD}" stroke-width="${1.6 - i * .2}" fill="none" stroke-linecap="round"/>`).join("");
    const arm = `<path d="M${S[0]} ${S[1]}Q${(S[0] + Wr[0]) / 2} ${Math.min(S[1], Wr[1]) - 6} ${Wr[0]} ${Wr[1]}" stroke="${fur}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${S[0]} ${S[1] - 1.6}Q${(S[0] + Wr[0]) / 2} ${Math.min(S[1], Wr[1]) - 8} ${Wr[0]} ${Wr[1] - 1.6}" stroke="${lit(fur, .5)}" stroke-width="1" fill="none" stroke-linecap="round" opacity=".7"/>`;
    const thumb = `<path d="M${Wr[0]} ${Wr[1]}q-2.4 -2.6 -1.2 -5.6q.6 -.8 1.4 0" fill="${fur}" stroke="${line}" stroke-width=".7"/>`;
    const body = `${ink(C, d, g, line, { heavy: W.minor })}<g clip-path="${C.clip(d)}"><path d="${d}" fill="none" stroke="${membL}" stroke-width="3" opacity=".3" transform="translate(-1 -1)"/></g>${bones}${arm}${thumb}${o.armWear ? o.armWear(C, { S, Wr, F, B, d }, null, "wing") : ""}`;
    return side < 0 ? `<g class="wing wingL">${body}</g>` : `<g class="wing wingR" transform="translate(200 0) scale(-1 1)">${body}</g>`;
  };
  const wrapped = E.wing < -.3;
  // ---- body: a small round bean with a pale tummy and tiny feet
  const bodyD = "M100 154C85 154 77 166 77 180C77 194 87 203 100 203C113 203 123 194 123 180C123 166 115 154 100 154Z";
  const feet = [-1, 1].map(s => { const x = 100 + s * 8; return `${ink(C, `M${x - 3.6} 200C${x - 3.6} 205 ${x + 3.6} 205 ${x + 3.6} 200Z`, furD, line, { heavy: 1 })}${[-2.2, 0, 2.2].map(t => `<path d="M${x + t} 204.2l${t * .3} 1.8" stroke="#EADCF4" stroke-width=".8" stroke-linecap="round"/>`).join("")}`; }).join("");
  const body = `<g class="body">${feet}${ink(C, bodyD, C.vol(fur, { hi: .3, lo: .35 }), line, { heavy: W.major })}
    <ellipse cx="100" cy="183" rx="15" ry="15" fill="${C.vol(belly, { hi: .3, lo: .15, cy: .3 })}"/>
    ${shade(C, bodyD, "M114 158C130 170 128 196 108 206L130 206L130 156Z", "#1A0E30", .4, 3)}
    ${tufts([[88, 194, -1, 4], [100, 198, 0, 4], [112, 194, 1, 4]], lit(belly, .2), .8, .7)}</g>`;
  // her little heart book, hugged to her tummy
  const book = `<g class="book" transform="translate(100 182) rotate(-6)">
    ${ink(C, "M-11 -8.6L11 -8.6L11 8.6L-11 8.6Z", C.lin([[0, "#FFC4DA"], [1, "#E07AA4"]], [0, 0, 1, 1]), "#6A2A50", { heavy: 1.2 })}
    <path d="M-11 -8.6L-8.6 -10.4L13 -10.4L11 -8.6" fill="#FFF4F8" stroke="#6A2A50" stroke-width=".5"/><path d="M-8 -8.6V8.6" stroke="#C25A88" stroke-width=".8"/>
    <path d="M2 -2.6C2 -5 -2.6 -5 -2.6 -1.8C-2.6 1 2 3.6 2 4.6C2 3.6 6.6 1 6.6 -1.8C6.6 -5 2 -5 2 -2.6Z" fill="#FFFFFF" opacity=".95"/>
    <path d="M-9.4 -7l3 0" stroke="#fff" stroke-width=".8" opacity=".6"/></g>`;
  const ruffD = "M84 150C90 146 110 146 116 150C118 154 115 157 111 158C107 160.6 104 160 100 161.6C96 160 93 160.6 89 158C85 157 82 154 84 150Z";
  const ruff = `<g class="ruff">${ink(C, ruffD, C.vol(ruffC, { hi: .3, lo: .25, cy: .2 }), "#6A5A8A", { heavy: 1.2 })}
    ${tufts([[90, 156, -1, 4], [96, 158, 0, 4], [104, 158, 0, 4], [110, 156, 1, 4]], "#C8B8E0", .7, .7)}</g>`;
  // ---- head: a big soft round head, wide ears, huge glossy eyes, a tiny button muzzle
  const earD = "M78 102C66 94 57 78 57 63C57 56 62 53 67 56C80 63 90 76 94 92Z";
  const earIn = "M79 97C70 90 63 78 62 67C62 62 65 60 68 62C77 68 84 78 87 90Z";
  const ear = side => { const g = `<g transform="rotate(${-E.ear} 88 96) translate(88 96) scale(.82 .78) translate(-88 -96)">${ink(C, earD, C.vol(fur, { hi: .3, lo: .35, cx: .3 }), line, { heavy: W.major })}
      <path d="${earIn}" fill="${C.lin([[0, innerEar], [1, "#B06A9A"]], [0, 0, .4, 1])}"/>
      <path d="M60 64C60 59 63 57 66 57.6" stroke="${lit(fur, .6)}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".8"/></g>`;
    return side < 0 ? g : `<g transform="translate(200 0) scale(-1 1)">${g}</g>`; };
  const headD = "M100 86C79 86 64 99 64 117C64 131 72 143 85 148C90 150 95 151 100 151C105 151 110 150 115 148C128 143 136 131 136 117C136 99 121 86 100 86Z";
  const eyeO = { skin: fur, line, shape: "round", iris: ["#24104A", "#6A40B0", "#D2B8FF"], pupil: "round", dil: E.dil, look: E.look, up: E.up, low: E.low, w2: 1.7, wet: E.wet, irisR: .9 };
  const mouths = {
    shy: `<path d="M96.2 135.4Q97.6 137.6 100 137.2Q102.6 136.8 103.8 134.8" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M96.2 135.4l-.8 -.6M103.8 134.8l.7 -.7" stroke="${line}" stroke-width=".8" stroke-linecap="round"/>`,
    tiny: `<path d="M98 136.4Q100 137.8 102 136.4" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/><path d="M101.6 136.8l.5 1.6l.6 -1.4Z" fill="#fff"/>`,
    smile: `<path d="M96 135.4Q100 141 104 135.4Q100 137 96 135.4Z" fill="#7A2A50" stroke="${line}" stroke-width="1" stroke-linejoin="round"/><path d="M98.4 136.2Q100 138.4 101.6 136.2Z" fill="#F08AAE"/><path d="M102.4 135.9l.5 1.7l.7 -1.6Z" fill="#fff"/>`,
    sad: `<path d="M96.6 138.4Q98 136 100 137Q102 136 103.4 138.4" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    o: `<ellipse cx="100" cy="137.6" rx="2" ry="2.6" fill="#7A2A50" stroke="${line}" stroke-width="1"/>`,
  };
  const brow = s => `<path d="M${100 + s * 7} ${101 - E.brow}Q${100 + s * 13} ${99 - E.brow * .5} ${100 + s * 20} ${101 + E.brow * .3}" stroke="${furD}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>`;
  const bow = o.bare ? "" : `<g class="outfit bow" transform="translate(124 92) rotate(18)">
    ${ink(C, "M0 0C-6 -8 -15 -7 -14 0C-15 7 -6 8 0 0Z", C.vol("#D6B8F4", { hi: .4, lo: .3 }), "#5A3A86", { heavy: 1.1 })}
    ${ink(C, "M0 0C6 -8 15 -7 14 0C15 7 6 8 0 0Z", C.vol("#D6B8F4", { hi: .4, lo: .3 }), "#5A3A86", { heavy: 1.1 })}
    <path d="M-1 1L-4.4 11L-1.4 9.6L0 12L1 2Z" fill="#B696E0" stroke="#5A3A86" stroke-width=".6"/><path d="M1 1L5.4 10L2.4 9.6L1.4 12Z" fill="#A486D4" stroke="#5A3A86" stroke-width=".6"/>
    <path d="M-11.6 -1.6C-11 -4.4 -8.4 -5.2 -6.2 -4.4" stroke="#fff" stroke-width=".9" fill="none" opacity=".8"/>
    ${ink(C, "M-2.8 -3Q0 -4.2 2.8 -3L2.8 3Q0 4.2 -2.8 3Z", "#C4A4EC", "#5A3A86", { heavy: .9 })}</g>`;
  const head = `<g class="head" transform="translate(0 ${E.dy}) rotate(${E.tilt} 100 150)">${ear(-1)}${ear(1)}
    ${ink(C, headD, C.vol(fur, { hi: .34, lo: .3, cx: .36, cy: .28 }), line, { heavy: W.major })}
    ${shade(C, headD, "M120 94C142 108 138 140 114 154L142 156L142 90Z", "#1A0E30", .35, 3)}
    ${sheen(82, 98, 10, 5)}
    ${tufts([[65, 120, -4, 3], [66, 126, -3, 4], [135, 120, 4, 3], [134, 126, 3, 4], [98, 87, -1, -4], [101.6, 86.4, 1.4, -4.4]], fur, 1.6, .95)}
    <ellipse cx="100" cy="134" rx="7.4" ry="5.4" fill="${C.vol(mix(fur, "#FFFFFF", .45), { hi: .3, lo: .1, cy: .3 })}"/>
    ${ART3.eye(C, { ...eyeO, cx: 85, cy: 117, w: 21, h: 11.4, side: "L" })}
    ${ART3.eye(C, { ...eyeO, cx: 115, cy: 117, w: 21, h: 11.4, side: "R" })}
    ${brow(-1)}${brow(1)}
    ${E.bash ? ART3.bashful(C, 76, 132, 9, "#F07AA4", .9) + ART3.bashful(C, 124, 132, 9, "#F07AA4", .9) : `<ellipse cx="76" cy="132" rx="7" ry="3.6" fill="#F07AA4" opacity="${.25 + E.blush * .4}" filter="${C.blur(1.4)}"/><ellipse cx="124" cy="132" rx="7" ry="3.6" fill="#F07AA4" opacity="${.25 + E.blush * .4}" filter="${C.blur(1.4)}"/>`}
    <path d="M98 131.4C98 130 102 130 102 131.4C102 132.8 100.6 133.6 100 133.6C99.4 133.6 98 132.8 98 131.4Z" fill="#4A2A5A"/>
    <ellipse cx="99.2" cy="131" rx=".7" ry=".35" fill="#fff" opacity=".7"/>
    ${mouths[E.mouth]}${bow}</g>`;
  const ground = `<ellipse cx="100" cy="207" rx="${24 + Math.max(0, E.wing) * 34}" ry="3.4" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  // open wings sit behind her; wrapped wings come round in front, over the book
  const wings = wing(-1) + wing(1);
  return ART3.fin(C, `<svg class="art3 nyx" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}${ART3.mount("back")}${wrapped ? "" : wings}${body}${ART3.mount("dress")}${book}${wrapped ? wings : ""}${ruff}${ART3.mount("body")}${head}</svg>`);
};

// ===== Antonio — a theatrical golden lion romantic =====
// anatomy (tall): a broad, athletic V-shaped torso — wide shoulders, defined pecs, narrow waist — a magnificent
// golden mane flowing down over the shoulders, a handsome muzzle with a strong jaw, a long tufted tail
ART3.antonio = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const fur = "#E8AE52", furLt = "#FAE0AE", line = "#4A2410", maneDk = "#A85A16", maneMd = "#E09A2E", maneLt = "#F8CC66";
  const E = {
    neutral:   { up: .38, low: .14, look: [.35, 0], dil: .5, brow: [1.6, -1.6], mouth: "smoulder", ear: 0, mane: 1, tilt: -4, dy: 0, rose: "chest", blush: .15 },
    happy:     { up: .08, low: .58, look: [.1, -.1], dil: .62, brow: [-2.6, -2.6], mouth: "grin", ear: -8, mane: 1.04, tilt: -7, dy: -2, rose: "out", blush: .3 },
    sad:       { up: .3, low: 0, look: [.2, -.7], dil: .75, brow: [4, -4], mouth: "sad", ear: 26, mane: .97, tilt: 12, dy: 2, rose: "down", wet: 1, blush: 0 },
    surprised: { up: 0, low: 0, look: [0, -.1], dil: .9, brow: [-4.6, -4.6], mouth: "o", ear: -14, mane: 1.1, tilt: 0, dy: -3, rose: "chest", blush: .1 },
    love:      { up: 1, low: .3, look: [0, 0], dil: .5, brow: [-1.6, -1.6], mouth: "kiss", ear: 6, mane: 1.02, tilt: -10, dy: 0, rose: "lips", blush: 1 },
  }[expr] || {};
  const hc = [100, 64];
  // ---- mane: two rings of wide, curling locks, longest at the cheeks and flowing down over the shoulders
  const lock = (a, r0, r1, w, curl) => {
    const P = (r, t) => [hc[0] + r * Math.cos(t), hc[1] + r * Math.sin(t)], f = v => v.map(n => n.toFixed(1)).join(" ");
    const b1 = P(r0, a - w), b2 = P(r0, a + w), tip = P(r1, a + curl);
    return `M${f(b1)}C${f(P(r0 + (r1 - r0) * .5, a - w * 1.3))} ${f(P(r1 + 1, a + curl - w * .8))} ${f(tip)}C${f(P(r1 - 4, a + curl + w * .4))} ${f(P(r0 + (r1 - r0) * .45, a + w * 1.15))} ${f(b2)}Z`;
  };
  const jit = i => ((i * 53) % 11) / 11;
  const reach = (a, back) => 31 + (back ? 30 : 8) * Math.max(0, Math.sin(a)) ** 1.2 + 10 * Math.abs(Math.cos(a));
  const ring = (n, off, extra, light, w, back) => { const g = C.rad([[0, light ? lit(maneLt, .25) : maneLt], [.55, light ? maneLt : maneMd], [1, light ? maneMd : maneDk]], { cx: hc[0] - 8, cy: hc[1] - 10, r: back ? 72 : 56, user: 1 }); return Array.from({ length: n }, (_, i) => { const a = (i + off) / n * Math.PI * 2 - Math.PI / 2;
    if (!back && Math.sin(a) > .42) return "";
    const sweep = (Math.cos(a) >= 0 ? .18 : -.1) + .08 * jit(i);
    return ink(C, lock(a, 18, reach(a, back) + extra + jit(i + 3) * 5, w * (.85 + .3 * jit(i + 7)), sweep), g, shd(maneDk, .4), { heavy: W.minor }); }).join(""); };
  const strands = Array.from({ length: 11 }, (_, i) => { const a = (i + .3) / 11 * Math.PI * 2 - Math.PI / 2; if (Math.sin(a) > .42) return ""; const r0 = 28, r1 = reach(a) - 3, c = .28;
    return `<path d="M${(hc[0] + r0 * Math.cos(a)).toFixed(1)} ${(hc[1] + r0 * Math.sin(a)).toFixed(1)}Q${(hc[0] + (r1 - 5) * Math.cos(a + c * .4)).toFixed(1)} ${(hc[1] + (r1 - 5) * Math.sin(a + c * .4)).toFixed(1)} ${(hc[0] + r1 * Math.cos(a + c)).toFixed(1)} ${(hc[1] + r1 * Math.sin(a + c)).toFixed(1)}" stroke="#FFF0B8" stroke-width=".9" fill="none" opacity=".55" stroke-linecap="round"/>`; }).join("");
  const mtf = `translate(${hc[0]} ${hc[1] + 8}) scale(${E.mane}) translate(${-hc[0]} ${-hc[1] - 8})`;
  const headTf = `translate(0 ${E.dy}) rotate(${E.tilt} 100 96)`;
  // the long back mane flows down behind the shoulders; the front mane frames the face only
  const maneBack = `<g class="mane-back" transform="${headTf}"><g transform="${mtf}">${ring(12, .25, 8, 0, .44, true)}</g></g>`;
  const mane = `<g class="mane" transform="${mtf}">${ring(16, 0, 2, 0, .32)}${ring(16, .5, -3, 1, .28)}${strands}</g>`;
  const forelock = "";
  // ---- tail: long, lifted in a confident curve, dark tuft
  const tailD = ART3.tube([[[120, 158], [150, 168], [160, 196], [174, 190]], [[174, 190], [184, 184], [184, 168], [176, 160]]], [6.6, 6, 5.4, 5, 4.6]);
  const tail = `<g class="tail">${ink(C, tailD, C.lin([[0, lit(fur, .1)], [1, shd(fur, .3)]], [0, 0, 1, 1]), line, { heavy: W.minor })}
    ${ink(C, "M176 163C167 160 164 150 170 143C172 149 178 149 180 143C186 151 184 161 176 163Z", C.vol(maneMd), shd(maneDk, .4), { heavy: W.minor })}</g>`;
  // ---- body: broad shoulders, defined pecs, narrow waist, subtle abs
  const torso = "M74 100C63 104 59 116 61 128C63 140 73 150 82 160L118 160C127 150 137 140 139 128C141 116 137 104 126 100C116 96 84 96 74 100Z";
  const legFill = o.bare ? C.lin([[0, fur], [1, shd(fur, .3)]], [0, 0, 1, 0]) : C.lin([[0, "#5A3426"], [.6, "#3A1E16"], [1, "#22100A"]], [0, 0, 1, 0]);
  const legL = ART3.tube([[[90, 158], [87, 176], [86, 190], [87, 204]]], [20, 15.4, 12.6]), legR = ART3.tube([[[110, 158], [114, 176], [116, 190], [116, 204]]], [20, 15.4, 12.6]);
  const boot = (x, s) => o.bare ? ink(C, `M${x - 8} 209C${x - 8} 202 ${x + 8} 202 ${x + 8} 209C${x + 8} 213 ${x - 8} 213 ${x - 8} 209Z`, C.vol(fur), line, { heavy: W.minor }) + `<path d="M${x - 3} 208v3M${x + 1} 208v3" stroke="${line}" stroke-width=".7" opacity=".6"/>`
    : ink(C, `M${x - 8} 186C${x - 9} 182 ${x + 8} 182 ${x + 8} 186L${x + 8 + s * 4} 207C${x + 9 + s * 4} 212 ${x - 10} 212 ${x - 10} 209Z`, C.lin([[0, "#4A2E22"], [.6, "#1E0E08"], [1, "#0E0604"]], [0, 0, 1, 1]), "#0E0604", { heavy: W.minor })
      + `<path d="M${x - 9} 187.6h17" stroke="#D8A040" stroke-width="1.6"/><path d="M${x - 5} 192C${x - 5} 198 ${x - 4} 202 ${x - 4} 206" stroke="#7A5A48" stroke-width="1" fill="none" opacity=".7"/>`;
  const abs = `<path d="M78 120C86 127 95 127 100 122C105 127 114 127 122 120" stroke="${shd(fur, .45)}" stroke-width="1.1" fill="none" opacity=".75"/>
    <path d="M100 126V156" stroke="${shd(fur, .4)}" stroke-width=".9" opacity=".5"/>
    ${[136, 145, 153].map(y => `<path d="M${93} ${y}Q${96.6} ${y + 1.6} ${99.4} ${y}M${100.6} ${y}Q${103.4} ${y + 1.6} ${107} ${y}" stroke="${shd(fur, .35)}" stroke-width=".8" fill="none" opacity=".5"/>`).join("")}
    <path d="M84 112C88 118 94 120 98 118" stroke="#FFF2D0" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"/>`;
  const body = `<g class="body">${ink(C, legL, legFill, line, { heavy: W.minor })}${ink(C, legR, legFill, line, { heavy: W.minor })}${boot(87, -1)}${boot(116, 1)}
    ${ink(C, torso, C.vol(fur, { hi: .32, lo: .38, cy: .2 }), line, { heavy: W.major })}
    <path d="M90 102C92 112 96 120 100 124C104 120 108 112 110 102C104 100 96 100 90 102Z" fill="${C.vol(furLt, { hi: .2 })}"/>
    ${abs}
    ${tufts([[96, 106, -1, 4], [104, 106, 1, 4], [100, 110, 0, 4]], "#FFF2D8", .8, .7)}
    ${shade(C, torso, "M120 104C140 120 134 152 118 164L142 164L142 100Z", "#3A1A08", .4, 3)}</g>`;
  // ---- default outfit: a romantically open white shirt with lace and flared collar, a knotted red sash, boots
  const half = s => { const m = x => 100 + s * (x - 100);
    return `M${m(72)} 99C${m(61)} 104 ${m(57)} 118 ${m(60)} 130C${m(63)} 142 ${m(73)} 152 ${m(83)} 160L${m(96)} 160C${m(91)} 146 ${m(85)} 128 ${m(85)} 112C${m(85)} 106 ${m(87)} 101 ${m(90)} 98C${m(84)} 97 ${m(77)} 97 ${m(72)} 99Z`; };
  const linen = C.lin([[0, "#FFFFFF"], [.55, "#F4EEE2"], [1, "#C8BAA2"]], [0, 0, 1, 1]);
  const lace = s => { const m = x => 100 + s * (x - 100); return Array.from({ length: 5 }, (_, i) => { const t = i / 4, x = m(85.4 + (t < .3 ? t * 0 : (t - .3) * 14)), y = 104 + t * 52; return `<path d="M${x} ${y}q${s * 3.4} 1.6 ${s * .6} 5.6" stroke="#C8B89E" stroke-width=".9" fill="#FFFFFF"/>`; }).join(""); };
  const shirt = o.bare ? "" : `<g class="outfit shirt">
    ${ink(C, half(1), linen, "#5A4A3A", { heavy: W.minor })}${ink(C, half(-1), linen, "#5A4A3A", { heavy: W.minor })}
    ${lace(1)}${lace(-1)}
    ${ink(C, "M90 98L74 90L80 112Z", C.lin([[0, "#FFFFFF"], [1, "#E2D8C6"]], [0, 0, 1, 1]), "#5A4A3A", { heavy: 1 })}${ink(C, "M110 98L126 90L120 112Z", C.lin([[0, "#F6F0E4"], [1, "#D4C8B2"]], [0, 0, 1, 1]), "#5A4A3A", { heavy: 1 })}
    <path d="M66 120C70 136 76 148 84 156M134 120C130 136 124 148 116 156" stroke="#B8A88E" stroke-width=".9" fill="none" opacity=".7"/>
    <path d="M64 112C66 120 68 126 70 130" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".8" stroke-linecap="round"/>
    ${ink(C, "M80 152Q100 159 120 152L121 166Q100 173 79 166Z", C.lin([[0, "#E8303E"], [.5, "#B0101E"], [1, "#5A0610"]], [0, 0, 0, 1]), "#3A0408", { heavy: W.minor })}
    <path d="M82 157Q100 163 118 157" stroke="#FF7A86" stroke-width="1" fill="none" opacity=".6"/>
    ${ink(C, "M80 158C74 156 70 160 72 165C76 166 80 164 82 162Z", C.lin([[0, "#D8283A"], [1, "#7A0814"]], [0, 0, 1, 1]), "#3A0408", { heavy: 1 })}
    ${ink(C, "M80 164C76 174 72 186 66 196C70 197 74 195 76 192C78 184 82 174 84 166Z", C.lin([[0, "#D21E32"], [1, "#6A0614"]], [0, 0, 1, 1]), "#3A0408", { heavy: W.fine + .4 })}
    ${ink(C, "M83 164C84 176 84 188 82 200C86 199 89 196 90 192C90 182 88 172 86 164Z", C.lin([[0, "#C01A2E"], [1, "#5A0610"]], [0, 0, 1, 1]), "#3A0408", { heavy: W.fine + .4 })}</g>`;
  // ---- arms: a fist on the hip (left), the rose hand (right) changes with mood
  const sleeve = o.bare ? C.lin([[0, lit(fur, .1)], [1, shd(fur, .25)]], [0, 0, 1, 1]) : linen;
  const rig = ART3.armRig(o, C);
  const armL = rig.tube("L", [[[74, 106], [60, 114], [55, 130], [63, 142]], [[63, 142], [68, 148], [76, 150], [82, 150]]], [17, 16, 14, 12, 11]);
  const R = { chest: [[[126, 106], [140, 114], [142, 128], [133, 134]], [[133, 134], [126, 138], [118, 132], [116, 122]]],
    out: [[[126, 106], [142, 106], [154, 112], [162, 102]]],
    down: [[[126, 106], [138, 116], [140, 132], [136, 148]]],
    lips: [[[126, 106], [140, 112], [140, 124], [130, 124]], [[130, 124], [122, 124], [114, 108], [112, 96]]] }[E.rose];
  const armR = rig.tube("R", R, [17, 16, 14, 12, 11]);
  const hand = R[R.length - 1][3];
  const PAW = (x, y, r) => ink(C, `M${x - r} ${y}C${x - r} ${y - r} ${x + r} ${y - r} ${x + r} ${y}C${x + r} ${y + r * .9} ${x - r} ${y + r * .9} ${x - r} ${y}Z`, C.vol(fur), line, { heavy: W.minor }) + `<path d="M${x - r * .35} ${y + 1}v${r * .6}M${x + r * .35} ${y + 1}v${r * .6}" stroke="${line}" stroke-width=".7" opacity=".6"/>`;
  const cuff = (x, y) => o.bare ? "" : `<path d="M${x - 7} ${y - 3}q2 3 4 0q2 3 4 0q2 3 4 0q2 3 3 0" stroke="#C8B89E" stroke-width="1" fill="#FFFFFF"/>`;
  const roseAng = { chest: 24, out: -24, down: 150, lips: -70 }[E.rose];
  const rose = o.bare ? "" : `<g class="outfit rose" transform="translate(${hand[0]} ${hand[1]}) rotate(${roseAng})">
    <path d="M0 6L0 -22" stroke="#2E6A2A" stroke-width="1.6"/><path d="M0 -9q-7 -2 -8 -8q7 0 8 6Z" fill="#3E8A36" stroke="#1E4A1A" stroke-width=".5"/>
    ${ink(C, "M0 -22C-7 -22 -9 -28 -7 -34C-3 -37 3 -37 7 -34C9 -28 7 -22 0 -22Z", C.rad([[0, "#FF6A7E"], [.6, "#C8102A"], [1, "#6A0614"]], { cx: .4, cy: .35 }), "#3A0408", { heavy: 1 })}
    <path d="M-3 -31C-1 -34 2.4 -33 2.4 -30C2.4 -27.6 -1 -26.6 -2 -29M-5.6 -26.6C-3 -24.4 2.6 -24.4 4.6 -27.6" stroke="#7A0618" stroke-width=".7" fill="none"/><path d="M-4.6 -32q1 -2.2 3.4 -2.6" stroke="#fff" stroke-width=".8" fill="none" opacity=".65"/></g>`;
  const armLG = `<g class="arm armL">${ink(C, armL, sleeve, o.bare ? line : "#5A4A3A", { heavy: W.minor })}${PAW(82, 150, 6)}${rig.wear("L")}</g>`;
  const armRG = `<g class="arm armR">${ink(C, armR, sleeve, o.bare ? line : "#5A4A3A", { heavy: W.minor })}${E.rose === "out" || E.rose === "lips" ? "" : cuff(hand[0], hand[1] - 3)}${rose}${PAW(hand[0], hand[1], 6.2)}${rig.wear("R")}</g>`;
  // ---- head: handsome, with defined cheekbones and a strong jaw
  const faceD = "M100 40C85 40 77 50 76 63C75 74 80 84 88 90C92 94 96 96 100 96C104 96 108 94 112 90C120 84 125 74 124 63C123 50 115 40 100 40Z";
  const ear = (x, s) => `<g transform="rotate(${s * E.ear} ${x} 46)">${ink(C, `M${x - 8} 47C${x - 9} 37 ${x + 9} 35 ${x + 8} 47Z`, C.vol(fur), line, { heavy: W.minor })}<path d="M${x - 5} 45C${x - 5} 40 ${x + 5} 39 ${x + 5} 45Z" fill="#C46A4A"/></g>`;
  const eyeO = { skin: shd(fur, .12), line: "#2A1206", shape: "almond", iris: ["#6A3006", "#E0901A", "#FFDC80"], pupil: "round", dil: E.dil, look: E.look, up: E.up, low: E.low, w2: 2.3, wet: E.wet, lash: 1 };
  const brows = `<path d="M81 ${55 + E.brow[0]}Q88 ${50.6 + E.brow[0] * .5} 96 ${53.6 + E.brow[0] * .1}" stroke="${maneDk}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M104 ${53.6 + E.brow[1] * .1}Q112 ${50.6 + E.brow[1] * .5} 119 ${55 + E.brow[1]}" stroke="${maneDk}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const mouths = {
    smoulder: `<path d="M100 79v3M100 82C97.6 84.6 94.4 84.4 93 82.6M100 82C103 85.4 107.6 84.6 109.6 81" stroke="${line}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M109.6 81l1.4 -1" stroke="${line}" stroke-width="1" stroke-linecap="round"/>`,
    grin: `<path d="M100 79v2.4" stroke="${line}" stroke-width="1.3"/><path d="M90 81.6C92 90 108 90 110 81.6Q100 84.6 90 81.6Z" fill="#6A1A1A" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/><path d="M92 82.6Q100 85.2 108 82.6L107.4 84.6Q100 86.8 92.6 84.6Z" fill="#fff"/><path d="M95 87.6Q100 89 105 87.6" stroke="#E07A7A" stroke-width="1.4" fill="none"/>`,
    sad: `<path d="M100 79v3.4M93.4 87C96 83.8 104 83.8 106.6 87" stroke="${line}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    o: `<path d="M100 79v2" stroke="${line}" stroke-width="1.3"/><ellipse cx="100" cy="85.6" rx="3" ry="3.8" fill="#6A1A1A" stroke="${line}" stroke-width="1.2"/>`,
    kiss: `<path d="M100 79v2.6" stroke="${line}" stroke-width="1.3"/><path d="M97.4 84.6C97.4 82.2 102.6 82.2 102.6 84.6C102.6 87 97.4 87 97.4 84.6Z" fill="#C0303E" stroke="${line}" stroke-width="1"/><path d="M98 84.6h4" stroke="${line}" stroke-width=".6"/>`,
  };
  const head = `<g class="head" transform="${headTf}">${mane}${ear(80, -1)}${ear(120, 1)}
    ${ink(C, faceD, C.vol(fur, { hi: .34, lo: .28, cy: .25 }), line, { heavy: W.major })}
    ${shade(C, faceD, "M114 50C130 62 128 86 110 96L130 98L130 46Z", "#5A2A08", .32, 3)}
    <path d="M80 68C82 74 86 78 90 80M120 68C118 74 114 78 110 80" stroke="${shd(fur, .3)}" stroke-width="1" fill="none" opacity=".55"/>
    ${sheen(86, 52, 7, 3.4)}
    <path d="M88 71C88 65 112 65 112 71C113 81 107 92 100 92C93 92 87 81 88 71Z" fill="${C.vol(furLt, { hi: .3, lo: .15, cy: .3 })}"/>
    ${ART3.eye(C, { ...eyeO, cx: 88.6, cy: 61.4, w: 15, h: 6.8, side: "L", tilt: 2 })}
    ${ART3.eye(C, { ...eyeO, cx: 111.4, cy: 61.4, w: 15, h: 6.8, side: "R", tilt: 2 })}
    ${brows}${forelock}
    <ellipse cx="85" cy="74" rx="${5 + 3 * E.blush}" ry="2.6" fill="#E86A5A" opacity="${.12 + .45 * E.blush}" filter="${C.blur(1.4)}"/><ellipse cx="115" cy="74" rx="${5 + 3 * E.blush}" ry="2.6" fill="#E86A5A" opacity="${.12 + .45 * E.blush}" filter="${C.blur(1.4)}"/>
    ${ink(C, "M94.4 72.4C94.4 69.6 105.6 69.6 105.6 72.4C105.6 75.6 101.6 78.6 100 78.6C98.4 78.6 94.4 75.6 94.4 72.4Z", C.lin([[0, "#B8644C"], [1, "#5A2418"]], [0, 0, 0, 1]), line, { heavy: 1 })}
    <ellipse cx="98" cy="71.6" rx="1.6" ry=".7" fill="#fff" opacity=".6"/>
    ${[[92, 78], [90, 81], [108, 78], [110, 81]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".6" fill="${line}" opacity=".6"/>`).join("")}
    ${mouths[E.mouth]}</g>`;
  const ground = `<ellipse cx="102" cy="211" rx="44" ry="4.4" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 antonio" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}${tail}${maneBack}${ART3.mount("back")}${body}${shirt}${ART3.mount("body")}${armLG}${E.rose === "lips" ? "" : armRG}${head}${E.rose === "lips" ? armRG : ""}</svg>`);
};

// ===== Professor Hoot — a distinguished old owl =====
// anatomy (medium): one plump egg of a body with a broad head sitting low on it, a heart-shaped facial disc,
// ear tufts, huge forward-facing eyes, a small hooked beak, folded wings and feathered feet with talons
ART3.hoot = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const brown = "#8A6646", brownDk = "#5A3E26", disc = "#EAD6B0", chest = "#EEDFC4", line = "#3A2414", tweed = "#4E6A3C", gold = "#D8AA4A";
  const E = {
    neutral:   { up: .22, low: .1, look: [0, .3], dil: .55, brow: 0, tuft: 0, beak: "shut", tilt: 0, dy: 0, glasses: 0, puff: 1, blush: 0 },
    happy:     { up: .04, low: .55, look: [0, 0], dil: .6, brow: -2.6, tuft: -12, beak: "smile", tilt: -12, dy: -2, glasses: 0, puff: 1.02, blush: .3 },
    sad:       { up: .42, low: 0, look: [-.1, .55], dil: .7, brow: 3.4, tuft: 34, beak: "shut", tilt: 8, dy: 3, glasses: 5, puff: .97, wet: 1, blush: 0 },
    surprised: { up: 0, low: 0, look: [0, 0], dil: .2, brow: -4.4, tuft: -26, beak: "o", tilt: 0, dy: -3, glasses: -1.4, puff: 1.06, blush: 0 },
    love:      { up: 1, low: .25, look: [0, 0], dil: .55, brow: -1.2, tuft: 12, beak: "smile", tilt: -16, dy: 0, glasses: 1, puff: 1.01, blush: 1, bash: 1 },
  }[expr] || {};
  // ---- body: a plump egg with a pale, chevron-marked breast
  const bodyD = "M100 92C74 92 60 116 60 146C60 176 78 198 100 199C122 198 140 176 140 146C140 116 126 92 100 92Z";
  const breastD = "M100 104C84 104 76 124 76 148C76 172 86 192 100 194C114 192 124 172 124 148C124 124 116 104 100 104Z";
  const chevrons = Array.from({ length: 5 }, (_, r) => [-1, 0, 1].map(i => { const x = 100 + i * 10 + (r % 2) * 5 - 2.5, y = 124 + r * 13; return `<path d="M${x - 3.6} ${y}l3.6 3.4l3.6 -3.4" stroke="${brownDk}" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round" stroke-linejoin="round"/>`; }).join("")).join("");
  const feet = [-1, 1].map(s => { const x = 100 + s * 11; return `${ink(C, `M${x - 7} 199C${x - 7} 193 ${x + 7} 193 ${x + 7} 199Z`, C.vol(chest), line, { heavy: W.fine + .4 })}${[-4, 0, 4].map(t => `<path d="M${x + t} 198.6q${t * .3} 3 ${t * .5 + .6} 6" stroke="#E0A030" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M${x + t * 1.5 + .6} 204.4l.4 1.8" stroke="#2A1A0A" stroke-width="1.2" stroke-linecap="round"/>`).join("")}`; }).join("");
  const body = `<g class="body">${ink(C, bodyD, C.vol(brown, { hi: .28, lo: .4 }), line, { heavy: W.major })}
    <path d="${breastD}" fill="${C.vol(chest, { hi: .3, lo: .18, cy: .25 })}"/>${chevrons}
    ${shade(C, bodyD, "M120 100C146 120 146 176 114 204L146 204L146 96Z", "#2A1408", .45, 3)}
    ${tufts([[64, 150, -3, 3], [66, 170, -3, 4], [136, 150, 3, 3], [134, 170, 3, 4]], brownDk, .9, .6)}${feet}</g>`;
  // ---- wings: folded at the sides, wing-tips curling forward to hold the book
  const wing = s => { const m = x => 100 + s * (x - 100);
    const d = `M${m(64)} 112C${m(52)} 126 ${m(52)} 156 ${m(60)} 174C${m(64)} 182 ${m(72)} 186 ${m(80)} 182C${m(76)} 172 ${m(74)} 158 ${m(76)} 144C${m(78)} 130 ${m(74)} 118 ${m(64)} 112Z`;
    return `<g class="wing">${ink(C, d, C.lin([[0, lit(brown, .15)], [.6, brown], [1, brownDk]], [s < 0 ? 0 : 1, 0, s < 0 ? 1 : 0, 1]), line, { heavy: W.minor })}
      ${[0, 1, 2].map(i => `<path d="M${m(58 + i * 5)} ${150 + i * 4}C${m(60 + i * 5)} ${162 + i * 3} ${m(64 + i * 4)} ${172 + i * 2} ${m(70 + i * 3)} ${180 - i}" stroke="${brownDk}" stroke-width=".9" fill="none" opacity=".7"/>`).join("")}
      ${[0, 1, 2].map(i => `<path d="M${m(58 + i * 4)} ${124 + i * 8}q${s * 4} 3 ${s * 8} 0" stroke="${disc}" stroke-width=".9" fill="none" opacity=".55"/>`).join("")}</g>`; };
  // ---- the open book he is always reading
  const book = `<g class="book">${ink(C, "M100 166L70 158L68 184L100 192L132 184L130 158Z", C.lin([[0, "#9A2A2E"], [1, "#4A0A10"]], [0, 0, 0, 1]), "#2A0408", { heavy: W.minor })}
    <path d="M100 163C92 158 82 156 72 157L71 180C82 179 92 182 100 188Z" fill="${C.lin([[0, "#FFFBF0"], [1, "#E8DCC4"]], [0, 0, 1, 1])}" stroke="#6A5A44" stroke-width=".7"/>
    <path d="M100 163C108 158 118 156 128 157L129 180C118 179 108 182 100 188Z" fill="${C.lin([[0, "#F6F0E2"], [1, "#D8CCB2"]], [0, 0, 1, 1])}" stroke="#6A5A44" stroke-width=".7"/>
    ${[0, 1, 2, 3].map(i => `<path d="M76 ${163 + i * 4.4}Q86 ${161 + i * 4.4} 96 ${165 + i * 4.4}M104 ${165 + i * 4.4}Q114 ${161 + i * 4.4} 124 ${163 + i * 4.4}" stroke="#9A8A72" stroke-width=".7" fill="none"/>`).join("")}
    <path d="M100 163V188" stroke="#8A7A62" stroke-width=".8"/>
    <path d="M71 180C82 179 92 182 100 188C108 182 118 179 129 180L130 182.6C118 181.6 108 184.6 100 190.6C92 184.6 82 181.6 70 182.6Z" fill="${C.lin([[0, "#FFE6A0"], [1, "#B8862A"]], [0, 0, 0, 1])}" stroke="#6A4A10" stroke-width=".4"/>
    <path d="M101 188L102 202L104.4 198.6L106.6 201.4L105 188Z" fill="#C0283A" stroke="#5A0610" stroke-width=".5"/>
    <path d="M78 168Q84 167 90 169" stroke="#C8B89A" stroke-width=".6" fill="none"/></g>`;
  const wingTips = [-1, 1].map(s => { const m = x => 100 + s * (x - 100); return ink(C, `M${m(70)} 168C${m(64)} 170 ${m(62)} 178 ${m(68)} 182C${m(72)} 184 ${m(76)} 180 ${m(75)} 174Z`, C.vol(brown), line, { heavy: W.minor }); }).join("");
  // ---- default outfit: tweed waistcoat with brass buttons, a claret bow tie
  const vest = o.bare ? "" : `<g class="outfit waistcoat">${[-1, 1].map(s => { const m = x => 100 + s * (x - 100);
      const d = `M${m(99)} 108L${m(86)} 106C${m(76)} 118 ${m(72)} 136 ${m(73)} 156L${m(99)} 160L${m(99)} 148C${m(93)} 136 ${m(91)} 122 ${m(99)} 108Z`;
      return ink(C, d, C.lin([[0, lit(tweed, .2)], [.6, tweed], [1, shd(tweed, .4)]], [0, 0, 1, 1]), "#1E2A14", { heavy: W.minor }) + `<g clip-path="${C.clip(d)}">${Array.from({ length: 9 }, (_, i) => `<path d="M${m(70)} ${104 + i * 7}l${s * 32} -8" stroke="#2E4220" stroke-width=".5" opacity=".6"/><path d="M${m(70)} ${107 + i * 7}l${s * 32} 8" stroke="#7A9A5E" stroke-width=".4" opacity=".4"/>`).join("")}</g>`; }).join("")}
    <path d="M73 156L100 162L127 156L126 164L100 168L74 164Z" fill="${shd(tweed, .3)}" stroke="#1E2A14" stroke-width=".8"/>
    ${[130, 142].map(y => `<circle cx="${y === 130 ? 96 : 96.6}" cy="${y}" r="1.7" fill="${C.vol(gold)}" stroke="#6A4A10" stroke-width=".5"/>`).join("")}
    <path d="M96 136q-6 6 -14 6" stroke="${gold}" stroke-width=".8" fill="none"/><path d="M82 130L76 112" stroke="#1E1E2A" stroke-width="1.4" stroke-linecap="round"/><path d="M76 112C70 106 70 98 74 92C76 98 80 104 78 112Z" fill="#F4ECE0" stroke="#6A5A44" stroke-width=".6"/><path d="M78 128h8" stroke="#2A3A1E" stroke-width="1.2"/><circle cx="82" cy="142.4" r="1.3" fill="${gold}"/></g>`;
  const bowtie = o.bare ? "" : `<g class="outfit bowtie">${ink(C, "M100 106L88 99C86 101 86 111 88 113Z", C.lin([[0, "#C83040"], [1, "#6A0A18"]], [0, 0, 1, 1]), "#3A0408", { heavy: 1.2 })}
    ${ink(C, "M100 106L112 99C114 101 114 111 112 113Z", C.lin([[0, "#B82838"], [1, "#5A0814"]], [0, 0, 1, 1]), "#3A0408", { heavy: 1.2 })}
    <rect x="97.4" y="102.6" width="5.2" height="7" rx="1.6" fill="#A01E2E" stroke="#3A0408" stroke-width=".7"/><path d="M89.4 101.6l4 3" stroke="#FF8A96" stroke-width=".7" opacity=".7"/></g>`;
  // ---- head: broad, low on the body; heart-shaped facial disc; ear tufts; feather brows
  const headD = "M100 42C78 42 62 54 62 74C62 92 78 104 100 104C122 104 138 92 138 74C138 54 122 42 100 42Z";
  const discD = "M100 58C94 52 72 50 70 72C68 90 86 98 100 96C114 98 132 90 130 72C128 50 106 52 100 58Z";
  const tuft = s => { const m = x => 100 + s * (x - 100); return `<g transform="rotate(${s * E.tuft} ${m(78)} 50)">${ink(C, `M${m(70)} 56C${m(64)} 48 ${m(60)} 38 ${m(58)} 26C${m(64)} 31 ${m(67)} 34 ${m(69)} 38C${m(69)} 32 ${m(71)} 27 ${m(75)} 22C${m(75)} 32 ${m(80)} 42 ${m(86)} 50Z`, C.lin([[0, brownDk], [1, brown]], [0, 0, 0, 1]), line, { heavy: W.minor })}<path d="M${m(68)} 34L${m(74)} 44M${m(71)} 30L${m(78)} 42" stroke="${disc}" stroke-width=".6" opacity=".5"/></g>`; };
  const eyeO = { skin: mix(disc, brown, .25), line: "#2A1408", shape: "round", iris: ["#8A3A06", "#F09A1A", "#FFE08A"], pupil: "round", dil: E.dil, look: E.look, up: E.up, low: E.low, w2: 2, wet: E.wet, irisR: .86 };
  const brows = [-1, 1].map(s => `<path d="M${100 + s * 4} ${60 + E.brow * .2}C${100 + s * 10} ${55 - E.brow * .8} ${100 + s * 20} ${55 + E.brow * .2} ${100 + s * 28} ${60 + E.brow}" stroke="${brownDk}" stroke-width="3" fill="none" stroke-linecap="round"/>`).join("");
  const beaks = {
    shut: ink(C, "M95.4 82C95.4 78.6 104.6 78.6 104.6 82L101 93C100.6 94 99.4 94 99 93Z", C.lin([[0, "#F2D490"], [1, "#9A7A3A"]], [0, 0, 0, 1]), "#4A3010", { heavy: 1 }),
    smile: ink(C, "M95.4 82C95.4 78.6 104.6 78.6 104.6 82L101 91C100.6 92 99.4 92 99 91Z", C.lin([[0, "#F2D490"], [1, "#9A7A3A"]], [0, 0, 0, 1]), "#4A3010", { heavy: 1 }) + `<path d="M94 89Q100 95 106 89" stroke="#4A3010" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
    o: `<ellipse cx="100" cy="92" rx="3.2" ry="3.6" fill="#5A1E1E" stroke="#4A3010" stroke-width=".8"/>` + ink(C, "M95.4 81C95.4 77.6 104.6 77.6 104.6 81L101 88C100.6 89 99.4 89 99 88Z", C.lin([[0, "#F2D490"], [1, "#9A7A3A"]], [0, 0, 0, 1]), "#4A3010", { heavy: 1 }),
  };
  // half-moon-ish round spectacles: dark outer rim + gold inner rim, a keyhole bridge, and a beaded chain looping to his shoulder
  const glasses = o.bare ? "" : `<g class="outfit spectacles" transform="translate(0 ${E.glasses})">
    <path d="M64.6 70C58 84 60 100 70 106" stroke="${gold}" stroke-width="1.1" fill="none" stroke-dasharray="1.4 1.2"/>
    ${[-1, 1].map(s => `<circle cx="${100 + s * 14.6}" cy="74" r="12.4" fill="#DDEEFF" fill-opacity=".12" stroke="#3A2A10" stroke-width="2.8"/><circle cx="${100 + s * 14.6}" cy="74" r="12.4" fill="none" stroke="${C.lin([[0, "#FFEDB0"], [.5, "#D8AA4A"], [1, "#8A6420"]], [0, 0, 1, 1])}" stroke-width="1.7"/><path d="M${100 + s * 14.6 - 8.6} 68.6q3 -4.6 7.6 -5.2" stroke="#fff" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/><path d="M${100 + s * 14.6 + 4} 83q3 -1.6 4.6 -4.4" stroke="#fff" stroke-width=".7" fill="none" opacity=".35"/>`).join("")}
    <path d="M97 72.4C97 68.6 103 68.6 103 72.4" stroke="#3A2A10" stroke-width="2.6" fill="none"/><path d="M97 72.4C97 68.6 103 68.6 103 72.4" stroke="${gold}" stroke-width="1.4" fill="none"/>
    <path d="M73 71L63 67.6M127 71L137 67.6" stroke="#3A2A10" stroke-width="2.4"/><path d="M73 71L63 67.6M127 71L137 67.6" stroke="${gold}" stroke-width="1.2"/>
    <circle cx="64.4" cy="69.6" r="1.4" fill="${gold}"/></g>`;
  const head = `<g class="head" transform="translate(0 ${E.dy}) rotate(${E.tilt} 100 100)">${tuft(-1)}${tuft(1)}
    ${ink(C, headD, C.vol(brown, { hi: .3, lo: .35, cy: .25 }), line, { heavy: W.major })}
    ${shade(C, headD, "M120 48C142 58 142 92 116 106L142 106L142 44Z", "#2A1408", .4, 3)}
    ${sheen(80, 50, 9, 4)}
    ${[[50, 5], [56, 6]].map(([y, n], r) => Array.from({ length: n }, (_, i) => { const x = 80 + i * (40 / (n - 1)) + (r ? 0 : 0); return `<path d="M${x - 3.6} ${y}Q${x} ${y + 4} ${x + 3.6} ${y}" stroke="${brownDk}" stroke-width=".8" fill="none" opacity=".45"/>`; }).join("")).join("")}
    <path d="${discD}" fill="${C.rad([[0, lit(disc, .3)], [.7, disc], [1, mix(disc, brown, .35)]], { cx: .5, cy: .45, r: .6 })}" stroke="${brownDk}" stroke-width="1.2" opacity=".98"/>
    ${tufts([[72, 84, -3, 3], [76, 90, -2, 3], [128, 84, 3, 3], [124, 90, 2, 3]], mix(disc, brown, .5), .8, .7)}
    ${ART3.eye(C, { ...eyeO, cx: 85.4, cy: 74, w: 21, h: 11, side: "L" })}
    ${ART3.eye(C, { ...eyeO, cx: 114.6, cy: 74, w: 21, h: 11, side: "R" })}
    ${brows}
    ${E.bash ? ART3.bashful(C, 76, 89, 6, "#E07A7A", .8) + ART3.bashful(C, 124, 89, 6, "#E07A7A", .8) : ""}
    ${beaks[E.beak]}${glasses}</g>`;
  const ground = `<ellipse cx="100" cy="206" rx="36" ry="4" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 hoot" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}<g class="rig" style="transform-origin:100px 199px;transform:scale(${E.puff})">${ART3.mount("back")}${body}${vest}${ART3.mount("body")}${wing(-1)}${wing(1)}${o.armWear ? o.armWear(C, null, null, "wing") : ""}${book}${wingTips}${bowtie}</g>${head}</svg>`);
};

// ===== Ember — a red fox spy =====
// anatomy (medium): slender and light-footed, a wedge-shaped face with white cheek ruffs and a fine pointed muzzle,
// tall black-tipped ears, black "socks", and an enormous brush of a tail with a white tip
ART3.ember = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const fox = "#E2702A", foxLt = "#F6A050", white = "#FFF6EC", sock = "#2A1814", line = "#3A1606", amber = "#F2A832", cloak = "#1E2C32";
  const E = {
    neutral:   { up: .36, low: .22, look: [.45, 0], dil: .2, brow: [1.4, -1.6], mouth: "smirk", ear: 0, tail: "n", puff: 1, tilt: -4, dy: 0, blush: 0 },
    happy:     { up: .18, low: .52, look: [.3, 0], dil: .3, brow: [-1, -2.6], mouth: "grin", ear: -6, tail: "u", puff: 1, tilt: -7, dy: -1, blush: .2 },
    sad:       { up: .5, low: 0, look: [-.3, .6], dil: .5, brow: [3.2, -3.2], mouth: "sad", ear: 28, tail: "l", puff: .95, tilt: 7, dy: 2, wet: 1, blush: 0 },
    surprised: { up: 0, low: 0, look: [0, -.1], dil: .95, brow: [-4, -4], mouth: "o", ear: -14, tail: "u", puff: 1.32, tilt: 0, dy: -2, blush: 0 },
    love:      { up: .34, low: .3, look: [-.65, .2], dil: .6, brow: [-1.6, 1], mouth: "soft", ear: 12, tail: "w", puff: 1, tilt: 8, dy: 0, blush: 1, bash: 1 },
  }[expr] || {};
  // ---- tail: a huge brush with a white tip
  const T = { n: [[[112, 180], [140, 190], [164, 176], [170, 150]], [[170, 150], [174, 134], [166, 122], [158, 120]]],
    u: [[[112, 180], [140, 180], [156, 156], [156, 128]], [[156, 128], [156, 112], [150, 100], [142, 98]]],
    l: [[[112, 184], [138, 200], [162, 208], [186, 200]]],
    w: [[[112, 180], [146, 186], [168, 168], [164, 140]], [[164, 140], [162, 126], [152, 118], [146, 122]]] }[E.tail];
  const tailD = ART3.tube(T, [8, 14, 19, 20, 17, 11, 4].map(w => w * E.puff));
  const tip = T[T.length - 1][3];
  const tail = `<g class="tail">${ink(C, tailD, C.lin([[0, foxLt], [.5, fox], [1, shd(fox, .35)]], [0, 0, 1, 1]), line, { heavy: W.minor })}
    <g clip-path="${C.clip(tailD)}"><circle cx="${tip[0]}" cy="${tip[1]}" r="${15 * E.puff}" fill="${C.vol(white, { hi: .2, lo: .15 })}"/>
    ${tufts([[tip[0] - 6, tip[1] + 6, -3, 2], [tip[0] + 2, tip[1] + 9, 1, 3]], "#E8D8C8", .8, .8)}</g>
    ${E.puff > 1.1 ? tufts([[150, 140, -4, -1], [162, 130, 4, -2], [146, 160, -4, 1], [166, 114, 4, -3]], fox, 1.2, .9) : ""}</g>`;
  // ---- body: slim, orange back, white chest, black socks
  const torso = "M91 104C85 108 83 118 84 130C85 142 87 150 87 160C87 172 89 182 93 186L109 186C113 182 115 172 115 160C115 150 117 142 118 130C119 118 115 108 109 104Z";
  const legL = ART3.tube([[[94, 180], [93, 192], [93, 200], [94, 207]]], [11, 8, 7]), legR = ART3.tube([[[108, 180], [109, 192], [109, 200], [108, 207]]], [11, 8, 7]);
  const PAW = (x, y, r) => ink(C, `M${x - r} ${y}C${x - r} ${y - r * .9} ${x + r} ${y - r * .9} ${x + r} ${y}C${x + r} ${y + r * .8} ${x - r} ${y + r * .8} ${x - r} ${y}Z`, C.vol(sock, { hi: .2 }), "#120806", { heavy: W.fine + .5 });
  const body = `<g class="body">${ink(C, legL, C.lin([[0, fox], [.45, sock], [1, sock]], [0, 0, 0, 1]), line, { heavy: W.minor })}${ink(C, legR, C.lin([[0, fox], [.45, sock], [1, sock]], [0, 0, 0, 1]), line, { heavy: W.minor })}
    ${PAW(94, 208.6, 5.8)}${PAW(108.4, 208.6, 5.6)}
    ${ink(C, torso, C.vol(fox, { hi: .3, lo: .35, cy: .2 }), line, { heavy: W.major })}
    <path d="M92 106C94 122 96 140 100 156C104 140 106 122 108 106C104 104 96 104 92 106Z" fill="${C.vol(white, { hi: .2 })}"/>
    ${tufts([[96, 112, -1, 4], [104, 112, 1, 4], [100, 120, 0, 5]], "#E8DAC8", .8, .8)}
    ${shade(C, torso, "M112 108C126 124 124 170 110 190L128 190L128 104Z", "#2A0A02", .4, 3)}</g>`;
  const rig = ART3.armRig(o, C);
  const armL = rig.tube("L", [[[88, 110], [80, 120], [79, 136], [82, 150]]], [9, 8, 6.4, 6]), armR = rig.tube("R", [[[112, 110], [120, 120], [121, 136], [118, 150]]], [9, 8, 6.4, 6]);
  const armFill = C.lin([[0, fox], [.7, fox], [1, sock]], [0, 0, 0, 1]);
  const bareArms = `<g class="arm">${ink(C, armL, armFill, line, { heavy: W.minor })}${PAW(82, 152, 4.6)}${rig.wear("L")}${ink(C, armR, armFill, line, { heavy: W.minor })}${PAW(118, 152, 4.6)}${rig.wear("R")}</g>`;
  // ---- default outfit: a dark hooded cloak (worn up), an amber clasp, a belt of bookmark daggers
  const cloakFill = C.lin([[0, lit(cloak, .18)], [.5, cloak], [1, shd(cloak, .5)]], [0, 0, 1, 1]);
  const halfD = s => { const m = x => 100 + s * (x - 100); return `M${m(100)} 106L${m(80)} 103C${m(67)} 120 ${m(59)} 160 ${m(55)} 204Q${m(74)} 210 ${m(91)} 208C${m(92)} 182 ${m(95)} 140 ${m(100)} 106Z`; };
  // asymmetric: her left side stays wrapped in the cloak; the right side is thrown back over the shoulder
  const cloakBack = o.bare ? "" : `<g class="outfit cloak-back">${ink(C, "M106 104L122 101C136 120 146 160 152 205Q141 210 128 205C130 172 126 140 114 110Z", cloakFill, "#0A1216", { heavy: W.minor })}
    <path d="M124 112C134 136 140 168 142 204" stroke="#0A1216" stroke-width="1" fill="none" opacity=".55"/><path d="M121 106C127 112 131 120 134 130" stroke="#3E5A62" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
  const cloakBody = o.bare ? "" : `<g class="outfit cloak">${ink(C, halfD(1), cloakFill, "#0A1216", { heavy: W.minor })}<path d="${halfD(1)}" fill="none" stroke="#3E5A62" stroke-width=".9" opacity=".5" transform="translate(-1.2 0)"/>
    <path d="M76 130C72 156 68 182 66 206M86 128C84 156 82 182 80 208" stroke="#0A1216" stroke-width="1" fill="none" opacity=".55"/>
    <path d="M62 150C60 170 58 186 57 202" stroke="#5A7A84" stroke-width="1.2" fill="none" opacity=".35"/></g>`;
  const vestD = "M91 106C85 112 85 124 87 136C88 148 89 158 89 168L113 168C113 158 115 148 116 136C118 124 116 112 110 106Q100 112 91 106Z";
  const vest = o.bare ? "" : `<g class="outfit vest">${ink(C, vestD, C.lin([[0, "#4A3A40"], [.5, "#2A2026"], [1, "#140E12"]], [0, 0, 1, 1]), "#0A0608", { heavy: W.minor })}
    <path d="M100 112V166" stroke="#0A0608" stroke-width=".8" opacity=".6"/>${[122, 134, 146, 158].map(y => `<path d="M97 ${y}h6" stroke="${amber}" stroke-width=".9"/>`).join("")}
    <path d="M90 116C89 128 90 142 91 156" stroke="#6A5A62" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
  const strapPt = t => [88 + t * 30, 110 + t * 52];
  const belt = o.bare ? "" : `<g class="outfit bandolier"><path d="M88 110L118 162" stroke="#2A140A" stroke-width="6.4" stroke-linecap="round"/><path d="M88 110L118 162" stroke="#7A4A2A" stroke-width="4.6" stroke-linecap="round"/><path d="M87 112L117 164" stroke="#A8724A" stroke-width=".9" opacity=".7"/>
    ${[.2, .38, .56, .74].map(t => { const [x, y] = strapPt(t); return `<g transform="translate(${x} ${y}) rotate(${-30 + t * 8}) scale(1.15)"><path d="M-1.6 0L-1.6 -14L0 -17L1.6 -14L1.6 0Z" fill="${C.lin([[0, "#FFFFFF"], [1, "#8A96A6"]], [0, 0, 1, 0])}" stroke="#2A3240" stroke-width=".5"/><rect x="-3.4" y="-.6" width="6.8" height="1.8" rx=".6" fill="${amber}"/><rect x="-1.2" y="1.2" width="2.4" height="4" fill="#6A1E1E"/><path d="M-1.2 5.2l1.2 3.4l1.2 -3.4" fill="#B0303A"/><circle cy="1.2" r=".8" fill="#FFE0A0"/></g>`; }).join("")}
    <g transform="translate(120 150) rotate(12)"><rect x="-2.6" y="0" width="5.2" height="18" rx="2" fill="#3A1E10" stroke="#140804" stroke-width=".7"/><path d="M-2.6 14h5.2" stroke="${amber}" stroke-width=".9"/>
      <rect x="-5" y="-1.8" width="10" height="2.4" rx=".8" fill="${amber}" stroke="#6A3A06" stroke-width=".5"/><rect x="-1.4" y="-8" width="2.8" height="6.4" rx="1" fill="#5A1A1A"/><circle cy="-9" r="1.8" fill="${C.rad([[0, "#FFE0A0"], [1, "#8A4A08"]], { cx: .35, cy: .3 })}"/></g></g>`;
  const armRC = o.bare ? "" : (() => { const d = rig.tube("R", [[[113, 110], [124, 116], [129, 130], [122, 144]]], [9, 8.2, 7, 6.4]); return `<g class="arm armR">${ink(C, d, C.lin([[0, fox], [.75, fox], [1, sock]], [0, 0, 0, 1]), line, { heavy: W.minor })}${PAW(120.6, 145.6, 4.8)}${rig.wear("R")}</g>`; })();
  const clutchPaw = o.bare ? "" : PAW(104, 128, 4.8);
  // hood: back drawn behind the head, rim drawn over the forehead; the ears come through slits
  const hoodBack = o.bare ? "" : `<g class="outfit hood">` + ink(C, "M100 30C74 30 56 50 56 78C56 94 62 106 72 112L128 112C138 106 144 94 144 78C144 50 126 30 100 30Z", C.lin([[0, lit(cloak, .15)], [1, shd(cloak, .4)]], [0, 0, 1, 1]), "#0A1216", { heavy: W.major }) + `</g>`;
  const hoodRim = o.bare ? "" : `<g class="outfit hood">${ink(C, "M64 86C60 60 78 40 100 40C122 40 140 60 136 86L130 86C131 66 118 50 100 50C82 50 69 66 70 86Z", cloakFill, "#0A1216", { heavy: W.minor })}
    <path d="M70 64C76 52 88 45 100 45" stroke="#5A7A84" stroke-width="1.2" fill="none" opacity=".5" stroke-linecap="round"/></g>`;
  const clasp = o.bare ? "" : `<g class="outfit clasp"><circle cx="100" cy="114" r="4.2" fill="${C.rad([[0, "#FFE0A0"], [.5, amber], [1, "#8A4A08"]], { cx: .35, cy: .3 })}" stroke="#4A2A06" stroke-width=".8"/><circle cx="98.8" cy="112.8" r="1.1" fill="#fff" opacity=".8"/></g>`;
  // ---- head
  const headD = "M100 46C82 46 70 58 68 72C66 82 72 88 80 92C88 97 94 102 100 104C106 102 112 97 120 92C128 88 134 82 132 72C130 58 118 46 100 46Z";
  const cheeksD = "M69 78C77 82 87 86 95 95L100 103L105 95C113 86 123 82 131 78C129 89 117 99 100 106C83 99 71 89 69 78Z";
  const ear = s => { const m = x => 100 + s * (x - 100); return `<g transform="rotate(${s * E.ear} ${m(80)} 54)">${ink(C, `M${m(74)} 58C${m(70)} 44 ${m(68)} 32 ${m(68)} 20C${m(78)} 26 ${m(86)} 36 ${m(90)} 50Z`, C.lin([[0, sock], [.32, sock], [.36, fox], [1, fox]], [0, 0, 0, 1]), line, { heavy: W.major })}
    <path d="M${m(76)} 54C${m(74)} 44 ${m(73)} 36 ${m(73)} 28C${m(79)} 34 ${m(84)} 42 ${m(86)} 50Z" fill="${white}" opacity=".85"/></g>`; };
  const eyeO = { skin: shd(fox, .05), line: "#1A0804", shape: "almond", iris: ["#0E5A3A", "#2EA86A", "#B0F4D0"], pupil: "slit", dil: E.dil, look: E.look, up: E.up, low: E.low, lash: 2, wing: 1, w2: 2.2, wet: E.wet };
  const brows = `<path d="M80 ${62 + E.brow[0]}Q87 ${58.6 + E.brow[0] * .5} 94 ${61 + E.brow[0] * .1}" stroke="${shd(fox, .5)}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M106 ${61 + E.brow[1] * .1}Q113 ${58.6 + E.brow[1] * .5} 120 ${62 + E.brow[1]}" stroke="${shd(fox, .5)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  const mouths = {
    smirk: `<path d="M100 98.6v1.6M100 100.2C98.4 101.8 96.6 101.6 95.6 100.4M100 100.2C102 102.4 105 102 106.6 99.4" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
    grin: `<path d="M100 98.6v1.4" stroke="${line}" stroke-width="1.1"/><path d="M94.6 99.8C96 104.6 104 104.6 106.4 99.2Q100 101.4 94.6 99.8Z" fill="#6A1A1A" stroke="${line}" stroke-width="1" stroke-linejoin="round"/><path d="M103.4 100.6l.6 2l.8 -1.8Z" fill="#fff"/>`,
    sad: `<path d="M100 98.6v2M96.6 103C98 101.4 102 101.4 103.4 103" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
    o: `<path d="M100 98.6v1.2" stroke="${line}" stroke-width="1.1"/><ellipse cx="100" cy="102.4" rx="2" ry="2.4" fill="#6A1A1A" stroke="${line}" stroke-width=".9"/>`,
    soft: `<path d="M100 98.6v1.6M97.4 100.6Q100 102.4 102.6 100.6" stroke="${line}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
  };
  const head = `<g class="head" transform="translate(0 ${E.dy}) rotate(${E.tilt} 100 104)">${hoodBack}${ART3.mount("nape")}${ear(-1)}${ear(1)}
    ${ink(C, headD, C.vol(fox, { hi: .32, lo: .3, cy: .25 }), line, { heavy: W.major })}
    <path d="${cheeksD}" fill="${C.vol(white, { hi: .2, lo: .12, cy: .3 })}"/>
    ${tufts([[69, 80, -4, 2], [71, 85, -4, 3], [131, 80, 4, 2], [129, 85, 4, 3]], white, 1.4, .95)}
    ${shade(C, headD, "M118 54C134 64 132 88 114 100L136 100L136 50Z", "#2A0A02", .3, 3)}
    ${ink(C, "M78 58C82 45 102 39 116 47C122 51 122 58 117 62C116 56 110 52 103 54C98 56 95 62 94 72C90 63 85 59 78 58Z", C.lin([[0, "#FFE29A"], [.5, amber], [1, "#C8701A"]], [0, 0, 1, 1]), line, { heavy: W.fine + .5 })}
    <path d="M86 50C94 45 104 44 112 47" stroke="#FFF4D0" stroke-width="1" fill="none" opacity=".85" stroke-linecap="round"/><path d="M98 57C96 61 95 65 95 69" stroke="#FFE6A8" stroke-width=".8" fill="none" opacity=".7"/>
    ${hoodRim}
    ${ART3.eye(C, { ...eyeO, cx: 87, cy: 75, w: 16.6, h: 7.6, side: "L", tilt: 2.4 })}
    ${ART3.eye(C, { ...eyeO, cx: 113, cy: 75, w: 16.6, h: 7.6, side: "R", tilt: 2.4 })}
    ${brows}
    ${E.bash ? ART3.bashful(C, 82, 88, 6, "#F07A7A", .8) + ART3.bashful(C, 118, 88, 6, "#F07A7A", .8) : ""}
    ${ink(C, "M97 94.6C97 93 103 93 103 94.6C103 96.6 100.8 98.4 100 98.4C99.2 98.4 97 96.6 97 94.6Z", C.lin([[0, "#3A2A2A"], [1, "#0A0404"]], [0, 0, 0, 1]), "#0A0404", { heavy: .8 })}
    <ellipse cx="99" cy="94.4" rx="1" ry=".45" fill="#fff" opacity=".7"/>
    ${mouths[E.mouth]}</g>`;
  const ground = `<ellipse cx="100" cy="210" rx="38" ry="4.2" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 ember" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}${ART3.mount("far")}${tail}${cloakBack}${ART3.mount("back")}${body}${o.bare ? bareArms : `<g class="arm armL">${ink(C, armL, armFill, line, { heavy: W.minor })}${PAW(82, 152, 4.6)}${rig.wear("L")}</g>`}${vest}${cloakBody}${belt}${ART3.mount("body")}${armRC}${clasp}${head}</svg>`);
};

// ===== Sir Wartsworth — a delighted toad scientist =====
// anatomy (small, broad): no neck — one wide squat head-and-body, bulging eye domes on top, a very wide mouth,
// a throat sac, warty skin, short arms, big folded hind legs with webbed feet
ART3.wartsworth = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const skin = "#72AC4C", skinDk = "#3E6A28", belly = "#ECE6AE", line = "#22401A", wart = "#4E8A34";
  const E = {
    neutral:   { up: 0, low: .2, look: [-.5, .3], dil: .62, brow: -1.4, mouth: "delight", sac: 0, arm: "rest", tilt: -5, dy: -1, dome: 1.02, blush: 0 },
    happy:     { up: 0, low: .58, look: [0, 0], dil: .55, brow: -2.4, mouth: "grin", sac: .3, arm: "eureka", tilt: -6, dy: -4, dome: 1.03, blush: .3 },
    sad:       { up: .48, low: 0, look: [0, .6], dil: .6, brow: 3.2, mouth: "frown", sac: 0, arm: "low", tilt: 5, dy: 3, dome: .96, wet: 1, blush: 0 },
    surprised: { up: 0, low: 0, look: [0, -.15], dil: .22, brow: -3.6, mouth: "o", sac: 1, arm: "rest", tilt: 0, dy: -5, dome: 1.1, blush: 0 },
    love:      { up: 1, low: .2, look: [0, 0], dil: .5, brow: -1, mouth: "smile", sac: 0, arm: "rest", tilt: -8, dy: 0, dome: 1, blush: 1, bash: 1 },
  }[expr] || {};
  // ---- hind legs: big folded thighs, webbed feet splayed on the ground
  const foot = s => { const m = x => 100 + s * (x - 100); return ink(C, `M${m(60)} 204C${m(52)} 204 ${m(44)} 208 ${m(42)} 212C${m(48)} 213 ${m(52)} 211 ${m(54)} 212C${m(56)} 214 ${m(62)} 214 ${m(66)} 212C${m(70)} 213 ${m(74)} 212 ${m(74)} 208C${m(72)} 204 ${m(66)} 203 ${m(60)} 204Z`, C.vol(skin), line, { heavy: W.minor }); };
  const thigh = s => { const m = x => 100 + s * (x - 100); const d = `M${m(58)} 196C${m(50)} 186 ${m(52)} 168 ${m(66)} 164C${m(78)} 162 ${m(84)} 176 ${m(80)} 190C${m(78)} 198 ${m(66)} 204 ${m(58)} 196Z`;
    return ink(C, d, C.vol(skin, { hi: .3, lo: .35, cx: s < 0 ? .3 : .45 }), line, { heavy: W.minor }) + `<circle cx="${m(64)}" cy="176" r="2.4" fill="${wart}"/><circle cx="${m(72)}" cy="186" r="1.8" fill="${wart}"/>`; };
  // ---- body + head as one squat shape
  const bodyD = "M100 82C76 82 58 94 56 116C54 130 58 140 60 148C56 164 60 186 74 196C82 202 118 202 126 196C140 186 144 164 140 148C142 140 146 130 144 116C142 94 124 82 100 82Z";
  const warts = [[72, 96, 2.6], [128, 98, 2.2], [64, 128, 2], [136, 132, 2.4], [70, 150, 1.6], [130, 154, 1.8], [84, 92, 1.4], [116, 90, 1.6], [62, 112, 1.6], [138, 116, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${wart}"/><circle cx="${x - r * .3}" cy="${y - r * .35}" r="${r * .35}" fill="#B8E090" opacity=".7"/>`).join("");
  const dome = s => { const m = x => 100 + s * (x - 100); return `<g transform="translate(${m(80)} 84) scale(${E.dome}) translate(${-m(80)} -84)"><path d="M${m(63)} 96C${m(61)} 76 ${m(70)} 66 ${m(80)} 66C${m(90)} 66 ${m(99)} 76 ${m(97)} 96Z" fill="${C.vol(skin, { hi: .35, lo: .2, cy: .2 })}"/><path d="M${m(63.6)} 90C${m(62)} 75 ${m(70)} 66 ${m(80)} 66C${m(90)} 66 ${m(98)} 75 ${m(96.4)} 90" stroke="${line}" stroke-width="${W.major}" fill="none" stroke-linecap="round"/>
    ${ART3.eye(C, { skin: mix(skin, skinDk, .2), line: "#14260E", shape: "round", iris: ["#8A4A04", "#F0B820", "#FFF4B0"], pupil: "round", dil: E.dil, look: E.look, up: E.up, low: E.low, w2: 1.9, wet: E.wet, irisR: .9, cx: m(80), cy: 81, w: 21, h: 11.2 })}
    <path d="M${m(68)} ${73 + E.brow * .2}Q${m(76)} ${69 - E.brow * .6} ${m(88)} ${71 + E.brow * (s < 0 ? 1 : 1)}" stroke="${skinDk}" stroke-width="2.4" fill="none" stroke-linecap="round" transform="${s < 0 ? "" : `translate(${2 * 100} 0) scale(-1 1)`}" opacity=".9"/></g>`; };
  // brows drawn per dome need mirroring maths of their own; keep them simple and symmetric:
  const browsFix = "";
  const sacR = 6 + E.sac * 10;
  const sac = E.sac > .05 ? `<ellipse cx="100" cy="${124 + E.sac * 4}" rx="${sacR * 1.3}" ry="${sacR}" fill="${C.vol(belly, { hi: .4, lo: .2, cy: .3 })}" stroke="${line}" stroke-width="1.2"/><ellipse cx="${96 - E.sac * 3}" cy="${120 + E.sac * 2}" rx="${sacR * .4}" ry="${sacR * .25}" fill="#fff" opacity=".6"/>` : "";
  const mouths = {
    delight: `<path d="M74 111C86 127 114 127 126 111Q100 117 74 111Z" fill="#7A1E2A" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/><path d="M90 120Q100 125 110 120Q100 121 90 120Z" fill="#E87A8A"/>`,
    smile: `<path d="M72 112C84 124 116 124 128 112" stroke="${line}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M70 110.6q2 1 3 2.6M130 110.6q-2 1 -3 2.6" stroke="${line}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    grin: `<path d="M70 110C80 132 120 132 130 110Q100 118 70 110Z" fill="#7A1E2A" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/><path d="M86 122Q100 130 114 122Q100 124 86 122Z" fill="#E87A8A"/>`,
    frown: `<path d="M74 122C86 112 114 112 126 122" stroke="${line}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    o: `<path d="M76 112C86 116 114 116 124 112" stroke="${line}" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="100" cy="114.6" rx="4" ry="3" fill="#7A1E2A" stroke="${line}" stroke-width="1.1"/>`,
  };
  const body = `<g class="body">${foot(-1)}${foot(1)}${thigh(-1)}${thigh(1)}
    ${ink(C, bodyD, C.vol(skin, { hi: .3, lo: .35, cy: .22 }), line, { heavy: W.major })}
    <path d="M100 128C80 128 70 146 72 166C74 184 86 196 100 196C114 196 126 184 128 166C130 146 120 128 100 128Z" fill="${C.vol(belly, { hi: .25, lo: .2, cy: .3 })}"/>
    ${warts}
    ${shade(C, bodyD, "M124 90C150 110 148 170 120 204L150 204L150 86Z", "#0E2006", .4, 3)}
    ${sheen(78, 96, 10, 4.6)}</g>`;
  // ---- default outfit: a white lab coat, goggles pushed up, a bubbling flask
  const coat = o.bare ? "" : `<g class="outfit coat">${[-1, 1].map(s => { const m = x => 100 + s * (x - 100);
      const d = `M${m(62)} 128C${m(56)} 146 ${m(56)} 176 ${m(64)} 198L${m(86)} 200C${m(82)} 178 ${m(80)} 152 ${m(82)} 128C${m(76)} 124 ${m(68)} 124 ${m(62)} 128Z`;
      return ink(C, d, C.lin([[0, "#FFFFFF"], [.6, "#ECEEF2"], [1, "#B8C0CC"]], [0, 0, 1, 1]), "#4A5260", { heavy: W.minor }) + `<path d="M${m(82)} 128L${m(78)} 146L${m(86)} 140Z" fill="#DDE2EA" stroke="#4A5260" stroke-width=".8"/>`; }).join("")}
    <path d="M122 160h11v9h-11Z" fill="#F4F6FA" stroke="#4A5260" stroke-width=".8"/><path d="M125 160v-6M128 160v-5M131 160v-6" stroke-width="1.6" stroke-linecap="round" stroke="#2A5AC0"/><path d="M128 160v-5" stroke="#C0303A" stroke-width="1.6"/>
    <path d="M66 150C64 166 64 182 68 196" stroke="#AAB2BE" stroke-width="1" fill="none" opacity=".7"/></g>`;
  const goggles = o.bare ? "" : `<g class="outfit goggles">${ink(C, "M60 74C70 62 130 62 140 74L138 78C128 68 72 68 62 78Z", C.lin([[0, "#7A4A2A"], [1, "#3A1E10"]], [0, 0, 0, 1]), "#1E0E06", { heavy: 1 })}
    ${[-1, 1].map(s => `<circle cx="${100 + s * 15}" cy="64" r="8.4" fill="${C.vol("#C8A060")}" stroke="#4A3010" stroke-width="1.2"/><circle cx="${100 + s * 15}" cy="64" r="6" fill="${C.rad([[0, "#E8F6FF"], [.6, "#8AC8F0"], [1, "#3A78A8"]], { cx: .35, cy: .3 })}" stroke="#2A3A4A" stroke-width=".8"/><ellipse cx="${100 + s * 15 - 2}" cy="62" rx="2" ry="1.2" fill="#fff" opacity=".85"/>`).join("")}
    <path d="M91.6 64Q100 60 108.4 64" stroke="#4A3010" stroke-width="1.8" fill="none"/></g>`;
  const ARM = s => ({ rest: [[[s < 0 ? 66 : 134, 132], [s < 0 ? 58 : 142, 140], [s < 0 ? 56 : 144, 152], [s < 0 ? 62 : 138, 160]]],
    eureka: s < 0 ? [[[66, 132], [58, 140], [56, 152], [62, 160]]] : [[[134, 132], [144, 128], [148, 116], [146, 104]]],
    low: [[[s < 0 ? 66 : 134, 132], [s < 0 ? 60 : 140, 144], [s < 0 ? 60 : 140, 158], [s < 0 ? 64 : 136, 168]]] })[E.arm];
  const hand = (x, y, up) => `${ink(C, `M${x - 5} ${y}C${x - 5} ${y - 5} ${x + 5} ${y - 5} ${x + 5} ${y}C${x + 5} ${y + 4} ${x - 5} ${y + 4} ${x - 5} ${y}Z`, C.vol(skin), line, { heavy: W.minor })}${up ? `<path d="M${x + 1} ${y - 3}L${x + 2} ${y - 11}" stroke="${skin}" stroke-width="3" stroke-linecap="round"/><path d="M${x + 1} ${y - 3}L${x + 2} ${y - 11}" stroke="${line}" stroke-width="3.6" stroke-linecap="round" opacity=".0"/><circle cx="${x + 2}" cy="${y - 11.6}" r="1.8" fill="${skin}" stroke="${line}" stroke-width=".8"/>` : ""}`;
  const sleeve = o.bare ? C.vol(skin) : C.lin([[0, "#FFFFFF"], [1, "#C8D0DA"]], [0, 0, 1, 1]);
  const rig = ART3.armRig(o, C), armL = rig.tube("L", ARM(-1), [12, 10.6, 9.4, 8.4]), armR = rig.tube("R", ARM(1), [12, 10.6, 9.4, 8.4]);
  const hL = ARM(-1)[0][3], hR = ARM(1)[0][3];
  const flask = o.bare ? "" : `<g class="outfit flask" transform="translate(${hL[0] - 2} ${hL[1] + 2}) rotate(${E.arm === "low" ? 24 : -8})">
    ${ink(C, "M-3 -16L3 -16L3 -8L12 8C13 11 11 13 8 13L-8 13C-11 13 -13 11 -12 8L-3 -8Z", C.lin([[0, "#EAF8FF", .7], [1, "#B8D8E8", .55]], [0, 0, 1, 1]), "#3A5A6A", { heavy: 1 })}
    <path d="M-7 2L7 2L11 9C12 11 10.6 12.4 8 12.4L-8 12.4C-10.6 12.4 -12 11 -11 9Z" fill="${C.lin([[0, "#9AF070"], [1, "#3AA83A"]], [0, 0, 0, 1])}"/>
    <circle cx="-2" cy="-1" r="1.6" fill="#B8F8A0" opacity=".85"/><circle cx="2" cy="-6" r="1.1" fill="#B8F8A0" opacity=".8"/><circle cx="3" cy="5" r="1.2" fill="#E8FFD8" opacity=".9"/>
    <rect x="-4" y="-19" width="8" height="3.6" rx="1" fill="#8A5A2A" stroke="#3A2010" stroke-width=".6"/><path d="M-6 -2L-10 6" stroke="#fff" stroke-width="1" opacity=".7"/></g>`;
  const lens = o.bare || E.arm === "eureka" ? "" : `<g class="outfit lens" transform="translate(${hR[0]} ${hR[1]}) rotate(${E.arm === "low" ? 150 : 24})">
    <rect x="-1.6" y="-14" width="3.2" height="12" rx="1.2" fill="#5A3418" stroke="#2A1408" stroke-width=".6"/>
    <circle cy="-22" r="8.6" fill="${C.rad([[0, "#FFFFFF", .55], [.7, "#BFE6FF", .3], [1, "#7AB8E0", .45]], { cx: .35, cy: .3 })}" stroke="${C.lin([[0, "#FFE6A0"], [1, "#8A6420"]], [0, 0, 1, 1])}" stroke-width="2.2"/>
    <path d="M-5 -25q2.4 -3.6 6 -4" stroke="#fff" stroke-width="1.2" fill="none" opacity=".85" stroke-linecap="round"/></g>`;
  const bowtie = o.bare ? "" : `<g class="outfit bowtie">${ink(C, "M100 131L91 126C89 128 89 134 91 136Z", C.lin([[0, "#4AC07A"], [1, "#1E6A3A"]], [0, 0, 1, 1]), "#0E3A1E", { heavy: 1 })}${ink(C, "M100 131L109 126C111 128 111 134 109 136Z", C.lin([[0, "#3AB06A"], [1, "#145A2E"]], [0, 0, 1, 1]), "#0E3A1E", { heavy: 1 })}<rect x="97.8" y="128.4" width="4.4" height="5.2" rx="1.4" fill="#2A8A50" stroke="#0E3A1E" stroke-width=".6"/></g>`;
  const arms = `${ink(C, armL, sleeve, o.bare ? line : "#4A5260", { heavy: W.minor })}${hand(hL[0], hL[1])}${rig.wear("L")}${flask}
    ${ink(C, armR, sleeve, o.bare ? line : "#4A5260", { heavy: W.minor })}${hand(hR[0], hR[1], E.arm === "eureka")}${rig.wear("R")}${lens}`;
  const head = `<g class="head" transform="translate(0 ${E.dy}) rotate(${E.tilt} 100 140)">${dome(-1)}${dome(1)}${goggles}
    <circle cx="95.4" cy="100" r="1.3" fill="${line}"/><circle cx="104.6" cy="100" r="1.3" fill="${line}"/>
    ${E.bash ? ART3.bashful(C, 70, 104, 7, "#F08A8A", .75) + ART3.bashful(C, 130, 104, 7, "#F08A8A", .75) : ""}
    ${sac}${mouths[E.mouth]}</g>`;
  const ground = `<ellipse cx="100" cy="211" rx="50" ry="4.2" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 wartsworth" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}<g class="rig" transform="translate(0 ${E.dy * .3})">${ART3.mount("back")}${body}${coat}${bowtie}${ART3.mount("body")}</g>${head}<g class="rig-arms" transform="translate(0 ${E.dy * .3})">${arms}</g></svg>`);
};

// ===== Bramble — a little hedgehog explorer (a child) =====
// anatomy (small, childlike): a big round head on a small bean of a body, a cloak of layered quills from crown to heels,
// huge innocent eyes, a short snout with a button nose, tiny round ears, short arms, little feet planted wide
ART3.bramble = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const quill = "#5E3E24", quillDk = "#2E1C10", tipC = "#E8D4B0", face = "#F0D6AA", belly = "#F6E2BC", line = "#3A2212";
  const E = {
    neutral:   { up: 0, low: .1, look: [.2, .05], dil: .86, brow: 0, lift: .6, mouth: "smile", bristle: 1, arm: "go", tilt: -3, dy: 0, ear: 0, blush: .45 },
    happy:     { up: 0, low: .55, look: [0, 0], dil: .9, brow: 0, lift: 2.4, mouth: "open", bristle: 1.06, arm: "cheer", tilt: -5, dy: -8, ear: -8, blush: .7 },
    sad:       { up: .12, low: .08, look: [0, .6], dil: .95, brow: 3.4, lift: 0, mouth: "sad", bristle: .9, arm: "down", tilt: 7, dy: 3, ear: 20, wet: 1, blush: .2 },
    surprised: { up: 0, low: 0, look: [0, -.1], dil: .5, brow: 1, lift: 4.4, mouth: "o", bristle: 1.2, arm: "cheeks", tilt: 0, dy: -3, ear: -10, blush: .3 },
    love:      { up: 1, low: .2, look: [0, 0], dil: .8, brow: .8, lift: 1, mouth: "smile", bristle: 1, arm: "hug", tilt: -9, dy: 0, ear: 10, blush: 1, bash: 1 },
  }[expr] || {};
  // ---- the quill cloak
  const cx = 100, cy = 140, rx = 46, ry = 54;
  const quills = (n, a0, a1, k0, k1, fill, tip, jit) => Array.from({ length: n }, (_, i) => {
    const t = a0 + (a1 - a0) * i / (n - 1), a = t * Math.PI / 180, len = k1 + ((i * 37) % 7) * jit, w = 5.6;
    const P = k => [cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)], b = P(k0), kk = k0 + (len - k0) * E.bristle, tp = [cx + rx * kk * Math.cos(a + .04), cy + ry * kk * Math.sin(a + .04)];
    const nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
    const d = `M${(b[0] - nx).toFixed(1)} ${(b[1] - ny).toFixed(1)}L${tp[0].toFixed(1)} ${tp[1].toFixed(1)}L${(b[0] + nx).toFixed(1)} ${(b[1] + ny).toFixed(1)}Z`;
    const tq = [b[0] + (tp[0] - b[0]) * .7, b[1] + (tp[1] - b[1]) * .7];
    return `<path d="${d}" fill="${fill}" stroke="${quillDk}" stroke-width=".8" stroke-linejoin="round"/><path d="M${tq[0].toFixed(1)} ${tq[1].toFixed(1)}L${tp[0].toFixed(1)} ${tp[1].toFixed(1)}" stroke="${tip}" stroke-width="1.6" stroke-linecap="round"/>`; }).join("");
  const massD = `M${cx} ${cy - ry}C${cx - rx * 1.12} ${cy - ry} ${cx - rx * 1.08} ${cy + ry * .9} ${cx - rx * .6} ${cy + ry * 1.14}L${cx + rx * .6} ${cy + ry * 1.14}C${cx + rx * 1.08} ${cy + ry * .9} ${cx + rx * 1.12} ${cy - ry} ${cx} ${cy - ry}Z`;
  const spines = `<g class="spines">${quills(28, 160, 380, .86, 1.12, C.lin([[0, quillDk], [1, quill]], [0, 1, 0, 0]), "#A88A6A", .012)}
    ${ink(C, massD, C.vol(quill, { hi: .2, lo: .4, cy: .2 }), quillDk, { heavy: W.major })}
    ${quills(26, 164, 376, .8, 1.03, C.lin([[0, quill], [1, lit(quill, .2)]], [0, 1, 0, 0]), tipC, .01)}
    ${shade(C, massD, "M126 90C156 120 152 176 128 204L156 204L156 86Z", "#0E0602", .45, 3)}</g>`;
  // ---- body: a small bean with a pale tummy, feet planted wide
  const feet = [-1, 1].map(s => { const x = 100 + s * 11; return ink(C, `M${x - 7} 203C${x - 7} 197 ${x + 7} 197 ${x + 7} 203C${x + 7} 206.4 ${x - 7} 206.4 ${x - 7} 203Z`, C.vol("#6A4A36"), line, { heavy: W.minor }) + `<path d="M${x - 2.4} 204.6v1.6M${x + 2.4} 204.6v1.6" stroke="#E8D4B0" stroke-width=".8" stroke-linecap="round"/>`; }).join("");
  const bellyD = "M100 158C87 158 81 169 81 181C81 194 89 202 100 202C111 202 119 194 119 181C119 169 113 158 100 158Z";
  const body = `<g class="body">${feet}${ink(C, bellyD, C.vol(belly, { hi: .25, lo: .25, cy: .25 }), line, { heavy: W.major })}
    ${tufts([[90, 166, -1, 3], [110, 166, 1, 3], [94, 196, 0, 3], [106, 196, 0, 3]], "#D8BC90", .8, .8)}
    ${shade(C, bellyD, "M112 160C126 172 124 196 108 206L126 206L126 158Z", "#5A3010", .35, 3)}</g>`;
  // ---- default outfit: an oversized satchel stuffed with maps and snacks, and a bush hat a size too big
  const satchel = o.bare ? "" : `<g class="outfit satchel"><path d="M88 160L124 178" stroke="#5A3418" stroke-width="3.8" stroke-linecap="round"/><path d="M88 160L124 178" stroke="#9A6A3A" stroke-width="1.5" stroke-linecap="round"/>
    <g transform="translate(128 188) rotate(-6)">
      <path d="M-9 -12L-6 -26L1 -25L-1 -11Z" fill="${C.lin([[0, "#FFF4DC"], [1, "#D8C49A"]], [0, 0, 1, 0])}" stroke="#6A5434" stroke-width=".7"/><path d="M-7.6 -20l5.4 1M-7 -16l4 .8" stroke="#C0303A" stroke-width=".8"/>
      <path d="M3 -12C3 -18 9 -20 11 -14Z" fill="#E8A040" stroke="#6A3A10" stroke-width=".6"/>
      ${ink(C, "M-17 -12L17 -12L18 11C18 15 -18 15 -18 11Z", C.lin([[0, "#B07034"], [1, "#5A3010"]], [0, 0, 1, 1]), "#2E1606", { heavy: W.minor })}
      ${ink(C, "M-17 -12L17 -12L16 1C8 5 -8 5 -16 1Z", C.lin([[0, "#C0844C"], [1, "#6A3A16"]], [0, 0, 0, 1]), "#2E1606", { heavy: 1 })}
      <rect x="-3" y="-1.6" width="6" height="5.2" rx="1.2" fill="#E2B04A" stroke="#6A4A10" stroke-width=".6"/><path d="M-14 -10h10" stroke="#EABE84" stroke-width=".9" opacity=".6"/>
      <path d="M-12 6l4 0M-12 9l6 0" stroke="#3A1E08" stroke-width=".6" opacity=".6"/></g></g>`;
  const hat = o.bare ? "" : `<g class="outfit hat" transform="rotate(-7 100 96)">
    ${ink(C, "M56 98C64 90 136 90 144 98C146 105 132 107 100 107C68 107 54 105 56 98Z", C.lin([[0, "#E6CC94"], [1, "#9A7A44"]], [0, 0, 0, 1]), "#4A3418", { heavy: W.minor })}
    ${ink(C, "M73 98C72 78 85 68 100 68C115 68 128 78 127 98C116 100 84 100 73 98Z", C.vol("#D8BA7E", { hi: .3, lo: .35 }), "#4A3418", { heavy: W.minor })}
    <path d="M74 93C84 95 116 95 126 93L126.6 98C116 100 84 100 73.4 98Z" fill="#6A4A2A"/>
    <path d="M100 70C98 77 98 84 99 92" stroke="#8A6A3A" stroke-width="1" fill="none" opacity=".6"/>
    <path d="M120 94C128 80 138 74 150 72C144 80 134 88 122 96Z" fill="${C.lin([[0, "#5AC07A"], [1, "#1E6A3A"]], [0, 0, 1, 1])}" stroke="#14421E" stroke-width=".8"/><path d="M122 95C130 85 139 78 148 74" stroke="#BFF0CC" stroke-width=".6" fill="none"/>
    <path d="M80 78C86 72 94 70 100 70" stroke="#FFF4D8" stroke-width="1.3" fill="none" opacity=".65" stroke-linecap="round"/></g>`;
  // ---- arms: short and busy
  const A = { go: [[[86, 166], [82, 172], [86, 176], [92, 172]], [[114, 166], [124, 166], [130, 160], [132, 150]]],
    cheer: [[[86, 166], [72, 160], [62, 146], [58, 130]], [[114, 166], [128, 160], [138, 146], [142, 130]]],
    down: [[[86, 166], [80, 174], [80, 182], [84, 188]], [[114, 166], [120, 174], [120, 182], [116, 188]]],
    cheeks: [[[86, 166], [76, 162], [72, 152], [76, 144]], [[114, 166], [124, 162], [128, 152], [124, 144]]],
    hug: [[[86, 166], [82, 176], [90, 182], [98, 178]], [[114, 166], [118, 176], [110, 182], [102, 178]]] }[E.arm];
  const rig = ART3.armRig(o, C);
  const arm = (seg, side) => { const p = seg[3]; return ink(C, rig.tube(side, [seg], [9, 8, 7, 6.6]), C.lin([[0, face], [1, shd(face, .2)]], [0, 0, 1, 1]), line, { heavy: W.minor }) + ink(C, `M${p[0] - 4.6} ${p[1]}C${p[0] - 4.6} ${p[1] - 4.6} ${p[0] + 4.6} ${p[1] - 4.6} ${p[0] + 4.6} ${p[1]}C${p[0] + 4.6} ${p[1] + 4} ${p[0] - 4.6} ${p[1] + 4} ${p[0] - 4.6} ${p[1]}Z`, C.vol(shd(face, .1)), line, { heavy: 1 }) + `<path d="M${p[0] - 1.6} ${p[1] + 1}v2M${p[0] + 1.6} ${p[1] + 1}v2" stroke="${line}" stroke-width=".6" opacity=".6"/>` + rig.wear(side); };
  const armsG = arm(A[0], "L") + arm(A[1], "R"), front = E.arm === "cheer" || E.arm === "cheeks";
  // ---- head: big and round, huge eyes, short snout
  const faceD = "M100 92C80 92 66 106 66 124C66 142 82 154 100 155C118 154 134 142 134 124C134 106 120 92 100 92Z";
  const ear = s => { const x = 100 + s * 31; return `<g transform="rotate(${s * E.ear} ${x} 106)">${ink(C, `M${x - 6.4} 108C${x - 6.4} 99 ${x + 6.4} 99 ${x + 6.4} 108C${x + 6.4} 111 ${x - 6.4} 111 ${x - 6.4} 108Z`, C.vol(face), line, { heavy: W.minor })}<ellipse cx="${x}" cy="106.4" rx="3.6" ry="2.6" fill="#EE9EA0"/></g>`; };
  const eyeO = { skin: shd(face, .08), line: "#2A1408", shape: "round", iris: ["#2A1206", "#7A4418", "#E2AE70"], pupil: "round", dil: E.dil, look: E.look, up: E.up, low: E.low, w2: 1.8, wet: E.wet, irisR: .92 };
  const L = E.lift || 0;
  const mouths = {
    smile: `<path d="M95.4 145.4Q100 149.4 104.6 145.4" stroke="${line}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    open: `<path d="M94.6 144.6Q100 153 105.4 144.6Q100 146.6 94.6 144.6Z" fill="#7A2A2A" stroke="${line}" stroke-width="1" stroke-linejoin="round"/><path d="M97.6 148.6Q100 150 102.4 148.6" stroke="#F09090" stroke-width="1.2" fill="none"/>`,
    sad: `<path d="M95.6 148.4Q100 144.6 104.4 148.4" stroke="${line}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    o: `<ellipse cx="100" cy="147.4" rx="2.6" ry="3" fill="#7A2A2A" stroke="${line}" stroke-width="1"/>`,
  };
  const head = `<g class="head" transform="rotate(${E.tilt} 100 155)">${ear(-1)}${ear(1)}
    ${ink(C, faceD, C.vol(face, { hi: .32, lo: .25, cy: .25 }), line, { heavy: W.major })}
    <path d="M74 106C84 98 95 98 100 102C105 98 116 98 126 106C116 103 107 106 100 111C93 106 84 103 74 106Z" fill="${quill}" opacity=".92"/>
    ${sheen(84, 108, 7, 3.6)}
    <ellipse cx="100" cy="140" rx="10" ry="7" fill="${C.vol(lit(face, .3), { hi: .3, lo: .1, cy: .3 })}"/>
    ${ART3.eye(C, { ...eyeO, cx: 86.6, cy: 125, w: 19, h: 10.6, side: "L" })}
    ${ART3.eye(C, { ...eyeO, cx: 113.4, cy: 125, w: 19, h: 10.6, side: "R" })}
    <path d="M79 ${114 + E.brow * .3 - L}Q85.6 ${112 - E.brow * .4 - L} 92 ${114 - E.brow - L}M108 ${114 - E.brow - L}Q114.4 ${112 - E.brow * .4 - L} 121 ${114 + E.brow * .3 - L}" stroke="${shd(face, .5)}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    ${E.bash ? ART3.bashful(C, 76, 138, 6.6, "#F08A8A", .85) + ART3.bashful(C, 124, 138, 6.6, "#F08A8A", .85) : `<ellipse cx="77" cy="138" rx="6" ry="3" fill="#F08A8A" opacity="${.25 + .4 * E.blush}" filter="${C.blur(1.2)}"/><ellipse cx="123" cy="138" rx="6" ry="3" fill="#F08A8A" opacity="${.25 + .4 * E.blush}" filter="${C.blur(1.2)}"/>`}
    ${ink(C, "M96.4 138C96.4 135.2 103.6 135.2 103.6 138C103.6 140.4 101.2 141.8 100 141.8C98.8 141.8 96.4 140.4 96.4 138Z", C.lin([[0, "#4A3028"], [1, "#100604"]], [0, 0, 0, 1]), "#100604", { heavy: .8 })}
    <ellipse cx="98.8" cy="137.4" rx="1.1" ry=".55" fill="#fff" opacity=".75"/>
    ${mouths[E.mouth]}${hat}</g>`;
  const ground = `<ellipse cx="100" cy="207" rx="${40 + E.dy * 1.4}" ry="3.8" fill="#000" opacity="${.3 + E.dy * .015}" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 bramble" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}<g class="rig" transform="translate(0 ${E.dy})">${ART3.mount("far")}${spines}${ART3.mount("back")}${body}${satchel}${ART3.mount("body")}${front ? "" : armsG}${head}${front ? armsG : ""}</g></svg>`);
};

// ===== Wulfila — a gothic teenage wolf =====
// anatomy (tall, slouched): long legs, narrow shoulders rolled forward, a broad wolf skull with a long pale muzzle,
// tall pointed ears, shaggy cheek ruffs, a heavy brush tail carried low
ART3.wulfila = function(expr = "neutral", o = {}){
  const C = ART3.Ctx(), { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  const fur = "#82808F", furDk = "#4A4858", pale = "#D6D4E0", line = "#22202C", hair = "#1C1826", purple = "#8A3AC8", knit = "#1F1D26";
  const E = {
    neutral:   { up: .5, low: .12, look: [.45, -.55], dil: .5, brow: 0, lift: 0, arch: 1.4, mouth: "flat", ear: 6, tail: "n", puff: 1, tilt: 3, dy: 1, fringe: 0, blush: 0 },
    happy:     { up: .36, low: .36, look: [.5, 0], dil: .55, brow: 0, lift: .4, arch: 3.2, mouth: "smirk", ear: -3, tail: "w", puff: 1, tilt: -2, dy: 0, fringe: 0, blush: .2 },
    sad:       { up: .42, low: .1, look: [-.7, .4], dil: .7, brow: 2.4, lift: 0, mouth: "sad", ear: 32, tail: "t", puff: .95, tilt: 6, dy: 3, fringe: 2, wet: 1, blush: 0 },
    surprised: { up: 0, low: 0, look: [0, -.1], dil: .95, brow: 1, lift: 4, mouth: "o", ear: -12, tail: "n", puff: 1.3, tilt: 0, dy: -3, fringe: -8, blush: 0 },
    love:      { up: .3, low: .32, look: [-.65, .3], dil: .7, brow: 1.4, lift: .6, mouth: "tiny", ear: 14, tail: "w", puff: 1, tilt: 7, dy: 1, fringe: 0, blush: 1, bash: 1 },
  }[expr] || {};
  // ---- tail: heavy and low, dark-tipped
  const T = { n: [[[86, 176], [64, 182], [54, 196], [46, 200]]], w: [[[86, 176], [64, 176], [52, 164], [50, 148]]], t: [[[90, 180], [78, 194], [72, 204], [62, 208]]] }[E.tail];
  const tailD = ART3.tube(T, [9, 17, 19, 9].map(w => w * E.puff)), tip = T[0][3];
  const tail = `<g class="tail">${ink(C, tailD, C.lin([[0, lit(fur, .1)], [1, furDk]], [1, 0, 0, 1]), line, { heavy: W.minor })}
    <g clip-path="${C.clip(tailD)}"><circle cx="${tip[0]}" cy="${tip[1]}" r="${12 * E.puff}" fill="${C.vol("#2A2836")}"/></g></g>`;
  // ---- body
  const torso = "M88 106C80 110 78 122 80 136C82 150 84 160 84 170C84 182 88 190 92 192L110 192C114 190 118 182 118 170C118 160 120 150 122 136C124 122 122 110 114 106Z";
  const legL = ART3.tube([[[93, 186], [92, 196], [92, 202], [93, 206]]], [12, 9, 8]), legR = ART3.tube([[[109, 186], [110, 196], [110, 202], [109, 206]]], [12, 9, 8]);
  const boot = x => o.bare ? ink(C, `M${x - 6} 208C${x - 6} 203 ${x + 6} 203 ${x + 6} 208C${x + 6} 211 ${x - 6} 211 ${x - 6} 208Z`, C.vol(fur), line, { heavy: W.minor })
    : ink(C, `M${x - 7} 194L${x + 6} 194L${x + 7} 206C${x + 9} 207 ${x + 9} 212 ${x + 6} 212L${x - 8} 212C${x - 9} 212 ${x - 9} 207 ${x - 7} 206Z`, C.lin([[0, "#3A3846"], [1, "#0E0C14"]], [0, 0, 0, 1]), "#08060C", { heavy: W.minor }) + `<path d="M${x - 7} 199h13" stroke="#B8B8C8" stroke-width="1.2"/><rect x="${x - 2}" y="197.6" width="4" height="3" fill="none" stroke="#D8D8E8" stroke-width=".7"/><path d="M${x - 8} 210.4h15" stroke="#5A5868" stroke-width="1.6"/>`;
  const body = `<g class="body">${ink(C, legL, C.lin([[0, fur], [1, furDk]], [0, 0, 1, 0]), line, { heavy: W.minor })}${ink(C, legR, C.lin([[0, fur], [1, furDk]], [0, 0, 1, 0]), line, { heavy: W.minor })}${boot(93)}${boot(109)}
    ${ink(C, torso, C.vol(fur, { hi: .28, lo: .35, cy: .2 }), line, { heavy: W.major })}
    <path d="M90 108C92 124 96 140 100 154C104 140 108 124 112 108C106 106 96 106 90 108Z" fill="${C.vol(pale, { hi: .2 })}"/>
    ${tufts([[94, 112, -1, 5], [100, 114, 0, 6], [106, 112, 1, 5]], "#ECEAF4", .9, .8)}
    ${shade(C, torso, "M114 110C130 126 128 176 112 196L132 196L132 106Z", "#0A0814", .45, 3)}</g>`;
  // ---- default outfit: an oversized black jumper with a stitched heart, a spiked choker, chunky boots
  const jumperD = "M84 104C74 108 70 122 72 140C73 156 76 168 78 178C90 184 112 184 124 178C126 168 129 156 130 140C132 122 128 108 118 104C110 108 92 108 84 104Z";
  const jumper = o.bare ? "" : `<g class="outfit jumper">${ink(C, jumperD, C.lin([[0, "#3A3846"], [.5, knit], [1, "#0A0910"]], [0, 0, 1, 1]), "#06050A", { heavy: W.minor })}
    <g clip-path="${C.clip(jumperD)}">${Array.from({ length: 7 }, (_, i) => `<path d="M${76 + i * 8} 108C${75 + i * 8} 130 ${76 + i * 8} 156 ${78 + i * 8} 182" stroke="#2E2C38" stroke-width="1.6" fill="none" opacity=".7"/>`).join("")}
      <path d="M72 172C90 178 112 178 130 172L130 184L72 184Z" fill="#2A2834"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${74 + i * 4.6} 174v8" stroke="#0A0910" stroke-width=".8"/>`).join("")}
      <path d="M78 120C78 140 80 156 82 168" stroke="#5A5868" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/></g>
    <path d="M100 146C100 142 94 141 94 145.6C94 149 100 152 100 154C100 152 106 149 106 145.6C106 141 100 142 100 146Z" fill="none" stroke="${purple}" stroke-width="1.3" stroke-dasharray="1.6 1.2"/>
    <g transform="translate(86 124) rotate(-24)"><path d="M0 0h10" stroke="#D8D8E8" stroke-width="1.1" stroke-linecap="round"/><path d="M0 2h9" stroke="#D8D8E8" stroke-width="1"/><circle cx="10.4" cy="1" r="1.6" fill="none" stroke="#D8D8E8" stroke-width="1"/><rect x="-2.4" y="-.6" width="2.6" height="3.4" rx=".6" fill="#B8B8C8"/></g>
    <path d="M76 178l4 4l4 -3l4 4l5 -3l4 3l4 -2" stroke="#06050A" stroke-width="1.2" fill="none"/></g>`;
  const choker = o.bare ? "" : `<g class="outfit choker">${ink(C, "M84 103Q100 110 116 103L116 108Q100 115 84 108Z", "#0C0A12", "#000", { heavy: .8 })}
    ${[86, 90.6, 95.3, 100, 104.7, 109.4, 114].map((x, i) => { const y = 107.6 + Math.sin(i / 6 * Math.PI) * 3.4; return `<path d="M${x - 1.6} ${y}L${x} ${y + 4.2}L${x + 1.6} ${y}Z" fill="${C.lin([[0, "#FFFFFF"], [1, "#8A8A9A"]], [0, 0, 1, 1])}" stroke="#3A3A48" stroke-width=".4"/>`; }).join("")}
    <circle cx="100" cy="112" r="1.6" fill="${purple}"/></g>`;
  // ---- arms (in long sleeves when dressed) hugging her skull book
  const sleeve = o.bare ? C.lin([[0, fur], [1, furDk]], [0, 0, 1, 1]) : C.lin([[0, "#34323E"], [1, "#0C0B12"]], [0, 0, 1, 1]);
  const hug = E.bash || expr === "sad";
  const rig = ART3.armRig(o, C);
  const armL = rig.tube("L", hug ? [[[82, 112], [74, 126], [80, 142], [96, 146]]] : [[[82, 112], [72, 124], [72, 142], [80, 154]]], [11, 10, 9, 8.4]);
  const armR = rig.tube("R", hug ? [[[118, 112], [128, 126], [122, 142], [106, 148]]] : [[[118, 112], [128, 124], [126, 140], [112, 148]]], [11, 10, 9, 8.4]);
  const pawAt = (x, y) => ink(C, `M${x - 4.6} ${y}C${x - 4.6} ${y - 4} ${x + 4.6} ${y - 4} ${x + 4.6} ${y}C${x + 4.6} ${y + 3.6} ${x - 4.6} ${y + 3.6} ${x - 4.6} ${y}Z`, C.vol(fur), line, { heavy: 1 });
  const book = `<g class="book" transform="translate(${hug ? 101 : 104} ${hug ? 138 : 142}) rotate(${hug ? -4 : 8})">${ink(C, "M-12 -15L12 -15L12 15L-12 15Z", C.lin([[0, "#5A2A8A"], [1, "#24103A"]], [0, 0, 1, 1]), "#10061A", { heavy: W.minor })}
    <path d="M-12 -15L-9 -17L14.4 -17L12 -15" fill="#E8E2EE" stroke="#10061A" stroke-width=".5"/><rect x="-10" y="-13" width="20" height="26" rx="1" fill="none" stroke="#B08AD8" stroke-width=".6" opacity=".7"/>
    <path d="M0 -8C-5 -8 -6.4 -4 -6 -1C-5.6 1.4 -4 2 -4 4L4 4C4 2 5.6 1.4 6 -1C6.4 -4 5 -8 0 -8Z" fill="#F2EEF6"/><circle cx="-2.4" cy="-2" r="1.6" fill="#24103A"/><circle cx="2.4" cy="-2" r="1.6" fill="#24103A"/><path d="M-2 4v2M0 4v2M2 4v2" stroke="#24103A" stroke-width=".7"/></g>`;
  const handL = hug ? [96, 146] : [80, 155], handR = hug ? [106, 148] : [112, 148];
  const arms = `${book}${ink(C, armL, sleeve, o.bare ? line : "#06050A", { heavy: W.minor })}${pawAt(...handL)}${rig.wear("L")}${ink(C, armR, sleeve, o.bare ? line : "#06050A", { heavy: W.minor })}${pawAt(...handR)}${rig.wear("R")}`;
  // ---- head
  const headD = "M100 40C80 40 68 54 68 70C68 80 74 88 82 93C88 97 94 100 100 101C106 100 112 97 118 93C126 88 132 80 132 70C132 54 120 40 100 40Z";
  const ear = s => { const m = x => 100 + s * (x - 100); return `<g transform="rotate(${s * E.ear} ${m(80)} 50)">${ink(C, `M${m(72)} 56C${m(68)} 42 ${m(66)} 28 ${m(68)} 12C${m(80)} 22 ${m(88)} 34 ${m(92)} 46Z`, C.lin([[0, furDk], [1, fur]], [0, 0, 0, 1]), line, { heavy: W.major })}
    <path d="M${m(74)} 50C${m(72)} 40 ${m(71)} 30 ${m(72)} 20C${m(79)} 28 ${m(84)} 36 ${m(87)} 46Z" fill="#5A4A68"/>${tufts([[m(76), 48, s * 3, -5], [m(77), 42, s * 3, -6]], pale, .8, .8)}
    ${s > 0 && !o.bare ? `<circle cx="${m(70.6)}" cy="40" r="2.4" fill="none" stroke="#D8D8E8" stroke-width="1.1"/><circle cx="${m(70)}" cy="46" r="2.4" fill="none" stroke="#D8D8E8" stroke-width="1.1"/>` : ""}</g>`; };
  const eyeO = { skin: shd(fur, .1), line: "#0A0810", shape: "almond", iris: ["#3A1A6A", "#9A6AE0", "#E2D2FF"], pupil: "round", dil: E.dil, look: E.look, up: E.up, low: E.low, lash: 2, wing: 1, w2: 3, wet: E.wet };
  const browY = (inner) => inner ? 59 - E.brow - E.lift : 60 + E.brow * .3 - E.lift, ar = E.arch || 0;
  const brows = `<path d="M80 ${browY(0)}Q87 ${browY(0) - 2.4} 94 ${browY(1)}" stroke="${hair}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M106 ${browY(1) - ar * .4}Q113 ${browY(0) - 2.4 - ar} 120 ${browY(0) - ar * .6}" stroke="${hair}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  const lip = "#4A2A6A";
  const mouths = {
    flat: `<path d="M100 95.6v2.2M95 98.6h10" stroke="${lip}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    smirk: `<path d="M100 95.6v2.2M95.4 98.8Q100 99.6 104 98.2Q106 97.4 106.6 96" stroke="${lip}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    sad: `<path d="M100 95.6v2.4M95.6 101C97.4 99 102.6 99 104.4 101" stroke="${lip}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
    o: `<path d="M100 95.6v1.6" stroke="${lip}" stroke-width="1.3"/><ellipse cx="100" cy="100" rx="2.4" ry="2.8" fill="#3A1A2A" stroke="${lip}" stroke-width="1"/>`,
    tiny: `<path d="M100 95.6v2M97 98.8Q100 100.6 103 98.8" stroke="${lip}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  };
  const fringe = `<g class="fringe" transform="rotate(${E.fringe} 120 44)">${ink(C, "M68 60C66 42 82 30 102 30C120 30 134 42 134 56C128 50 118 47 108 49L112 44C104 46 96 50 90 56C86 60 84 66 83 72C81 67 78 64 75 64C74 67 75 71 77 75C72 71 69 66 68 60Z", C.lin([[0, "#3A3448"], [.5, hair], [1, "#08060C"]], [0, 0, 1, 1]), "#000", { heavy: W.major })}
    <path d="M112 35C101 37 92 44 87 52C84 57 83 62 82 68" stroke="${purple}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".95"/><path d="M124 40C116 40 108 43 102 48" stroke="#B070F0" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>${ink(C, "M90 33C86 29 80 27 75 28C80 24 87 24 92 27C92 22 95 17 100 15C98 21 99 26 102 29C104 25 108 23 112 23C109 26 108 29 108 32Z", C.lin([[0, "#3A3448"], [1, hair]], [0, 0, 0, 1]), "#000", { heavy: W.minor })}<path d="M84 42C90 38 98 36 106 37" stroke="#6A6280" stroke-width="1.2" fill="none" opacity=".7" stroke-linecap="round"/></g>`;
  const head = `<g class="head" transform="translate(0 ${E.dy}) rotate(${E.tilt} 100 106)">${ear(-1)}${ear(1)}
    ${ink(C, headD, C.vol(fur, { hi: .3, lo: .3, cy: .25 }), line, { heavy: W.major })}
    ${tufts([[69, 76, -4, 3], [70, 82, -4, 4], [72, 88, -3, 5], [131, 76, 4, 3], [130, 82, 4, 4], [128, 88, 3, 5]], fur, 1.8, .95)}
    <path d="M87 80C89 75 111 75 113 80C115 89 108 99 100 101C92 99 85 89 87 80Z" fill="${C.vol(pale, { hi: .25, lo: .15, cy: .3 })}"/>
    ${shade(C, headD, "M118 50C136 62 132 92 112 104L136 104L136 46Z", "#0A0814", .3, 3)}
    ${ART3.eye(C, { ...eyeO, cx: 87, cy: 70, w: 16, h: 7.4, side: "L", tilt: 2 })}
    ${ART3.eye(C, { ...eyeO, cx: 113, cy: 70, w: 16, h: 7.4, side: "R", tilt: 2 })}
    ${[[87, 1], [113, -1]].map(([x, d]) => `<ellipse cx="${x}" cy="73.6" rx="9" ry="3" fill="#3A2A5A" opacity=".35" filter="${C.blur(1.2)}"/>`).join("")}
    ${E.up < .97 ? `<path d="M79 69.6l-6.4 -3.6M121 69.6l6.4 -3.6" stroke="#0A0810" stroke-width="2" stroke-linecap="round"/>` : ""}
    ${brows}${fringe}
    ${E.bash ? ART3.bashful(C, 81, 84, 6, "#C87AB8", .8) + ART3.bashful(C, 119, 84, 6, "#C87AB8", .8) : ""}
    ${ink(C, "M96.4 86C96.4 84 103.6 84 103.6 86C103.6 88.4 101.2 90.4 100 90.4C98.8 90.4 96.4 88.4 96.4 86Z", C.lin([[0, "#3A3446"], [1, "#08060C"]], [0, 0, 0, 1]), "#000", { heavy: .8 })}
    <ellipse cx="98.6" cy="85.6" rx="1.1" ry=".5" fill="#fff" opacity=".7"/>
    <g transform="translate(0 -3.6)">${mouths[E.mouth]}</g></g>`;
  const ground = `<ellipse cx="96" cy="211" rx="44" ry="4.2" fill="#000" opacity=".3" filter="${C.blur(1.6)}"/>`;
  return ART3.fin(C, `<svg class="art3 wulfila" viewBox="0 0 200 220" aria-hidden="true"><defs>@@DEFS@@</defs>${ground}${tail}${ART3.mount("back")}${body}${jumper}${choker}${ART3.mount("body")}${arms}${head}</svg>`);
};

// ===== Wardrobe attachment anchors, per species =====
// Coordinates are in each mount's own (untransformed) stage space, so an item placed at an anchor inside its mount
// follows that character's head tilt, lift, puff and jump automatically. Never reuse one species' numbers for another.
//   head mount: headTop (hats, crowns), brow (circlets, helm bands), eyes (spectacles, goggles, masks), earL / earR (ear items, set
//               on the ear's own pivot so a bow or piercing stays put when the ear rotates with the mood)
//   body mount: neck (collars, chokers, scarves, bow ties), chest (brooches, badges), waist (belts, sashes), aura (centre of mass)
//   back mount: back (capes, quivers, wings, backpacks: the top centre they hang from)
// "w" gives a sensible width in stage units at that anchor (head width at the brow, chest width at the neck/waist) for sizing items.
ART3.ANCHORS = {
  natasha:    { head: { headTop: [101, 40], brow: [102, 56], eyes: [102, 68, 34], earL: [82, 45], earR: [121, 43] }, body: { neck: [102, 106, 22], chest: [102, 124, 30], waist: [102, 144, 30], aura: [104, 140] }, back: { back: [102, 104, 36] } },
  antonio:    { head: { headTop: [100, 40], brow: [100, 52], eyes: [100, 61, 30], earL: [80, 43], earR: [120, 43] }, body: { neck: [100, 100, 26], chest: [100, 120, 56], waist: [100, 158, 38], aura: [100, 130] }, back: { back: [100, 100, 66] } },
  hoot:       { head: { headTop: [100, 44], brow: [100, 60], eyes: [100, 74, 56], earL: [76, 47], earR: [124, 47] }, body: { neck: [100, 106, 26], chest: [100, 130, 56], waist: [100, 160, 62], aura: [100, 146] }, back: { back: [100, 100, 66] } },
  corvin:     { head: { headTop: [100, 32], brow: [98, 47], eyes: [106, 60, 28], earL: [76, 38], earR: [115, 33] }, body: { neck: [100, 98, 30], chest: [100, 124, 40], waist: [100, 152, 34], aura: [100, 140] }, back: { back: [100, 98, 44] } },
  ember:      { head: { headTop: [100, 48], brow: [100, 60], eyes: [100, 75, 34], earL: [79, 51], earR: [121, 51] }, body: { neck: [100, 110, 22], chest: [100, 126, 30], waist: [100, 152, 32], aura: [100, 146] }, back: { back: [100, 104, 34] } },
  wartsworth: { head: { headTop: [100, 64], brow: [100, 72], eyes: [100, 81, 66], earL: [74, 76], earR: [126, 76] }, body: { neck: [100, 128, 30], chest: [100, 150, 52], waist: [100, 174, 60], aura: [100, 150] }, back: { back: [100, 118, 70] } },
  nyx:        { head: { headTop: [100, 88], brow: [100, 101], eyes: [100, 117, 52], earL: [86, 92], earR: [114, 92] }, body: { neck: [100, 152, 32], chest: [100, 172, 34], waist: [100, 188, 40], aura: [100, 176] }, back: { back: [100, 158, 40] } },
  bramble:    { head: { headTop: [100, 94], brow: [100, 113], eyes: [100, 125, 50], earL: [69, 102], earR: [131, 102] }, body: { neck: [100, 158, 28], chest: [100, 172, 34], waist: [100, 186, 36], aura: [100, 178] }, back: { back: [100, 120, 70] } },
  wulfila:    { head: { headTop: [100, 40], brow: [100, 58], eyes: [100, 70, 40], earL: [79, 47], earR: [121, 47] }, body: { neck: [100, 106, 30], chest: [100, 130, 44], waist: [100, 168, 46], aura: [100, 146] }, back: { back: [100, 104, 40] } },
};
// place a wardrobe item (an SVG fragment drawn around 0,0) at an anchor; the caller inserts the result into the mount group
ART3.place = (k, mount, anchor, frag, scale = 1) => { const p = ART3.ANCHORS[k][mount][anchor]; return `<g transform="translate(${p[0]} ${p[1]}) scale(${scale})">${frag}</g>`; };
// put items into a rendered companion: items = [{ mount, anchor, frag, scale }]
ART3.dress = (k, svg, items) => items.reduce((s, it) => s.replace(`<g class="mount mount-${it.mount}" data-mount="${it.mount}">`, m => m + ART3.place(k, it.mount, it.anchor, it.frag, it.scale)), svg);

// ===== Companion wardrobe: 90 pieces, two per bond level for each companion, drawn in the house style =====
// Items are drawn in each species' own coordinates from ART3.FIT and land in the companion's mount groups
// (back / body / head), so they follow every expression. Arm pieces use the character's arm rig.
(() => {
  const { ink, shade, tufts, mix, lit, shd, W, sheen } = ART3;
  // ---------- per-species fit (stage units, inside each mount's own space) ----------
  // head.top: where a hat's crown sits; head.w: skull width there; eyes: [x, y, r] near → far; ears on their pivots
  // prof: torso half-widths down the body, for garments; back: [x, y, shoulder width]; floor: ground line
  const FIT = {
    natasha:    { head: { top: [101, 38], w: 50, brow: [102, 57], eyes: [[87.5, 69, 9.5], [117, 67.5, 8.3]], ears: [[82, 45], [121, 43]] }, neck: [102, 105, 22], prof: { cx: 102, pts: [[100, 9], [108, 16], [118, 19.5], [130, 17], [142, 13.5], [158, 16], [172, 20.5], [190, 18]] }, back: [102, 104, 34], floor: 210, arms: "tube" },
    antonio:    { head: { top: [100, 34], w: 52, brow: [100, 52], eyes: [[88.6, 61.4, 7.5], [111.4, 61.4, 7.5]], ears: [[80, 43], [120, 43]] }, neck: [100, 98, 24], prof: { cx: 100, pts: [[98, 12], [102, 26], [116, 38], [130, 38], [146, 27], [160, 18]] }, back: [100, 100, 60], floor: 211 },
    hoot:       { head: { top: [100, 44], w: 52, brow: [100, 60], eyes: [[85.4, 74, 10.5], [114.6, 74, 10.5]], ears: [[76, 47], [124, 47]] }, neck: [100, 109, 30], prof: { cx: 100, pts: [[102, 20], [110, 30], [128, 38], [148, 40], [168, 37], [188, 28]] }, back: [100, 100, 60], floor: 205 },
    corvin:     { head: { top: [102, 32], w: 44, brow: [98, 47], eyes: [[96, 61, 8], [117, 59, 5.6]], ears: [[76, 38], [115, 33]] }, neck: [100, 113, 30], prof: { cx: 100, pts: [[92, 10], [100, 22], [116, 30], [134, 33], [156, 28], [178, 18]] }, back: [100, 96, 40], floor: 212, arms: "wing" },
    ember:      { head: { top: [100, 47], w: 50, brow: [100, 61], eyes: [[87, 75, 8.3], [113, 75, 8.3]], ears: [[79, 51], [121, 51]] }, neck: [100, 113, 18], prof: { cx: 100, pts: [[106, 8], [112, 13], [126, 16.5], [142, 15], [160, 14], [180, 13]] }, back: [100, 104, 30], floor: 209 },
    wartsworth: { head: { top: [100, 72], w: 40, brow: [100, 74], eyes: [[80, 81, 10.5], [120, 81, 10.5]], ears: [[64, 92], [136, 92]] }, neck: [100, 126, 56], prof: { cx: 100, pts: [[124, 30], [132, 40], [150, 44], [170, 43], [188, 34]] }, back: [100, 118, 70], floor: 210, arms: "tube" },
    nyx:        { head: { top: [100, 88], w: 56, brow: [100, 101], eyes: [[85, 117, 10.5], [115, 117, 10.5]], ears: [[86, 92], [114, 92]] }, neck: [100, 151, 26], prof: { cx: 100, pts: [[152, 12], [158, 18], [170, 22.5], [182, 23], [194, 18]] }, back: [100, 156, 36], floor: 205 },
    bramble:    { head: { top: [100, 97], w: 58, brow: [100, 113], eyes: [[86.6, 125, 9.5], [113.4, 125, 9.5]], ears: [[69, 102], [131, 102]] }, neck: [100, 157, 22], prof: { cx: 100, pts: [[156, 10], [162, 15], [172, 18.5], [184, 19], [196, 15]] }, back: [100, 120, 60], floor: 206 },
    wulfila:    { head: { top: [100, 38], w: 52, brow: [100, 58], eyes: [[87, 70, 8], [113, 70, 8]], ears: [[79, 47], [121, 47]] }, neck: [100, 104, 24], prof: { cx: 100, pts: [[104, 11], [110, 17], [124, 20.5], [140, 20.5], [160, 17], [180, 16], [190, 14]] }, back: [100, 104, 36], floor: 211, arms: "tube" },
  };
  ART3.FIT = FIT;
  // which default-outfit groups each slot replaces (class names of the character's own outfit groups)
  const DEFAULT_SLOTS = {
    natasha: { torso: ["dress"], neck: ["necklace"], held: ["clutch"] },
    antonio: { held: ["rose"] },
    hoot: { torso: ["waistcoat"], neck: ["bowtie"], face: ["spectacles"] },
    corvin: { head: ["helm"], torso: ["armor", "pauldron"], back: ["cape"] },
    ember: { head: ["hood"], back: ["cloak-back", "cloak", "clasp"], torso: ["vest", "bandolier"] },
    wartsworth: { head: ["goggles"], face: ["goggles"], torso: ["coat"], neck: ["bowtie"], held: ["flask"] },
    nyx: { head: ["bow"] },
    bramble: { head: ["hat"] },
    wulfila: { torso: ["jumper"], neck: ["choker"] },
  };
  ART3.DEFAULT_SLOTS = DEFAULT_SLOTS;

  // ---------- small shared pieces ----------
  const goldF = C => C.lin([[0, "#FFF2BE"], [.45, "#E2B04A"], [1, "#8A6420"]], [0, 0, 0, 1]);
  const silverF = C => C.lin([[0, "#FFFFFF"], [.45, "#C8D2DE"], [1, "#5A6476"]], [0, 0, 0, 1]);
  const ironF = C => C.lin([[0, "#9AA2B0"], [.5, "#5A6272"], [1, "#2A2E38"]], [0, 0, 0, 1]);
  const fab = (C, col, a = [0, 0, 1, 1]) => C.lin([[0, lit(col, .28)], [.5, col], [1, shd(col, .42)]], a);
  const GL = "#5A3E10", SL = "#2A3240";
  const f1 = n => (+n).toFixed(1);
  const gem = (C, x, y, r, col, shape = "round") => {
    const fill = C.rad([[0, lit(col, .7)], [.5, col], [1, shd(col, .5)]], { cx: .38, cy: .32 }), ln = shd(col, .65);
    const d = shape === "heart" ? `M${x} ${y + r}C${x - r * 1.9} ${y - r * .2} ${x - r * .8} ${y - r * 1.6} ${x} ${y - r * .45}C${x + r * .8} ${y - r * 1.6} ${x + r * 1.9} ${y - r * .2} ${x} ${y + r}Z`
      : shape === "drop" ? `M${x} ${y - r * 1.3}C${x - r * 1.1} ${y} ${x - r} ${y + r} ${x} ${y + r}C${x + r} ${y + r} ${x + r * 1.1} ${y} ${x} ${y - r * 1.3}Z`
      : shape === "diamond" ? `M${x} ${y - r}L${x + r * .8} ${y}L${x} ${y + r}L${x - r * .8} ${y}Z`
      : `M${x - r} ${y}A${r} ${r} 0 1 0 ${x + r} ${y}A${r} ${r} 0 1 0 ${x - r} ${y}Z`;
    return `<path d="${d}" fill="${fill}" stroke="${ln}" stroke-width=".6"/><ellipse cx="${f1(x - r * .32)}" cy="${f1(y - r * .32)}" rx="${f1(r * .3)}" ry="${f1(r * .2)}" fill="#fff" opacity=".85"/>`;
  };
  const star = (x, y, r, col, o = {}) => `<path d="M${f1(x)} ${f1(y - r)}L${f1(x + r * .28)} ${f1(y - r * .28)}L${f1(x + r)} ${f1(y)}L${f1(x + r * .28)} ${f1(y + r * .28)}L${f1(x)} ${f1(y + r)}L${f1(x - r * .28)} ${f1(y + r * .28)}L${f1(x - r)} ${f1(y)}L${f1(x - r * .28)} ${f1(y - r * .28)}Z" fill="${col}"${o.cls ? ` class="${o.cls}"` : ""}${o.line ? ` stroke="${o.line}" stroke-width=".5"` : ""}/>`;
  // a soft light behind something (no filter: a radial gradient that fades out)
  const glow = (C, x, y, r, col, op = .35) => `<circle class="a3glow" cx="${x}" cy="${y}" r="${r}" fill="${C.rad([[0, col, op], [.6, col, op * .35], [1, col, 0]])}"/>`;
  // Catmull-Rom through points → smooth cubic path (open)
  const smooth = (pts, move = true) => { let d = move ? `M${f1(pts[0][0])} ${f1(pts[0][1])}` : "";
    for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`; }
    return d; };
  const hw = (F, y) => { const P = F.prof.pts; if (y <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (y <= P[i][0]) { const t = (y - P[i - 1][0]) / (P[i][0] - P[i - 1][0]); return P[i - 1][1] + (P[i][1] - P[i - 1][1]) * t; } return P[P.length - 1][1]; };

  // ---------- garments that follow each torso ----------
  // o: top, hem, ease, flare (extra half-width at the hem), from (y where flare starts), neck: round|v|high, depth, scallop
  const garment = (F, o) => {
    const cx = F.prof.cx, y0 = o.top ?? F.prof.pts[0][0] + 2, y1 = o.hem, ease = o.ease ?? 1.12, from = o.from ?? (y0 + (y1 - y0) * .55), flare = o.flare ?? 0;
    const half = y => hw(F, y) * ease + 1.2 + (y > from ? flare * ((y - from) / (y1 - from)) ** 1.25 : 0);
    const N = 9, ys = Array.from({ length: N }, (_, i) => y0 + (y1 - y0) * i / (N - 1));
    const L = ys.map(y => [cx - half(y), y]), R = ys.map(y => [cx + half(y), y]).reverse();
    const hb = half(y1), hem = o.scallop ? Array.from({ length: o.scallop }, (_, i) => { const xa = cx - hb + 2 * hb * (i + 1) / o.scallop; return `Q${f1(xa - hb / o.scallop)} ${f1(y1 + 5)} ${f1(xa)} ${f1(y1)}`; }).join("")
      : `Q${f1(cx)} ${f1(y1 + 4)} ${f1(cx + hb)} ${f1(y1)}`;
    const d0 = o.depth ?? 6;
    const neck = o.neck === "v" ? `L${f1(cx)} ${f1(y0 + d0)}Z` : o.neck === "high" ? `Q${f1(cx)} ${f1(y0 - 3)} ${f1(L[0][0])} ${f1(L[0][1])}Z` : `Q${f1(cx)} ${f1(y0 + d0)} ${f1(L[0][0])} ${f1(L[0][1])}Z`;
    return smooth(L) + hem + smooth(R, false).replace(/^/, `L${f1(R[0][0])} ${f1(R[0][1])}`) + neck;
  };
  // an open-front panel (one side of a jacket or coat)
  const panel = (F, o, s) => {
    const cx = F.prof.cx, y0 = o.top ?? F.prof.pts[0][0] + 2, y1 = o.hem, ease = o.ease ?? 1.14, from = o.from ?? (y0 + (y1 - y0) * .55), flare = o.flare ?? 0;
    const half = y => hw(F, y) * ease + 1.4 + (y > from ? flare * ((y - from) / (y1 - from)) ** 1.25 : 0);
    const gap = y => (o.gap0 ?? 7) + ((o.gap1 ?? 3) - (o.gap0 ?? 7)) * (y - y0) / (y1 - y0);
    const N = 8, ys = Array.from({ length: N }, (_, i) => y0 + (y1 - y0) * i / (N - 1));
    const outer = ys.map(y => [cx + s * half(y), y]), inner = ys.map(y => [cx + s * gap(y), y]).reverse();
    return smooth(outer) + `L${f1(inner[0][0])} ${f1(inner[0][1])}` + smooth(inner, false) + "Z";
  };
  const folds = (F, y0, y1, n, col, op = .45, spread = .7) => Array.from({ length: n }, (_, i) => { const t = (i + .5) / n - .5, x0 = F.prof.cx + t * 2 * hw(F, y0) * spread, x1 = F.prof.cx + t * 2 * hw(F, y1) * spread * 1.15;
    return `<path d="M${f1(x0)} ${f1(y0)}C${f1(x0 + t * 2)} ${f1(y0 + (y1 - y0) * .4)} ${f1(x1 - t * 2)} ${f1(y1 - (y1 - y0) * .3)} ${f1(x1)} ${f1(y1)}" stroke="${col}" stroke-width="1" fill="none" opacity="${op}"/>`; }).join("");
  const buttons = (F, y0, y1, n, col, x = F.prof.cx) => Array.from({ length: n }, (_, i) => `<circle cx="${f1(x)}" cy="${f1(y0 + (y1 - y0) * i / Math.max(1, n - 1))}" r="1.5" fill="${col}" stroke="${shd(col, .6)}" stroke-width=".5"/>`).join("");

  // ---------- capes, cloaks, mantles, wings (back mount) ----------
  const cape = (C, F, o) => {
    const [x, y, w] = F.back, hemY = o.hem ?? (F.floor - 4), sp = o.spread ?? 1.9, hw2 = w * sp / 2, top = y + (o.drop ?? 0);
    const waves = o.waves ?? 4, hem = Array.from({ length: waves }, (_, i) => { const xa = x + hw2 - 2 * hw2 * (i + 1) / waves; return `Q${f1(xa + hw2 / waves)} ${f1(hemY + (i % 2 ? -3 : 4))} ${f1(xa)} ${f1(hemY)}`; }).join("");
    const d = `M${f1(x - w / 2)} ${f1(top)}C${f1(x - w * .8)} ${f1(top + (hemY - top) * .35)} ${f1(x - hw2 * .95)} ${f1(hemY - (hemY - top) * .25)} ${f1(x - hw2)} ${f1(hemY)}L${f1(x + hw2)} ${f1(hemY)}` .replace(`L${f1(x + hw2)} ${f1(hemY)}`, "") ;
    const full = `M${f1(x - w / 2)} ${f1(top)}C${f1(x - w * .8)} ${f1(top + (hemY - top) * .35)} ${f1(x - hw2 * .95)} ${f1(hemY - (hemY - top) * .25)} ${f1(x - hw2)} ${f1(hemY)}`
      + Array.from({ length: waves }, (_, i) => { const xa = x - hw2 + 2 * hw2 * (i + 1) / waves; return `Q${f1(xa - hw2 / waves)} ${f1(hemY + (i % 2 ? -3 : 4))} ${f1(xa)} ${f1(hemY)}`; }).join("")
      + `C${f1(x + hw2 * .95)} ${f1(hemY - (hemY - top) * .25)} ${f1(x + w * .8)} ${f1(top + (hemY - top) * .35)} ${f1(x + w / 2)} ${f1(top)}Q${f1(x)} ${f1(top - 4)} ${f1(x - w / 2)} ${f1(top)}Z`;
    const lining = o.lining ? `<path d="M${f1(x - hw2 + 3)} ${f1(hemY - 2)}Q${f1(x)} ${f1(hemY + 3)} ${f1(x + hw2 - 3)} ${f1(hemY - 2)}" stroke="${o.lining}" stroke-width="3" fill="none" opacity=".9"/>` : "";
    const fl = [-.6, -.25, .25, .6].map(t => `<path d="M${f1(x + t * w * .5)} ${f1(top + 8)}C${f1(x + t * hw2 * .8)} ${f1(top + (hemY - top) * .5)} ${f1(x + t * hw2)} ${f1(hemY - 10)} ${f1(x + t * hw2 * 1.02)} ${f1(hemY - 1)}" stroke="${shd(o.col, .6)}" stroke-width="1" fill="none" opacity=".5"/>`).join("");
    return `<g class="w-cape">${ink(C, full, fab(C, o.col, [0, 0, 1, .6]), shd(o.col, .7), { heavy: W.minor })}<g clip-path="${C.clip(full)}">${fl}${o.pattern || ""}</g>${lining}
      <g clip-path="${C.clip(full)}"><path d="M${f1(x - hw2 + 6)} ${f1(hemY - 12)}C${f1(x - hw2 * .8)} ${f1(top + (hemY - top) * .55)} ${f1(x - w * .72)} ${f1(top + 14)} ${f1(x - w * .5)} ${f1(top + 6)}" stroke="${lit(o.col, .5)}" stroke-width="1.4" fill="none" opacity=".45" stroke-linecap="round"/></g></g>`;
  };
  // the clasp/collar of a cape shows in front, at the neck (body mount)
  const capeClasp = (C, F, col, gemCol) => { const [x, y, w] = F.neck; return `<path d="M${f1(x - w * .7)} ${f1(y - 2)}Q${f1(x)} ${f1(y + 5)} ${f1(x + w * .7)} ${f1(y - 2)}" stroke="${col}" stroke-width="2.6" fill="none" stroke-linecap="round"/>` + `<circle cx="${x}" cy="${f1(y + 2.4)}" r="3.4" fill="${goldF(C)}" stroke="${GL}" stroke-width=".7"/>` + (gemCol ? gem(C, x, y + 2.4, 1.8, gemCol) : ""); };
  const wingPair = (C, F, o) => { const [x, y] = F.back, s = o.size ?? 1;
    const one = side => { const m = v => x + side * v; const d = `M${f1(m(4))} ${f1(y + 10)}C${f1(m(26 * s))} ${f1(y - 30 * s)} ${f1(m(64 * s))} ${f1(y - 44 * s)} ${f1(m(84 * s))} ${f1(y - 36 * s)}C${f1(m(74 * s))} ${f1(y - 22 * s)} ${f1(m(80 * s))} ${f1(y - 8 * s)} ${f1(m(70 * s))} ${f1(y + 4 * s)}C${f1(m(72 * s))} ${f1(y + 16 * s)} ${f1(m(58 * s))} ${f1(y + 22 * s)} ${f1(m(50 * s))} ${f1(y + 34 * s)}C${f1(m(40 * s))} ${f1(y + 36 * s)} ${f1(m(28 * s))} ${f1(y + 40 * s)} ${f1(m(8))} ${f1(y + 30)}Z`;
      return ink(C, d, o.fill, o.line, { heavy: W.minor }) + `<g clip-path="${C.clip(d)}">${o.inner ? o.inner(m, s) : ""}</g>`; };
    return one(-1) + one(1); };

  // ---------- headwear pieces (head mount) ----------
  const H = F => F.head;
  const crown = (C, F, o) => { const [x, y] = H(F).top, w = H(F).w * (o.wk ?? .62), h = o.h ?? 10, pts = o.points ?? [[-1, 0], [-.7, -1], [-.38, -.35], [0, -1.3], [.38, -.35], [.7, -1], [1, 0]];
    const d = `M${f1(x - w / 2)} ${f1(y + 3)}` + pts.map(([px, py]) => `L${f1(x + px * w / 2)} ${f1(y + py * h)}`).join("") + `L${f1(x + w / 2)} ${f1(y + 3)}Q${f1(x)} ${f1(y + 6)} ${f1(x - w / 2)} ${f1(y + 3)}Z`;
    const fill = o.fill ?? goldF(C), line = o.line ?? GL;
    return `${o.glow ? glow(C, x, y - h * .4, w * .9, o.glow, .45) : ""}${ink(C, d, fill, line, { heavy: W.minor })}<path d="M${f1(x - w / 2 + 1)} ${f1(y + 1.4)}Q${f1(x)} ${f1(y + 4)} ${f1(x + w / 2 - 1)} ${f1(y + 1.4)}" stroke="${shd(o.base ?? "#E2B04A", .45)}" stroke-width="1" fill="none"/>`
      + (o.gems || []).map(([px, py, r, col, sh]) => gem(C, x + px * w / 2, y + py * h, r, col, sh)).join("")
      + `<path d="M${f1(x - w / 2 + 2)} ${f1(y - 1)}L${f1(x - w * .35)} ${f1(y - h * .8)}" stroke="#fff" stroke-width=".9" opacity=".6"/>`; };
  const beret = (C, F, o) => { const [x, y] = H(F).top, w = H(F).w * (o.wk ?? .72), dx = o.dx ?? 6, r = o.rot ?? -14;
    const d = `M${f1(x - w / 2 + dx)} ${f1(y + 2)}C${f1(x - w / 2 - 4 + dx)} ${f1(y - 9)} ${f1(x - w * .1 + dx)} ${f1(y - 15)} ${f1(x + w * .2 + dx)} ${f1(y - 13)}C${f1(x + w * .6 + dx)} ${f1(y - 11)} ${f1(x + w * .62 + dx)} ${f1(y - 1)} ${f1(x + w / 2 + dx)} ${f1(y + 2)}Q${f1(x + dx)} ${f1(y + 6)} ${f1(x - w / 2 + dx)} ${f1(y + 2)}Z`;
    return `<g transform="rotate(${r} ${x} ${y})">${ink(C, d, C.vol(o.col, { hi: .3, lo: .4, cx: .3, cy: .25 }), shd(o.col, .7), { heavy: W.minor })}
      <path d="M${f1(x - w / 2 + 2 + dx)} ${f1(y + 1.4)}Q${f1(x + dx)} ${f1(y + 4.6)} ${f1(x + w / 2 - 2 + dx)} ${f1(y + 1.4)}" stroke="${shd(o.col, .5)}" stroke-width="1.6" fill="none"/>
      ${o.topper ?? `<circle cx="${f1(x + w * .16 + dx)}" cy="${f1(y - 14)}" r="1.8" fill="${shd(o.col, .2)}" stroke="${shd(o.col, .7)}" stroke-width=".6"/>`}
      <path d="M${f1(x - w * .3 + dx)} ${f1(y - 6)}Q${f1(x - w * .1 + dx)} ${f1(y - 11)} ${f1(x + w * .1 + dx)} ${f1(y - 11.6)}" stroke="#fff" stroke-width="1" fill="none" opacity=".45"/></g>`; };
  const pointyHat = (C, F, o) => { const [x, y] = H(F).top, w = H(F).w * (o.wk ?? .8), h = o.h ?? 34, bend = o.bend ?? 8;
    const cone = `M${f1(x - w * .36)} ${f1(y)}C${f1(x - w * .2)} ${f1(y - h * .5)} ${f1(x + bend * .2)} ${f1(y - h * .8)} ${f1(x + bend)} ${f1(y - h)}C${f1(x + bend * .2)} ${f1(y - h * .62)} ${f1(x + w * .24)} ${f1(y - h * .4)} ${f1(x + w * .36)} ${f1(y)}Z`;
    const brim = `M${f1(x - w / 2 - 3)} ${f1(y + 1)}Q${f1(x)} ${f1(y - 5)} ${f1(x + w / 2 + 3)} ${f1(y + 1)}Q${f1(x + w / 2 + 4)} ${f1(y + 5)} ${f1(x + w / 2 - 2)} ${f1(y + 5)}Q${f1(x)} ${f1(y + 1)} ${f1(x - w / 2 + 2)} ${f1(y + 5)}Q${f1(x - w / 2 - 4)} ${f1(y + 5)} ${f1(x - w / 2 - 3)} ${f1(y + 1)}Z`;
    return `${ink(C, cone, C.vol(o.col, { hi: .3, lo: .45, cx: .3, cy: .35 }), shd(o.col, .7), { heavy: W.minor })}${o.band ? `<path d="M${f1(x - w * .35)} ${f1(y - 2)}Q${f1(x)} ${f1(y + 1)} ${f1(x + w * .35)} ${f1(y - 2)}" stroke="${o.band}" stroke-width="2.6" fill="none"/>` : ""}${ink(C, brim, fab(C, o.col, [0, 0, 0, 1]), shd(o.col, .7), { heavy: W.minor })}${o.deco ? o.deco(x, y, w, h, bend) : ""}`; };
  const brimHat = (C, F, o) => { const [x, y] = H(F).top, w = H(F).w * (o.wk ?? .95), ch = o.ch ?? 14, bw = o.bw ?? 1.25, rot = o.rot ?? -6;
    const brim = `M${f1(x - w * bw / 2)} ${f1(y + 2)}C${f1(x - w * bw / 2 + 4)} ${f1(y - 5)} ${f1(x + w * bw / 2 - 4)} ${f1(y - 5)} ${f1(x + w * bw / 2)} ${f1(y + 2)}C${f1(x + w * bw / 2 + 2)} ${f1(y + 7)} ${f1(x - w * bw / 2 - 2)} ${f1(y + 7)} ${f1(x - w * bw / 2)} ${f1(y + 2)}Z`;
    const dome = o.shape === "pith" ? `M${f1(x - w * .36)} ${f1(y + 1)}C${f1(x - w * .38)} ${f1(y - ch * 1.1)} ${f1(x + w * .38)} ${f1(y - ch * 1.1)} ${f1(x + w * .36)} ${f1(y + 1)}Z`
      : `M${f1(x - w * .34)} ${f1(y + 1)}C${f1(x - w * .36)} ${f1(y - ch)} ${f1(x - w * .2)} ${f1(y - ch - 2)} ${f1(x)} ${f1(y - ch + 2)}C${f1(x + w * .2)} ${f1(y - ch - 2)} ${f1(x + w * .36)} ${f1(y - ch)} ${f1(x + w * .34)} ${f1(y + 1)}Z`;
    return `<g transform="rotate(${rot} ${x} ${y})">${ink(C, brim, fab(C, o.col, [0, 0, 0, 1]), shd(o.col, .7), { heavy: W.minor })}${ink(C, dome, C.vol(o.col, { hi: .3, lo: .4 }), shd(o.col, .7), { heavy: W.minor })}
      <path d="M${f1(x - w * .35)} ${f1(y - 2)}Q${f1(x)} ${f1(y + 1)} ${f1(x + w * .35)} ${f1(y - 2)}" stroke="${o.band ?? shd(o.col, .5)}" stroke-width="3" fill="none"/>
      <path d="M${f1(x - w * .22)} ${f1(y - ch * .7)}Q${f1(x - w * .05)} ${f1(y - ch - .5)} ${f1(x + w * .1)} ${f1(y - ch)}" stroke="#fff" stroke-width="1.1" fill="none" opacity=".5"/>${o.deco ? o.deco(x, y, w, ch) : ""}</g>`; };
  const bow = (C, x, y, s, col, rot = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot}) scale(${s})">
    ${ink(C, "M0 0C-6 -8 -15 -7 -14 0C-15 7 -6 8 0 0Z", C.vol(col, { hi: .4, lo: .35 }), shd(col, .65), { heavy: 1.1 })}${ink(C, "M0 0C6 -8 15 -7 14 0C15 7 6 8 0 0Z", C.vol(col, { hi: .4, lo: .35 }), shd(col, .65), { heavy: 1.1 })}
    <path d="M-1 1L-4.4 11L-1.4 9.6L0 12L1 2Z" fill="${shd(col, .15)}" stroke="${shd(col, .65)}" stroke-width=".6"/><path d="M1 1L5.4 10L2.4 9.6L1.4 12Z" fill="${shd(col, .25)}" stroke="${shd(col, .65)}" stroke-width=".6"/>
    <path d="M-11.6 -1.6C-11 -4.4 -8.4 -5.2 -6.2 -4.4" stroke="#fff" stroke-width=".9" fill="none" opacity=".8"/>${ink(C, "M-2.8 -3Q0 -4.2 2.8 -3L2.8 3Q0 4.2 -2.8 3Z", lit(col, .1), shd(col, .65), { heavy: .9 })}</g>`;
  const hood = (C, F, o) => { const [x, y] = H(F).top, w = H(F).w, cy = y + w * .58, rx = w * .66, ry = w * .66;
    const outer = `M${f1(x)} ${f1(cy - ry * 1.18)}C${f1(x - rx * 1.25)} ${f1(cy - ry * 1.18)} ${f1(x - rx * 1.3)} ${f1(cy + ry * .5)} ${f1(x - rx * 1.05)} ${f1(cy + ry * .95)}L${f1(x - rx * .82)} ${f1(cy + ry * .78)}C${f1(x - rx * 1)} ${f1(cy)} ${f1(x - rx * .9)} ${f1(cy - ry * .86)} ${f1(x)} ${f1(cy - ry * .9)}C${f1(x + rx * .9)} ${f1(cy - ry * .86)} ${f1(x + rx * 1)} ${f1(cy)} ${f1(x + rx * .82)} ${f1(cy + ry * .78)}L${f1(x + rx * 1.05)} ${f1(cy + ry * .95)}C${f1(x + rx * 1.3)} ${f1(cy + ry * .5)} ${f1(x + rx * 1.25)} ${f1(cy - ry * 1.18)} ${f1(x)} ${f1(cy - ry * 1.18)}Z`;
    return `${ink(C, outer, fab(C, o.col, [0, 0, 1, 1]), shd(o.col, .75), { heavy: W.minor })}<path d="M${f1(x - rx * .88)} ${f1(cy + ry * .6)}C${f1(x - rx * .98)} ${f1(cy - ry * .2)} ${f1(x - rx * .7)} ${f1(cy - ry * .84)} ${f1(x)} ${f1(cy - ry * .9)}C${f1(x + rx * .7)} ${f1(cy - ry * .84)} ${f1(x + rx * .98)} ${f1(cy - ry * .2)} ${f1(x + rx * .88)} ${f1(cy + ry * .6)}" stroke="${o.trim}" stroke-width="1.8" fill="none" opacity=".95"/>${o.deco ? o.deco(x, cy, rx, ry) : ""}`; };

  // ---------- face pieces ----------
  const mask = (C, F, o) => { const [[x1, y1, r1], [x2, y2, r2]] = H(F).eyes, cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, pad = o.pad ?? 1.45, R1 = r1 * pad, R2 = r2 * pad;
    const d = `M${f1(x1 - R1 * 1.25)} ${f1(y1 - R1 * .2)}C${f1(x1 - R1)} ${f1(y1 - R1 * 1.1)} ${f1(cx - 3)} ${f1(cy - R1 * .9)} ${f1(cx)} ${f1(cy - R1 * .5)}C${f1(cx + 3)} ${f1(cy - R2 * .9)} ${f1(x2 + R2)} ${f1(y2 - R2 * 1.1)} ${f1(x2 + R2 * 1.25)} ${f1(y2 - R2 * .2)}C${f1(x2 + R2)} ${f1(y2 + R2 * .9)} ${f1(cx + 3)} ${f1(cy + R2 * .8)} ${f1(cx)} ${f1(cy + R1 * .2)}C${f1(cx - 3)} ${f1(cy + R1 * .8)} ${f1(x1 - R1)} ${f1(y1 + R1 * .9)} ${f1(x1 - R1 * 1.25)} ${f1(y1 - R1 * .2)}Z`
      + `M${f1(x1 - r1 * 1.05)} ${f1(y1)}a${f1(r1 * 1.05)} ${f1(r1 * .8)} 0 1 0 ${f1(r1 * 2.1)} 0a${f1(r1 * 1.05)} ${f1(r1 * .8)} 0 1 0 ${f1(-r1 * 2.1)} 0Z`
      + `M${f1(x2 - r2 * 1.05)} ${f1(y2)}a${f1(r2 * 1.05)} ${f1(r2 * .8)} 0 1 0 ${f1(r2 * 2.1)} 0a${f1(r2 * 1.05)} ${f1(r2 * .8)} 0 1 0 ${f1(-r2 * 2.1)} 0Z`;
    return `<path d="${d}" fill-rule="evenodd" fill="${o.line}" transform="translate(.5 .7)"/><path d="${d}" fill-rule="evenodd" fill="${fab(C, o.col, [0, 0, 0, 1])}" stroke="${o.line}" stroke-width=".9"/>${o.deco ? o.deco(x1, y1, x2, y2, R1, R2, cx, cy) : ""}`; };
  const goggles = (C, F, o) => { const E = H(F).eyes, k = o.k ?? 1.25;
    return E.map(([x, y, r]) => { const R = r * k; return `<circle cx="${x}" cy="${y}" r="${f1(R)}" fill="${o.tint}" fill-opacity="${o.op ?? .32}"/><circle cx="${x}" cy="${y}" r="${f1(R + 1.2)}" fill="none" stroke="${shd(o.frameCol, .6)}" stroke-width="4.6"/><circle cx="${x}" cy="${y}" r="${f1(R + 1.2)}" fill="none" stroke="${o.frame}" stroke-width="3.2"/><path d="M${f1(x - R * .6)} ${f1(y - R * .4)}q${f1(R * .3)} ${f1(-R * .4)} ${f1(R * .7)} ${f1(-R * .45)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".75" stroke-linecap="round"/>`; }).join("")
      + `<path d="M${f1(E[0][0] + E[0][2] * k + 2)} ${E[0][1]}Q${f1((E[0][0] + E[1][0]) / 2)} ${f1(E[0][1] - 4)} ${f1(E[1][0] - E[1][2] * k - 2)} ${E[1][1]}" stroke="${o.frameCol}" stroke-width="2.4" fill="none"/>`
      + `<path d="M${f1(E[0][0] - E[0][2] * k - 2)} ${E[0][1]}l-8 -3M${f1(E[1][0] + E[1][2] * k + 2)} ${E[1][1]}l8 -3" stroke="${o.strap}" stroke-width="2.6" stroke-linecap="round"/>`; };

  // ---------- neck pieces (body mount) ----------
  const necklaceCurve = (F, drop, wk = .9) => { const [x, y, w] = F.neck; return t => [x - w * wk / 2 + w * wk * t, y + Math.sin(Math.PI * t) * drop]; };
  const pearls = (C, F, o) => { const P = necklaceCurve(F, o.drop ?? 6, o.wk ?? 1), n = o.n ?? 11;
    return Array.from({ length: n }, (_, i) => { const [x, y] = P(i / (n - 1)); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="${o.r ?? 1.55}" fill="${C.rad([[0, "#FFFFFF"], [.6, o.col ?? "#F2EAF0"], [1, shd(o.col ?? "#C8B8C8", .3)]], { cx: .35, cy: .3 })}" stroke="${shd(o.col ?? "#B8A8B8", .3)}" stroke-width=".3"/>`; }).join(""); };
  const chain = (F, col, drop = 9, wk = .8) => { const [x, y, w] = F.neck; return `<path d="M${f1(x - w * wk / 2)} ${f1(y)}Q${f1(x)} ${f1(y + drop * 2)} ${f1(x + w * wk / 2)} ${f1(y)}" stroke="${col}" stroke-width="1" fill="none" stroke-dasharray="1.6 .8"/>`; };
  const pend = (F, drop = 9) => [F.neck[0], F.neck[1] + drop + 1.5];
  const band = (C, F, col, o = {}) => { const [x, y, w] = F.neck, h = o.h ?? 3.6, wk = o.wk ?? .9;
    const d = `M${f1(x - w * wk / 2)} ${f1(y - h / 2)}Q${f1(x)} ${f1(y + 3 - h / 2)} ${f1(x + w * wk / 2)} ${f1(y - h / 2)}L${f1(x + w * wk / 2)} ${f1(y + h / 2)}Q${f1(x)} ${f1(y + 3 + h / 2)} ${f1(x - w * wk / 2)} ${f1(y + h / 2)}Z`;
    return ink(C, d, fab(C, col, [0, 0, 0, 1]), shd(col, .7), { heavy: 1 }); };
  const scarf = (C, F, o) => { const [x, y, w] = F.neck, wk = o.wk ?? 1.15, th = o.th ?? 7;
    const wrap = `M${f1(x - w * wk / 2)} ${f1(y - th / 2)}Q${f1(x)} ${f1(y + 4 - th / 2)} ${f1(x + w * wk / 2)} ${f1(y - th / 2)}Q${f1(x + w * wk / 2 + 2)} ${f1(y + th / 2)} ${f1(x + w * wk / 2 - 1)} ${f1(y + th / 2 + 1)}Q${f1(x)} ${f1(y + 5 + th / 2)} ${f1(x - w * wk / 2 + 1)} ${f1(y + th / 2 + 1)}Q${f1(x - w * wk / 2 - 2)} ${f1(y + th / 2)} ${f1(x - w * wk / 2)} ${f1(y - th / 2)}Z`;
    const ex = x + (o.side ?? 1) * w * .22, len = o.len ?? 22;
    const end = `M${f1(ex - 3.6)} ${f1(y + 2)}C${f1(ex - 5)} ${f1(y + len * .5)} ${f1(ex - 2)} ${f1(y + len * .85)} ${f1(ex - 4)} ${f1(y + len)}L${f1(ex + 4)} ${f1(y + len + 1)}C${f1(ex + 4.6)} ${f1(y + len * .7)} ${f1(ex + 3)} ${f1(y + len * .4)} ${f1(ex + 4)} ${f1(y + 2)}Z`;
    const stripes = o.stripes ? `<g clip-path="${C.clip(end)}">${Array.from({ length: 6 }, (_, i) => `<path d="M${f1(ex - 8)} ${f1(y + 5 + i * len / 6)}h16" stroke="${o.stripes}" stroke-width="${len / 14}"/>`).join("")}</g><g clip-path="${C.clip(wrap)}">${Array.from({ length: 6 }, (_, i) => `<path d="M${f1(x - w + i * w / 2.5)} ${f1(y - 8)}v18" stroke="${o.stripes}" stroke-width="${w / 14}"/>`).join("")}</g>` : "";
    const fringe = o.fringe ? Array.from({ length: 4 }, (_, i) => `<path d="M${f1(ex - 3 + i * 2.3)} ${f1(y + len + .6)}v3" stroke="${o.fringe}" stroke-width="1" stroke-linecap="round"/>`).join("") : "";
    const knit = o.knit ? `<g clip-path="${C.clip(wrap)}">${Array.from({ length: 9 }, (_, i) => `<path d="M${f1(x - w * .6 + i * w * .15)} ${f1(y - 6)}l1.4 3 1.4 -3" stroke="${shd(o.col, .35)}" stroke-width=".7" fill="none" transform="translate(0 ${f1(4 + Math.sin(i / 8 * Math.PI) * 2)})"/>`).join("")}</g>` : "";
    return `${ink(C, end, fab(C, o.col, [0, 0, 1, 1]), shd(o.col, .7), { heavy: W.minor })}${fringe}${ink(C, wrap, fab(C, o.col, [0, 0, 0, 1]), shd(o.col, .7), { heavy: W.minor })}${stripes}${knit}
      <path d="M${f1(x - w * wk / 2 + 3)} ${f1(y - th / 2 + 1)}Q${f1(x - w * .1)} ${f1(y + 1)} ${f1(x + w * .1)} ${f1(y + .4)}" stroke="#fff" stroke-width="1" fill="none" opacity=".4"/>${o.deco || ""}`; };
  const bowtie = (C, F, o) => { const [x, y] = F.neck, s = o.s ?? 1;
    return `<g transform="translate(${x} ${f1(y + 1)}) scale(${s})">${ink(C, "M0 0L-11 -6C-13 -3 -13 3 -11 6Z", fab(C, o.col), shd(o.col, .65), { heavy: 1.1 })}${ink(C, "M0 0L11 -6C13 -3 13 3 11 6Z", fab(C, shd(o.col, .08)), shd(o.col, .65), { heavy: 1.1 })}
      <rect x="-2.6" y="-3.4" width="5.2" height="6.8" rx="1.6" fill="${shd(o.col, .15)}" stroke="${shd(o.col, .65)}" stroke-width=".6"/>${o.pattern || ""}<path d="M-10 -3.4l4 2.4" stroke="#fff" stroke-width=".8" opacity=".6"/></g>`; };

  // ---------- items ----------
  // item(k, level, ab, slug, slot, name, lore, draw, {aliases}) — draw(C, F) returns { back, body, head, arms }
  const ITEMS = [];
  const item = (k, lvl, ab, slug, slot, name, lore, draw, o = {}) => ITEMS.push({ id: `${k}.${slug}`, k, lvl, ab, slug, slot, name, lore, draw, aliases: o.aliases || [], replaces: o.replaces, covers: o.covers || [], rarity: ["common", "uncommon", "rare", "epic", "legendary"][lvl - 1] });

  // ===== Natasha (cat) =====
  item("natasha", 1, 0, "silkbow", "head", "Silk Hair Bow", "Emerald satin, tied a little too perfectly. She'll tell you it took no effort at all.",
    (C, F) => ({ head: bow(C, 76, 44, .82, "#169A6A", -18) }), { aliases: ["bow"] });
  item("natasha", 1, 1, "pearlchoker", "neck", "Pearl Choker", "A row of moonlit pearls, each one a compliment she once received.",
    (C, F) => ({ body: band(C, F, "#0E4A36", { h: 4.6, wk: 1.1 }) + pearls(C, F, { drop: 2.4, n: 12, r: 1.8, wk: 1.05, col: "#FFFFFF" }) + pearls(C, { neck: [F.neck[0], F.neck[1] + 3.6, F.neck[2] * .95] }, { drop: 3, n: 12, r: 1.5 }) }), { aliases: ["scarf"] });
  item("natasha", 2, 0, "operagloves", "arms", "Opera Gloves", "Black velvet to the elbow. Turning pages has never looked so dramatic.",
    (C, F) => ({ arms: (C2, segs, w) => { const d = ART3.tube(ART3.subSegs(segs, .4, 1), w.slice(-3).map(v => v * 1.1)); return ink(C2, d, C2.lin([[0, "#3A3446"], [.5, "#1E1A26"], [1, "#0A080E"]], [0, 0, 1, 1]), "#000", { heavy: W.minor }); } }));
  item("natasha", 2, 1, "fascinator", "head", "Feather Fascinator", "A tiny tilted hat with one dark plume, for evenings that end in mystery.",
    (C, F) => ({ head: `<g transform="rotate(-22 80 44)">${ink(C, "M68 46C68 40 90 40 90 46C90 50 68 50 68 46Z", C.vol("#1E1A24", { hi: .3 }), "#06050A", { heavy: W.minor })}${ink(C, "M84 44C91 33 97 25 96 15C93 23 88 31 80 40Z", C.lin([[0, "#3A2E4A"], [1, "#100C16"]], [0, 0, 1, 1]), "#06050A", { heavy: 1 })}<path d="M84 42C89 33 94 25 95 17" stroke="#7A6A9A" stroke-width=".7" fill="none"/><path d="M70 47C74 52 82 54 88 50" stroke="#2A2234" stroke-width=".6" fill="none" stroke-dasharray="1 1"/>${gem(C, 74, 44.6, 2, "#1FA070")}</g>` }), { aliases: ["beret", "wizhat"] });
  item("natasha", 3, 0, "rubyheart", "neck", "Ruby Heart Necklace", "Her heart, on a chain. Probably the only one she'll ever give away.",
    (C, F) => ({ body: `<path d="M${F.neck[0] - 9} ${F.neck[1]}Q${F.neck[0] + 2} ${F.neck[1] + 24} ${F.neck[0] + 12} ${F.neck[1]}" stroke="#E2C27A" stroke-width="1" fill="none" stroke-dasharray="1.6 .8"/>` + gem(C, F.neck[0] + 5, F.neck[1] + 14, 4, "#D21E3A", "heart") }), { aliases: ["pearls"] });
  item("natasha", 3, 1, "tiara", "head", "Diamond Tiara", "Vintage, delicate, and absolutely not borrowed. Don't ask.",
    (C, F) => ({ head: crown(C, F, { wk: .7, h: 7, fill: silverF(C), line: SL, base: "#C8D2DE", points: [[-1, 0], [-.6, -.5], [-.3, -.8], [0, -1.4], [.3, -.8], [.6, -.5], [1, 0]], gems: [[0, -.75, 2, "#BFE6FF", "diamond"], [-.5, -.2, 1.1, "#E8F6FF"], [.5, -.2, 1.1, "#E8F6FF"]] }) }), { aliases: ["flowers"] });
  item("natasha", 4, 0, "masquerade", "face", "Midnight Masquerade Mask", "Black lace and one emerald. Everyone knows it's her. That's the point.",
    (C, F) => ({ head: mask(C, F, { col: "#1E1A24", line: "#06050A", deco: (x1, y1, x2, y2, R1, R2, cx, cy) => `<path d="M${f1(x1 - R1 * 1.2)} ${f1(y1 - R1 * .3)}l-4 -5M${f1(x1 - R1 * 1.1)} ${f1(y1 - R1 * .6)}l-2 -6" stroke="#1E1A24" stroke-width="1.4" stroke-linecap="round"/>${gem(C, cx, cy - 2, 2.2, "#1FA070", "diamond")}<path d="M${f1(x2 - R2)} ${f1(y2 - R2 * .9)}q${f1(R2)} -2 ${f1(R2 * 1.6)} 1" stroke="#6A5A8A" stroke-width=".7" fill="none"/>` }) }));
  item("natasha", 4, 1, "furstole", "neck", "Golden Fur Stole", "Champagne-soft, faux, and worn as if she invented shoulders.",
    (C, F) => { const [x0, y] = F.neck, x = x0; const S = 1.3; const d0 = `M${x - 24} ${y + 6}C${x - 22} ${y - 6} ${x - 10} ${y - 4} ${x} ${y + 2}C${x + 10} ${y - 4} ${x + 22} ${y - 6} ${x + 24} ${y + 6}C${x + 26} ${y + 14} ${x + 20} ${y + 20} ${x + 14} ${y + 16}C${x + 8} ${y + 12} ${x - 8} ${y + 12} ${x - 14} ${y + 16}C${x - 20} ${y + 20} ${x - 26} ${y + 14} ${x - 24} ${y + 6}Z`;
      const d = d0;
      return { body: `<g transform="translate(${x} ${y}) scale(${S}) translate(${-x} ${-y})">` + ink(C, d, C.vol("#F2D8A8", { hi: .35, lo: .3 }), "#8A6A3A", { heavy: W.minor }) + tufts([[x - 22, y + 10, -2, 4], [x - 16, y + 14, -1, 4], [x + 22, y + 10, 2, 4], [x + 16, y + 14, 1, 4], [x - 6, y + 10, 0, 3], [x + 6, y + 10, 0, 3]], "#C8A070", 1, .8) + tufts([[x - 18, y + 2, -2, -2], [x + 18, y + 2, 2, -2]], "#FFF4DC", 1, .8) + `</g>` }; }, { aliases: ["cape"] });
  item("natasha", 5, 0, "celestialcrown", "head", "Celestial Diamond Crown", "Stars that agreed to float just above her head. For you, darling, they stay.",
    (C, F) => ({ head: crown(C, F, { wk: .74, h: 11, fill: silverF(C), line: SL, base: "#C8D2DE", glow: "#BFE0FF", gems: [[0, -.9, 2.4, "#BFE6FF", "diamond"], [-.66, -.6, 1.4, "#1FA070"], [.66, -.6, 1.4, "#1FA070"]] }) + [[-24, -14, 3], [0, -24, 3.6], [24, -14, 3]].map(([dx, dy, r]) => star(F.head.top[0] + dx, F.head.top[1] + dy, r, "#FFF6C8", { cls: "a3twinkle", line: "#C8A040" })).join("") }), { aliases: ["starcrown"] });
  item("natasha", 5, 1, "queengown", "torso", "Queen of Hearts Gown", "Ruby and emerald, with a train that sweeps the ballroom and every heart in it.",
    (C, F) => { const bod = "M84 119C85 114 90 112 94 114C97 115 99 118 101.5 121C104 118 106 115 109 114C114 112 118 115 119 119C121 128 120 136 117 144L89 144C85 136 82 128 84 119Z";
      const sk = "M88 142C83 152 80 164 82 176C82 184 74 192 62 201Q58 211 72 209Q86 214 100 210Q114 215 128 210Q142 215 158 208Q172 211 184 202C160 196 134 188 127 178C129 166 125 152 118 142Z";
      return { body: `${ink(C, sk, C.lin([[0, "#F25A6E"], [.45, "#B0102A"], [1, "#4A0410"]], [0, 0, 1, .8]), "#2A0208", { heavy: W.minor + .4 })}<g clip-path="${C.clip(sk)}"><path d="M70 196C96 186 136 186 182 200L186 214L66 214Z" fill="#127A58" opacity=".85"/>${[96, 108, 120, 134].map((x, i) => `<path d="M${x} 150C${x - 2 + i * 2} 172 ${x + i * 6 - 6} 190 ${x + i * 10 - 10} 208" stroke="#4A0410" stroke-width="1" fill="none" opacity=".5"/>`).join("")}${[[84, 172], [100, 188], [124, 182], [150, 198]].map(([x, y]) => gem(C, x, y, 2.2, "#FF4A6A", "heart")).join("")}</g>
        ${ink(C, bod, C.lin([[0, "#E83A50"], [1, "#6A0614"]], [0, 0, 1, 1]), "#2A0208", { heavy: W.minor })}<path d="M84.4 118.6C85.4 114.4 90 112.4 94 114C97 115.2 99 118 101.5 121C104 118 106 115.2 109 114C113.6 112.4 117.8 114.8 118.8 118.8" stroke="#E2BE6A" stroke-width="1.3" fill="none"/>${gem(C, 101.5, 128, 3, "#D21E3A", "heart")}
        ${ink(C, "M88 141Q102 145 117 141L118 146Q102 150 87 146Z", goldF(C), GL, { heavy: 1 })}` }; }, { aliases: ["mantle"] });

  // ===== Antonio (lion) =====
  item("antonio", 1, 0, "rosebrooch", "neck", "Crimson Rose Brooch", "Pinned exactly over his heart, so you always know where it is.",
    (C, F) => ({ body: `<g transform="translate(84 112)">${ink(C, "M0 4C-6 4 -8 -2 -6 -7C-3 -10 3 -10 6 -7C8 -2 6 4 0 4Z", C.rad([[0, "#FF6A7E"], [.6, "#C8102A"], [1, "#6A0614"]], { cx: .4, cy: .35 }), "#3A0408", { heavy: 1 })}<path d="M-3 -5C-1 -8 2.4 -7 2.4 -4C2.4 -1.6 -1 -.6 -2 -3" stroke="#7A0618" stroke-width=".7" fill="none"/><path d="M-5 3l-5 4l4 1ZM5 3l5 4l-4 1Z" fill="#3E8A36" stroke="#1E4A1A" stroke-width=".5"/></g>` }), { aliases: ["bow"] });
  item("antonio", 1, 1, "silkscarf", "neck", "Silk Neck Scarf", "Burgundy silk that flutters when he sighs, which is often.",
    (C, F) => ({ body: scarf(C, F, { col: "#8A1430", wk: 1.1, th: 6, len: 20, side: -1 }) }), { aliases: ["scarf"] });
  item("antonio", 2, 0, "matador", "torso", "Matador's Jacket", "Short, black and embroidered in gold. Olé is implied.",
    (C, F) => { const o = { top: 100, hem: 140, ease: 1.18, gap0: 13, gap1: 22 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      const emb = (s) => `<path d="M${100 + s * 30} 112q${s * 6} 6 0 12q${-s * 6} 6 0 12" stroke="#E2B04A" stroke-width="1.4" fill="none"/>${[0, 1, 2].map(i => `<circle cx="${100 + s * 20}" cy="${116 + i * 8}" r="1.3" fill="#E2B04A"/>`).join("")}`;
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#3A3036"], [.5, "#16121A"], [1, "#06040A"]], [0, 0, 1, 1]), "#000", { heavy: W.minor })).join("") + emb(-1) + emb(1) + `<path d="M64 104C60 100 62 96 68 98M136 104C140 100 138 96 132 98" stroke="#E2B04A" stroke-width="1.6" fill="none"/>${[-1, 1].map(s => `<path d="M${100 + s * 13} 101L${100 + s * 22} 139" stroke="#E2B04A" stroke-width="1.2"/>`).join("")}` }; });
  item("antonio", 2, 1, "poetberet", "head", "Poet's Beret", "Tilted at exactly the angle of a man about to recite a sonnet.",
    (C, F) => ({ head: beret(C, F, { col: "#4A1A30", wk: .9, dx: 8, rot: -16 }) }), { aliases: ["beret", "wizhat"] });
  item("antonio", 3, 0, "heartlocket", "neck", "Lover's Heart Locket", "Inside: a tiny folded letter. He wrote it to you. He will not say so.",
    (C, F) => ({ body: chain(F, "#E2C27A", 12, .7) + `<g transform="translate(100 ${F.neck[1] + 13})">${ink(C, "M0 7C-12 0 -6 -9 0 -4C6 -9 12 0 0 7Z", goldF(C), GL, { heavy: 1 })}<path d="M0 -3V6" stroke="${GL}" stroke-width=".6"/><path d="M-5 -3q2 -2 4 0" stroke="#fff" stroke-width=".8" fill="none" opacity=".8"/></g>` }), { aliases: ["pearls"] });
  item("antonio", 3, 1, "serenadecape", "back", "Velvet Serenade Cape", "Wine-red velvet, made to swirl at the exact moment the music swells.",
    (C, F) => ({ back: cape(C, F, { col: "#7A1430", spread: 2.2, lining: "#E2B04A" }), body: capeClasp(C, F, "#E2B04A", "#C0102A") }), { aliases: ["cape"] });
  item("antonio", 4, 0, "laurel", "head", "Golden Laurel Crown", "Awarded, by himself, for Most Romantic Lion. The judges agreed.",
    (C, F) => { const [x, y] = F.head.brow, n = 6; const leaf = (lx, ly, a) => `<g transform="translate(${f1(lx)} ${f1(ly)}) rotate(${f1(a)})">${ink(C, "M0 0C2 -3.6 8 -3.6 10 0C8 3.6 2 3.6 0 0Z", C.lin([[0, "#FFF8D0"], [.5, "#F2C440"], [1, "#9A6A10"]], [0, 0, 0, 1]), "#3A2406", { heavy: 1.3 })}<path d="M1 0H8" stroke="#9A6A10" stroke-width=".5"/></g>`;
      return { head: [-1, 1].map(s => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), ang = Math.PI * (1.05 + .4 * t); const lx = x + s * 26 * Math.cos(ang - Math.PI) * -1, ly = y - 6 - 10 * Math.sin(Math.PI * t * .9); return leaf(x + s * (26 - t * 20), y - 4 - t * 10, s > 0 ? 200 - t * 30 : -20 + t * 30); }).join("")).join("") + gem(C, x, y - 15, 2, "#C0102A") }; }, { aliases: ["flowers"] });
  item("antonio", 4, 1, "ruffledcoat", "torso", "Royal Ruffled Coat", "Ivory and gold, with ruffles that have their own fan club.",
    (C, F) => { const o = { top: 100, hem: 178, ease: 1.2, gap0: 11, gap1: 18, flare: 8 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      const ruff = Array.from({ length: 6 }, (_, i) => `<path d="M${94 - i * .2} ${104 + i * 7}q6 3 12 0q-6 5 -12 0Z" fill="#FFFFFF" stroke="#C8B89E" stroke-width=".7"/>`).join("");
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#FFFDF6"], [.6, "#EDE4D2"], [1, "#B8A88C"]], [0, 0, 1, 1]), "#6A5A3A", { heavy: W.minor })).join("") + `${[-1, 1].map(s => `<path d="M${100 + s * 12} 101L${100 + s * 19} 177" stroke="#E2B04A" stroke-width="2.2"/>`).join("")}${ruff}${buttons(F, 120, 160, 4, "#E2B04A", 80)}${buttons(F, 120, 160, 4, "#E2B04A", 120)}<path d="M62 106C58 100 62 94 70 96L72 104ZM138 106C142 100 138 94 130 96L128 104Z" fill="${goldF(C)}" stroke="${GL}" stroke-width=".7"/>` }; }, { aliases: ["mantle"] });
  item("antonio", 5, 0, "passioncrown", "head", "Crown of Eternal Passion", "Rubies that glow a little warmer whenever you open a book.",
    (C, F) => ({ head: crown(C, F, { wk: .78, h: 13, glow: "#FF6A7A", gems: [[0, -.95, 2.8, "#E0102A", "heart"], [-.7, -.65, 1.6, "#E0102A"], [.7, -.65, 1.6, "#E0102A"], [-.35, .1, 1.2, "#FF8A9A"], [.35, .1, 1.2, "#FF8A9A"]] }) }), { aliases: ["starcrown"] });
  item("antonio", 5, 1, "rosemantle", "back", "Enchanted Rose Mantle", "Scarlet, regal, and blooming with roses that never wilt.",
    (C, F) => { const roses = [[60, 170], [140, 166], [72, 196], [128, 198], [46, 196], [154, 194]].map(([x, y]) => `<g transform="translate(${x} ${y})">${ink(C, "M0 4C-6 4 -8 -2 -6 -7C-3 -10 3 -10 6 -7C8 -2 6 4 0 4Z", C.rad([[0, "#FF7A8E"], [.6, "#D0182E"], [1, "#6A0614"]], { cx: .4, cy: .35 }), "#3A0408", { heavy: .9 })}<path d="M-3 -5C-1 -8 2.4 -7 2.4 -4" stroke="#7A0618" stroke-width=".7" fill="none"/></g>`).join("");
      return { back: glow(C, 100, 120, 70, "#FF5A72", .22) + cape(C, F, { col: "#A8102A", spread: 2.4, lining: "#E2B04A", pattern: roses }), body: capeClasp(C, F, "#E2B04A", "#E0102A") }; }, { aliases: ["mantle"] });

  // ===== Professor Hoot (owl) =====
  item("hoot", 1, 0, "tweedbow", "neck", "Academic Bow Tie", "Tweed, slightly lopsided, and older than most of the library.",
    (C, F) => ({ body: bowtie(C, F, { col: "#7A6A4A", s: 1.05, pattern: `<path d="M-10 -2h8M-10 1h8M2 -2h8M2 1h8" stroke="#4A3A22" stroke-width=".6" opacity=".7"/>` }) }), { aliases: ["bow"] });
  item("hoot", 1, 1, "monocle", "face", "Monocle of Curiosity", "Brass, polished, and pointed at whatever's most interesting.",
    (C, F) => { const [x, y, r] = F.head.eyes[1]; return { head: `<circle cx="${x}" cy="${y}" r="${f1(r * 1.25)}" fill="#DDEEFF" fill-opacity=".14" stroke="#3A2A10" stroke-width="3"/><circle cx="${x}" cy="${y}" r="${f1(r * 1.25)}" fill="none" stroke="${goldF(C)}" stroke-width="1.8"/><path d="M${f1(x - r * .7)} ${f1(y - r * .6)}q${f1(r * .4)} ${f1(-r * .5)} ${f1(r)} ${f1(-r * .55)}" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/><path d="M${f1(x + r * 1.25)} ${y}C${f1(x + r * 2.4)} ${f1(y + 12)} ${f1(x + r * 1.6)} ${f1(y + 26)} ${f1(x + r * .6)} ${f1(y + 32)}" stroke="#E2B04A" stroke-width="1" fill="none" stroke-dasharray="1.4 1"/>` }; }, { aliases: ["pearls"] });
  item("hoot", 2, 0, "mortarboard", "head", "Scholar's Mortarboard", "Earned with honours, a few centuries ago. The tassel still swings.",
    (C, F) => { const [x, y] = F.head.top; return { head: `${ink(C, `M${x - 16} ${y + 2}C${x - 16} ${y - 7} ${x + 16} ${y - 7} ${x + 16} ${y + 2}Q${x} ${y + 6} ${x - 16} ${y + 2}Z`, C.vol("#1E1E2A"), "#000", { heavy: W.minor })}${ink(C, `M${x - 30} ${y - 6}L${x} ${y - 16}L${x + 30} ${y - 6}L${x} ${y + 3}Z`, C.lin([[0, "#3A3A4A"], [1, "#0E0E16"]], [0, 0, 1, 1]), "#000", { heavy: W.minor })}<path d="M${x - 22} ${y - 8}L${x} ${y - 14}" stroke="#6A6A80" stroke-width=".9" opacity=".7"/><circle cx="${x}" cy="${y - 6}" r="1.6" fill="#E2B04A"/><path class="a3tassel" d="M${x} ${y - 6}L${x + 20} ${y - 4}L${x + 22} ${y + 10}" stroke="#E2B04A" stroke-width="1.3" fill="none"/><path d="M${x + 20} ${y + 9}l2 8l2 -8Z" fill="#E2B04A" stroke="${GL}" stroke-width=".5"/>` }; }, { aliases: ["beret", "wizhat"] });
  item("hoot", 2, 1, "oxfordscarf", "neck", "Oxford Scarf", "Bottle green and gold, the colours of a college that may not exist.",
    (C, F) => ({ body: scarf(C, F, { col: "#1E5A3A", stripes: "#E2B04A", wk: 1.1, th: 8, len: 30, side: -1, fringe: "#E2B04A" }) }), { aliases: ["scarf"] });
  item("hoot", 3, 0, "pocketwatch", "neck", "Pocket Watch of Ages", "It runs a little slow, so the good chapters last longer.",
    (C, F) => ({ body: `<path d="M86 118C90 130 104 132 112 136" stroke="#E2C27A" stroke-width="1.1" fill="none" stroke-dasharray="1.6 .8"/><g transform="translate(116 140)">${ink(C, "M-7 0A7 7 0 1 0 7 0A7 7 0 1 0 -7 0Z", goldF(C), GL, { heavy: 1.1 })}<circle r="5" fill="#FFF8E8" stroke="${GL}" stroke-width=".5"/><path d="M0 0V-3.6M0 0L2.6 1.4" stroke="#3A2A10" stroke-width=".8" stroke-linecap="round"/><rect x="-1.4" y="-9.6" width="2.8" height="2.6" rx=".6" fill="${goldF(C)}" stroke="${GL}" stroke-width=".5"/><path d="M-4 -4q2 -2 4 -2" stroke="#fff" stroke-width=".7" fill="none" opacity=".8"/></g>` }), { aliases: ["pearls"] });
  item("hoot", 3, 1, "librarianvest", "torso", "Librarian's Waistcoat", "Deep green, embroidered with the call numbers of his favourite books.",
    (C, F) => { const o = { top: 106, hem: 164, ease: .95, gap0: 4, gap1: 2 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#2E6A4A"], [.5, "#1A4A30"], [1, "#0A2A18"]], [0, 0, 1, 1]), "#04140A", { heavy: W.minor })).join("") + `<g fill="#E2B04A" font-family="Georgia,serif" font-size="4.2" opacity=".85"><text x="74" y="128">823.9</text><text x="74" y="140">PR</text><text x="110" y="132">LB</text><text x="108" y="146">1601</text></g>${buttons(F, 120, 156, 4, "#E2B04A", 97)}` }; }, { aliases: ["cape"] });
  item("hoot", 4, 0, "grandrobe", "torso", "Grandmaster's Robe", "Midnight blue, with sleeves deep enough to hide three paperbacks.",
    (C, F) => { const o = { top: 104, hem: 200, ease: 1.08, gap0: 6, gap1: 10, flare: 4 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#2A3A7A"], [.5, "#16204A"], [1, "#080C22"]], [0, 0, 1, 1]), "#02040E", { heavy: W.minor })).join("") + `${[-1, 1].map(s => `<path d="M${100 + s * 6} 104L${100 + s * 10} 200" stroke="#E2B04A" stroke-width="2.4"/>`).join("")}${folds(F, 150, 196, 4, "#02040E", .5, .8)}${[[70, 150], [130, 172], [76, 186]].map(([x, y]) => star(x, y, 2.4, "#E2C27A")).join("")}` }; });
  item("hoot", 4, 1, "celestialcap", "head", "Celestial Scholar's Cap", "Pointed, starry, and full of questions nobody has answered yet.",
    (C, F) => ({ head: pointyHat(C, F, { col: "#22306A", wk: .9, h: 30, bend: 9, band: "#E2B04A", deco: (x, y, w, h, b) => [[-6, -10, 2.2], [4, -20, 1.8], [-2, -28, 1.5], [8, -6, 1.6]].map(([dx, dy, r]) => star(x + dx, y + dy, r, "#FFE6A0")).join("") + `<path d="M${x + b} ${y - h}c2 -1 4 1 3 3" stroke="#E2B04A" stroke-width="1" fill="none"/>` }) }), { aliases: ["flowers"] });
  item("hoot", 5, 0, "wisdomcrown", "head", "Crown of Infinite Wisdom", "Sapphire and gold. It hums very quietly when you learn something.",
    (C, F) => ({ head: crown(C, F, { wk: .74, h: 12, glow: "#7AB8FF", gems: [[0, -.95, 2.6, "#2A6ADA", "diamond"], [-.7, -.65, 1.5, "#2A6ADA"], [.7, -.65, 1.5, "#2A6ADA"], [0, .15, 1.3, "#BFE6FF"]] }) }), { aliases: ["starcrown"] });
  item("hoot", 5, 1, "libraryrobes", "torso", "Living Library Robes", "Runes drift across the cloth like footnotes. Some pages float free.",
    (C, F) => { const o = { top: 104, hem: 200, ease: 1.08, gap0: 6, gap1: 10, flare: 4 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      const rune = (x, y) => `<path d="M${x - 1.6} ${y + 2.4}l1.6 -4.8l1.6 4.8M${x - 1.1} ${y + .6}h2.2" stroke="#BFE0FF" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      const page = (x, y, r) => `<g class="a3float" transform="translate(${x} ${y}) rotate(${r})"><path d="M-5 -6h10v12h-10Z" fill="#FFF8E8" stroke="#8A7A5A" stroke-width=".6"/><path d="M-3 -3h6M-3 0h6M-3 3h4" stroke="#B8A888" stroke-width=".6"/></g>`;
      return { back: glow(C, 100, 140, 70, "#7AB8FF", .2), body: [L, R].map(d => ink(C, d, C.lin([[0, "#3A4A9A"], [.5, "#1E2A6A"], [1, "#0A1030"]], [0, 0, 1, 1]), "#02040E", { heavy: W.minor })).join("") + `${[-1, 1].map(s => `<path d="M${100 + s * 6} 104L${100 + s * 10} 200" stroke="#BFE0FF" stroke-width="2"/>`).join("")}${[[72, 146], [80, 176], [126, 156], [118, 186], [70, 192]].map(([x, y]) => rune(x, y)).join("")}${page(52, 120, -18)}${page(150, 110, 14)}${page(158, 160, -8)}` }; }, { aliases: ["mantle"] });

  // ===== Corvin (raven) =====
  item("corvin", 1, 0, "eyepatch", "face", "Veteran's Eyepatch", "He insists the eye underneath is fine. He insists on many things.",
    (C, F) => { const [x, y, r] = F.head.eyes[0]; return { head: `<path d="M${f1(x - r * 1.6)} ${f1(y - r * 1.6)}L${f1(x + r * 3.4)} ${f1(y - r * 2.6)}M${f1(x - r * 1.2)} ${f1(y + r * .6)}L${f1(x - r * 3)} ${f1(y + r * 1.8)}" stroke="#2A1A10" stroke-width="1.4" stroke-linecap="round"/>${ink(C, `M${f1(x - r * 1.3)} ${f1(y - r * .6)}C${f1(x - r * 1.2)} ${f1(y - r * 1.5)} ${f1(x + r * 1.3)} ${f1(y - r * 1.5)} ${f1(x + r * 1.3)} ${f1(y - r * .2)}C${f1(x + r * 1.2)} ${f1(y + r * 1.2)} ${f1(x - r * 1.1)} ${f1(y + r * 1.1)} ${f1(x - r * 1.3)} ${f1(y - r * .6)}Z`, C.vol("#2A1E18", { hi: .25 }), "#000", { heavy: 1.2 })}<path d="M${f1(x - r * .6)} ${f1(y - r * .9)}q${f1(r * .6)} ${f1(-r * .3)} ${f1(r * 1.2)} 0" stroke="#6A5A4A" stroke-width=".8" fill="none"/>` }; }, { aliases: ["bow"] });
  item("corvin", 1, 1, "bracers", "arms", "Warrior's Bracers", "Worn iron, dented in all the right places. Each dent has a story. Each story has improved.",
    (C, F) => ({ arms: (C2) => [150, 166].map((y, i) => `${ink(C2, `M64 ${y}C70 ${y - 3} 84 ${y - 3} 90 ${y}L90 ${y + 8}C84 ${y + 5} 70 ${y + 5} 64 ${y + 8}Z`, ironF(C2), "#14161C", { heavy: 1.2 })}<path d="M66 ${y + 2}C72 ${y} 82 ${y} 88 ${y + 2}" stroke="#C8CED8" stroke-width=".8" fill="none" opacity=".7"/>${[70, 84].map(x => `<circle cx="${x}" cy="${y + 4}" r=".9" fill="#C8CED8"/>`).join("")}`).join("") }), { aliases: ["scarf"] });
  item("corvin", 2, 0, "warscarf", "neck", "Crimson War Scarf", "Torn at the ends, and he will tell you exactly how.",
    (C, F) => ({ body: scarf(C, F, { col: "#A8142A", wk: 1.05, th: 7, len: 30, side: 1, deco: `<path d="M${F.neck[0] + 4} ${F.neck[1] + 31}l2 -4l2 5l2 -4" stroke="#5A0610" stroke-width=".8" fill="none"/>` }) }), { aliases: ["beret", "wizhat"] });
  item("corvin", 2, 1, "pauldrons", "torso", "Iron Battle Pauldrons", "Angular steel shoulders, so he always looks one size bigger.", 
    (C, F) => ({ body: [-1, 1].map(s => { const x = 100 + s * 22; return [0, 6, 12].map(dy => ink(C, `M${x - 13} ${104 + dy}L${x - 9} ${96 + dy}L${x + 9} ${96 + dy}L${x + 13} ${104 + dy}L${x} ${107 + dy}Z`, ironF(C), "#14161C", { heavy: W.minor })).reverse().join("") + `<path d="M${x - 10} ${98}L${x + 8} ${98}" stroke="#E0E6EE" stroke-width="1" opacity=".7"/><circle cx="${x}" cy="${101}" r="1.4" fill="#E2B04A"/>`; }).join("") }), { replaces: ["pauldron"] });
  item("corvin", 3, 0, "dragonfang", "head", "Dragonfang Helm", "Horned, dramatic, and a little too big. He grows into it every day.",
    (C, F) => { const helm = "M70 49C68 33 82 22 100 22C118 22 130 32 131 46C125 43 113 41 100 41C88 41 77 44 70 49Z";
      const horn = (d) => ink(C, d, C.lin([[0, "#FFF6E0"], [.6, "#D8C49A"], [1, "#7A6A46"]], [0, 0, 1, 1]), "#3A2E1A", { heavy: W.minor });
      return { head: horn("M78 37C66 36 54 30 47 19C58 26 68 29 82 29Z") + horn("M120 31C132 28 142 22 147 14C146 24 138 32 126 37Z") + ink(C, helm, C.lin([[0, "#5A4A3A"], [.5, "#3A2E24"], [1, "#1A120C"]], [0, 0, 1, 1]), "#0A0604", { heavy: W.major }) + `<path d="M70 49C77 44 88 41 100 41C113 41 125 43 131 46L131 49.4C125 46.6 113 44.6 100 44.6C88 44.6 77 47.4 70 52.4Z" fill="${goldF(C)}" stroke="${GL}" stroke-width=".7"/>${[[84, 30], [94, 26], [106, 26], [116, 30]].map(([x, y]) => `<path d="M${x - 2} ${y + 3}L${x} ${y - 3}L${x + 2} ${y + 3}Z" fill="#E8DCC0" stroke="#3A2E1A" stroke-width=".5"/>`).join("")}<path d="M80 34C86 28 94 25 100 25" stroke="#8A7A6A" stroke-width="1.2" fill="none" opacity=".7"/>` }; }, { aliases: ["flowers"] });
  item("corvin", 3, 1, "battlecloak", "back", "Champion's Battle Cloak", "Massive, crimson, fastened with a raven clasp. It billows even indoors.",
    (C, F) => ({ back: cape(C, F, { col: "#B0182E", spread: 2.9, lining: "#1A1E30", waves: 5 }), body: capeClasp(C, F, "#1A1E30", "#E2B04A") }), { aliases: ["cape"] });
  item("corvin", 4, 0, "ravenarmor", "torso", "Royal Raven Armor", "Feather-shaped plates of black and gold, fit for the smallest king.",
    (C, F) => { const plate = "M83 103Q100 95 117 103C124 118 122 136 115 149Q100 157 85 149C78 136 76 118 83 103Z";
      const feather = (x, y) => `<path d="M${x - 5} ${y}Q${x} ${y + 7} ${x + 5} ${y}Q${x} ${y + 3} ${x - 5} ${y}Z" fill="${goldF(C)}" stroke="${GL}" stroke-width=".4"/>`;
      return { body: ink(C, plate, C.lin([[0, "#3A3E52"], [.4, "#1A1C28"], [1, "#06070C"]], [0, 0, 1, 1]), "#000", { heavy: W.minor + .3 }) + `<g clip-path="${C.clip(plate)}">${[0, 1, 2, 3, 4].map(r => [-1, 0, 1].map(i => feather(100 + i * 9 + (r % 2) * 4.5 - 2, 110 + r * 9)).join("")).join("")}</g><path d="M100 99C99 116 99 136 100 154" stroke="#E2B04A" stroke-width="1.4"/>${gem(C, 100, 122, 2.6, "#C0102A", "diamond")}<path d="M86 108Q89 104 95 102.6" stroke="#8A90A8" stroke-width="1.2" fill="none"/>` }; }, { aliases: ["pearls"] });
  item("corvin", 4, 1, "conquerorcrown", "head", "Crown of the Conqueror", "Five iron prongs. One for each battle he definitely won.",
    (C, F) => ({ head: crown(C, F, { wk: .8, h: 12, fill: ironF(C), line: "#14161C", base: "#5A6272", points: [[-1, 0], [-.85, -1], [-.6, -.2], [-.3, -1.2], [0, -.2], [.3, -1.3], [.6, -.2], [.85, -1.1], [1, 0]], gems: [[-.3, -.6, 1.3, "#C0102A"], [.3, -.6, 1.3, "#C0102A"]] }) }));
  item("corvin", 5, 0, "victorhelm", "head", "Helm of the Eternal Victor", "Obsidian, rune-lit, and very slightly smug.",
    (C, F) => { const helm = "M70 49C68 33 82 22 100 22C118 22 130 32 131 46C125 43 113 41 100 41C88 41 77 44 70 49Z";
      const rune = (x, y) => `<path d="M${x - 1.6} ${y + 2.4}l1.6 -4.8l1.6 4.8M${x - 1.1} ${y + .6}h2.2" stroke="#9A7AFF" stroke-width="1" fill="none" stroke-linecap="round"/>`;
      return { head: glow(C, 100, 30, 34, "#9A6AFF", .3) + ink(C, "M98 23C97 19 99 15 103 12C103 16 105 19 107 23Z", C.lin([[0, "#5A4A8A"], [1, "#1A1030"]], [0, 0, 1, 1]), "#000", { heavy: W.minor }) + ink(C, helm, C.lin([[0, "#3A3446"], [.45, "#14101C"], [1, "#04030A"]], [0, 0, 1, 1]), "#000", { heavy: W.major }) + rune(86, 32) + rune(100, 30) + rune(114, 32) + `<path d="M70 49C77 44 88 41 100 41C113 41 125 43 131 46L131 49.4C125 46.6 113 44.6 100 44.6C88 44.6 77 47.4 70 52.4Z" fill="#7A5ACA" stroke="#2A1A4A" stroke-width=".7"/><path d="M80 32C86 26 94 24 100 24" stroke="#6A6280" stroke-width="1.3" fill="none" opacity=".8"/>` }; }, { aliases: ["starcrown"] });
  item("corvin", 5, 1, "unfallenwings", "back", "Wings of the Unfallen", "Ceremonial wing armour in crimson and black. He has never once fallen. Mostly.",
    (C, F) => ({ back: glow(C, 100, 100, 80, "#FF3A4A", .18) + wingPair(C, { back: [100, 110] }, { size: .95, fill: C.lin([[0, "#3A2A36"], [.5, "#1A1018"], [1, "#06040A"]], [0, 0, 1, 1]), line: "#000", inner: (m, s) => [0, 1, 2, 3].map(i => `<path d="M${f1(m(14 + i * 14))} ${f1(110 - 6 - i * 6)}C${f1(m(30 + i * 14))} ${f1(110 + 4)} ${f1(m(34 + i * 12))} ${f1(110 + 20)} ${f1(m(26 + i * 10))} ${f1(110 + 34 - i * 2)}" stroke="#C0182E" stroke-width="2.4" fill="none" opacity=".9"/>`).join("") + `<path d="M${f1(m(10))} ${f1(110 - 4)}C${f1(m(40))} ${f1(110 - 40)} ${f1(m(64))} ${f1(110 - 46)} ${f1(m(82))} ${f1(110 - 36)}" stroke="#E2B04A" stroke-width="1.6" fill="none"/>` }) }), { aliases: ["mantle"] });

  // ===== Ember (fox) =====
  item("ember", 1, 0, "thiefribbon", "neck", "Thief's Ribbon", "Slim black velvet. Stolen, obviously. From whom? She'll never say.",
    (C, F) => ({ body: band(C, F, "#4A1626", { h: 3.8, wk: 1.3 }) + `<path d="M${F.neck[0] - F.neck[2] * .62} ${F.neck[1] - 1.4}Q${F.neck[0]} ${F.neck[1] + 1.6} ${F.neck[0] + F.neck[2] * .62} ${F.neck[1] - 1.4}" stroke="#C86A82" stroke-width=".7" fill="none"/><g transform="translate(${F.neck[0] + 9} ${F.neck[1] + 2})"><path d="M0 0l-3 9l3 -2l2 3Z" fill="#4A1626" stroke="#1A0408" stroke-width=".5"/></g>` + gem(C, F.neck[0], F.neck[1] + 2.4, 1.6, "#F2A832") }), { aliases: ["bow"] });
  item("ember", 1, 1, "readingberet", "head", "Reading Beret", "Crooked on purpose. Her best disguise is looking like a bookworm.",
    (C, F) => ({ head: beret(C, F, { col: "#C8601E", wk: .78, dx: -6, rot: 12 }) }), { aliases: ["beret"] });
  item("ember", 2, 0, "secretscarf", "neck", "Knitted Secret-Keeper Scarf", "Amber and charcoal stripes. Each stripe hides a secret. There are a lot of stripes.",
    (C, F) => ({ body: scarf(C, F, { col: "#3A3640", stripes: "#F2A832", wk: 1.4, th: 8, len: 34, side: 1, fringe: "#F2A832", knit: 1 }) }), { aliases: ["scarf"] });
  item("ember", 2, 1, "wizardhat", "head", "Little Wizard Hat", "Navy, pointed, one gold star. She's not a wizard. She just borrowed the hat.",
    (C, F) => ({ head: pointyHat(C, F, { col: "#1E2A5A", wk: .78, h: 34, bend: -10, band: "#E2B04A", deco: (x, y) => star(x - 2, y - 14, 3.4, "#FFD860", { line: "#8A6420" }) }) }), { aliases: ["wizhat"] });
  item("ember", 3, 0, "lockpickearrings", "ears", "Silver Lockpick Earrings", "Tiny, mismatched, and fully functional. Just in case.",
    (C, F) => ({ head: F.head.ears.map(([x, y], i) => `<circle cx="${x}" cy="${y + 2}" r="1.6" fill="none" stroke="#D8DCE6" stroke-width="1"/><path d="M${x} ${y + 3.6}v${i ? 8 : 6}${i ? "l2 0" : "l-1.6 1.4l1.6 1.4"}" stroke="#D8DCE6" stroke-width="1.1" fill="none" stroke-linecap="round"/>`).join("") }), { aliases: ["pearls"] });
  item("ember", 3, 1, "shadowmask", "face", "Shadow Operative Mask", "Sleek, dark, and somehow it makes her grin even more suspicious.",
    (C, F) => ({ head: mask(C, F, { col: "#1A1A22", line: "#000", pad: 1.35, deco: (x1, y1, x2, y2, R1, R2) => `<path d="M${f1(x1 - R1 * 1.25)} ${f1(y1 - R1 * .2)}l-6 4M${f1(x2 + R2 * 1.25)} ${f1(y2 - R2 * .2)}l6 4" stroke="#1A1A22" stroke-width="2" stroke-linecap="round"/><path d="M${f1(x1 - R1 * .6)} ${f1(y1 - R1 * .95)}q${f1(R1 * .8)} -2 ${f1(R1 * 1.5)} -.6" stroke="#5A5A6A" stroke-width=".8" fill="none"/>` }) }));
  item("ember", 4, 0, "moonshadow", "back", "Moonshadow Cape", "Silver constellations on the lining. Perfect for disappearing at midnight.",
    (C, F) => ({ back: cape(C, F, { col: "#1A2232", spread: 2.6, lining: "#C8D2DE", pattern: [[70, 150, 2], [130, 160, 1.6], [62, 186, 1.8], [140, 194, 2.2], [100, 176, 1.4]].map(([x, y, r]) => star(x, y, r, "#E8EEF8")).join("") + `<path d="M70 150L100 176L130 160M62 186L100 176" stroke="#C8D2DE" stroke-width=".5" opacity=".6"/>` }), body: capeClasp(C, F, "#C8D2DE", "#BFE6FF") }), { aliases: ["cape"] });
  item("ember", 4, 1, "foxfirehood", "head", "Foxfire Hood", "Rune-stitched and glowing amber at the edges. Ears out, always.",
    (C, F) => ({ head: hood(C, F, { col: "#3A1E14", trim: "#FFB040", deco: (x, cy, rx, ry) => [-1, 1].map(s => `<path d="M${f1(x + s * rx * 1.1)} ${f1(cy + ry * .2)}l${s * 2} -3l${s * 1.6} 3" stroke="#FFB040" stroke-width=".9" fill="none"/>`).join("") }) }), { aliases: ["flowers"] });
  item("ember", 5, 0, "stolenstars", "head", "Crown of Stolen Stars", "Every star a different heist. She keeps the receipts. (There are no receipts.)",
    (C, F) => { const [x, y] = F.head.top; return { head: glow(C, x, y - 8, 30, "#FFD860", .3) + `<path d="M${x - 20} ${y + 2}Q${x} ${y - 4} ${x + 20} ${y + 2}" stroke="${goldF(C)}" stroke-width="2.4" fill="none"/>` + [[-16, -6, 3.6], [-8, -13, 4.4], [0, -17, 5.6], [8, -13, 4.4], [16, -6, 3.6]].map(([dx, dy, r]) => star(x + dx, y + dy, r, "#FFE27A", { line: "#8A6420", cls: "a3twinkle" })).join("") }; }, { aliases: ["starcrown"] });
  item("ember", 5, 1, "thousandsecrets", "back", "Mantle of a Thousand Secrets", "Dark as a locked room, with glyphs that flicker and vanish before you can read them.",
    (C, F) => { const rune = (x, y) => `<path class="a3twinkle" d="M${x - 1.6} ${y + 2.4}l1.6 -4.8l1.6 4.8M${x - 1.1} ${y + .6}h2.2" stroke="#FFB040" stroke-width=".9" fill="none" stroke-linecap="round"/>`;
      return { back: glow(C, 100, 150, 70, "#FF9A3A", .18) + cape(C, F, { col: "#140E18", spread: 2.9, lining: "#FFB040", waves: 5, pattern: [[66, 150], [134, 156], [58, 182], [142, 186], [80, 196], [120, 198]].map(([x, y]) => rune(x, y)).join("") }), body: capeClasp(C, F, "#FFB040", "#FF8A1A") }; }, { aliases: ["mantle"] });

  // ===== Sir Wartsworth (toad) =====
  item("wartsworth", 1, 0, "safetygoggles", "face", "Safety Goggles", "Oversized, green-tinted, and absolutely essential. Safety first. Science second. Snacks third.",
    (C, F) => ({ head: goggles(C, F, { frame: "#2A2A30", frameCol: "#3A3A44", tint: "#7AF09A", op: .3, strap: "#2A2A30", k: 1.2 }) }), { aliases: ["beret"] });
  item("wartsworth", 1, 1, "periodicbow", "neck", "Periodic Bow Tie", "Covered in tiny element symbols. He knows all of them. He will tell you.",
    (C, F) => ({ body: bowtie(C, F, { col: "#2A6ADA", s: 1.1, pattern: `<g fill="#fff" font-family="Arial,sans-serif" font-size="3.2" font-weight="700"><text x="-9.6" y="1">Fe</text><text x="4.6" y="1">Au</text></g>` }) }), { aliases: ["bow"] });
  item("wartsworth", 2, 0, "headlamp", "head", "Inventor's Headlamp", "A copper band and a tiny lamp, for reading the fine print of the universe.",
    (C, F) => ({ head: `<path d="M64 98Q100 90 136 98" stroke="#B8682A" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M64 97Q100 89 136 97" stroke="#F0A060" stroke-width="1" fill="none" opacity=".7"/>${glow(C, 100, 92, 14, "#FFF6A0", .5)}${ink(C, "M93 92C93 86 107 86 107 92C107 97 93 97 93 92Z", goldF(C), GL, { heavy: 1.1 })}<circle cx="100" cy="91.6" r="4" fill="${C.rad([[0, "#FFFFFF"], [.5, "#FFF6A0"], [1, "#E8C040"]])}"/>` }), { aliases: ["wizhat"] });
  item("wartsworth", 2, 1, "chemgloves", "arms", "Chemist's Gloves", "Spotless white, and the only thing about him that stays tidy.",
    (C, F) => ({ arms: (C2, segs, w) => { const d = ART3.tube(ART3.subSegs(segs, .7, 1), w.slice(-2).map(v => v * 1.16)), e = segs[segs.length - 1][3], fill = C2.lin([[0, "#FFFFFF"], [.6, "#E6EEF6"], [1, "#AFC0D2"]], [0, 0, 1, 1]); return ink(C2, d, fill, "#3A4A60", { heavy: W.minor }) + ink(C2, `M${e[0] - 6.4} ${e[1]}C${e[0] - 6.4} ${e[1] - 6.6} ${e[0] + 6.4} ${e[1] - 6.6} ${e[0] + 6.4} ${e[1]}C${e[0] + 6.4} ${e[1] + 5.2} ${e[0] - 6.4} ${e[1] + 5.2} ${e[0] - 6.4} ${e[1]}Z`, fill, "#3A4A60", { heavy: W.minor }) + `<path d="M${e[0] - 4} ${e[1] - 6}q4 2 8 0" stroke="#7A9AC8" stroke-width="1.4" fill="none"/>`; } }), { aliases: ["scarf"] });
  item("wartsworth", 3, 0, "madwig", "head", "Mad Scientist Wig", "Comically wild and very white. Wearing it adds 40% to every idea.",
    (C, F) => ({ head: [[60, 82, 9], [56, 96, 8], [64, 70, 8], [140, 82, 9], [144, 96, 8], [136, 70, 8], [100, 64, 7], [88, 64, 6], [112, 64, 6]].map(([x, y, r]) => ink(C, `M${x - r} ${y}C${x - r} ${y - r * 1.2} ${x + r} ${y - r * 1.2} ${x + r} ${y}C${x + r} ${y + r} ${x - r} ${y + r} ${x - r} ${y}Z`, C.vol("#F4F6FA", { hi: .3, lo: .25 }), "#7A808A", { heavy: 1 })).join("") + tufts([[56, 80, -4, -3], [144, 80, 4, -3], [100, 58, 0, -4], [60, 100, -4, 2], [140, 100, 4, 2]], "#C8CED8", .9, .8) }), { aliases: ["flowers"] });
  item("wartsworth", 3, 1, "alchemistapron", "torso", "Alchemist's Apron", "Thick leather with a row of test tubes, each a different colour of maybe.",
    (C, F) => { const d = garment(F, { top: 132, hem: 196, ease: .82, neck: "high" });
      const tube = (x, col) => `<rect x="${x - 2}" y="150" width="4" height="12" rx="2" fill="${col}" stroke="#2A2A30" stroke-width=".5" opacity=".9"/><rect x="${x - 2}" y="148.6" width="4" height="2" fill="#8A5A2A"/>`;
      return { body: `<path d="M${88} 132L82 122M112 132L118 122" stroke="#5A3418" stroke-width="2.2"/>${ink(C, d, C.lin([[0, "#A86A3A"], [.5, "#7A4A22"], [1, "#3A2010"]], [0, 0, 1, 1]), "#1A0C04", { heavy: W.minor })}<path d="M82 160h36" stroke="#3A2010" stroke-width="5" opacity=".55"/>${tube(86, "#9AF070")}${tube(94, "#FF8AB0")}${tube(102, "#8AC8FF")}${tube(110, "#FFD860")}<path d="M80 136C82 160 82 180 84 194" stroke="#C8946A" stroke-width="1.2" fill="none" opacity=".5"/>` }; }, { aliases: ["pearls"] });
  item("wartsworth", 4, 0, "quantumcoat", "torso", "Quantum Research Coat", "Lined with luminous blue. It's in two places at once, mostly in the way.",
    (C, F) => { const o = { top: 126, hem: 200, ease: 1.1, gap0: 6, gap1: 16, flare: 6 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#FFFFFF"], [.6, "#E2E8F0"], [1, "#9AA6B8"]], [0, 0, 1, 1]), "#3A4250", { heavy: W.minor })).join("") + `${[-1, 1].map(s => `<path d="M${100 + s * 7} 128L${100 + s * 16} 198" stroke="#3AB8FF" stroke-width="2.4"/><path d="M${100 + s * 7} 128L${100 + s * 16} 198" stroke="#BFF0FF" stroke-width=".8"/>`).join("")}<g class="a3float" opacity=".35">${[-1, 1].map(s => `<path d="M${100 + s * 9} 128L${100 + s * 18} 198" stroke="#3AB8FF" stroke-width="1"/>`).join("")}</g><circle cx="74" cy="160" r="5" fill="none" stroke="#3AB8FF" stroke-width="1"/><circle cx="74" cy="160" r="1.6" fill="#3AB8FF"/><ellipse cx="74" cy="160" rx="8" ry="3" fill="none" stroke="#3AB8FF" stroke-width=".7" transform="rotate(-30 74 160)"/>` }; }, { aliases: ["cape"] });
  item("wartsworth", 4, 1, "antigravgoggles", "face", "Anti-Gravity Goggles", "Brass frames and floating crystals. Things look lighter through them. Including him.",
    (C, F) => ({ head: goggles(C, F, { frame: goldF(C), frameCol: "#8A6420", tint: "#C8A0FF", op: .35, strap: "#5A3418", k: 1.25 }) + [[60, 64, 2.4], [140, 62, 2], [100, 56, 2.6]].map(([x, y, r]) => `<g class="a3float">${gem(C, x, y, r, "#B080FF", "diamond")}</g>`).join("") }));
  item("wartsworth", 5, 0, "inventorcrown", "head", "Crown of the Grand Inventor", "A miniature orbital crown. The little planets are, technically, his.",
    (C, F) => { const [x, y] = F.head.top; return { head: crown(C, F, { wk: .9, h: 9, glow: "#8AC8FF", gems: [[0, -.95, 2.2, "#3A8ADA"]] }) + `<ellipse cx="${x}" cy="${y - 10}" rx="30" ry="7" fill="none" stroke="#E2B04A" stroke-width="1" opacity=".9"/>` + [[-28, -8, 3, "#FF8A5A"], [24, -14, 2.6, "#7AD8FF"], [6, -3.4, 2, "#C8F070"]].map(([dx, dy, r, col]) => `<circle class="a3float" cx="${x + dx}" cy="${y + dy}" r="${r}" fill="${C.rad([[0, lit(col, .6)], [1, shd(col, .4)]], { cx: .35, cy: .3 })}" stroke="${shd(col, .6)}" stroke-width=".5"/>`).join("") }; }, { aliases: ["starcrown"] });
  item("wartsworth", 5, 1, "cosmicsuit", "torso", "Cosmic Scientist Suit", "Galaxy-patterned and slightly magical. Field trips now include nebulae.",
    (C, F) => { const o = { top: 126, hem: 200, ease: 1.1, gap0: 6, gap1: 16, flare: 6 }; const L = panel(F, o, -1), R = panel(F, o, 1), sky = C.lin([[0, "#3A2A8A"], [.5, "#1A1050"], [1, "#06041A"]], [0, 0, 1, 1]);
      const dots = [[70, 150], [78, 176], [64, 190], [130, 156], [124, 186], [136, 172], [74, 134], [128, 138]].map(([x, y], i) => star(x, y, 1 + (i % 3) * .6, "#FFF6C8")).join("");
      return { back: glow(C, 100, 160, 70, "#8A5AFF", .22), body: [L, R].map(d => ink(C, d, sky, "#02010A", { heavy: W.minor })).join("") + `<g clip-path="${C.clip(L)}"><ellipse cx="74" cy="168" rx="16" ry="6" fill="#C85AFF" opacity=".35" transform="rotate(-30 74 168)"/></g><g clip-path="${C.clip(R)}"><ellipse cx="128" cy="170" rx="16" ry="6" fill="#5AC8FF" opacity=".3" transform="rotate(24 128 170)"/></g>${dots}${[-1, 1].map(s => `<path d="M${100 + s * 7} 128L${100 + s * 16} 198" stroke="#E2B04A" stroke-width="1.6"/>`).join("")}` }; }, { aliases: ["mantle"] });

  // ===== Nyx (bat) =====
  item("nyx", 1, 0, "pinkbow", "head", "Blushing Pink Bow", "Silk, with a tiny embroidered heart. She checks it's still there every few minutes.",
    (C, F) => ({ head: bow(C, 124, 92, .95, "#F48AB8", 18) + gem(C, 124, 92, 1.2, "#FF4A8A", "heart") }), { aliases: ["bow"] });
  item("nyx", 1, 1, "knitscarf", "neck", "Cozy Knitted Scarf", "Big, lavender, and perfect for hiding behind when someone says hello.",
    (C, F) => ({ body: scarf(C, F, { col: "#B8A0E8", wk: 1.25, th: 10, len: 22, side: -1, knit: 1, fringe: "#9A80D0" }) }), { aliases: ["scarf"] });
  item("nyx", 2, 0, "strawberryberet", "head", "Strawberry Beret", "Pastel pink with one berry on top. It makes her feel brave. Ish.",
    (C, F) => ({ head: beret(C, F, { col: "#F2A0C0", wk: .7, dx: -2, rot: 10, topper: `<g transform="translate(${F.head.top[0] + 6} ${F.head.top[1] - 16})">${ink(C, "M0 5C-5 3 -5 -3 0 -3C5 -3 5 3 0 5Z", C.vol("#E8304A"), "#6A0614", { heavy: .8 })}<path d="M-2 -3l2 -2l2 2" stroke="#3E8A36" stroke-width="1.4" fill="none"/>${[[-1.6, 0], [1.4, .4], [0, 2]].map(([a, b]) => `<circle cx="${a}" cy="${b}" r=".4" fill="#FFE27A"/>`).join("")}</g>` }) }), { aliases: ["beret", "wizhat"] });
  item("nyx", 2, 1, "cloudcapelet", "back", "Cloud-Sleeper Capelet", "Cream and fluffy, like napping inside a cloud that's also a hug.",
    (C, F) => ({ back: cape(C, F, { col: "#F4EEE6", spread: 2.1, hem: 196, waves: 6 }), body: `<g>${[[-14, 0], [-7, 3], [0, 4], [7, 3], [14, 0]].map(([dx, dy]) => `<circle cx="${F.neck[0] + dx}" cy="${F.neck[1] + dy}" r="4.4" fill="${C.vol("#FFFBF4", { hi: .3, lo: .2 })}" stroke="#B8A890" stroke-width=".6"/>`).join("")}</g>` }), { aliases: ["cape"] });
  item("nyx", 3, 0, "moonstone", "neck", "Moonstone Pendant", "Silver and softly glowing. She says it helps with the dark. It does.",
    (C, F) => ({ body: chain(F, "#D8DCE6", 8, .9) + glow(C, ...pend(F, 7), 8, "#BFE0FF", .5) + gem(C, ...pend(F, 7), 3.2, "#C8E6FF", "drop") }), { aliases: ["pearls"] });
  item("nyx", 3, 1, "starcuffs", "ears", "Starlight Ear Cuffs", "A crescent on one ear, a star on the other. She can't decide which is her favourite.",
    (C, F) => { const [[x1, y1], [x2, y2]] = F.head.ears; return { head: `<path d="M${x1 - 4} ${y1 - 4}a4.4 4.4 0 1 0 6 6a3.4 3.4 0 1 1 -6 -6Z" fill="#E8EEF8" stroke="#8A90A8" stroke-width=".6"/>${star(x2 + 1, y2 - 2, 3.6, "#FFF2B0", { line: "#B8963A" })}` }; }, { aliases: ["flowers"] });
  item("nyx", 4, 0, "fairycrown", "head", "Fairy-Dream Crown", "Tiny pastel blossoms and two butterflies who refuse to leave.",
    (C, F) => { const [x, y] = F.head.top, flower = (fx, fy, col) => `<g transform="translate(${fx} ${fy})">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-2.4" rx="1.8" ry="2.6" fill="${col}" stroke="${shd(col, .4)}" stroke-width=".4" transform="rotate(${a})"/>`).join("")}<circle r="1.3" fill="#FFE27A"/></g>`;
      const fly = (bx, by, s) => `<g class="a3float" transform="translate(${bx} ${by}) scale(${s})"><path d="M0 0C-5 -6 -9 -2 -6 2C-8 5 -3 6 0 1C3 6 8 5 6 2C9 -2 5 -6 0 0Z" fill="#C8A0FF" stroke="#6A4A9A" stroke-width=".5"/><path d="M0 -2v4" stroke="#3A2A5A" stroke-width=".8"/></g>`;
      return { head: `<path d="M${x - 24} ${y + 4}Q${x} ${y - 4} ${x + 24} ${y + 4}" stroke="#7AB86A" stroke-width="1.8" fill="none"/>` + [[-20, 2, "#FFC8E0"], [-10, -2, "#C8E0FF"], [0, -3.6, "#FFE0F0"], [10, -2, "#E0C8FF"], [20, 2, "#FFC8E0"]].map(([dx, dy, col]) => flower(x + dx, y + dy, col)).join("") + fly(x - 28, y - 14, .9) + fly(x + 26, y - 18, .8) }; });
  item("nyx", 4, 1, "balletdress", "torso", "Moonlit Ballet Dress", "Airy lilac tulle with lace. She practises curtseys when nobody's looking.",
    (C, F) => { const bod = garment(F, { top: 156, hem: 182, ease: 1.02, neck: "round", depth: 3 }), tutu = `M72 180C78 174 122 174 128 180C138 184 140 192 132 196C122 200 78 200 68 196C60 192 62 184 72 180Z`;
      return { body: `${ink(C, tutu, C.lin([[0, "#F0E4FF", .95], [1, "#B8A0E8", .9]], [0, 0, 0, 1]), "#7A6AA8", { heavy: W.minor })}<g clip-path="${C.clip(tutu)}">${Array.from({ length: 9 }, (_, i) => `<path d="M${70 + i * 7.5} 180l3 18" stroke="#FFFFFF" stroke-width="1" opacity=".6"/>`).join("")}</g>${ink(C, bod, C.lin([[0, "#E8DCFF"], [1, "#A890D8"]], [0, 0, 1, 1]), "#6A5A98", { heavy: W.minor })}<path d="M82 160Q100 166 118 160" stroke="#FFFFFF" stroke-width="1" fill="none" stroke-dasharray="1.6 1"/>${gem(C, 100, 166, 1.6, "#F48AB8", "heart")}` }; }, { aliases: ["mantle"] });
  item("nyx", 5, 0, "dreamhalo", "head", "Halo of Gentle Dreams", "Silver stars that float above her, humming lullabies only she can hear.",
    (C, F) => { const [x, y] = F.head.top; return { head: glow(C, x, y - 10, 26, "#E8E0FF", .35) + `<ellipse class="a3float" cx="${x}" cy="${y - 10}" rx="22" ry="5.4" fill="none" stroke="${silverF(C)}" stroke-width="2.6"/>` + [[-20, -10], [-8, -15], [8, -15], [20, -10], [0, -6]].map(([dx, dy], i) => star(x + dx, y + dy, 2 + (i % 2), "#FFFFFF", { line: "#A8B0D0", cls: "a3twinkle" })).join("") }; }, { aliases: ["starcrown"] });
  item("nyx", 5, 1, "dreamwings", "back", "Wings of the Dreamkeeper", "Translucent, constellation-lit wings over her own. She finally feels as big as her dreams.",
    (C, F) => ({ back: glow(C, 100, 150, 66, "#C8A0FF", .25) + wingPair(C, { back: [100, 156] }, { size: .78, fill: C.lin([[0, "#E8DCFF", .75], [1, "#8A6AD8", .55]], [0, 0, 1, 1]), line: "#6A4AA8", inner: (m) => [[30, -16], [48, -24], [60, -10], [40, 4], [24, 10]].map(([a, b]) => star(m(a), 156 + b, 1.6, "#FFFFFF")).join("") + `<path d="M${m(30)} 140L${m(48)} 132L${m(60)} 146L${m(40)} 160" stroke="#FFFFFF" stroke-width=".5" fill="none" opacity=".7"/>` }) }), { aliases: ["mantle"] });

  // ===== Bramble (hedgehog) =====
  item("bramble", 1, 0, "bandana", "neck", "Explorer's Bandana", "Red, with a little compass printed on it. North is wherever the next biscuit is.",
    (C, F) => { const [x, y] = F.neck; const d = `M${x - 14} ${y - 2}Q${x} ${y + 2} ${x + 14} ${y - 2}L${x + 2} ${y + 14}Q${x} ${y + 16} ${x - 2} ${y + 14}Z`;
      return { body: ink(C, d, fab(C, "#D0283A", [0, 0, 0, 1]), "#5A0610", { heavy: W.minor }) + `<g clip-path="${C.clip(d)}">${[[-8, 2], [6, 4], [0, 9]].map(([dx, dy]) => `<circle cx="${x + dx}" cy="${y + dy}" r=".9" fill="#FFFFFF" opacity=".9"/>`).join("")}</g><circle cx="${x}" cy="${y + 5}" r="2.6" fill="none" stroke="#FFF4DC" stroke-width=".7"/><path d="M${x} ${y + 3}v4M${x - 2} ${y + 5}h4" stroke="#FFF4DC" stroke-width=".6"/>` }; }, { aliases: ["bow", "scarf"] });
  item("bramble", 1, 1, "binoculars", "neck", "Pocket Binoculars", "Brass, slightly foggy, and pointed at absolutely everything.",
    (C, F) => { const [x, y] = F.neck; return { body: `<path d="M${x - 10} ${y}Q${x} ${y + 14} ${x + 10} ${y}" stroke="#5A3418" stroke-width="1.4" fill="none"/><g transform="translate(${x} ${y + 15})">${[-1, 1].map(s => `${ink(C, `M${s * 2} -4L${s * 9} -4L${s * 9.6} 5L${s * 1.4} 5Z`, goldF(C), GL, { heavy: 1 })}<ellipse cx="${s * 5.5}" cy="5" rx="4" ry="1.6" fill="#3A4A5A" stroke="${GL}" stroke-width=".5"/>`).join("")}<rect x="-2" y="-2" width="4" height="4" fill="#5A3A1A"/></g>` }; });
  item("bramble", 2, 0, "safarivest", "torso", "Jungle Safari Vest", "Khaki, with eleven pockets. He has filled all eleven with snacks.",
    (C, F) => { const o = { top: 158, hem: 196, ease: 1.12, gap0: 4, gap1: 2 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      const pocket = (x, y) => `<rect x="${x - 4.4}" y="${y}" width="8.8" height="7" rx="1" fill="#B89A60" stroke="#5A4418" stroke-width=".6"/><path d="M${x - 4.4} ${y + 2}h8.8" stroke="#5A4418" stroke-width=".6"/><circle cx="${x}" cy="${y + 2.6}" r=".7" fill="#3A2A10"/>`;
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#D8BE84"], [1, "#8A7040"]], [0, 0, 1, 1]), "#4A3A18", { heavy: W.minor })).join("") + pocket(90, 168) + pocket(110, 168) + pocket(90, 182) + pocket(110, 182) + `<path d="M${102} 176c2 -3 6 -2 5 1" stroke="#C88A3A" stroke-width="1" fill="none"/>` }; }, { aliases: ["pearls"] });
  item("bramble", 2, 1, "pithhelmet", "head", "Explorer's Pith Helmet", "A small classic safari helmet. It makes him feel 12% taller.",
    (C, F) => ({ head: brimHat(C, F, { col: "#EEE2C0", shape: "pith", ch: 20, bw: 1.18, rot: -5, band: "#8A6A3A" }) }), { aliases: ["beret", "wizhat"] });
  item("bramble", 3, 0, "treasuremedallion", "neck", "Lost Treasure Medallion", "An ancient compass that points at treasure. So far: biscuits, twice.",
    (C, F) => ({ body: chain(F, "#C8A040", 9, .9) + `<g transform="translate(${pend(F, 8)[0]} ${pend(F, 8)[1] + 1})">${ink(C, "M-6 0A6 6 0 1 0 6 0A6 6 0 1 0 -6 0Z", goldF(C), GL, { heavy: 1.1 })}<circle r="4" fill="#3A6A6A" stroke="${GL}" stroke-width=".5"/><path d="M0 -3.4L1 0L0 3.4L-1 0Z" fill="#E8D8A8"/><path d="M0 -3.4L1 0L-1 0Z" fill="#E03A3A"/></g>` }), { aliases: ["flowers"] });
  item("bramble", 3, 1, "climbercloak", "back", "Mountain Climber's Cloak", "Rugged olive wool. It has seen three mountains and one very steep staircase.",
    (C, F) => ({ back: cape(C, { back: [100, 158, 30], floor: 206 }, { col: "#5A6A3A", spread: 2.2, hem: 202, lining: "#8A7A4A" }), body: capeClasp(C, F, "#8A6A3A", null) }), { aliases: ["cape"] });
  item("bramble", 4, 0, "captainhat", "head", "Captain's Explorer Hat", "Broad, ornate, with a feather from a bird he swears was enormous.",
    (C, F) => ({ head: brimHat(C, F, { col: "#3A4A6A", ch: 16, bw: 1.45, rot: -9, band: "#E2B04A", deco: (x, y, w, ch) => `<path d="M${x + w * .2} ${y - 4}C${x + w * .5} ${y - 26} ${x + w * .8} ${y - 34} ${x + w * 1.1} ${y - 36}C${x + w * .9} ${y - 24} ${x + w * .6} ${y - 12} ${x + w * .32} ${y - 2}Z" fill="${C.lin([[0, "#FF8A5A"], [1, "#C83A1A"]], [0, 0, 1, 1])}" stroke="#5A1A06" stroke-width=".7"/>${gem(C, x + w * .22, y - 4, 2.4, "#E2B04A")}` }) }));
  item("bramble", 4, 1, "atlascoat", "torso", "Atlas Keeper's Coat", "Embroidered with maps of everywhere he's been and most places he hasn't.",
    (C, F) => { const o = { top: 158, hem: 202, ease: 1.18, gap0: 5, gap1: 9, flare: 3 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      return { body: [L, R].map(d => ink(C, d, C.lin([[0, "#3A6A8A"], [1, "#16304A"]], [0, 0, 1, 1]), "#081828", { heavy: W.minor })).join("") + `<g clip-path="${C.clip(L)}"><path d="M78 168q4 -4 8 0t8 2M80 184q6 -6 12 0" stroke="#E2C88A" stroke-width=".8" fill="none"/></g><g clip-path="${C.clip(R)}"><path d="M106 172q4 6 10 2M108 188l4 -6l4 6" stroke="#E2C88A" stroke-width=".8" fill="none"/></g>${buttons(F, 166, 194, 4, "#E2B04A", 94)}` }; }, { aliases: ["mantle"] });
  item("bramble", 5, 0, "lostkingdoms", "head", "Crown of the Lost Kingdoms", "Worn, ancient, set with gems from places that aren't on any map.",
    (C, F) => ({ head: crown(C, F, { wk: .74, h: 11, fill: C.lin([[0, "#E8D49A"], [.5, "#B8963A"], [1, "#6A5418"]], [0, 0, 0, 1]), glow: "#FFD860", points: [[-1, 0], [-.8, -.9], [-.5, -.2], [-.2, -1.1], [.1, -.3], [.45, -1], [.8, -.6], [1, 0]], gems: [[-.2, -.4, 1.6, "#3AA86A"], [.45, -.35, 1.4, "#C0102A"], [-.75, -.2, 1.2, "#3A6ADA"]] }) + `<path d="M${F.head.top[0] + 8} ${F.head.top[1] - 2}l3 4" stroke="#5A4418" stroke-width=".7"/>` }), { aliases: ["starcrown"] });
  item("bramble", 5, 1, "thousandjourneys", "back", "Mantle of a Thousand Journeys", "Hills and rivers drift across the cloth. If you look closely, you're in there too.",
    (C, F) => ({ back: glow(C, 100, 170, 60, "#8AD86A", .18) + cape(C, { back: [100, 156, 34], floor: 206 }, { col: "#2A5A4A", spread: 2.6, hem: 203, lining: "#E2C88A", pattern: `<path d="M50 176q10 -10 20 0t20 0M110 184q10 -8 20 0t16 0M58 196c10 -6 30 -4 40 2" stroke="#E2C88A" stroke-width="1" fill="none"/><path d="M130 168l4 -6l4 6Z" fill="#E2C88A"/>` }), body: capeClasp(C, F, "#E2B04A", "#3AA86A") }), { aliases: ["mantle"] });

  // ===== Wulfila (wolf) =====
  item("wulfila", 1, 0, "studcuffs", "ears", "Studded Ear Cuffs", "Five silver studs. It's not a phase. (It's a little bit a phase.)",
    (C, F) => ({ head: F.head.ears.map(([x, y], i) => `<path d="M${x - 3} ${y - 2}a5 5 0 0 0 6 4" stroke="#D8D8E8" stroke-width="1.4" fill="none"/>${[0, 1, 2].map(j => `<circle cx="${x - 3 + j * 1.6 + (i ? 1 : 0)}" cy="${y - 6 - j * 2.6}" r=".9" fill="#E8E8F4" stroke="#6A6A7A" stroke-width=".3"/>`).join("")}`).join("") }), { aliases: ["bow"] });
  item("wulfila", 1, 1, "armwarmers", "arms", "Striped Arm Warmers", "Black and purple, fingerless, and very warm for someone who claims not to feel anything.",
    (C, F) => ({ arms: (C2, segs, w) => { const sub = ART3.subSegs(segs, .38, .86), d = ART3.tube(sub, w.slice(-3).map(v => v * 1.12)); return ink(C2, d, "#1A1620", "#000", { heavy: W.minor }) + `<g clip-path="${C2.clip(d)}">${Array.from({ length: 8 }, (_, i) => `<path d="M40 ${120 + i * 6}h120" stroke="#8A3AC8" stroke-width="2.6"/>`).join("")}</g>`; } }), { aliases: ["scarf"] });
  item("wulfila", 2, 0, "skullclips", "head", "Skull Hair Clips", "A pair of tiny silver skulls holding back a fringe that refuses to be held back.",
    (C, F) => ({ head: [[90, 52, -20], [104, 46, -10]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-6" y="-1" width="12" height="2" rx="1" fill="#B8B8C8"/><path d="M0 -4.4C-3.4 -4.4 -4 -1.6 -3.6 .6C-3.2 2 -2 2.4 -2 3.6L2 3.6C2 2.4 3.2 2 3.6 .6C4 -1.6 3.4 -4.4 0 -4.4Z" fill="#F2F2FA" stroke="#5A5A6A" stroke-width=".6"/><circle cx="-1.3" cy="-.6" r=".9" fill="#2A2234"/><circle cx="1.3" cy="-.6" r=".9" fill="#2A2234"/></g>`).join("") }), { aliases: ["beret", "wizhat"] });
  item("wulfila", 2, 1, "lacecollar", "neck", "Black Lace Collar", "Dark, ornate, and very dramatic. Like her diary.",
    (C, F) => { const [x, y, w] = F.neck; const scal = Array.from({ length: 7 }, (_, i) => { const t = i / 6, cx2 = x - w * .7 + w * 1.4 * t, cy2 = y + 3 + Math.sin(Math.PI * t) * 4; return `<path d="M${f1(cx2 - 3.6)} ${f1(cy2)}a3.6 4 0 0 0 7.2 0" fill="#1A1620" stroke="#000" stroke-width=".6"/><circle cx="${f1(cx2)}" cy="${f1(cy2 + 1.6)}" r=".8" fill="#4A3A5A"/>`; }).join("");
      return { body: scal + band(C, F, "#1A1620", { h: 4, wk: 1.3 }) + gem(C, x, y + 2.4, 1.8, "#8A3AC8", "diamond") }; });
  item("wulfila", 3, 0, "brokenheart", "neck", "Broken Heart Pendant", "Cracked silver. She says it's ironic. She keeps it very polished.",
    (C, F) => { const [px, py] = pend(F, 10); return { body: chain(F, "#B8B8C8", 10, .8) + `<g transform="translate(${px} ${py})">${ink(C, "M0 6C-11 0 -6 -8 0 -3C6 -8 11 0 0 6Z", silverF(C), SL, { heavy: 1 })}<path d="M0 -3L-1.4 0L1 1.6L-.6 5" stroke="#3A3A48" stroke-width=".8" fill="none"/><path d="M-5 -2q2 -2 3.6 0" stroke="#fff" stroke-width=".8" fill="none"/></g>` }; }, { aliases: ["pearls"] });
  item("wulfila", 3, 1, "ravencapelet", "back", "Midnight Raven Capelet", "Feather-shouldered and dark as a cancelled plan.",
    (C, F) => { const [x, y] = F.neck; const feathers = [-1, 1].map(s => [0, 1, 2, 3].map(i => `<path d="M${x + s * (8 + i * 6)} ${y - 2 + i}C${x + s * (6 + i * 6)} ${y + 8} ${x + s * (10 + i * 6)} ${y + 14} ${x + s * (12 + i * 6)} ${y + 16}C${x + s * (14 + i * 6)} ${y + 10} ${x + s * (14 + i * 6)} ${y + 4} ${x + s * (8 + i * 6)} ${y - 2 + i}Z" fill="${C.lin([[0, "#3A3448"], [1, "#0A0810"]], [0, 0, 0, 1])}" stroke="#000" stroke-width=".7"/>`).join("")).join("");
      return { back: cape(C, F, { col: "#14121C", spread: 2, hem: 170, waves: 6 }), body: feathers + `<path d="M${x - 6} ${y + 1}Q${x} ${y + 5} ${x + 6} ${y + 1}" stroke="#8A3AC8" stroke-width="1.4" fill="none"/>` }; }, { aliases: ["cape"] });
  item("wulfila", 4, 0, "countessjacket", "torso", "Vampire Countess Jacket", "Fitted velvet with silver chains. Fangs sold separately (she has her own).",
    (C, F) => { const o = { top: 104, hem: 176, ease: 1.22, gap0: 6, gap1: 12, flare: 6 }; const L = panel(F, o, -1), R = panel(F, o, 1);
      return { back: `<path d="M74 104C70 88 76 76 84 70L90 98ZM126 104C130 88 124 76 116 70L110 98Z" fill="#2A0A1A" stroke="#000" stroke-width="1"/>`, body: [L, R].map(d => ink(C, d, C.lin([[0, "#5A1A3A"], [.5, "#2E0A1E"], [1, "#12040C"]], [0, 0, 1, 1]), "#000", { heavy: W.minor })).join("") + `<path d="M86 130Q100 138 114 130M86 142Q100 150 114 142" stroke="#C8C8D8" stroke-width="1" fill="none" stroke-dasharray="1.6 1"/>${buttons(F, 118, 166, 4, "#C8C8D8", 92)}<path d="M80 110C78 130 78 150 80 168" stroke="#8A3A6A" stroke-width="1.2" fill="none" opacity=".6"/>` }; });
  item("wulfila", 4, 1, "thorntiara", "head", "Thorn Princess Tiara", "Dark roses and thorns. Beautiful, prickly, and very much her.",
    (C, F) => { const [x, y] = F.head.top; const rose = (rx, ry, s) => `<g transform="translate(${rx} ${ry}) scale(${s})">${ink(C, "M0 4C-6 4 -8 -2 -6 -7C-3 -10 3 -10 6 -7C8 -2 6 4 0 4Z", C.rad([[0, "#8A2A5A"], [.6, "#4A0A2A"], [1, "#1A0410"]], { cx: .4, cy: .35 }), "#000", { heavy: .8 })}<path d="M-3 -5C-1 -8 2.4 -7 2.4 -4" stroke="#C83A7A" stroke-width=".7" fill="none"/></g>`;
      return { head: `<path d="M${x - 24} ${y + 4}Q${x} ${y - 4} ${x + 24} ${y + 4}" stroke="#1A1218" stroke-width="2.2" fill="none"/>${[-20, -12, -4, 4, 12, 20].map(dx => `<path d="M${x + dx} ${y + 1 - Math.abs(dx) * .1}l1.4 -4l1.4 4" fill="#1A1218"/>`).join("")}${rose(x - 12, y - 3, .7)}${rose(x, y - 6, .9)}${rose(x + 12, y - 3, .7)}` }; }, { aliases: ["flowers"] });
  item("wulfila", 5, 0, "midnightcrown", "head", "Crown of Eternal Midnight", "Obsidian with violet embers. It's the only thing she's ever said 'I love it' about.",
    (C, F) => ({ head: crown(C, F, { wk: .76, h: 13, fill: C.lin([[0, "#4A4258"], [.5, "#16121E"], [1, "#04030A"]], [0, 0, 0, 1]), line: "#000", base: "#3A3448", glow: "#9A4AFF", points: [[-1, 0], [-.75, -1.1], [-.5, -.3], [-.25, -.9], [0, -1.5], [.25, -.9], [.5, -.3], [.75, -1.1], [1, 0]], gems: [[0, -.95, 2.6, "#9A4AFF", "diamond"], [-.75, -.6, 1.3, "#B070FF"], [.75, -.6, 1.3, "#B070FF"]] }) }), { aliases: ["starcrown"] });
  item("wulfila", 5, 1, "endlessnight", "torso", "Dress of the Endless Night", "Violet-black and dramatic enough to make thunder jealous.",
    (C, F) => { const d = garment(F, { top: 106, hem: 206, ease: 1.18, flare: 26, from: 150, neck: "v", depth: 10, scallop: 6 });
      return { back: glow(C, 100, 170, 64, "#7A3AFF", .2), body: ink(C, d, C.lin([[0, "#4A2A6A"], [.45, "#1E1030"], [1, "#06040C"]], [0, 0, 1, 1]), "#000", { heavy: W.minor }) + `<g clip-path="${C.clip(d)}">${folds(F, 150, 206, 5, "#000", .55, 1.3)}<path d="M70 190C84 180 116 180 132 192" stroke="#9A4AFF" stroke-width="1.2" fill="none" opacity=".7"/>${[[82, 168], [118, 178], [96, 196]].map(([x, y]) => star(x, y, 1.6, "#C8A0FF")).join("")}</g><path d="M90 108L100 116L110 108" stroke="#9A4AFF" stroke-width="1.1" fill="none"/>` }; }, { aliases: ["mantle"] });

  ART3.ITEMS = ITEMS;
  // a tiling pattern fill (sequins, lace, veil netting); returns url(#id)
  let PN = 0; const patt = (C, w, h, inner, o = {}) => { const id = `pt${C.u}_${PN++}`; C.defs.push(`<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${o.rot ? ` patternTransform="rotate(${o.rot})"` : ""}>${inner}</pattern>`); return `url(#${id})`; };
  // the shared toolkit, for collections defined in their own files
  ART3.WK = { goldF, silverF, ironF, fab, gem, star, glow, smooth, hw, garment, panel, folds, buttons, cape, capeClasp, bow, mask, goggles, pearls, chain, pend, band, scarf, bowtie, crown, beret, pointyHat, brimHat, hood, f1, GL, SL, patt, item, FIT,
    // replace one companion's whole collection in place
    replaceCollection: (k, list) => { for (let i = ITEMS.length - 1; i >= 0; i--) if (ITEMS[i].k === k) ITEMS.splice(i, 1); list(); } };
  ART3.RENAMED = ART3.RENAMED || {};
  // put a piece on: anything in the same slot comes off, and so does anything it covers or that covers it
  ART3.equip = (ids, id) => { const it = ITEMS.find(i => i.id === id); if (!it) return ids; return ids.filter(x => { const o = ITEMS.find(i => i.id === x); return o && o.slot !== it.slot && !(it.covers || []).includes(o.slot) && !(o.covers || []).includes(it.slot); }).concat(id); };
  ART3.itemsFor = k => ITEMS.filter(i => i.k === k).sort((a, b) => a.lvl - b.lvl || a.ab - b.ab);

  // ---------- composing a dressed companion ----------
  // remove a group (and everything inside it) whose class list contains `cls`
  const dropGroup = (svg, cls) => { const re = new RegExp(`<g class="[^"]*\\b${cls.replace(/[-]/g, "\\-")}\\b[^"]*"`); let m;
    while ((m = re.exec(svg))) { const i = m.index, tag = /<g\b[^>]*?(\/?)>|<\/g>/g; tag.lastIndex = i; let depth = 0, t, end = -1;
      while ((t = tag.exec(svg))) { if (t[0] === "</g>") { if (--depth === 0) { end = t.index + 4; break; } } else if (!t[1]) depth++; }
      if (end < 0) break; svg = svg.slice(0, i) + svg.slice(end); }
    return svg; };
  ART3.dropGroup = dropGroup;
  const SLOT_ORDER = ["back", "torso", "neck", "arms", "held", "ears", "face", "head"];
  const HELD_SIDE = { natasha: "R", ember: "R", wartsworth: "L", antonio: "R", hoot: "R", corvin: "wing", nyx: "R", bramble: "R", wulfila: "R" };
  // wear(k, expr, ids, o): ids = item ids or slugs; o.bare removes the whole default outfit first
  ART3.wear = (k, expr = "neutral", ids = [], o = {}) => {
    let items = ids.map(id => ART3.RENAMED[id] || ART3.RENAMED[`${k}.${id}`] || id).map(id => ITEMS.find(i => i.id === id || (i.k === k && i.slug === id))).filter(Boolean);
    // a piece that covers other slots (a coat with its own high collar, say) takes those pieces off
    const covered = new Set(items.flatMap(i => i.covers || []));
    items = items.filter(i => !covered.has(i.slot) || (i.covers || []).length);
    const F = o.lite ? { ...FIT[k], lite: 1 } : FIT[k], C = ART3.Ctx(), parts = { far: "", back: "", nape: "", body: "", head: "" };
    const armFns = [], heldFns = [];
    items.sort((a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot)).forEach(it => {
      const r = it.draw(C, F) || {}; for (const m of Object.keys(r)) if (m !== "arms" && m !== "held" && r[m]) parts[m] = (parts[m] || "") + `<g class="w-item w-${it.slug}">${r[m]}</g>`;
      if (r.arms) armFns.push((...a) => { const out = r.arms(...a); return out ? `<g class="w-arm w-${it.slug}">${out}</g>` : ""; }); if (r.held) heldFns.push(r.held); });
    const armWear = armFns.length || heldFns.length ? (C2, segs, w, side) => { let out = armFns.map(f => f(C2, segs, w, side)).join("");
      if (heldFns.length && segs && side === HELD_SIDE[k]) { const Lg = segs[segs.length - 1], e = Lg[3], ang = Math.atan2(Lg[3][1] - Lg[2][1], Lg[3][0] - Lg[2][0]) * 180 / Math.PI; out += heldFns.map(h => h(C2, e, ang)).join(""); }
      return out; } : null;
    let svg = ART3[k](expr, { bare: o.bare, armWear });
    if (!o.bare) for (const it of items) for (const cls of (it.replaces || DEFAULT_SLOTS[k][it.slot] || [])) svg = dropGroup(svg, `outfit ${cls}`.split(" ")[1]);
    // far = behind everything (even a tail), nape = behind the head but turning with it; both fall back to the back mount
    const tag = m => `<g class="mount mount-${m}" data-mount="${m}">`;
    const FALLBACK = { far: "back", nape: "back" };
    for (const m of ["back", "body", "head", ...Object.keys(parts).filter(x => !["back", "body", "head"].includes(x))]) if (parts[m]) { const at = svg.includes(tag(m)) ? m : (FALLBACK[m] || "body"); svg = svg.replace(tag(at), s => s + parts[m]); }
    // small-size variant: fine detail marked data-fine="1" is left out below ~130px
    if (o.lite) { svg = svg.replace(/<(path|circle|ellipse|rect|text)\b[^>]*data-fine="1"[^>]*\/>/g, "");
      const re = /<g\b[^>]*data-fine="1"[^>]*>/; let m;
      while ((m = re.exec(svg))) { const tag = /<g\b[^>]*?(\/?)>|<\/g>/g; tag.lastIndex = m.index; let depth = 0, t, end = -1;
        while ((t = tag.exec(svg))) { if (t[0] === "</g>") { if (--depth === 0) { end = t.index + 4; break; } } else if (!t[1]) depth++; }
        if (end < 0) break; svg = svg.slice(0, m.index) + svg.slice(end); } }
    return svg.replace("</defs>", C.defs.join("") + "</defs>");
  };
})();

// ===== Materials for the wardrobe collections: velvet, satin, leather, metals, lace, net, fluff, embroidery =====
(() => {
  const { ink, mix, lit, shd, W } = ART3, K = ART3.WK, f1 = K.f1;
  const M = {
    // velvet: deep body, a soft bloom on the lit edge, very dark in the folds
    velvet: (C, col, a = [.15, 0, .85, 1]) => C.lin([[0, lit(col, .22)], [.3, col], [.72, shd(col, .4)], [1, shd(col, .62)]], a),
    // satin/silk: a bright specular band across the form
    satin: (C, col, a = [0, 0, 1, .5]) => C.lin([[0, shd(col, .25)], [.32, lit(col, .5)], [.46, col], [.8, shd(col, .35)], [1, shd(col, .55)]], a),
    leather: (C, col, a = [0, 0, 1, 1]) => C.lin([[0, lit(col, .18)], [.55, col], [1, shd(col, .5)]], a),
    brass: (C, a = [0, 0, .3, 1]) => C.lin([[0, "#FFEDB8"], [.35, "#DCA648"], [.72, "#9A6424"], [1, "#5A3410"]], a),
    copper: (C, a = [0, 0, .3, 1]) => C.lin([[0, "#FFD0A8"], [.35, "#D07A40"], [.72, "#8A3E1A"], [1, "#4A1C08"]], a),
    steel: (C, a = [0, 0, .3, 1]) => C.lin([[0, "#FFFFFF"], [.4, "#C2CCD8"], [.75, "#6A7488"], [1, "#30384A"]], a),
    glass: (C, col, op = .35) => C.rad([[0, "#FFFFFF", op + .3], [.6, col, op], [1, shd(col, .3), op + .2]], { cx: .35, cy: .3 }),
    stitch: (d, col, w = .6) => `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="none" stroke-dasharray="1.4 1.1" stroke-linecap="round"/>`,
    // a symmetric embroidered scroll motif centred at x,y
    filigree: (x, y, s, col, w = .8) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${s})" fill="none" stroke="${col}" stroke-width="${w / s}" stroke-linecap="round"><path d="M0 1.6C-1.6 -1.6 -5.6 -2.2 -6.6 .6C-7.2 2.6 -5 3.8 -3.8 2.4M0 1.6C1.6 -1.6 5.6 -2.2 6.6 .6C7.2 2.6 5 3.8 3.8 2.4M-2.4 3.4C-1.2 4.4 1.2 4.4 2.4 3.4"/><path d="M0 1.4C-1.3 -.4 -1.1 -2.6 0 -3.8C1.1 -2.6 1.3 -.4 0 1.4Z" fill="${col}"/><circle cx="-3.8" cy="2.4" r=".55" fill="${col}"/><circle cx="3.8" cy="2.4" r=".55" fill="${col}"/></g>`,
    // sequins, lace, net as tiling patterns
    sequins: (C, hi = "#FFFFFF", lo = "#000000") => K.patt(C, 2.6, 2.3, `<circle cx=".65" cy=".6" r=".6" fill="${hi}" opacity=".32"/><circle cx="1.95" cy="1.75" r=".6" fill="${lo}" opacity=".22"/><circle cx="1.85" cy="1.6" r=".22" fill="${hi}" opacity=".45"/>`),
    net: (C, col = "#000", w = .35) => K.patt(C, 3, 3, `<path d="M0 0L3 3M3 0L0 3" stroke="${col}" stroke-width="${w}"/>`),
    lace: (C, col = "#000") => K.patt(C, 4, 4, `<circle cx="2" cy="2" r="1.2" fill="none" stroke="${col}" stroke-width=".5"/><circle cx="0" cy="0" r=".6" fill="${col}"/><circle cx="4" cy="4" r=".6" fill="${col}"/><circle cx="0" cy="4" r=".6" fill="${col}"/><circle cx="4" cy="0" r=".6" fill="${col}"/>`),
    // a scalloped edge along a straight run from (x0,y) to (x1,y)
    scallops: (x0, x1, y, n, depth, col, fill = "none", w = .7) => { const step = (x1 - x0) / n; let d = `M${f1(x0)} ${f1(y)}`; for (let i = 0; i < n; i++) d += `Q${f1(x0 + step * (i + .5))} ${f1(y + depth)} ${f1(x0 + step * (i + 1))} ${f1(y)}`; return `<path d="${d}" stroke="${col}" stroke-width="${w}" fill="${fill}"/>`; },
    // fluffy feather boa / fur along a list of points
    fluff: (C, pts, w, col, tip) => { const d = K.smooth(pts), puff = C.rad([[0, lit(col, .55)], [.55, col], [1, shd(col, .28)]], { cx: .38, cy: .32 }), out = [`<path d="${d}" stroke="${shd(col, .55)}" stroke-width="${w + 1.6}" fill="none" stroke-linecap="round" opacity=".55" transform="translate(.6 1)"/>`];
      const P = [], wisps = []; let seed = 0; const rnd = () => (seed = Math.sin(seed * 12.9898 + 78.233 + P.length) * 43758.5453) - Math.floor(seed);
      for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / L, ny = (x1 - x0) / L, n = Math.max(2, Math.round(L / 2.1));
        for (let j = 0; j < n; j++) { const t = j / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, o = (rnd() - .5) * w * .5, r = w * (.38 + rnd() * .2);
          P.push(`<circle cx="${f1(x + nx * o)}" cy="${f1(y + ny * o)}" r="${f1(r)}" fill="${puff}"/>`);
          if (j % 2 === 0) for (const s of [-1, 1]) { const bx = x + nx * s * (w * .45), by = y + ny * s * (w * .45), k = 1.6 + rnd() * 1.6; wisps.push(`<path d="M${f1(bx)} ${f1(by)}q${f1(nx * s * k + (rnd() - .5) * 2)} ${f1(ny * s * k + (rnd() - .5) * 2)} ${f1(nx * s * k * 1.4 + (rnd() - .5) * 3)} ${f1(ny * s * k * 1.4 + (rnd() - .5) * 3)}" stroke="${rnd() > .6 && tip ? tip : lit(col, .3)}" stroke-width=".7" fill="none" stroke-linecap="round" opacity=".85"/>`); } } }
      return out.concat(wisps, P).join("") + `<path d="${d}" stroke="#FFFFFF" stroke-width="${f1(w * .18)}" fill="none" stroke-linecap="round" opacity=".28" transform="translate(-.9 -1.1)"/>`; },
    // a point and direction along a chain of cubic segments (t over the whole chain)
    along: (segs, t) => { const n = segs.length, i = Math.min(n - 1, Math.floor(t * n)), u = t * n - i, [p0, p1, p2, p3] = segs[i];
      const P = k => (1 - u) ** 3 * p0[k] + 3 * (1 - u) ** 2 * u * p1[k] + 3 * (1 - u) * u * u * p2[k] + u ** 3 * p3[k];
      const D = k => 3 * (1 - u) ** 2 * (p1[k] - p0[k]) + 6 * (1 - u) * u * (p2[k] - p1[k]) + 3 * u * u * (p3[k] - p2[k]);
      return [P(0), P(1), Math.atan2(D(1), D(0)) * 180 / Math.PI]; },
  };
  ART3.MAT = M;
})();

// ===== Natasha — "Siren of the Silver Screen": old-Hollywood couture in emerald, sapphire and pearl =====
// L1 a pearl hair comb · sapphire ear drops      L2 satin opera gloves · lace cameo choker
// L3 cocktail hat with birdcage veil · marabou stole      L4 sapphire sequin mermaid gown · velvet opera cape with Medici collar
// L5 Midnight Siren couture gown · diamond peacock fan
(() => {
  const { ink, mix, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const EM = "#127A58", SAP = "#1E4AB8", GOLD = "#E2B04A";
  K.replaceCollection("natasha", () => {
    const item = K.item;
    // ---------- Level 1 ----------
    item("natasha", 1, 0, "pearlcomb", "head", "Pearl Hair Comb", "Three pearls and an emerald leaf, tucked behind her ear as if it had always been there.",
      (C) => ({ head: `<g transform="translate(125 49) rotate(26)">
        <path d="M-10 2Q0 -3 10 2" stroke="#6A4A10" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M-10 2Q0 -3 10 2" stroke="${K.goldF(C)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        ${[[-9, -4, -40], [9, -4, 40], [-4, -8, -12], [4, -8, 12]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})">${ink(C, "M0 4C-2.6 1 -2.6 -3 0 -5C2.6 -3 2.6 1 0 4Z", C.lin([[0, "#6AD8A8"], [1, "#0A5A3A"]], [0, 0, 1, 1]), "#063A26", { heavy: .7 })}<path d="M0 3.4V-4" stroke="#B8F0D4" stroke-width=".4"/></g>`).join("")}
        ${[[-5.4, -2.2, 2.1], [0, -4.4, 2.4], [5.4, -2.2, 2.1]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.rad([[0, "#FFFFFF"], [.6, "#F4EAF0"], [1, "#B8A8B8"]], { cx: .35, cy: .3 })}" stroke="#8A7A8A" stroke-width=".4"/>`).join("")}
        ${K.gem(C, 0, -9, 1.2, "#E8F6FF", "diamond")}</g>` }), { aliases: ["bow", "beret"] });
    item("natasha", 1, 1, "sapphiredrops", "ears", "Sapphire Ear Drops", "Cut to match her eyes exactly. She had them made after someone said they couldn't be.",
      (C) => ({ head: [[75, 52], [127, 50]].map(([x, y]) => `${K.gem(C, x, y, 1.3, "#E8F6FF", "diamond")}<path d="M${x} ${y + 1.4}V${y + 5.6}" stroke="${GOLD}" stroke-width=".8"/><path d="M${x - 1.4} ${y + 5.8}h2.8" stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round"/>${K.gem(C, x, y + 9.6, 2.6, SAP, "drop")}`).join("") }), { aliases: ["pearls"] });
    // ---------- Level 2 ----------
    item("natasha", 2, 0, "operagloves", "arms", "Satin Opera Gloves", "Black satin to the elbow, a diamond bracelet worn over the left. Turning pages has never looked so dramatic.",
      (C) => ({ arms: (C2, segs, w, side) => { if (!segs) return ""; const sub = ART3.subSegs(segs, .36, 1), d = ART3.tube(sub, w.slice(-3).map(v => v * 1.12));
        const [ex, ey, ea] = M.along(segs, .995), [cx, cy, ca] = M.along(segs, .37), [bx, by, ba] = M.along(segs, .8);
        return `${ink(C2, d, M.satin(C2, "#262230", [0, 0, 1, .3]), "#000", { heavy: W.minor })}
          <g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${f1(ea - 90)})">${ink(C2, "M-5.6 -1C-5.6 -6 5.6 -6 5.6 -1C5.6 3.6 3 5.4 0 5.4C-3 5.4 -5.6 3.6 -5.6 -1Z", M.satin(C2, "#262230"), "#000", { heavy: 1.2 })}<path d="M-2 2.6v2.2M0 3v2.4M2 2.6v2.2" stroke="#4A4458" stroke-width=".6"/></g>
          <g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ca)})"><ellipse rx="2" ry="6.6" fill="${M.satin(C2, "#3A3446", [0, 0, 0, 1])}" stroke="#000" stroke-width=".9"/><path d="M-.6 -5.4Q-1.4 0 -.6 5.4" stroke="#8A80A0" stroke-width=".5" fill="none"/></g>
          ${side === "L" ? `<g transform="translate(${f1(bx)} ${f1(by)}) rotate(${f1(ba + 90)})">${[-3.6, -1.8, 0, 1.8, 3.6].map(t => `<circle cx="${t}" cy="0" r="1" fill="#F4FAFF" stroke="#8A9AB0" stroke-width=".3"/>`).join("")}</g>` : ""}`; } }), { aliases: [] });
    item("natasha", 2, 1, "cameochoker", "neck", "Lace Cameo Choker", "Black Chantilly lace and an ivory cameo of a cat in profile. She insists it isn't her. It is her.",
      (C, F) => { const [x, y] = F.neck, bandD = `M${x - 14} ${y - 2}Q${x} ${y + 2} ${x + 14} ${y - 2}L${x + 14} ${y + 3}Q${x} ${y + 7} ${x - 14} ${y + 3}Z`;
        return { body: `${ink(C, bandD, "#14101A", "#000", { heavy: .9 })}<path d="${bandD}" fill="${M.lace(C, "#4A4058")}"/>${M.scallops(x - 14, x + 14, y + 4.4, 9, 2.2, "#14101A", "#14101A", .5)}
          <g transform="translate(${x + 2} ${y + 6})">${ink(C, "M0 -5.6C3.6 -5.6 4.6 -2.4 4.6 0C4.6 3 3 5.6 0 5.6C-3 5.6 -4.6 3 -4.6 0C-4.6 -2.4 -3.6 -5.6 0 -5.6Z", K.goldF(C), K.GL, { heavy: .9 })}
            <ellipse rx="3.4" ry="4.4" fill="${C.lin([[0, "#F2B8A8"], [1, "#B86A5A"]], [0, 0, 0, 1])}"/>
            <path d="M-1.6 3.4C-2.6 2 -2.4 0 -1.4 -.8L-1.6 -2.8L-.4 -1.6C.6 -2 1.6 -1.6 2 -.6L2.6 -.2L2 .4C2 1.6 1 2.4 0 3.4Z" fill="#FFF8F0"/>
            <circle cy="7.6" r="1.2" fill="#FFFFFF" stroke="#B8A8B8" stroke-width=".3"/></g>` }; }, { aliases: ["scarf"] });
    // ---------- Level 3 ----------
    item("natasha", 3, 0, "cocktailhat", "head", "Velvet Cocktail Hat", "A tilted velvet pillbox, a birdcage veil and one emerald plume. For evenings that end in mystery.",
      (C) => { const veil = "M100 44C97 56 101 70 112 77C121 81 131 77 135 68C134 57 128 47 121 42Z";
        return { head: `<path d="${veil}" fill="${M.net(C, "#120C18", .4)}" opacity=".85"/><path d="M100 44C97 56 101 70 112 77C121 81 131 77 135 68" stroke="#120C18" stroke-width=".7" fill="none" opacity=".7"/>
          ${[[104, 60], [118, 72], [128, 58]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#120C18"/>`).join("")}
          <g transform="translate(113 41) rotate(16)">
            ${ink(C, "M-4 -2C-12 -14 -22 -22 -36 -24C-26 -17 -18 -9 -9 1Z", C.lin([[0, "#1E9A6A"], [.6, "#0A4A32"], [1, "#04140E"]], [1, 1, 0, 0]), "#02100A", { heavy: 1 })}
            ${[[-10, -6], [-16, -11], [-22, -15], [-28, -19]].map(([a, b]) => `<path d="M${a} ${b}l-2 -3.6M${a} ${b}l3 -1.6" stroke="#6AD8A8" stroke-width=".5" opacity=".7"/>`).join("")}
            ${ink(C, "M-2 -1C-6 -10 -12 -16 -20 -18C-14 -12 -10 -6 -6 1Z", C.lin([[0, "#3A3446"], [1, "#06040A"]], [1, 1, 0, 0]), "#000", { heavy: .8 })}
            ${ink(C, "M-11 0C-11 -6 11 -6 11 0L11 5C11 8.6 -11 8.6 -11 5Z", M.velvet(C, "#1E1A26"), "#000", { heavy: W.minor })}
            ${ink(C, "M-11 0C-11 -5 11 -5 11 0C11 4 -11 4 -11 0Z", M.velvet(C, "#3A3446", [0, 0, 1, 1]), "#000", { heavy: .9 })}
            <path d="M-11 3.6Q0 7 11 3.6" stroke="${EM}" stroke-width="1.8" fill="none"/><path d="M-9 -1.6Q-4 -3.4 2 -3" stroke="#8A80A0" stroke-width=".9" fill="none" opacity=".7"/>
            ${K.gem(C, -6, 2.4, 2, "#BFE6FF", "diamond")}${K.gem(C, -3, 4.4, 1, "#E8F6FF")}${K.gem(C, -8.6, 4.4, 1, "#E8F6FF")}</g>` }; }, { aliases: ["wizhat", "flowers"] });
    item("natasha", 3, 1, "maraboustole", "back", "Champagne Marabou Stole", "Feathers so soft they make the room go quiet. She lets it slip off one shoulder, on purpose.",
      (C) => ({ back: M.fluff(C, [[74, 116], [82, 104], [102, 99], [122, 104], [130, 116]], 9, "#F2DCC0", "#F6B8C8"),
        body: M.fluff(C, [[84, 108], [79, 122], [76, 140], [75, 158], [77, 172]], 7.5, "#F2DCC0", "#F6B8C8") + M.fluff(C, [[120, 108], [128, 124], [131, 144], [132, 162], [130, 176]], 7.5, "#F2DCC0", "#F6B8C8") }), { aliases: [] });
    // ---------- Level 4 ----------
    item("natasha", 4, 0, "sequingown", "torso", "Sapphire Sequin Gown", "A mermaid gown that catches every light in the room and keeps it. The train has its own entrance.",
      (C) => { const bod = "M84 119C85 114 90 112 94 114C97 115 99 118 101.5 121C104 118 106 115 109 114C114 112 118 115 119 119C121 128 120 136 117 144L89 144C85 136 82 128 84 119Z";
        const sk = "M88 142C84 154 83 166 86 180C87 188 84 194 75 201C69 206 65 211 74 212Q96 215 120 213Q150 215 188 208C174 204 152 200 136 194C129 190 125 186 126 178C128 164 125 152 118 142Z";
        const shimmer = C.lin([[0, "#FFFFFF", 0], [.42, "#FFFFFF", 0], [.5, "#FFFFFF", .32], [.58, "#FFFFFF", 0], [1, "#FFFFFF", 0]], [0, 0, 1, 1]);
        return { body: `${ink(C, sk, M.satin(C, SAP, [0, 0, 1, .7]), "#06102E", { heavy: W.minor + .4 })}<path d="${sk}" fill="${M.sequins(C, "#BFD8FF", "#020A24")}"/><path d="${sk}" fill="${shimmer}"/>
          <g clip-path="${C.clip(sk)}">${K.folds({ prof: { cx: 104, pts: [[150, 14], [180, 18], [210, 40]] } }, 182, 212, 5, "#020A24", .5, 1.6)}<path d="M126 176C138 190 160 200 186 206" stroke="#E8F2FF" stroke-width="5" fill="none" opacity=".18"/><path d="M86 150C84 162 85 172 88 180" stroke="#E8F2FF" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/></g>
          <path d="M120 150C130 162 140 176 154 192C160 198 170 203 184 206" stroke="#DCE8FF" stroke-width="3.6" fill="none" opacity=".28" stroke-linecap="round"/>
          ${ink(C, bod, M.satin(C, SAP, [0, 0, 1, .6]), "#06102E", { heavy: W.minor })}<path d="${bod}" fill="${M.sequins(C, "#BFD8FF", "#020A24")}"/>
          <path d="M84.4 118.6C85.4 114.4 90 112.4 94 114C97 115.2 99 118 101.5 121C104 118 106 115.2 109 114C113.6 112.4 117.8 114.8 118.8 118.8" stroke="#F4FAFF" stroke-width="1.6" fill="none" stroke-dasharray=".2 1.6" stroke-linecap="round"/>
          <path d="M88 143Q102 147 118 143" stroke="#DCE8FF" stroke-width="1.4" fill="none" stroke-dasharray=".2 1.4" stroke-linecap="round"/>${K.gem(C, 101.5, 124, 2.4, "#6AA8FF", "drop")}` }; }, { aliases: [] });
    item("natasha", 4, 1, "operacape", "back", "Emerald Opera Cape", "Floor-length velvet with a lace Medici collar that frames her face like a portrait. Exits have never been so slow.",
      (C) => { const cp = "M84 104C72 120 58 160 45 207Q102 217 160 207C146 160 132 120 120 104Q102 110 84 104Z";
        const P = (a, R, s) => [102 + s * R * Math.cos(a * Math.PI / 180), 112 - R * Math.sin(a * Math.PI / 180)];
        const collar = s => { const n = 7, a0 = 100, a1 = 178; let d = `M${P(a0, 12, s).map(f1).join(" ")}`; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, q = a0 + (a1 - a0) * (i - .5) / n; d += i === 0 ? `L${P(a, 46, s).map(f1).join(" ")}` : `Q${P(q, 51, s).map(f1).join(" ")} ${P(a, 46, s).map(f1).join(" ")}`; } return d + `L${P(a1, 12, s).map(f1).join(" ")}Z`; };
        const ribs = s => Array.from({ length: 8 }, (_, i) => { const a = 100 + 78 * i / 7; return `<path d="M${P(a, 13, s).map(f1).join(" ")}L${P(a, 45, s).map(f1).join(" ")}" stroke="${GOLD}" stroke-width=".55" opacity=".85"/>`; }).join("");
        return { back: `${ink(C, cp, M.velvet(C, "#0E5A3E", [.2, 0, .8, 1]), "#021A10", { heavy: W.minor + .3 })}
          <g clip-path="${C.clip(cp)}"><path d="M52 192C70 182 134 182 154 194L162 214L40 214Z" fill="${M.satin(C, "#F4EADA", [0, 0, 1, 0])}"/>${[0, 1, 2, 3, 4, 5].map(i => M.filigree(56 + i * 18.6, 196 - Math.abs(i - 2.5) * .8, .9, GOLD)).join("")}
            <path d="M70 130C62 156 56 180 50 204M134 130C142 156 148 180 154 204" stroke="#021A10" stroke-width="1.2" fill="none" opacity=".55"/><path d="M76 120C68 140 62 160 58 180" stroke="#5ADCA8" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/></g>
          ${[-1, 1].map(s => `${ink(C, collar(s), M.satin(C, "#F6EEDC", [0, 0, 1, 1]), "#6A5A3A", { heavy: 1 })}<path d="${collar(s)}" fill="${M.lace(C, "#B8A880")}" opacity=".8"/>${ribs(s)}<path d="${collar(s)}" fill="none" stroke="${GOLD}" stroke-width="1"/>`).join("")}`,
          body: `<path d="M88 110Q102 118 116 110" stroke="${GOLD}" stroke-width="1" fill="none" stroke-dasharray="1.6 .8"/>${[88, 116].map(x => `<circle cx="${x}" cy="110" r="2.8" fill="${K.goldF(C)}" stroke="${K.GL}" stroke-width=".6"/>${K.gem(C, x, 110, 1.6, EM)}`).join("")}` }; }, { aliases: ["cape"] });
    // ---------- Level 5 ----------
    item("natasha", 5, 0, "sirencouture", "torso", "Midnight Siren Couture", "Emerald melting into midnight, a crystal-laced corset and an open tulle overskirt that pools like the tide. The room stops. So does the music.",
      (C) => { const bod = "M84 119C85 114 90 112 94 114C97 115 99 118 101.5 121C104 118 106 115 109 114C114 112 118 115 119 119C121 128 120 136 117 144L89 144C85 136 82 128 84 119Z";
        const sk = "M88 142C84 154 83 166 86 180C86 188 80 196 72 203C70 207 72 211 80 211Q104 214 128 211C134 210 136 206 132 202C126 196 122 188 122 180C125 164 124 152 118 142Z";
        const over = "M88 144C70 156 46 182 22 206Q22 212 34 212Q100 216 168 212Q180 212 178 206C156 182 134 156 118 144Z";
        const ombre = (a) => C.lin([[0, "#1A9A6E"], [.45, "#0B5A44"], [.8, "#0A2A4A"], [1, "#060E26"]], a);
        const tulle = C.lin([[0, "#2AC890", .5], [.5, "#0E6A5A", .55], [1, "#0A1E46", .8]], [0, 0, 0, 1]);
        const hemWave = (() => { let d = "M24 208"; for (let i = 0; i < 16; i++) d += `Q${f1(24 + 9.5 * (i + .5))} ${i % 2 ? 214 : 211} ${f1(24 + 9.5 * (i + 1))} 208`; return d; })();
        const drape = [-1, -.6, -.25, .25, .6, 1].map(t => `<path d="M${f1(103 + t * 13)} 146C${f1(103 + t * 30)} 170 ${f1(103 + t * 55)} 192 ${f1(103 + t * 76)} 210" stroke="#03141A" stroke-width="1.4" fill="none" opacity=".35"/><path d="M${f1(104 + t * 13)} 146C${f1(104 + t * 30)} 170 ${f1(104 + t * 55)} 192 ${f1(105 + t * 76)} 209" stroke="#9AFFE0" stroke-width=".6" fill="none" opacity=".25"/>`).join("");
        const stars = [[38, 200], [54, 188], [62, 204], [146, 190], [156, 202], [164, 196], [70, 176], [138, 178]].map(([x, y], i) => `<path class="${i % 3 ? "" : "a3twinkle"}" d="M${x} ${y - 2}l.5 1.5 1.5 .5 -1.5 .5 -.5 1.5 -.5 -1.5 -1.5 -.5 1.5 -.5Z" fill="#E8FFF6" opacity=".85" style="animation-delay:${i * .4}s"/>`).join("");
        // a sheer chiffon sash falling from the waist jewel and sweeping off to the right hem
        const sash = "M100 147C108 158 112 172 122 186C130 197 144 204 160 208C150 210 136 210 126 206C116 196 110 184 104 170C100 160 98 152 100 147Z";
        const casc = `${ink(C, sash, C.lin([[0, "#E8FFF4", .7], [.5, "#7ADCB8", .5], [1, "#1E7A6A", .55]], [0, 0, 1, 1]), "#0E5A48", { heavy: .6 })}<path d="M102 152C108 166 114 180 124 192C132 200 142 205 152 208M101 158C104 172 110 186 120 198" stroke="#FFFFFF" stroke-width=".7" fill="none" opacity=".55"/><path d="M104 160C110 174 116 186 128 198" stroke="#0E5A48" stroke-width=".6" fill="none" opacity=".5"/>`;
        const lacing = [0, 1, 2, 3, 4].map(i => { const y = 124 + i * 4; return `<path d="M98.6 ${y}L104.4 ${y + 4}M104.4 ${y}L98.6 ${y + 4}" stroke="${GOLD}" stroke-width=".7"/>`; }).join("") + [0, 1, 2, 3, 4, 5].map(i => `<circle cx="98.6" cy="${124 + i * 4}" r=".7" fill="#E8F6FF"/><circle cx="104.4" cy="${124 + i * 4}" r=".7" fill="#E8F6FF"/>`).join("");
        const swag = s => { const m = x => 101.5 + s * (x - 101.5); return `M${m(85)} 117C${m(80)} 116 ${m(74)} 120 ${m(73)} 127C${m(76)} 131 ${m(82)} 130 ${m(86)} 125Z`; };
        return {
          back: K.glow(C, 100, 196, 70, "#2AE0A0", .14),
          body: `${ink(C, over, tulle, "#04182A", { heavy: 1 })}<g clip-path="${C.clip(over)}">${drape}<path d="${hemWave}L180 216L20 216Z" fill="#060E26" opacity=".55"/><path d="${hemWave}" stroke="${GOLD}" stroke-width=".8" fill="none"/>${[0, 1, 2, 3].map(i => M.filigree(40 + i * 40, 203, .7, GOLD, .6)).join("")}</g>${stars}
            ${ink(C, sk, ombre([0, 0, 0, 1]), "#020E10", { heavy: W.minor })}<g clip-path="${C.clip(sk)}"><path d="M87 150C85 162 86 172 89 182" stroke="#C8FFE6" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/><path d="M112 148C116 160 117 170 116 180" stroke="#C8FFE6" stroke-width="1" fill="none" opacity=".3"/>${K.folds({ prof: { cx: 102, pts: [[180, 14], [212, 28]] } }, 186, 212, 4, "#020E10", .5, 1.4)}</g>${casc}
            ${[-1, 1].map(s => ink(C, swag(s), C.lin([[0, "#BFF4DC", .75], [1, "#2A9A7A", .7]], [0, 0, 1, 1]), "#0A3A30", { heavy: .7 })).join("")}
            ${ink(C, bod, M.velvet(C, "#0A2A3A", [0, 0, 1, 1]), "#02080E", { heavy: W.minor })}<g clip-path="${C.clip(bod)}"><path d="M88 114C88 128 90 138 92 146M115 114C115 128 113 138 111 146M94 118V146M109 118V146" stroke="${GOLD}" stroke-width=".55" fill="none" opacity=".85"/><path d="M84 122C90 128 94 136 95 146M119 122C113 128 109 136 108 146" stroke="#127A58" stroke-width="3" fill="none" opacity=".7"/><path d="M86 118C88 126 89 134 90 142" stroke="#9AD8FF" stroke-width="1.2" fill="none" opacity=".3"/></g>${lacing}
            <path d="M84.4 118.6C85.4 114.4 90 112.4 94 114C97 115.2 99 118 101.5 121C104 118 106 115.2 109 114C113.6 112.4 117.8 114.8 118.8 118.8" stroke="${GOLD}" stroke-width="1.4" fill="none"/><path d="M84.6 118C85.6 115 89.6 113.2 93.6 114.6" stroke="#FFF4C8" stroke-width=".5" fill="none"/>
            ${[[88.6, 116.4], [94, 115.6], [109, 115.6], [114.4, 116.4]].map(([x, y]) => K.gem(C, x, y, .9, "#E8F6FF", "diamond")).join("")}
            <path d="M89 143Q102 148 117 143" stroke="${GOLD}" stroke-width="2.2" fill="none"/><path d="M89 143Q102 148 117 143" stroke="#FFF4C8" stroke-width=".5" fill="none" stroke-dasharray=".3 1.6"/>
            <g transform="translate(102.5 146)">${ink(C, "M0 -4.6L4 0L0 4.6L-4 0Z", K.goldF(C), K.GL, { heavy: .9 })}${K.gem(C, 0, 0, 2.6, EM, "diamond")}<path d="M0 4.4V9" stroke="${GOLD}" stroke-width=".6"/>${K.gem(C, 0, 10.6, 1.8, "#E8F6FF", "drop")}</g>` }; }, { aliases: ["mantle"] });
    item("natasha", 5, 1, "peacockfan", "held", "Diamond Peacock Fan", "Seven peacock feathers on diamond-studded sticks. One flick and the whole ballroom forgets what it was saying.",
      (C) => ({ held: (C2, e, ang) => { const base = -38, eye = C2.rad([[0, "#0A0A2A"], [.25, "#1E4AB8"], [.5, "#127A58"], [.78, "#E2B04A"], [1, "#6A8A2A", 0]]), vane = C2.lin([[0, "#1E5A3A", .95], [.6, "#2A8A5A", .95], [1, "#6AB86A", .9]], [0, 0, 1, 0]);
        const fe = Array.from({ length: 7 }, (_, i) => { const a = base - 54 + i * 18; return `<g transform="rotate(${f1(a)})"><path d="M2 0L22 0" stroke="#F4DC9A" stroke-width=".7"/>${ink(C2, "M7 0C12 -4.6 21 -5.6 28 0C21 5.6 12 4.6 7 0Z", vane, "#0A2A1A", { heavy: .6 })}${[11, 14, 17, 20].map(x => `<path d="M${x} 0l2.4 -3M${x} 0l2.4 3" stroke="#9AE8B8" stroke-width=".35" opacity=".8"/>`).join("")}<ellipse cx="23.4" cy="0" rx="4" ry="3.3" fill="${eye}"/><ellipse cx="24" cy="0" rx="1.5" ry="1.3" fill="#06061A"/><circle cx="23" cy="-.9" r=".5" fill="#fff" opacity=".85"/></g>`; }).join("");
        return `<g class="w-held" transform="translate(${f1(e[0])} ${f1(e[1])}) scale(1.22)">${fe}<g transform="rotate(${f1(base)})"><path d="M-1 -2.6L7 -1.2L7 1.2L-1 2.6Z" fill="${K.goldF(C2)}" stroke="${K.GL}" stroke-width=".5"/>${[2.2, 4.4, 6.4].map(x => K.gem(C2, x, 0, .7, "#E8F6FF", "diamond")).join("")}</g><circle r="1.8" fill="${K.goldF(C2)}" stroke="${K.GL}" stroke-width=".5"/><path d="M0 1.6C-1 5 -.6 8 0 10M0 1.6C1 5 .8 8 0 10" stroke="#127A58" stroke-width=".9" fill="none"/><ellipse cy="11" rx="1.1" ry="1.6" fill="#127A58"/></g>`; } }), { aliases: ["starcrown"] });
  });
})();

// ===== Ember — "The Velvet Shadow": five identities, from mischievous thief to legendary phantom =====
// charcoal black · midnight violet · dark leather brown · antique brass · glowing amber
// L1 thief:        Whisperer's Scarf · Little Thief's Capelet
// L2 spy:          Midnight Burglar's Suit · Fox Shadow Mask
// L3 assassin:     Silent Blade Ensemble · Moonshadow Half-Cloak
// L4 infiltrator:  The Night Infiltrator · Phantom Glider Mantle
// L5 phantom:      Regalia of the Velvet Phantom · Living Shadow Mantle
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const CH = "#262833", CHL = "#4A4E5E", VIO = "#3A2660", VIOD = "#1E1434", LEA = "#5A3420", AMB = "#F2A030", GOLD = "#D8A848";
  const MIR = `transform="translate(200 0) scale(-1 1)"`;
  const amberGem = (C, x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.rad([[0, "#FFF0C0"], [.45, AMB], [1, "#7A3A06"]], { cx: .35, cy: .3 })}" stroke="#4A2406" stroke-width="${f1(r * .22)}"/><circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .32)}" r="${f1(r * .28)}" fill="#fff" opacity=".85"/>`;
  const buckle = (C, x, y, a = 0, s = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${s})"><rect x="-2.6" y="-2.4" width="5.2" height="4.8" rx=".8" fill="none" stroke="#3A2006" stroke-width="1.9"/><rect x="-2.6" y="-2.4" width="5.2" height="4.8" rx=".8" fill="none" stroke="${M.brass(C)}" stroke-width="1.2"/><path d="M0 -2.2V2.2" stroke="#F4D890" stroke-width=".7"/></g>`;
  const rivet = (C, x, y, r = .8) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".3"/>`;
  const strap = (C, d, w = 3.4, col = LEA) => `<path d="${d}" stroke="#140804" stroke-width="${w + 1.2}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${M.leather(C, col, [0, 0, 1, 1])}" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#D8A070" stroke-width=".35" fill="none" stroke-dasharray=".9 .8" opacity=".8"/>`;
  const pouch = (C, x, y, wd, h, a = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})">${ink(C, `M${-wd / 2} 0H${wd / 2}V${h - 1.6}Q${wd / 2} ${h} ${wd / 2 - 1.6} ${h}H${-wd / 2 + 1.6}Q${-wd / 2} ${h} ${-wd / 2} ${h - 1.6}Z`, M.leather(C, "#4A2814"), "#140804", { heavy: .8 })}${ink(C, `M${-wd / 2 - .3} -.4H${wd / 2 + .3}V${h * .42}Q0 ${h * .62} ${-wd / 2 - .3} ${h * .42}Z`, M.leather(C, "#6A3C20"), "#140804", { heavy: .7 })}${rivet(C, 0, h * .4, .75)}</g>`;
  const rune = (x, y, s = 1, col = AMB, cls = "", i = 0) => { const g = ["M0 -3V3M-2.2 0A2.2 2.2 0 0 1 2.2 0", "M-2 0A2 2 0 1 0 2 0A2 2 0 1 0 -2 0M0 -3.6V-2M0 2V3.6", "M-2.4 2L0 -2.4L2.4 2ZM0 .4V.6", "M-2 -2.6Q-.4 0 -2 2.6M2 -2.6Q.4 0 2 2.6M-1 0H1", "M0 -3L1.4 0L0 3L-1.4 0ZM-3 0H-1.4M1.4 0H3"][i % 5];
    return `<path${cls ? ` class="${cls}" style="animation-delay:${(i * .37).toFixed(2)}s"` : ""} d="${g}" transform="translate(${f1(x)} ${f1(y)}) scale(${s})" stroke="${col}" stroke-width="${f1(.7 / s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; };
  // Ember's signature: a bookmark dagger in an ornate sheath, hilt up, ribbon tail streaming from the pommel
  const bookDagger = (C, x, y, a, s = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${s})">
      <path d="M0 -6.4C1.6 -5 3.4 -3 3.6 .4L2.6 4.6L4.4 8.4L1.4 6.6L1.6 1.2Z" fill="#B0303A" stroke="#5A0A12" stroke-width=".35"/>
      ${ink(C, "M-2.1 0H2.1L1.8 12.6L0 16L-1.8 12.6Z", M.leather(C, "#24160E", [0, 0, 1, 0]), "#0A0604", { heavy: .55 })}
      <path d="M-1 2.4H1L.9 11.6L0 13.4L-.9 11.6Z" fill="${M.steel(C, [0, 0, 1, 0])}" stroke="#2A3240" stroke-width=".25"/><path d="M-.3 2.8V12" stroke="#FFFFFF" stroke-width=".35"/>
      <path d="M-2 2.2H2M-1.9 7H1.9M-1.8 11.8H1.8" stroke="${GOLD}" stroke-width=".75"/><path d="M-1.6 12.4L0 15.8L1.6 12.4Z" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".3"/><circle cy="7" r=".65" fill="${AMB}"/>
      <rect x="-3.8" y="-1.3" width="7.6" height="1.6" rx=".6" fill="${M.brass(C, [0, 0, 1, 0])}" stroke="#3A2006" stroke-width=".35"/>
      <rect x="-1" y="-5.2" width="2" height="3.9" rx=".5" fill="#7A1A22" stroke="#3A0408" stroke-width=".3"/><path d="M-1 -4.2H1M-1 -3H1" stroke="#C84A50" stroke-width=".35"/>
      <circle cy="-6.2" r="1.35" fill="${C.rad([[0, "#FFF0C0"], [.5, AMB], [1, "#7A3A06"]], { cx: .35, cy: .3 })}" stroke="#4A2406" stroke-width=".3"/></g>`;
  // a sleeve over most of the arm, with an optional cuff band and glove
  const sleeve = (C2, segs, w, fill, line, t1 = .8) => ART3.tube(ART3.subSegs(segs, 0, t1), w.slice(0, -1).map(v => v * 1.14));
  const band = (C2, segs, t, w, fill, line, extra = "") => { const [x, y, a] = M.along(segs, t); return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><path d="M-1.8 ${-w}Q-2.8 0 -1.8 ${w}L1.8 ${w}Q.8 0 1.8 ${-w}Z" fill="${fill}" stroke="${line}" stroke-width=".7"/>${extra}</g>`; };
  const TORSO = "M91 104C85 108 83 118 84 130C85 142 87 150 87 160C87 170 86 180 87 188L95 184L100 190L105 184L113 188C114 180 113 170 113 160C113 150 115 142 116 130C117 118 115 108 109 104Q100 110 91 104Z";
  const SUIT = "M91 104C85 108 83 118 84 130C85 142 87 150 87 160C87 170 86 178 87 186L98.6 186L100 181L101.4 186L113 186C114 178 113 170 113 160C113 150 115 142 116 130C117 118 115 108 109 104Q100 110 91 104Z";
  const SUITS = ["vest", "bandolier", "cloak", "cloak-back", "clasp"], CLOAKS = ["cloak-back", "cloak", "clasp"];

  K.replaceCollection("ember", () => {
    const item = K.item;
    // ================= LEVEL 1 · the mischievous thief =================
    item("ember", 1, 0, "whisperscarf", "neck", "Whisperer's Scarf", "Yards of soft charcoal wool, thrown over one shoulder and pinned with a skeleton key. Good for hiding a smile, or a stolen letter.",
      (C) => { const sc = (a = [0, 0, 1, 1]) => C.lin([[0, "#9AA0B6"], [.35, "#6A7084"], [.75, "#40444F"], [1, "#24262E"]], a);
        const fringe = (pts) => pts.map(([x, y, a]) => `<path d="M${x} ${y}l${f1(Math.cos(a) * 3.2)} ${f1(Math.sin(a) * 3.2)}" stroke="#6A7084" stroke-width=".9" stroke-linecap="round"/>`).join("");
        // the loose end falls from her right side, across her chest, to the left hip
        const end = "M108 118C104 128 98 138 93 148C91 152 89 157 87 162L90.4 160L91.8 164.4L94.6 160.6L97 163.6L98.4 158.4C101 148 106 138 113 126C115 122 115 118 113 115Z";
        const wrap = "M77 104C88 111 112 111 123 103C128 110 127 119 120 124C110 131 90 131 80 124C74 119 73 110 77 104Z";
        return {
          back: `${ink(C, "M86 108C77 112 71 124 69 140C68 150 67 158 65 166L68.4 163.4L70.6 167.4L73.6 163.6L76.4 166.6L78.6 161.6C78.4 148 80 132 89 115Z", sc([0, 0, 1, 0]), "#14151A", { heavy: W.minor })}<path d="M80 118C76 132 74 148 72 162" stroke="#A0A6BA" stroke-width="1.1" fill="none" opacity=".5" stroke-linecap="round"/>${fringe([[68.4, 163.4, 1.9], [70.6, 167.4, 1.7], [73.6, 163.6, 1.6], [76.4, 166.6, 1.5]])}<path d="M68 156Q73 158 79 155M67.6 159.6Q73 161.6 78.8 158.6" stroke="${AMB}" stroke-width=".7" fill="none" opacity=".85"/>`,
          body: `${ink(C, end, sc([1, 0, 0, 1]), "#14151A", { heavy: W.minor })}<g clip-path="${C.clip(end)}"><path d="M106 124C101 134 96 144 91 156" stroke="#14151A" stroke-width="1" fill="none" opacity=".55"/><path d="M110 122C105 132 100 142 95 152" stroke="#C0C6D8" stroke-width="1.3" fill="none" opacity=".5" stroke-linecap="round"/><path d="M86 152Q93 154 100 150M85 156Q92 158 99 154" stroke="${AMB}" stroke-width=".9" fill="none"/></g>${fringe([[90.4, 160, 1.9], [91.8, 164.4, 1.7], [94.6, 160.6, 1.5], [97, 163.6, 1.4], [87, 162, 2.1]])}`,
          head: `${ink(C, "M84 108C78 106 73 109 71 114C70 121 73 127 78 130C80 124 82 118 88 113Z", sc([1, 0, 0, 1]), "#14151A", { heavy: 1 })}<path d="M74 116C74 121 75 124 77 127" stroke="#C0C6D8" stroke-width=".9" fill="none" opacity=".5"/>
            ${ink(C, wrap, sc([0, 0, 0, 1]), "#14151A", { heavy: W.minor })}<g clip-path="${C.clip(wrap)}"><path d="M78 112C89 119 111 119 123 110M79 119C91 125 109 125 121 117" stroke="#14151A" stroke-width="1.1" fill="none" opacity=".6"/><path d="M80 108C91 115 109 115 120 107" stroke="#C0C6D8" stroke-width="1.3" fill="none" opacity=".5"/><path d="M82 125C92 129 106 129 116 125" stroke="#2A1E40" stroke-width="2.2" fill="none" opacity=".6"/></g>
            <g transform="translate(92 120) rotate(-12)"><circle cx="-7" r="3.4" fill="none" stroke="#3A2006" stroke-width="2.6"/><circle cx="-7" r="3.4" fill="none" stroke="${M.brass(C, [0, 0, 1, 1])}" stroke-width="1.8"/><circle cx="-7" r="1.1" fill="none" stroke="${M.brass(C)}" stroke-width=".7"/>
              <path d="M-3.6 0H10" stroke="#3A2006" stroke-width="2.4" stroke-linecap="round"/><path d="M-3.6 0H10" stroke="${M.brass(C, [0, 0, 0, 1])}" stroke-width="1.6" stroke-linecap="round"/><path d="M5.6 0v3.2h1.7v-1.7h1.5V3.2h1.2V0" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".4"/><path d="M-2.8 -.45H9" stroke="#FFF0C0" stroke-width=".4"/></g>` }; },
      { aliases: ["bow", "scarf"], replaces: ["clasp"] });

    item("ember", 1, 1, "thiefcapelet", "back", "Little Thief's Capelet", "A short black capelet lined in midnight violet, its hem cut into points and stitched in amber. It sweeps when she bows. She bows a lot.",
      (C) => { const pL = "M99 112C92 112 86 110 81 106C73 112 67 126 64 147L71 143L76 151L83 143L88 147C91 136 95 124 99 112Z";
        const pR = "M101 112C108 112 114 110 119 106C126 112 132 121 136 132L130 130L125 137L120 131L115 134C111 126 106 119 101 112Z";
        const ext = (a) => M.velvet(C, CH, a), lin = M.satin(C, VIO, [0, 0, 1, 1]);
        const panel = (d, a, hem, motif) => `<path d="${d}" fill="${lin}" stroke="#0A0612" stroke-width=".9" transform="translate(0 2.2)"/>${ink(C, d, ext(a), "#06060A", { heavy: W.minor })}<g clip-path="${C.clip(d)}">${hem}</g>${motif}`;
        const hemL = `<path d="M64 147L71 143L76 151L83 143L88 147" stroke="${AMB}" stroke-width=".8" fill="none" stroke-dasharray="1.3 .7" transform="translate(.8 -1.6)"/><path d="M84 112C80 122 76 132 72 140" stroke="#6A6E82" stroke-width="1.3" fill="none" opacity=".5" stroke-linecap="round"/><path d="M92 114C88 124 86 134 84 142" stroke="#06060A" stroke-width=".9" fill="none" opacity=".6"/>`;
        const hemR = `<path d="M136 132L130 130L125 137L120 131L115 134" stroke="${AMB}" stroke-width=".8" fill="none" stroke-dasharray="1.3 .7" transform="translate(-.8 -1.6)"/><path d="M112 114C118 120 122 126 125 132" stroke="#06060A" stroke-width=".9" fill="none" opacity=".6"/>`;
        return {
          back: `${ink(C, "M80 104C70 112 64 128 62 148L72 145L78 152L86 144L100 150L114 142L124 144L132 136L138 132C134 118 126 108 120 104Z", M.velvet(C, "#1A1C24"), "#06060A", { heavy: W.minor })}<path d="M62 148L72 145L78 152L86 144L100 150L114 142L124 144L132 136L138 132" fill="none" stroke="${VIO}" stroke-width="1.6"/>`,
          body: `${panel(pL, [1, 0, 0, 1], hemL, M.filigree(78, 132, .55, AMB, .55))}
            ${[-1, 1].map(s => `<path d="M${100 + s * 1} 109L${100 + s * 13} 112L${100 + s * 8} 117Z" fill="${M.velvet(C, CH)}" stroke="#06060A" stroke-width=".7"/><path d="M${100 + s * 13} 112L${100 + s * 8} 117" stroke="${AMB}" stroke-width=".55"/>`).join("")}
            <g transform="translate(100 116)"><path d="M-12 -2Q-6 2 0 0Q6 2 12 -2" stroke="${GOLD}" stroke-width=".6" fill="none"/>${ink(C, "M-4 0C-4 -3.4 4 -3.4 4 0C4 3.4 -4 3.4 -4 0Z", M.brass(C, [0, 0, 1, 1]), "#3A2006", { heavy: .9 })}<path d="M-4.6 0H-6.4M4.6 0H6.4" stroke="${M.brass(C)}" stroke-width="1.2"/>${amberGem(C, 0, 0, 1.9)}</g>`,
          arms: (C2, segs, w, side) => side !== "R" ? "" : panel(pR, [0, 0, 1, 1], hemR, M.filigree(124, 124, .5, AMB, .55)) };
      }, { aliases: ["pearls"], replaces: CLOAKS });

    // ================= LEVEL 2 · the skilled spy =================
    item("ember", 2, 0, "burglarsuit", "torso", "Midnight Burglar's Suit", "Fitted charcoal leather with a wrapped front, a cross-body belt and two pouches that never jingle. The first outfit that looks as clever as she is.",
      (C) => { const lea = M.leather(C, "#30323C", [0, 0, 1, 1]);
        const flap = "M95 107C101 110 106 109 110 105C114 112 116 124 115 136C114 146 113 156 113 166L113 172C108 158 104 140 100 128C98 120 97 112 95 107Z";
        return {
          back: `<path d="M88 170C86 180 86 188 88 194L100 189L112 194C114 188 114 180 112 170Z" fill="${M.leather(C, "#20222A")}" stroke="#06060A" stroke-width="1"/>`,
          body: `${ink(C, SUIT, lea, "#06060A", { heavy: W.minor })}<g clip-path="${C.clip(SUIT)}">
              ${ink(C, "M84 116C90 120 110 120 116 116L116 104L84 104Z", M.leather(C, "#4A2A16", [0, 0, 0, 1]), "#140804", { heavy: .7 })}${M.stitch("M84 114.6C90 118.4 110 118.4 116 114.6", "#D8A070", .4)}
              <path d="M84 184H116" stroke="${VIO}" stroke-width="1.6"/>
              <path d="M90 114C88 128 89 146 90 162M110 114C112 128 111 146 110 162" stroke="#06060A" stroke-width=".8" fill="none" opacity=".6"/>${M.stitch("M91 114C89 128 90 146 91 162", "#7A7E92", .45)}
              <path d="M88 112C86 126 87 144 89 160" stroke="#7A7E92" stroke-width="1.8" fill="none" opacity=".35" stroke-linecap="round"/>
              ${ink(C, flap, M.leather(C, "#3A3C48", [0, 0, 1, 1]), "#06060A", { heavy: .9 })}${M.stitch("M96.6 109C98.6 116 100.6 124 102.2 130C105.4 142 108.6 154 111.4 166", "#9A9EB2", .45)}
              ${[118, 132, 146].map((y, i) => `<path d="M${98.6 + i * 3.4} ${y}h7" stroke="#14141A" stroke-width="2.4" stroke-linecap="round"/>${buckle(C, 98.6 + i * 3.4, y, 0, .5)}`).join("")}
              <path d="M84 176Q100 182 116 176L116 192L84 192Z" fill="#14141A" opacity=".45"/></g>
            <path d="M91 104Q100 109 109 104L109 108Q100 113 91 108Z" fill="${M.leather(C, "#20222A", [0, 0, 0, 1])}" stroke="#06060A" stroke-width=".7"/>
            ${strap(C, "M110 106L89 160", 3.2)}${buckle(C, 101, 128, -62, .8)}
            <path d="M86 156Q100 161 114 156L114 162Q100 167 86 162Z" fill="${M.leather(C, LEA, [0, 0, 0, 1])}" stroke="#140804" stroke-width=".8"/>${M.stitch("M86 159Q100 164 114 159", "#D8A070", .4)}${buckle(C, 100, 161.6, 0, .8)}
            ${pouch(C, 90, 161, 6.4, 8, 4)}${pouch(C, 109.6, 161, 6, 7.4, -4)}`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = sleeve(C2, segs, w);
            return `${ink(C2, d, M.leather(C2, "#2C2E38", [0, 0, 1, 0]), "#06060A", { heavy: W.minor })}<path d="${d}" fill="none" stroke="#7A7E92" stroke-width=".5" opacity=".4" transform="translate(-.6 0)"/>
              ${band(C2, segs, .58, 5.8, M.leather(C2, "#4A2814", [0, 0, 0, 1]), "#140804")}${band(C2, segs, .7, 5.6, M.leather(C2, "#4A2814", [0, 0, 0, 1]), "#140804", `<circle cx="0" cy="${-3}" r=".6" fill="${GOLD}"/><circle cx="0" cy="3" r=".6" fill="${GOLD}"/>`)}${band(C2, segs, .8, 5.6, "#14141A", "#06060A")}`; } };
      }, { aliases: ["wizhat"], replaces: SUITS });

    item("ember", 2, 1, "foxmask", "face", "Fox Shadow Mask", "Angular black velvet that follows the lines of a fox's face, embroidered in amber around the eyes. It hides who she is and none of what she feels.",
      (C, F) => { const [[lx, ly], [rx, ry]] = F.head.eyes;
        const mask = "M73 75L76 63L85 65.4C90.6 66.6 95.4 68 100 71C104.6 68 109.4 66.6 115 65.4L124 63L127 75C127 82.6 121.4 87.4 113 86.4C107 85.6 103.6 82.4 100 82.4C96.4 82.4 93 85.6 87 86.4C78.6 87.4 73 82.6 73 75Z";
        const tips = "M76 63L67.6 52.6L72.4 69ZM124 63L132.4 52.6L127.6 69Z";
        const eyeH = (x, y, r = 1) => `M${x - 8 * r} ${y + .6}C${x - 5 * r} ${y - 6 * r} ${x + 5 * r} ${y - 6.4 * r} ${x + 8.4 * r} ${y - 1.2}C${x + 5 * r} ${y + 5.4 * r} ${x - 5 * r} ${y + 5.6 * r} ${x - 8 * r} ${y + .6}Z`;
        const vel = M.velvet(C, "#2A2A38", [0, 0, 0, 1]);
        return { head: `${ink(C, tips, vel, "#000", { heavy: .9 })}<path d="M70 56L73.4 66" stroke="${AMB}" stroke-width=".5" opacity=".8"/><path d="M130 56L126.6 66" stroke="${AMB}" stroke-width=".5" opacity=".8"/>
          <path d="${mask} ${eyeH(lx, ly)} ${eyeH(rx, ry)}" fill-rule="evenodd" fill="${vel}" stroke="#000" stroke-width="1.3"/>
          <path d="M76 70C77 66.4 80.4 65 85 66.4C90 67.6 95 69 99 71.6" stroke="#9090AC" stroke-width="1.1" fill="none" opacity=".55" stroke-linecap="round"/><path d="M101 71.6C105 69 110 67.6 115 66.4" stroke="#9090AC" stroke-width=".8" fill="none" opacity=".4" stroke-linecap="round"/>
          <path d="${eyeH(lx, ly, 1.22)} ${eyeH(rx, ry, 1.22)}" fill="none" stroke="${AMB}" stroke-width=".6" stroke-dasharray="1.1 .8"/>
          ${[[lx - 9.8, ly - 1.6], [rx + 10.2, ry - 2]].map(([x, y]) => `<path d="M${x} ${y}l-1.6 -2.4M${x} ${y}l1.6 -2.4" stroke="${AMB}" stroke-width=".5"/>`).join("")}
          ${rivet(C, 75.6, 74.8, .9)}${rivet(C, 124.4, 74.8, .9)}<g transform="translate(100 74.6)"><path d="M-2.6 -1.6L-1.4 1.4L0 2.4L1.4 1.4L2.6 -1.6L1 -.4L0 -1.4L-1 -.4Z" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".35"/></g>` }; },
      { aliases: ["beret"] });

    // ================= LEVEL 3 · the shadow assassin =================
    item("ember", 3, 0, "silentblade", "torso", "Silent Blade Ensemble", "A fitted charcoal jacket over leather chest plates, crossed straps carrying her bookmark daggers, and gloves cut away at the fingertips. She marks her place in a book the same way she marks a target: precisely.",
      (C) => { const jk = "M90 104C84 108 82 118 83 130C84 142 86 150 86 160C86 168 86 174 86 178L114 178C114 174 114 168 114 160C114 150 116 142 117 130C118 118 116 108 110 104Q100 110 90 104Z";
        const plate = "M88 112C86 120 86.6 128 89.6 135L98.6 137L99 115Q94 113.6 88 112Z";
        const tail = "M88 168C85 180 82 192 78 202L90 198L97 176Z";
        return {
          back: `${ink(C, tail, M.velvet(C, CH), "#06060A", { heavy: W.minor })}<path d="${tail}" fill="none" stroke="${VIO}" stroke-width="1" transform="translate(.6 -.4)"/><g ${MIR}>${ink(C, tail, M.velvet(C, CH), "#06060A", { heavy: W.minor })}<path d="${tail}" fill="none" stroke="${VIO}" stroke-width="1" transform="translate(.6 -.4)"/></g>`,
          body: `${ink(C, jk, M.velvet(C, CH, [0, 0, 1, 1]), "#06060A", { heavy: W.minor })}<g clip-path="${C.clip(jk)}"><path d="M100 136V178" stroke="#06060A" stroke-width=".9"/><path d="M99.4 136V178" stroke="${VIO}" stroke-width=".7"/><path d="M88 140C87 152 88 164 89 176" stroke="#6A6E82" stroke-width="1.6" fill="none" opacity=".4" stroke-linecap="round"/>${K.folds({ prof: { cx: 100, pts: [[150, 15], [180, 15]] } }, 166, 180, 4, "#000", .45, 1)}</g>
            ${[0, 1].map(m => `<g ${m ? MIR : ""}>${ink(C, plate, M.leather(C, "#4A2A16", [0, 0, 1, 1]), "#140804", { heavy: .9 })}${M.stitch("M89.4 114C88 121 88.4 128 90.8 133.6L97.4 135.2", "#D8A070", .4)}<path d="M89 118C88.6 124 89 128 90.4 132" stroke="#B88058" stroke-width=".9" fill="none" opacity=".5"/>${rivet(C, 97.4, 117, .7)}${rivet(C, 97.4, 133, .7)}</g>`).join("")}
            <path d="M91 104Q100 109 109 104L110 109Q100 114 90 109Z" fill="${M.velvet(C, "#1A1C24", [0, 0, 0, 1])}" stroke="#06060A" stroke-width=".7"/><path d="M90.4 108.8Q100 113.6 109.6 108.8" stroke="${VIO}" stroke-width=".8" fill="none"/>
            ${strap(C, "M89 108L111 156", 3.2)}${strap(C, "M111 108L89 156", 3.2)}<circle cx="100" cy="132" r="3.4" fill="none" stroke="#3A2006" stroke-width="2.6"/><circle cx="100" cy="132" r="3.4" fill="none" stroke="${M.brass(C, [0, 0, 1, 1])}" stroke-width="1.7"/>

            <path d="M85 156Q100 161 115 156L115 162Q100 167 85 162Z" fill="${M.leather(C, LEA, [0, 0, 0, 1])}" stroke="#140804" stroke-width=".8"/>${buckle(C, 100, 161.4, 0, .8)}
            ${strap(C, "M86 167Q100 168 115 162", 2.6, "#3A2010")}${pouch(C, 89.6, 162.6, 5.6, 7, 4)}${pouch(C, 104, 164.4, 5, 6.4, -2)}
            ${bookDagger(C, 116.6, 150, -10, 1.45)}${bookDagger(C, 85, 158, 14, 1.3)}`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = sleeve(C2, segs, w, null, null, .82), gl = ART3.tube(ART3.subSegs(segs, .8, .95), [w[w.length - 2] * 1.16, w[w.length - 1] * 1.2]);
            return `${ink(C2, d, M.velvet(C2, CH, [0, 0, 1, 0]), "#06060A", { heavy: W.minor })}
              ${ink(C2, gl, M.leather(C2, "#5A3420", [0, 0, 1, 0]), "#140804", { heavy: W.minor })}<path d="${gl}" fill="none" stroke="#E8B070" stroke-width=".4" stroke-dasharray="1 .9" opacity=".7"/>
              ${band(C2, segs, .79, 5.8, M.velvet(C2, VIO, [0, 0, 0, 1]), "#0A0612")}${(() => { const [x, y, a] = M.along(segs, .86); return buckle(C2, x, y, a + 90, .5); })()}`; } };
      }, { aliases: ["flowers"], replaces: SUITS });

    item("ember", 3, 1, "moonshadowcloak", "back", "Moonshadow Half-Cloak", "Thrown over one shoulder: black outside, midnight violet within, split into two tails that follow her like a second shadow.",
      (C) => { const front = "M99 108C90 103 81 103 76 108C66 130 58 162 50 194L60 189L66 201L76 186L82 190C82 160 88 130 99 108Z";
        const lining = "M99 108C88 130 82 160 82 190L77.6 186.6C78 158 85 130 95.4 106.4Z";
        const backD = "M120 104C100 100 84 102 76 108C62 128 48 166 40 204L53 199L59 210L72 198L84 205C88 176 100 140 120 104Z";
        const weave = K.patt(C, 3, 3, `<path d="M0 3L3 0" stroke="#FFFFFF" stroke-width=".25" opacity=".06"/>`);
        return {
          back: `${ink(C, backD, M.velvet(C, "#1A1A22", [0, 0, 1, 1]), "#04040A", { heavy: W.minor })}<path d="${backD}" fill="${weave}"/><path d="M40 204L53 199L59 210L72 198L84 205" fill="none" stroke="${VIO}" stroke-width="2"/><path d="M40 204L53 199L59 210L72 198L84 205" fill="none" stroke="${AMB}" stroke-width=".55" stroke-dasharray="1.3 .8" transform="translate(.4 -1.6)"/>`,
          body: `${ink(C, front, M.velvet(C, CH, [1, 0, 0, 1]), "#04040A", { heavy: W.minor })}<path d="${front}" fill="${weave}"/><g clip-path="${C.clip(front)}"><path d="M72 130C66 152 62 172 58 190M86 124C82 150 80 170 78 188" stroke="#04040A" stroke-width="1.1" fill="none" opacity=".6"/><path d="M78 116C70 136 64 158 60 180" stroke="#6A6E86" stroke-width="1.8" fill="none" opacity=".35" stroke-linecap="round"/></g>
            <path d="M50 194L60 189L66 201L76 186" fill="none" stroke="${AMB}" stroke-width=".55" stroke-dasharray="1.3 .8" transform="translate(.6 -1.6)"/>
            ${ink(C, lining, M.satin(C, VIO, [0, 0, 1, 1]), "#0A0612", { heavy: .8 })}<path d="M96 110C87 130 81 158 80.6 186" stroke="#9A80D0" stroke-width=".6" fill="none" opacity=".6"/>
            <path d="M99 113Q106 116 112 111" stroke="${GOLD}" stroke-width=".8" fill="none" stroke-dasharray="1.2 .5"/><path d="M112 111l1.6 -1.6" stroke="${GOLD}" stroke-width=".9"/>
            <g transform="translate(97.6 113)"><circle r="4.6" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".7"/>${Array.from({ length: 8 }, (_, i) => `<circle r=".7" cx="${f1(Math.cos(i * Math.PI / 4) * 3.9)}" cy="${f1(Math.sin(i * Math.PI / 4) * 3.9)}" fill="#FFE8B0"/>`).join("")}${amberGem(C, 0, 0, 2.6)}<path d="M-2.6 4.4L0 8.6L2.6 4.4" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".4"/></g>` };
      }, { aliases: ["cape"], replaces: CLOAKS });

    // ================= LEVEL 4 · the master infiltrator =================
    item("ember", 4, 0, "nightinfiltrator", "torso", "The Night Infiltrator", "A fitted hood, a high angular collar and a tailored stealth coat over layered leather, stitched with amber symbols only other spies can read.",
      (C) => { const coat = "M90 104C84 108 82 118 83 130C84 142 86 150 86 160C85 170 84 178 83 186L92 182L100 176L108 182L117 186C116 178 115 170 114 160C114 150 116 142 117 130C118 118 116 108 110 104Q100 110 90 104Z";
        const flap = "M90 105C96 110 102 110 108 106C106 118 104 132 104 146C104 158 105 168 108 182L100 176L92 182C93 170 94 158 94 146C94 132 93 118 90 105Z";
        const pauld = (i) => `M${80 + i * .6} ${108 + i * 4.6}C${84 - i} ${104 + i * 4.6} ${92 - i} ${104 + i * 4.6} ${95 - i} ${110 + i * 4.6}L${92 - i * 1.4} ${116 + i * 4.4}C${88 - i} ${113 + i * 4.4} ${83} ${114 + i * 4.4} ${79 + i * .4} ${117 + i * 4.4}Z`;
        const hoodD = "M100 34C80 34 63 49 61 71C59 89 65 104 75 112L125 112C135 104 141 89 139 71C137 49 120 34 100 34Z";
        const rim = "M67 58C60 71 59 87 64 99C68 106 74 110 81 112L85 108C77 104 71 97 69 88C67 78 68 67 73 59Z";
        const tails = "M88 170C84 182 80 196 76 206L90 204L100 188L110 204L124 206C120 196 116 182 112 170Z";
        return {
          nape: `${ink(C, hoodD, M.velvet(C, "#22242E", [.2, 0, .8, 1]), "#04040A", { heavy: W.major })}<path d="M100 36V58" stroke="#04040A" stroke-width=".9" opacity=".7"/>${M.stitch("M101 37V56", "#6A6E86", .4)}<path d="M70 52C76 42 86 37 96 36" stroke="#6A6E86" stroke-width="1.6" fill="none" opacity=".4" stroke-linecap="round"/>`,
          head: `${[0, 1].map(m => `<g ${m ? MIR : ""}>${ink(C, rim, M.velvet(C, "#30323E", [1, 0, 0, 1]), "#04040A", { heavy: 1 })}${M.stitch("M68.4 61C62.4 73 61.6 87 65.8 97.6C69 103 73.6 106.6 79.6 109", AMB, .45)}
              ${ink(C, "M99 113L84 108L74 98L78 96L88 103L99 108Z", M.velvet(C, "#3A3C4A", [1, 0, 0, 1]), "#04040A", { heavy: .9 })}<path d="M76 97L86 104.6L98.6 109" stroke="${AMB}" stroke-width=".5" fill="none" stroke-dasharray="1 .7"/></g>`).join("")}`,
          back: `${ink(C, tails, M.velvet(C, "#1C1E26"), "#04040A", { heavy: W.minor })}<path d="M100 188V200" stroke="#04040A" stroke-width=".8"/>${[0, 1].map(i => rune(84 + i * 3, 198 - i * 6, .5, "#C88A30", "", i)).join("")}`,
          body: `${ink(C, coat, M.velvet(C, "#2A2C38", [0, 0, 1, 1]), "#04040A", { heavy: W.minor })}<g clip-path="${C.clip(coat)}">
              <path d="M88 116C86 132 87 152 88 176" stroke="#6A6E86" stroke-width="1.8" fill="none" opacity=".35" stroke-linecap="round"/>
              ${ink(C, "M104 112C110 112 114 116 115 124C116 134 114 142 110 146L104 146Z", M.leather(C, "#3A2416", [0, 0, 1, 1]), "#140804", { heavy: .8 })}${ink(C, "M104 128C110 128 114 132 114.6 138C114 144 112 148 108 152L104 152Z", M.leather(C, "#4A2C18", [0, 0, 1, 1]), "#140804", { heavy: .8 })}
              <path d="M88.4 150h5M107 160h6" stroke="#04040A" stroke-width="1.1"/><path d="M88.4 149.4h5M107 159.4h6" stroke="#6A6E86" stroke-width=".4"/><circle cx="93" cy="150" r=".6" fill="${GOLD}"/><circle cx="112.6" cy="160" r=".6" fill="${GOLD}"/></g>
            ${ink(C, flap, M.velvet(C, "#30323E", [0, 0, 1, 1]), "#04040A", { heavy: .9 })}${M.stitch("M107 108C105 120 103.4 134 103.4 146C103.4 158 104.4 168 106.8 180", AMB, .45)}${[124, 140, 156].map(y => rune(98.6, y, .5, "#C88A30", "", y)).join("")}
            ${[118, 134, 150, 166].map(y => `<path d="M103.6 ${y}L113 ${y - 1}" stroke="#140804" stroke-width="2.2" stroke-linecap="round"/><path d="M103.6 ${y}L113 ${y - 1}" stroke="${LEA}" stroke-width="1.4" stroke-linecap="round"/>${buckle(C, 108.4, y - .5, -6, .5)}`).join("")}
            <path d="M85 158Q100 163 115 158L115 163Q100 168 85 163Z" fill="${M.leather(C, "#1A1012", [0, 0, 0, 1])}" stroke="#04040A" stroke-width=".7"/>${buckle(C, 96, 162.6, 0, .75)}
            ${[2, 1, 0].map(i => `${ink(C, pauld(i), M.leather(C, i ? "#3A2416" : "#4A2C18", [0, 0, 1, 1]), "#140804", { heavy: .8 })}${M.stitch(pauld(i).split("L")[0].replace(/^M/, "M"), "#D8A070", .35)}`).join("")}${rivet(C, 88, 109, .8)}
            <path d="M90 105Q100 111 110 105L110 109Q100 115 90 109Z" fill="#1A1C24" stroke="#04040A" stroke-width=".7"/>`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = sleeve(C2, segs, w, null, null, .84);
            return `${ink(C2, d, M.velvet(C2, "#2A2C38", [0, 0, 1, 0]), "#04040A", { heavy: W.minor })}<path d="${d}" fill="none" stroke="#6A6E86" stroke-width=".5" opacity=".4" transform="translate(-.6 0)"/>
              ${[.48, .58, .68].map(t => band(C2, segs, t, 5.8, M.leather(C2, "#3A2416", [0, 0, 0, 1]), "#140804")).join("")}${band(C2, segs, .8, 6, M.leather(C2, "#1A1012", [0, 0, 0, 1]), "#04040A", `<path d="M0 -5.6V5.6" stroke="${AMB}" stroke-width=".45" stroke-dasharray="1 .7"/>`)}`; } };
      }, { aliases: [], replaces: [...SUITS, "hood"], covers: ["neck"] });

    item("ember", 4, 1, "nightglider", "back", "Phantom Glider Mantle", "A cloak by day. With one tug of a brass ring it unfolds into night-black wings on copper struts, every joint glowing amber, and she steps off the clock tower.",
      (C) => { const wing = s => { const m = x => 100 + s * (x - 100), A = [m(94), 110], J = [m(56), 66];
          const tips = [[m(12), 26], [m(4), 70], [m(18), 106], [m(44), 126]];
          let d = `M${A[0]} ${A[1]}C${m(80)} 90 ${m(66)} 72 ${J[0]} ${J[1] - 2}C${m(40)} 50 ${m(26)} 34 ${tips[0][0]} ${tips[0][1]}`;
          const cp = [[m(30), 56], [m(26), 92], [m(38), 112], [m(70), 120]];
          for (let i = 1; i < tips.length; i++) d += `Q${cp[i - 1][0]} ${cp[i - 1][1]} ${tips[i][0]} ${tips[i][1]}`;
          d += `Q${m(72)} 126 ${m(90)} 140Z`;
          const mem = C.lin([[0, "#3A2862"], [.45, "#1E1634"], [1, "#0C0A14"]], [s < 0 ? 1 : 0, 1, s < 0 ? 0 : 1, 0]);
          const struts = tips.map(([x, y]) => `<path d="M${J[0]} ${J[1]}L${x} ${y}" stroke="#2A1206" stroke-width="2.6" stroke-linecap="round"/><path d="M${J[0]} ${J[1]}L${x} ${y}" stroke="${M.copper(C, [0, 0, 1, 1])}" stroke-width="1.5" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="1.3" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".4"/>`).join("");
          const seams = tips.slice(0, 3).map(([x, y], i) => { const [x2, y2] = tips[i + 1]; return `<path d="M${f1((J[0] * 2 + x + x2) / 4)} ${f1((J[1] * 2 + y + y2) / 4)}Q${f1((x + x2) / 2)} ${f1((y + y2) / 2 + 4)} ${f1((x + x2 * 3) / 4)} ${f1((y + y2 * 3) / 4)}" stroke="#7A64B0" stroke-width=".45" fill="none" stroke-dasharray="1 .9" opacity=".7"/>`; }).join("");
          return `${ink(C, d, mem, "#04040A", { heavy: W.minor })}<g clip-path="${C.clip(d)}">${tips.map(([x, y]) => `<path d="M${J[0]} ${J[1]}L${x} ${y}" stroke="#5A4890" stroke-width="5" opacity=".25"/>`).join("")}${seams}<path d="${d}" fill="none" stroke="${VIO}" stroke-width="2.4" opacity=".8"/></g>
            <path d="M${A[0]} ${A[1]}C${m(80)} 90 ${m(66)} 72 ${J[0]} ${J[1]}" stroke="#2A1206" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M${A[0]} ${A[1]}C${m(80)} 90 ${m(66)} 72 ${J[0]} ${J[1]}" stroke="${M.brass(C, [0, 0, 1, 1])}" stroke-width="2" fill="none" stroke-linecap="round"/>${struts}
            ${K.glow(C, J[0], J[1], 7, AMB, .7)}<circle cx="${J[0]}" cy="${J[1]}" r="3" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".6"/>${amberGem(C, J[0], J[1], 1.7)}`; };
        const drape = "M82 104C70 128 66 168 64 206Q100 214 136 206C134 168 130 128 118 104Z";
        return {
          far: `${wing(-1)}${wing(1)}${ink(C, drape, M.velvet(C, "#14121C"), "#04040A", { heavy: W.minor })}<path d="M64 206Q100 214 136 206" stroke="${VIO}" stroke-width="1.6" fill="none"/>`,
          body: `${strap(C, "M86 108L100 126L114 108", 2.6, "#2A1810")}<g transform="translate(100 126)"><circle r="4.2" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".7"/><circle r="2.6" fill="none" stroke="#3A2006" stroke-width=".7"/>${amberGem(C, 0, 0, 1.5)}</g>` };
      }, { aliases: [], replaces: CLOAKS });

    // ================= LEVEL 5 · the legendary phantom =================
    item("ember", 5, 0, "phantomregalia", "torso", "Regalia of the Velvet Phantom", "Midnight-violet velvet cut on the bias, a tall sweeping collar, amber and antique-gold embroidery, brass frogging and long split tails. Wherever she has been, it is the only thing anyone remembers.",
      (C) => { const vio = (a) => C.lin([[0, "#6A4AA8"], [.3, "#3E2A6A"], [.75, "#231840"], [1, "#120A24"]], a);
        const collar = "M98 112C88 100 79 88 71 74C65 64 60 55 55 47C56 60 58 74 61 87C64 99 70 107 79 111Z";
        const undr = "M91 104C85 108 83 118 84 130C85 142 87 150 87 160L88 176L112 176L113 160C113 150 115 142 116 130C117 118 115 108 109 104Q100 110 91 104Z";
        const pL = "M90 104C84 108 82 118 83 130C84 142 86 150 86 160C85 170 84 180 82 192L96 186C99 170 103 150 105 134C107 122 106 112 101 108Q95 108 90 104Z";
        const pR = "M110 104C116 108 118 118 117 130C116 142 114 150 114 160C115 170 116 180 118 192L111 186C110 168 110 150 111 136C112 124 112 112 110 104Z";
        const tailL = "M88 168C80 184 70 198 54 210L74 210L90 196L96 178Z", tailR = "M112 168C116 180 120 192 128 204L116 204L106 186L104 176Z";
        const emb = (d) => `<path d="${d}" stroke="#2A1406" stroke-width="2.2" fill="none" opacity=".5"/><path d="${d}" stroke="${GOLD}" stroke-width="1.3" fill="none"/><path d="${d}" stroke="#FFF0C0" stroke-width=".45" fill="none" stroke-dasharray=".4 1.4"/>`;
        return {
          nape: `${[0, 1].map(m => `<g ${m ? MIR : ""}>${ink(C, collar, vio([1, 0, 0, 1]), "#0A0418", { heavy: W.minor })}<g clip-path="${C.clip(collar)}"><path d="M95 110C86 98 76 84 66 66L63 72C70 88 80 100 92 112Z" fill="${M.satin(C, "#5A3A90", [0, 0, 1, 1])}" opacity=".8"/>${[0, 1, 2, 3].map(i => `<path d="M${94 - i * 2} 111L${60 + i * 3.6} ${56 + i * 9}" stroke="${GOLD}" stroke-width=".45" opacity=".7"/>`).join("")}</g>${emb("M55 47C56 60 58 74 61 87C64 99 70 107 79 111")}${M.filigree(66, 86, .6, GOLD, .6)}</g>`).join("")}`,
          back: [[tailL, 0], [tailR, 1]].map(([d, i]) => `${ink(C, d, vio([0, 0, 1, 1]), "#0A0418", { heavy: W.minor })}<g clip-path="${C.clip(d)}">${emb(i ? "M128 204L116 204" : "M54 210L74 210")}</g>${i ? rune(118, 196, .8, AMB, "a3twinkle", 3) : rune(70, 202, .8, AMB, "a3twinkle", 1) + rune(80, 192, .7, AMB, "a3twinkle", 4)}`).join("") + `<path d="M54 210L74 210L90 196" stroke="${GOLD}" stroke-width="1" fill="none"/>`,
          body: `${ink(C, undr, M.leather(C, "#16121C", [0, 0, 1, 1]), "#04040A", { heavy: W.minor })}<g clip-path="${C.clip(undr)}"><path d="M104 114C106 130 106 150 104 176" stroke="#5A5070" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>${[120, 128, 136, 144].map(y => `<path d="M106 ${y}l5 4M111 ${y}l-5 4" stroke="${GOLD}" stroke-width=".5"/>`).join("")}</g>
            ${ink(C, pR, vio([1, 0, 0, 1]), "#0A0418", { heavy: W.minor })}${emb("M110 104C112 112 112 124 111 136C110 150 110 168 111 186")}
            ${ink(C, pL, vio([0, 0, 1, 1]), "#0A0418", { heavy: W.minor })}<g clip-path="${C.clip(pL)}"><path d="M87 112C85 130 86 152 87 180" stroke="#9A7AD8" stroke-width="2.2" fill="none" opacity=".35" stroke-linecap="round"/>${K.folds({ prof: { cx: 92, pts: [[160, 10], [192, 14]] } }, 172, 192, 3, "#06020E", .5, 1.1)}</g>
            ${emb("M101 108C106 112 107 122 105 134C103 150 99 170 96 186")}${emb("M82 192L96 186")}${M.filigree(97, 122, .7, GOLD, .6)}${M.filigree(92, 176, .7, GOLD, .6)}
            ${[128, 140, 152].map(y => `<path d="M${f1(104.6 - (y - 128) * .1)} ${y}H111" stroke="#2A1406" stroke-width="2" stroke-linecap="round"/><path d="M${f1(104.6 - (y - 128) * .1)} ${y}H111" stroke="${M.brass(C)}" stroke-width="1.2" stroke-linecap="round"/><circle cx="${f1(104 - (y - 128) * .1)}" cy="${y}" r="1.2" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".35"/><circle cx="111.6" cy="${y}" r="1" fill="none" stroke="${M.brass(C)}" stroke-width=".7"/>`).join("")}
            <path d="M86 158Q100 163 114 158L114 165Q100 170 86 165Z" fill="${M.leather(C, "#120C16", [0, 0, 0, 1])}" stroke="#04040A" stroke-width=".7"/>${buckle(C, 92, 162, 0, .7)}${buckle(C, 108, 162, 0, .7)}
            ${[[90, 182], [94, 170]].map(([x, y], i) => rune(x, y, .6, AMB, "a3twinkle", i + 2)).join("")}
            <g transform="translate(98 116)">${ink(C, "M-3.6 -2.6L-2 .2L0 -.8L2 .2L3.6 -2.6L3.2 1.4L0 4.2L-3.2 1.4Z", M.brass(C, [0, 0, 1, 1]), "#3A2006", { heavy: .6 })}<circle cx="-1.2" cy="1" r=".45" fill="#3A2006"/><circle cx="1.2" cy="1" r=".45" fill="#3A2006"/>${amberGem(C, 0, 3, .9)}</g>
            <path d="M80 110C82 104 90 102 94 106C92 110 88 114 84 116Z" fill="${vio([0, 0, 1, 1])}" stroke="#0A0418" stroke-width=".9"/>${emb("M80 110C82 104 90 102 94 106")}`,
          arms: (C2, segs, w, side) => { if (!segs) return ""; const d = sleeve(C2, segs, w, null, null, .8), vv = C2.lin([[0, "#5A3E94"], [.4, "#3E2A6A"], [1, "#160C2C"]], [0, 0, 1, 0]);
            const [cx, cy, ca] = M.along(segs, .79), [sx, sy] = M.along(segs, .04);
            return `${ink(C2, d, vv, "#0A0418", { heavy: W.minor })}<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ca)})"><path d="M-3.4 -7.2Q-5 0 -3.4 7.2L2 7.2Q.6 0 2 -7.2Z" fill="${M.satin(C2, "#4A3478", [0, 0, 0, 1])}" stroke="#0A0418" stroke-width=".7"/><path d="M-3.4 -7.2Q-5 0 -3.4 7.2M2 -7.2Q.6 0 2 7.2" stroke="${GOLD}" stroke-width=".8" fill="none"/><path d="M-1 -5Q-2 0 -1 5" stroke="${GOLD}" stroke-width=".4" fill="none" stroke-dasharray=".4 1"/></g>
              ${side === "R" ? `<path d="M${f1(sx - 6)} ${f1(sy - 2)}C${f1(sx - 2)} ${f1(sy - 7)} ${f1(sx + 7)} ${f1(sy - 6)} ${f1(sx + 9)} ${f1(sy + 1)}C${f1(sx + 6)} ${f1(sy + 4)} ${f1(sx)} ${f1(sy + 5)} ${f1(sx - 4)} ${f1(sy + 4)}Z" fill="${vv}" stroke="#0A0418" stroke-width=".9"/><path d="M${f1(sx - 6)} ${f1(sy - 2)}C${f1(sx - 2)} ${f1(sy - 7)} ${f1(sx + 7)} ${f1(sy - 6)} ${f1(sx + 9)} ${f1(sy + 1)}" stroke="${GOLD}" stroke-width="1.1" fill="none"/>` : ""}`; } };
      }, { aliases: ["mantle"], replaces: [...SUITS, "hood"], covers: ["neck"] });

    item("ember", 5, 1, "foxfirespirit", "back", "Living Shadow Mantle", "A cloak woven from living darkness. Amber foxfire drifts along its hem, old runes surface and fade in its folds, and from those folds a fox of shadow rises to keep watch.",
      (C) => { const cloak = "M82 102C62 122 42 162 28 206Q40 203 49 211Q61 203 73 211Q87 203 100 211Q113 203 126 211Q138 204 146 206C140 168 130 128 118 102Z";
        const veil1 = "M80 108C64 130 52 164 44 200Q62 194 76 204C76 170 80 136 92 110Z", veil2 = "M60 150C50 170 42 188 34 204Q48 200 58 206C58 186 60 168 66 150Z";
        const fox = "M24 96C26 92 30 88 34 85C34 80 34 76 36 72L36 58L44 67C47 66 51 65 53 66L59 56L59 68C63 72 65 78 65 86C67 96 70 104 76 112L64 122C58 114 52 106 49 100C44 99 36 98 30 98C28 98 25 97 24 96Z";
        const shadow = C.lin([[0, "#3A2464", .96], [.55, "#1A1030", .97], [1, "#06040C", .98]], [0, 0, .3, 1]);
        const flame = C.lin([[0, "#FFE8A0"], [.4, AMB], [1, "#D8401A"]], [0, 0, 0, 1]);
        const lick = (x, y, a, s = 1, i = 0) => `<path class="a3twinkle" style="animation-delay:${(i * .3).toFixed(1)}s" d="M0 0C-2 -4 -1 -8 1 -11C1 -7 3 -5 4 -2C4 -5 6 -7 7 -8C7 -4 6 -1 4 1Z" fill="${flame}" transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})"/>`;
        const hem = [[30, 206], [49, 211], [61, 203], [73, 211], [87, 203], [113, 203], [126, 211], [140, 205]];
        const sparks = [[38, 190], [56, 182], [26, 170], [134, 192], [46, 148], [70, 196], [30, 120], [142, 180]].map(([x, y], i) => `<circle data-fine="1" class="a3float" cx="${x}" cy="${y}" r="${(i % 3) * .35 + .8}" fill="${i % 2 ? "#FFE0A0" : AMB}" style="animation-delay:${(i * .45).toFixed(2)}s"/>`).join("");
        const wisps = ["M28 206C22 198 22 190 26 184", "M100 211C98 216 92 217 88 214", "M146 206C152 200 152 192 148 186"].map((d, i) => `<path data-fine="1" class="a3float" style="animation-delay:${i * .8}s" d="${d}" stroke="#6A4AA8" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>`).join("");
        return {
          far: `${K.glow(C, 46, 92, 30, AMB, .26)}${K.glow(C, 70, 204, 46, AMB, .18)}
            ${ink(C, cloak, shadow, "#04020A", { heavy: W.minor })}<g clip-path="${C.clip(cloak)}">
              <path d="${veil1}" fill="#6A4AA8" opacity=".3"/><path d="${veil2}" fill="#8A6AC8" opacity=".22"/>
              <path d="M70 120C60 148 52 176 46 204M94 112C90 146 88 176 88 204M112 110C116 140 120 170 124 204" stroke="#000" stroke-width="1.4" fill="none" opacity=".5"/><path d="M74 124C66 148 60 172 54 196" stroke="#8A6AC8" stroke-width="1.4" fill="none" opacity=".35" stroke-linecap="round"/>
              ${[[56, 168], [82, 150], [106, 176], [66, 194], [120, 150]].map(([x, y], i) => rune(x, y, .9, AMB, "a3twinkle", i)).join("")}</g>
            <path d="M28 206Q40 203 49 211Q61 203 73 211Q87 203 100 211Q113 203 126 211Q138 204 146 206" stroke="${AMB}" stroke-width="1" fill="none" opacity=".85"/>
            ${hem.map(([x, y], i) => lick(x, y + 1, (i % 2 ? 8 : -10), .55 + (i % 3) * .1, i)).join("")}${wisps}
            <path d="${fox}" fill="${C.lin([[0, "#6A4AA8", .7], [1, "#1E1434", .55]], [0, 0, 1, 1])}" stroke="${AMB}" stroke-width="1.2" stroke-linejoin="round"/><path d="${fox}" fill="none" stroke="#FFE8A0" stroke-width=".4" opacity=".8"/>
            ${lick(36, 59, -18, .8, 2)}${lick(59, 57, 14, .8, 5)}
            <path d="M40 80Q43.6 77.6 47 80Q43.6 82 40 80ZM51 79Q54 77 57 79Q54 81 51 79Z" fill="#FFE8A0"/><path d="M42.6 79.9h2M53.2 79h1.6" stroke="#C83A10" stroke-width=".8" stroke-linecap="round"/>
            <circle cx="25.6" cy="95.2" r="1.5" fill="#120A24" stroke="${AMB}" stroke-width=".5"/><path d="M29 96.4Q36 98 44 96" stroke="${AMB}" stroke-width=".6" fill="none" opacity=".8"/><path d="M34 86C38 90 44 92 50 92" stroke="#FFE8A0" stroke-width=".6" fill="none" opacity=".6"/>
            ${sparks}`,
          back: `<path d="M80 104C76 108 74 114 74 120C80 116 88 112 96 110ZM120 104C124 108 126 114 126 120C120 116 112 112 104 110Z" fill="#1A1030" stroke="#04020A" stroke-width=".8"/>` };
      }, { aliases: ["starcrown"], replaces: CLOAKS });
  });
  // pieces from the earlier Ember concept, kept so nothing unlocked is lost
  Object.assign(ART3.RENAMED, { "ember.keyribbon": "ember.whisperscarf", "ember.lockpickearring": "ember.thiefcapelet", "ember.leathergloves": "ember.burglarsuit",
    "ember.rogueharness": "ember.silentblade", "ember.grapplinghook": "ember.moonshadowcloak", "ember.tricorne": "ember.nightinfiltrator" });
})();

// ===== Sir Wartsworth — "The Marvellous Laboratory": brass, copper, glass, and inventions that probably shouldn't work =====
// L1 jeweller's loupe · periodic-table bow tie      L2 yellow rubber gloves · Tesla tuning fork
// L3 wild genius hair · alchemist's leather apron      L4 bubbling laboratory backpack · magnifier head-rig
// L5 brass ornithopter wings · Chrono-Coat with clockwork heart
(() => {
  const { ink, mix, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const COP = "#C8702E";
  const rivet = (C, x, y, r = .9) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".3"/><circle cx="${f1(x - r * .3)}" cy="${f1(y - r * .3)}" r="${f1(r * .35)}" fill="#FFF4C8"/>`;
  const gear = (C, x, y, r, teeth, fill, rot = 0, cls = "") => { let d = ""; const n = teeth * 2; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = i % 2 ? r : r * 1.22, a2 = ((i + 1) / n) * Math.PI * 2; d += `${i ? "L" : "M"}${f1(Math.cos(a) * rr)} ${f1(Math.sin(a) * rr)}L${f1(Math.cos(a2) * rr)} ${f1(Math.sin(a2) * rr)}`; }
    return `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})"><g${cls ? ` class="${cls}"` : ""}><path d="${d}Z" fill="${fill}" stroke="#3A2006" stroke-width=".5"/><circle r="${f1(r * .45)}" fill="#3A2006" opacity=".5"/><circle r="${f1(r * .22)}" fill="${fill}" stroke="#3A2006" stroke-width=".4"/></g></g>`; };
  const vial = (C, x, y, col, a = 0, h = 10) => `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-1.8" y="${-h}" width="3.6" height="${h}" rx="1.8" fill="${M.glass(C, "#DDEEFF", .3)}" stroke="#3A4A5A" stroke-width=".5"/><rect x="-1.4" y="${-h * .55}" width="2.8" height="${h * .55 - .4}" rx="1.4" fill="${col}"/><rect x="-2" y="${-h - 1.6}" width="4" height="2" rx=".6" fill="#7A4A2A"/><path d="M-.8 ${-h + 1.4}v${h * .3}" stroke="#fff" stroke-width=".5" opacity=".8"/></g>`;
  K.replaceCollection("wartsworth", () => {
    const item = K.item;
    // ---------- Level 1 ----------
    item("wartsworth", 1, 0, "brassloupe", "face", "Jeweller's Loupe", "A knurled brass eyeglass that makes everything ten times bigger, including his enthusiasm.",
      (C) => ({ head: `<path d="M110 70C116 64 126 64 132 70" stroke="#3A1E10" stroke-width="2.2" fill="none"/><path d="M110 70C116 64 126 64 132 70" stroke="#7A4A2A" stroke-width="1.4" fill="none"/>
        <g transform="translate(120 81)"><circle r="12.4" fill="none" stroke="#3A2006" stroke-width="4.6"/><circle r="12.4" fill="none" stroke="${M.brass(C, [0, 0, 1, 1])}" stroke-width="3.6"/><circle r="12.4" fill="none" stroke="#5A3410" stroke-width="3.6" stroke-dasharray=".5 1.1" opacity=".6"/>
          <circle r="10.4" fill="${M.glass(C, "#C8E8FF", .12)}" stroke="#3A2006" stroke-width=".6"/><path d="M-7 -4Q-5 -8 -1 -9" stroke="#fff" stroke-width="1.4" fill="none" opacity=".8" stroke-linecap="round"/>
          <path d="M10 8L15 14" stroke="#3A2006" stroke-width="3.6" stroke-linecap="round"/><path d="M10 8L15 14" stroke="${M.brass(C)}" stroke-width="2.4" stroke-linecap="round"/>${rivet(C, -11.6, -3.6, .7)}${rivet(C, 11.6, -3.6, .7)}</g>` }), { aliases: ["beret"] });
    item("wartsworth", 1, 1, "periodicbow", "neck", "Periodic Table Bow Tie", "Silk printed with the elements, knotted at Au (for a golden mind), pinned with a tiny orbiting atom.",
      (C) => { const tiles = K.patt(C, 4, 4, `<rect width="4" height="4" fill="#F4F0E4"/><rect x=".3" y=".3" width="3.4" height="3.4" fill="none" stroke="#2A4A8A" stroke-width=".35"/><rect x=".6" y=".6" width="1.2" height=".5" fill="#C83A3A" opacity=".6"/>`);
        const wing = s => { const m = x => 100 + s * (x - 100); return `M${m(100)} 131C${m(94)} 126 ${m(88)} 122 ${m(84)} 124C${m(82)} 128 ${m(82)} 134 ${m(84)} 138C${m(88)} 140 ${m(94)} 136 ${m(100)} 131Z`; };
        return { body: [-1, 1].map(s => `${ink(C, wing(s), "#F4F0E4", "#1E2A4A", { heavy: 1 })}<path d="${wing(s)}" fill="${tiles}"/><path d="${wing(s)}" fill="${M.satin(C, "#FFFFFF", [0, 0, 0, 1])}" opacity=".25"/><path d="M${100 + s * -8} 127Q${100 + s * -11} 131 ${100 + s * -9} 135" stroke="#1E2A4A" stroke-width=".6" fill="none" opacity=".5"/>`).join("")
          + `<rect x="96.4" y="127.4" width="7.2" height="7.2" rx="1" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".7"/><text x="100" y="132.8" font-family="Georgia,serif" font-size="4.4" font-weight="700" text-anchor="middle" fill="#3A2006">Au</text><text x="97.2" y="129.6" font-size="1.6" fill="#3A2006" font-family="sans-serif">79</text>
          <g transform="translate(110 141)"><circle r="1.1" fill="#C83A3A"/>${[0, 60, 120].map(a => `<ellipse rx="4" ry="1.4" fill="none" stroke="${M.brass(C)}" stroke-width=".6" transform="rotate(${a})"/>`).join("")}<circle cx="4" r=".6" fill="#7AE0FF"/></g>` }; }, { aliases: ["bow"] });
    // ---------- Level 2 ----------
    item("wartsworth", 2, 0, "rubbergloves", "arms", "Safety-Yellow Rubber Gloves", "Elbow-length, triple-tested and squeaky. He has never once needed them. He wears them anyway, just in case.",
      (C) => ({ arms: (C2, segs, w, side) => { if (!segs) return ""; const sub = ART3.subSegs(segs, .5, 1), ww = w.slice(-2).map(v => v * 1.1), d = ART3.tube(sub, ww);
        const [cx, cy, ca] = M.along(segs, .52), [ex, ey, ea] = M.along(segs, .999), yel = C2.lin([[0, "#FFF4A0"], [.4, "#F8D020"], [1, "#B88A06"]], [0, 0, 1, 1]);
        return `${ink(C2, d, yel, "#6A4A04", { heavy: W.minor })}<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width=".8" opacity=".3" transform="translate(-.8 -.4)"/>
          <g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ca)})"><rect x="-3" y="${-ww[0] / 2 - 1.8}" width="6" height="${ww[0] + 3.6}" rx="3" fill="${C2.lin([[0, "#FFF8C0"], [.5, "#F8D020"], [1, "#A87A06"]], [0, 0, 1, 0])}" stroke="#6A4A04" stroke-width=".9"/><path d="M0 ${-ww[0] / 2 - 1.4}V${ww[0] / 2 + 1.4}" stroke="#B88A06" stroke-width=".6"/></g>
          <g transform="translate(${f1(ex)} ${f1(ey)}) rotate(${f1(ea - 90)})">${ink(C2, "M-6.4 -1C-6.4 -6 6.4 -6 6.4 -1C6.4 2 5.6 4 4.4 5.6C3.6 7.6 2 7.6 1.6 5.6C1 7.6 -1 7.6 -1.4 5.6C-2 7.4 -4 7.4 -4.4 5.4C-5.8 3.8 -6.4 2 -6.4 -1Z", yel, "#6A4A04", { heavy: 1 })}<path d="M-3 -3.6Q-1 -5 2 -4.6" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".7" stroke-linecap="round"/><path d="M-1.6 1.4L-1.2 4.6M1.4 1.4L1.6 4.4" stroke="#B88A06" stroke-width=".5"/></g>`; } }), { aliases: ["scarf"] });
    item("wartsworth", 2, 1, "teslafork", "held", "Tesla Tuning Fork", "Strike it once and it hums in B-flat and throws lightning. He uses it to find the right page in a book. It works.",
      (C) => ({ held: (C2, e, ang) => { const arc = "M-3.4 -24L-1 -27L-3 -30L.4 -33L-1.6 -36L1.6 -38";
        return `<g class="w-held" transform="translate(${f1(e[0])} ${f1(e[1])}) rotate(${f1(-14)})">
          ${K.glow(C2, 0, -32, 9, "#9AE8FF", .55)}
          <rect x="-2.2" y="-6" width="4.4" height="16" rx="1.6" fill="${M.copper(C2, [0, 0, 1, 0])}" stroke="#3A1806" stroke-width=".7"/>${[-4, -1, 2, 5, 8].map(y => `<path d="M-2.4 ${y}Q0 ${y + 1.6} 2.4 ${y}" stroke="#FFD0A8" stroke-width=".7" fill="none"/>`).join("")}<circle cy="11" r="2.2" fill="${M.brass(C2)}" stroke="#3A2006" stroke-width=".5"/>
          <path d="M0 -6V-12M-4.4 -12C-4.4 -16 4.4 -16 4.4 -12M-4.4 -12V-38M4.4 -12V-38" stroke="#3A2006" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M0 -6V-12M-4.4 -12C-4.4 -16 4.4 -16 4.4 -12M-4.4 -12V-38M4.4 -12V-38" stroke="${M.brass(C2, [0, 0, 1, 0])}" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="-4.4" cy="-39" r="1.6" fill="#E8FAFF" stroke="#4A8AB0" stroke-width=".5"/><circle cx="4.4" cy="-39" r="1.6" fill="#E8FAFF" stroke="#4A8AB0" stroke-width=".5"/>
          <path class="a3twinkle" d="M-4 -38L-1 -34L-3 -31L1 -27L-1 -23L4 -20" stroke="#E8FAFF" stroke-width="1.2" fill="none" stroke-linejoin="round"/><path d="M-4 -38L-1 -34L-3 -31L1 -27L-1 -23L4 -20" stroke="#6AD0FF" stroke-width="2.6" fill="none" opacity=".35" stroke-linejoin="round"/>
          ${[[-8, -42], [7, -44], [9, -34], [-9, -30]].map(([x, y], i) => `<path class="a3twinkle" d="M${x} ${y - 2}l.5 1.5 1.5 .5 -1.5 .5 -.5 1.5 -.5 -1.5 -1.5 -.5 1.5 -.5Z" fill="#CFF4FF" style="animation-delay:${i * .3}s"/>`).join("")}</g>`; } }), { aliases: ["pearls"] });
    // ---------- Level 3 ----------
    item("wartsworth", 3, 0, "geniushair", "head", "Wild Genius Hair", "Snow-white and electrically charged from forty years of experiments. There is a pencil in there. There may be three.",
      (C) => { const hairF = C.lin([[0, "#FFFFFF"], [.55, "#EEF0F6"], [1, "#9AA2B4"]], [0, 0, 1, 1]);
        // one tapered, curling strand of hair from (x,y) heading at angle a (degrees), length L, bending by `bend`
        const strand = (x, y, a, L, w, bend) => { const r = a * Math.PI / 180, dx = Math.cos(r), dy = Math.sin(r), nx = -dy, ny = dx;
          const tx = x + dx * L + nx * bend, ty = y + dy * L + ny * bend, mx = x + dx * L * .55 + nx * bend * .9, my = y + dy * L * .55 + ny * bend * .9;
          return `M${f1(x + nx * w)} ${f1(y + ny * w)}Q${f1(mx + nx * w * .7)} ${f1(my + ny * w * .7)} ${f1(tx)} ${f1(ty)}Q${f1(mx - nx * w * .5)} ${f1(my - ny * w * .5)} ${f1(x - nx * w)} ${f1(y - ny * w)}Z`; };
        const clump = (x, y, base, n, spread, L, w, side) => Array.from({ length: n }, (_, i) => { const t = n === 1 ? 0 : i / (n - 1) - .5; return strand(x + t * 4, y + t * 6, base + t * spread, L * (1 - Math.abs(t) * .5), w, side * (5 + (i % 2) * 4)); });
        const draw = (ds) => `<path d="${ds.join("")}" fill="${hairF}" stroke="#5A6272" stroke-width=".8" stroke-linejoin="round"/>` + ds.map(d => `<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width=".5" opacity=".5" transform="translate(-.4 -.4)"/>`).join("");
        const L1 = clump(60, 90, 192, 8, 80, 18, 2.6, -1), R1 = clump(140, 90, -12, 8, 80, 18, 2.6, 1);
        const L2 = clump(58, 104, 176, 4, 40, 12, 2.2, 1), R2 = clump(142, 104, 4, 4, 40, 12, 2.2, -1);
        const top = clump(100, 78, -90, 6, 56, 20, 2.6, 1);
        return { head: `${draw(L2)}${draw(R2)}${draw(L1)}${draw(R1)}
          <g transform="translate(100 64) rotate(32)"><rect x="-1.4" y="-12" width="2.8" height="16" fill="#F2C028" stroke="#6A4A04" stroke-width=".5"/><path d="M-1.4 4L0 7.4L1.4 4Z" fill="#F4D8A8" stroke="#6A4A04" stroke-width=".4"/><rect x="-1.4" y="-14.4" width="2.8" height="2.4" fill="#E87A8A" stroke="#6A4A04" stroke-width=".4"/></g>
          ${draw(top)}<path d="M93 78Q100 72 107 78" stroke="#5A6272" stroke-width=".8" fill="${hairF}"/>` }; }, { aliases: ["wizhat"] });
    item("wartsworth", 3, 1, "alchemistapron", "torso", "Alchemist's Leather Apron", "Scorched, riveted and covered in pockets. Each burn mark is a story. Most of the stories end with 'and then it exploded, beautifully'.",
      (C) => { const ap = "M76 132C72 150 70 170 72 196L128 196C130 170 128 150 124 132Q100 138 76 132Z";
        const lea = M.leather(C, "#8A5A30", [0, 0, 1, 1]);
        return { body: `<path d="M82 133C84 126 90 122 94 120M118 133C116 126 110 122 106 120" stroke="#2A1406" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M82 133C84 126 90 122 94 120M118 133C116 126 110 122 106 120" stroke="${M.leather(C, "#6A3A1E")}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
          ${ink(C, ap, lea, "#2A1406", { heavy: W.minor })}<g clip-path="${C.clip(ap)}">${M.stitch("M78 136C75 152 74 172 75 194M122 136C125 152 126 172 125 194", "#F4C890", .55)}
            <ellipse cx="86" cy="182" rx="7" ry="4" fill="#2A1406" opacity=".45" transform="rotate(-20 86 182)"/><ellipse cx="117" cy="146" rx="4" ry="2.6" fill="#2A1406" opacity=".4"/><path d="M84 180q3 -3 6 -2M115 145q2 -1.6 4 -.6" stroke="#1A0A04" stroke-width=".6" fill="none" opacity=".6"/>
            <path d="M80 138C78 156 78 176 80 192" stroke="#C89060" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>${K.folds({ prof: { cx: 100, pts: [[170, 26], [196, 28]] } }, 178, 197, 4, "#2A1406", .45, 1.2)}</g>
          <path d="M77 140Q100 146 123 140" stroke="#2A1406" stroke-width="5.4" fill="none"/><path d="M77 140Q100 146 123 140" stroke="${M.leather(C, "#4A2410", [0, 0, 0, 1])}" stroke-width="4.2" fill="none"/>
          ${[[83, "#7AF04A"], [89, "#4AC8FF"], [95, "#F04AA0"], [105, "#F8C020"], [111, "#9A6AFF"], [117, "#FF7A3A"]].map(([x, col], i) => vial(C, x, 145 - Math.abs(x - 100) * .08, col, (x - 100) * .4, 9)).join("")}
          ${ink(C, "M88 158H112V174Q100 177 88 174Z", M.leather(C, "#6A3A1E", [0, 0, 0, 1]), "#2A1406", { heavy: 1 })}${M.stitch("M89.6 159.6H110.4V172.6Q100 175 89.6 172.6Z", "#F4C890", .5)}
          <path d="M92 158V150M92 150l-1.4 -2.4h2.8Z" stroke="${M.steel(C)}" stroke-width="1.2" fill="#C2CCD8"/><rect x="96.4" y="148" width="2.8" height="10" fill="#3A5AC0" stroke="#1A2A6A" stroke-width=".4"/><path d="M104 158V148" stroke="${M.brass(C)}" stroke-width="1.6"/><circle cx="104" cy="147" r="2" fill="none" stroke="${M.brass(C)}" stroke-width="1"/><path d="M108.6 158V151l1.4 -2" stroke="#C83A3A" stroke-width="1.4" stroke-linecap="round"/>
          ${[[78, 134], [122, 134], [74, 192], [126, 192], [88, 158], [112, 158]].map(([x, y]) => rivet(C, x, y)).join("")}
          <path d="M72 168C64 170 62 178 66 184M128 168C136 170 138 178 134 184" stroke="${M.leather(C, "#6A3A1E")}" stroke-width="1.8" fill="none" stroke-linecap="round"/>` }; }, { aliases: [], replaces: ["coat"] });
    // ---------- Level 4 ----------
    item("wartsworth", 4, 0, "labbackpack", "back", "Bubbling Laboratory Pack", "A portable laboratory: a brass boiler, two glowing reagent tanks, a smoking chimney and a hose for emergencies. Mostly emergencies.",
      (C) => { const tank = (x, col, glow) => `<g transform="translate(${x} 0)">${K.glow(C, 0, 130, 16, glow, .3)}<rect x="-8" y="96" width="16" height="64" rx="8" fill="${M.glass(C, col, .45)}" stroke="#3A2006" stroke-width="1.2"/><rect x="-6.4" y="118" width="12.8" height="40" rx="6.4" fill="${C.lin([[0, lit(col, .4)], [1, shd(col, .3)]], [0, 0, 0, 1])}" opacity=".9"/>
            ${[[-2, 140, 1.6], [2, 128, 1.1], [-1, 122, .8], [3, 148, 1.3]].map(([bx, by, r], i) => `<circle class="a3float" cx="${bx}" cy="${by}" r="${r}" fill="#FFFFFF" opacity=".7" style="animation-delay:${i * .5}s"/>`).join("")}
            <path d="M-5 100V154" stroke="#FFFFFF" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>
            <rect x="-9.4" y="92" width="18.8" height="6" rx="2" fill="${M.brass(C, [0, 0, 1, 0])}" stroke="#3A2006" stroke-width=".7"/><rect x="-9.4" y="157" width="18.8" height="6" rx="2" fill="${M.brass(C, [0, 0, 1, 0])}" stroke="#3A2006" stroke-width=".7"/>${rivet(C, -6, 95)}${rivet(C, 6, 95)}${rivet(C, -6, 160)}${rivet(C, 6, 160)}</g>`;
        const smoke = [[146, 30, 6], [140, 20, 7.6], [148, 10, 8.4]].map(([x, y, r], i) => `<circle class="a3float" cx="${x}" cy="${y}" r="${r}" fill="${C.rad([[0, "#FFFFFF", .85], [1, "#B8C0CC", .5]], { cx: .4, cy: .35 })}" style="animation-delay:${i * .6}s"/>`).join("");
        return { back: `${smoke}<rect x="140" y="34" width="10" height="44" rx="2" fill="${M.copper(C, [0, 0, 1, 0])}" stroke="#3A1806" stroke-width="1"/><rect x="137" y="30" width="16" height="6" rx="2" fill="${M.brass(C, [0, 0, 1, 0])}" stroke="#3A2006" stroke-width=".8"/>${[44, 56, 68].map(y => `<path d="M140 ${y}h10" stroke="#3A1806" stroke-width=".7"/>`).join("")}
          ${ink(C, "M58 92C58 82 70 76 100 76C130 76 142 82 142 92L146 176C146 184 54 184 54 176Z", M.brass(C, [0, 0, 1, 0]), "#3A2006", { heavy: W.minor })}
          ${tank(48, "#6AF04A", "#9AFF6A")}${tank(152, "#B06AFF", "#D0A0FF")}
          <path d="M56 104H44M56 150H44M144 104H156M144 150H156" stroke="#3A1806" stroke-width="3"/><path d="M56 104H44M56 150H44M144 104H156M144 150H156" stroke="${M.copper(C)}" stroke-width="2"/>
          <g transform="translate(36 120)"><circle r="5" fill="#F4F0E4" stroke="${M.brass(C)}" stroke-width="1.6"/><path d="M0 0L2.6 -2.6" stroke="#C83A3A" stroke-width=".8"/><circle r=".8" fill="#3A2006"/></g><g transform="translate(164 120)"><circle r="5" fill="#F4F0E4" stroke="${M.brass(C)}" stroke-width="1.6"/><path d="M0 0L-1 -3.4" stroke="#C83A3A" stroke-width=".8"/><circle r=".8" fill="#3A2006"/></g>`,
          body: `<path d="M64 132C72 146 70 160 78 170C84 178 92 176 94 168" stroke="#2A1406" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M64 132C72 146 70 160 78 170C84 178 92 176 94 168" stroke="${C.lin([[0, "#6AF04A"], [1, "#2A8A2A"]], [0, 0, 1, 1])}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-dasharray="2.4 .8"/>
            <g transform="translate(94 166) rotate(-20)"><rect x="-2.6" y="-4" width="5.2" height="7" rx="1" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".6"/><path d="M-1.6 -4L-1.2 -7h2.4L1.6 -4" fill="${M.copper(C)}" stroke="#3A1806" stroke-width=".5"/></g>
            <path d="M64 130L70 136M136 130L130 136" stroke="#2A1406" stroke-width="5" stroke-linecap="round"/><path d="M64 130L70 136M136 130L130 136" stroke="${M.leather(C, "#6A3A1E")}" stroke-width="3.6" stroke-linecap="round"/>` }; }, { aliases: ["cape"] });
    item("wartsworth", 4, 1, "magnifierrig", "head", "Magnifier Head-Rig", "A brass headband of flip-down lenses, a lamp, two gears and an antenna that picks up radio, thunderstorms and, he claims, ideas.",
      (C) => { const lensArm = (x, y, r, a, flip) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0L0 ${flip ? -10 : 10}" stroke="#3A2006" stroke-width="2.6"/><path d="M0 0L0 ${flip ? -10 : 10}" stroke="${M.brass(C)}" stroke-width="1.6"/>
          <g transform="translate(0 ${flip ? -10 - r : 10 + r})"><circle r="${r + 1.6}" fill="${M.glass(C, flip ? "#FFE8A0" : "#9AE8D0", .14)}" stroke="#3A2006" stroke-width="3.6"/><circle r="${r + 1.6}" fill="none" stroke="${M.brass(C, [0, 0, 1, 1])}" stroke-width="2.4"/><path d="M${-r * .6} ${-r * .3}Q${-r * .4} ${-r * .7} 0 ${-r * .8}" stroke="#fff" stroke-width="1" fill="none" opacity=".8" stroke-linecap="round"/></g>${rivet(C, 0, 0, 1.4)}</g>`;
        return { head: `<path d="M58 80C60 66 76 58 100 58C124 58 140 66 142 80" stroke="#3A2006" stroke-width="5.4" fill="none"/><path d="M58 80C60 66 76 58 100 58C124 58 140 66 142 80" stroke="${M.brass(C, [0, 0, 0, 1])}" stroke-width="4.2" fill="none"/><path d="M60 76C64 66 78 60 100 60" stroke="#FFF4C8" stroke-width=".8" fill="none" opacity=".8"/>
          ${[[64, 70], [80, 61], [120, 61], [136, 70]].map(([x, y]) => rivet(C, x, y, 1)).join("")}
          ${gear(C, 70, 64, 4.4, 8, M.copper(C), 10, "a3spin")}${gear(C, 63.6, 70.6, 3, 7, M.brass(C), 0)}
          ${lensArm(131, 63, 7.6, 32, false)}${lensArm(67, 66, 5.4, -36, true)}
          <g transform="translate(100 56)">${ink(C, "M-6 2V-4C-6 -7 6 -7 6 -4V2Z", M.brass(C, [0, 0, 1, 0]), "#3A2006", { heavy: .9 })}<ellipse cy="-5" rx="5" ry="2" fill="${C.rad([[0, "#FFFFFF"], [.5, "#FFF0A0"], [1, "#F8C020"]])}" stroke="#3A2006" stroke-width=".6"/>${K.glow(C, 0, -8, 10, "#FFF0A0", .45)}</g>
          <path d="M110 59C112 50 116 44 118 36" stroke="#3A2006" stroke-width="1.6" fill="none"/><path d="M110 59C112 50 116 44 118 36" stroke="${M.steel(C)}" stroke-width=".9" fill="none"/><path d="M114.6 46q2 -1 3.6 0M116 41q1.6 -.8 3 0" stroke="${M.steel(C)}" stroke-width=".7" fill="none"/>
          <circle cx="118.4" cy="34" r="2.8" fill="${C.rad([[0, "#FFFFFF"], [.4, "#FF8A8A"], [1, "#C81E2A"]], { cx: .35, cy: .3 })}" stroke="#5A0A0A" stroke-width=".6"/><circle class="a3twinkle" cx="118.4" cy="34" r="4.4" fill="none" stroke="#FF8A8A" stroke-width=".6" opacity=".7"/>` }; }, { aliases: ["flowers"] });
    // ---------- Level 5 ----------
    item("wartsworth", 5, 0, "ornithopter", "back", "Brass Ornithopter Wings", "Canvas and brass ribs on a clockwork harness, sketched from a five-hundred-year-old notebook. Flight time: eleven glorious seconds.",
      (C) => { const wing = s => { const m = x => 100 + s * (x - 100), J = [m(60), 118];
          const ribs = [[16, 40], [12, 70], [16, 100], [26, 128], [40, 150]];
          let d = `M${J[0]} ${J[1]}L${m(16)} 40`; for (let i = 1; i < ribs.length; i++) { const [px, py] = ribs[i - 1], [x, y] = ribs[i]; d += `Q${m((px + x) / 2 + 9)} ${(py + y) / 2 + 2} ${m(x)} ${y}`; } d += "Z";
          const canvas = C.lin([[0, "#FBF2DC"], [.6, "#EAD8B0"], [1, "#B89A68"]], [s < 0 ? 1 : 0, 0, s < 0 ? 0 : 1, 1]);
          return `${ink(C, d, canvas, "#5A3A14", { heavy: W.minor })}<g clip-path="${C.clip(d)}">${[[30, 60], [24, 90], [34, 118]].map(([x, y]) => `<circle cx="${m(x)}" cy="${y}" r="6" fill="none" stroke="#5A7AB0" stroke-width=".4" opacity=".6"/><path d="M${m(x - 7)} ${y}h14M${m(x)} ${y - 7}v14" stroke="#5A7AB0" stroke-width=".3" opacity=".5"/>`).join("")}
              <path d="M${m(40)} 66l4 2M${m(36)} 96l5 1M${m(44)} 122l4 3" stroke="#7A5A30" stroke-width=".5" opacity=".6"/><text x="${m(34)}" y="80" font-size="3.2" font-family="Georgia,serif" font-style="italic" fill="#5A7AB0" opacity=".7" text-anchor="middle" transform="rotate(${s * -50} ${m(34)} 80)">${s < 0 ? "ala sinistra" : "ala destra"}</text></g>
            ${ribs.map(([x, y]) => `<path d="M${J[0]} ${J[1]}L${m(x)} ${y}" stroke="#3A2006" stroke-width="2.6" stroke-linecap="round"/><path d="M${J[0]} ${J[1]}L${m(x)} ${y}" stroke="${M.brass(C, [0, 0, 1, 1])}" stroke-width="1.6" stroke-linecap="round"/><circle cx="${m(x)}" cy="${y}" r="1.6" fill="${M.brass(C)}" stroke="#3A2006" stroke-width=".5"/>`).join("")}
            ${gear(C, J[0], J[1], 6, 10, M.brass(C), 0, "a3spin")}${gear(C, m(52), 128, 3.6, 8, M.copper(C), 12)}`; };
        return { back: wing(-1) + wing(1) };
      }, { aliases: ["starcrown"] });
    item("wartsworth", 5, 1, "chronocoat", "torso", "The Chrono-Coat", "A tailcoat of impossible white, lined with the night sky, with a clockwork heart that ticks once for every brilliant idea. It has never stopped ticking.",
      (C) => { const half = s => { const m = x => 100 + s * (x - 100); return `M${m(60)} 128C${m(54)} 146 ${m(54)} 176 ${m(60)} 200L${m(84)} 202C${m(80)} 178 ${m(78)} 152 ${m(82)} 128C${m(76)} 124 ${m(66)} 124 ${m(60)} 128Z`; };
        const lining = s => { const m = x => 100 + s * (x - 100); return `M${m(82)} 128C${m(78)} 152 ${m(80)} 178 ${m(84)} 202L${m(80)} 202C${m(76)} 178 ${m(74)} 152 ${m(78)} 130Z`; };
        const tails = s => { const m = x => 100 + s * (x - 100); return `M${m(62)} 170C${m(56)} 186 ${m(52)} 200 ${m(44)} 210Q${m(58)} 212 ${m(72)} 206C${m(74)} 194 ${m(72)} 182 ${m(70)} 172Z`; };
        const cosmos = C.lin([[0, "#3A2A8A"], [.5, "#1A1050"], [1, "#0A0626"]], [0, 0, 0, 1]);
        const white = C.lin([[0, "#FFFFFF"], [.55, "#F2F4F8"], [1, "#B8C0CC"]], [0, 0, 1, 1]);
        const plate = `<g transform="translate(100 162)">${K.glow(C, 0, 0, 16, "#7AE8FF", .45)}<circle r="14" fill="${M.brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width="1.2"/><circle r="12" fill="#2A1A10" stroke="#5A3A14" stroke-width=".6"/>
          ${gear(C, -5, -4, 4.4, 9, M.brass(C), 0, "a3spin")}${gear(C, 5, 4, 3.4, 8, M.copper(C), 15)}${gear(C, 4, -6, 2.4, 7, M.steel(C), 0)}
          <circle r="4" fill="${C.rad([[0, "#FFFFFF"], [.4, "#9AF0FF"], [1, "#1E8AC8"]])}" stroke="#0A3A5A" stroke-width=".6"/><circle class="a3twinkle" r="5.6" fill="none" stroke="#9AF0FF" stroke-width=".6"/>
          ${Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<path d="M${f1(Math.cos(a) * 12.4)} ${f1(Math.sin(a) * 12.4)}L${f1(Math.cos(a) * 13.6)} ${f1(Math.sin(a) * 13.6)}" stroke="#FFF4C8" stroke-width=".7"/>`; }).join("")}</g>`;
        return { back: [-1, 1].map(s => `${ink(C, tails(s), white, "#4A5260", { heavy: W.minor })}<path d="${tails(s)}" fill="none" stroke="${COP}" stroke-width=".9" transform="translate(${s * -.8} -.6)"/>`).join(""),
          body: [-1, 1].map(s => `${ink(C, half(s), white, "#4A5260", { heavy: W.minor })}<path d="${lining(s)}" fill="${cosmos}" stroke="#0A0626" stroke-width=".5"/>${[[81, 150], [80, 172], [82, 190]].map(([x, y], i) => `<circle cx="${100 + s * (x - 100) * .985 + s * -.6}" cy="${y}" r="${.4 + (i % 2) * .3}" fill="#FFF8D0"/>`).join("")}
              <path d="${half(s)}" fill="none" stroke="${COP}" stroke-width="1" transform="translate(${s * .7} 0)" opacity=".85"/>
              <path d="M${100 + s * -18} 128L${100 + s * -24} 148L${100 + s * -14} 140Z" fill="${cosmos}" stroke="#4A5260" stroke-width=".8"/><path d="M${100 + s * -18} 128L${100 + s * -24} 148" stroke="${COP}" stroke-width=".8"/>`).join("")
            + `${plate}<path d="M86 162H74M114 162H126" stroke="#3A2006" stroke-width="2.4"/><path d="M86 162H74M114 162H126" stroke="${M.brass(C)}" stroke-width="1.4"/>
              <path d="M122 166h11v10h-11Z" fill="#F4F6FA" stroke="#4A5260" stroke-width=".8"/>${[["#F04A4A", 124], ["#F8C020", 126.6], ["#4AD06A", 129.2], ["#4A8AF0", 131.8]].map(([c, x]) => vial(C, x, 167, c, 0, 7)).join("")}
              <path d="M66 150C64 166 64 182 68 196" stroke="#AAB2BE" stroke-width="1" fill="none" opacity=".7"/>${[140, 150].map(y => rivet(C, 84, y, 1)).join("")}` }; }, { aliases: ["mantle"], replaces: ["coat"] });
  });
})();

// ===== Antonio — "El Caballero de la Rosa": the passionate Spanish romantic, from serenading troubadour to matador of legend =====
// crimson · black velvet · antique gold · ivory lace
// L1 gold hoop earring · polka-dot neckerchief      L2 embroidered bolero vest · serenade guitar
// L3 masquerade lace mask · caballero's capa      L4 velvet riding coat · plumed caballero hat
// L5 traje de luces · capote de paseo
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const CR = "#B0101E", GOLD = "#E2B04A", BV = "#1C1418";
  const MIR = `transform="translate(200 0) scale(-1 1)"`;
  const crimson = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#F0485A"], [.35, "#C8182C"], [.75, "#8A0818"], [1, "#4A0410"]], a);
  const velvetB = (C, a = [0, 0, 1, 1]) => M.velvet(C, "#2A2026", a);
  const goldLine = (d, w = 1.1) => `<path d="${d}" stroke="#5A3A0A" stroke-width="${w + .8}" fill="none" opacity=".55"/><path d="${d}" stroke="${GOLD}" stroke-width="${w}" fill="none"/><path d="${d}" stroke="#FFF2C0" stroke-width="${f1(w * .35)}" fill="none" stroke-dasharray=".4 1.3"/>`;
  // soutache: a looping gold braid scroll, centred at x,y
  const soutache = (x, y, s = 1, a = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})" fill="none" stroke-linecap="round"><path d="M0 -6C-4 -6 -5 -2 -2 -1C1 0 1 3 -2 3.6C-5 4 -6 7 -3 8.4M0 -6C4 -6 5 -2 2 -1C-1 0 -1 3 2 3.6C5 4 6 7 3 8.4" stroke="#5A3A0A" stroke-width="1.5" opacity=".5"/><path d="M0 -6C-4 -6 -5 -2 -2 -1C1 0 1 3 -2 3.6C-5 4 -6 7 -3 8.4M0 -6C4 -6 5 -2 2 -1C-1 0 -1 3 2 3.6C5 4 6 7 3 8.4" stroke="${GOLD}" stroke-width=".8"/><circle cy="-6" r=".9" fill="${GOLD}"/></g>`;
  const rose = (C, x, y, r, a = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${r / 6})">${ink(C, "M0 6C-6 6 -7 1 -6 -3C-3 -6.4 3 -6.4 6 -3C7 1 6 6 0 6Z", C.rad([[0, "#FF6A7E"], [.6, "#C8102A"], [1, "#6A0614"]], { cx: .4, cy: .35 }), "#3A0408", { heavy: .9 })}<path d="M-2 -2C0 -4.4 3 -3.4 2.6 -1C2.4 1.4 -1 2 -1.6 0M-4.4 1.4C-2 4 3 4 4.4 .6" stroke="#7A0618" stroke-width=".7" fill="none"/><path d="M-4 -3q1 -2 3 -2.4" stroke="#fff" stroke-width=".7" fill="none" opacity=".6"/></g>`;
  const leaf = (C, x, y, a, s = 1) => `<path d="M0 0C2 -3 6 -3 8 0C6 3 2 3 0 0Z" transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})" fill="${C.lin([[0, "#5AB04A"], [1, "#1E5A1A"]], [0, 0, 1, 1])}" stroke="#0E3A0A" stroke-width=".4"/>`;
  const sleeveOf = (segs, w, t1 = .86, k = 1.1) => ART3.tube(ART3.subSegs(segs, 0, t1), w.slice(0, -1).map(v => v * k));
  const at = (segs, t) => M.along(segs, t);
  const segPath = segs => segs.map((g, i) => `${i ? "" : `M${f1(g[0][0])} ${f1(g[0][1])}`}C${g.slice(1).map(p => `${f1(p[0])} ${f1(p[1])}`).join(" ")}`).join("");
  const SHIRT = ["shirt"];

  K.replaceCollection("antonio", () => {
    const item = K.item;
    // ================= LEVEL 1 =================
    item("antonio", 1, 0, "goldhoop", "ears", "Gitano Gold Hoop", "One gold hoop and a single ruby drop, worn in the left ear. His grandmother's, he says. It may even be true.",
      (C) => ({ head: `<g transform="translate(77 51)"><circle r="4.6" fill="none" stroke="#5A3A0A" stroke-width="2.2"/><circle r="4.6" fill="none" stroke="${K.goldF(C)}" stroke-width="1.5"/><path d="M-3.2 -3Q-4.4 0 -3 3" stroke="#FFF2C0" stroke-width=".5" fill="none"/>${K.gem(C, 0, 7, 1.9, "#C8102A", "drop")}</g>${K.gem(C, 121.4, 49.6, 1.3, "#C8102A")}` }),
      { aliases: ["pearls"] });
    item("antonio", 1, 1, "polkakerchief", "neck", "Polka-Dot Neckerchief", "Crimson silk scattered with white dots, knotted at the side of his throat with careless precision. It took him twenty minutes.",
      (C) => { const dots = K.patt(C, 5, 5, `<circle cx="1.3" cy="1.3" r=".95" fill="#FFF4EC"/><circle cx="3.8" cy="3.8" r=".95" fill="#FFF4EC"/>`);
        const band = "M84 95C92 101 108 101 116 95L118 101C110 108 90 108 82 101Z";
        const tail1 = "M111 101C114 108 116 116 114 124L120 121L123 126C125 116 121 106 116 100Z", tail2 = "M113 101C118 106 124 110 130 110L128 104L133 101C125 98 119 97 115 98Z";
        return { body: [tail2, tail1, band].map((d, i) => `${ink(C, d, crimson(C, i === 2 ? [0, 0, 0, 1] : [0, 0, 1, 1]), "#3A0408", { heavy: W.minor })}<path d="${d}" fill="${dots}"/>`).join("")
          + `<path d="M85 99C93 104 107 104 115 99" stroke="#FF8A96" stroke-width=".9" fill="none" opacity=".6"/><path d="M113 104C116 112 116 118 115 122" stroke="#5A0610" stroke-width=".7" fill="none" opacity=".6"/>
          ${ink(C, "M110 97C114 96 118 98 118 102C118 106 114 107 111 105C109 103 108 99 110 97Z", crimson(C, [0, 0, 1, 1]), "#3A0408", { heavy: 1 })}<path d="${"M110 97C114 96 118 98 118 102C118 106 114 107 111 105C109 103 108 99 110 97Z"}" fill="${dots}"/><path d="M111 99q3 -1 5 1" stroke="#FF8A96" stroke-width=".7" fill="none"/>` }; },
      { aliases: ["scarf", "bow"] });

    // ================= LEVEL 2 =================
    item("antonio", 2, 0, "bolerovest", "torso", "Embroidered Bolero Vest", "Black velvet stitched with gold soutache, cut short and open over the white shirt. It does nothing to keep him warm. That was never its purpose.",
      (C) => { const pL = "M72 99C62 104 58 118 61 130C63 142 72 150 80 155L91 152C88 140 86 124 87 110C87 104 85 100 82 98Z";
        const panel = m => `<g ${m ? MIR : ""}>${ink(C, pL, velvetB(C, [m ? 1 : 0, 0, m ? 0 : 1, 1]), "#06040A", { heavy: W.minor })}<g clip-path="${C.clip(pL)}"><path d="M66 112C64 124 66 136 72 146" stroke="#6A5A6E" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/></g>
          ${goldLine("M82.6 99C86 102 86.6 108 86.6 112C86 126 88 140 90.6 151.6L80 155C72 150 63 142 61 130", 1)}${soutache(75, 118, .9, -10)}${soutache(78, 138, .8, -6)}${[112, 124, 136].map(y => `<circle cx="${f1(87.6 + (y - 112) * .08)}" cy="${y}" r="1.3" fill="${K.goldF(C)}" stroke="#5A3A0A" stroke-width=".4"/>`).join("")}</g>`;
        return { body: panel(0) + panel(1) + `${[116, 128].map(y => `<path d="M${f1(89 + (y - 112) * .08)} ${y}Q100 ${y + 3} ${f1(111 - (y - 112) * .08)} ${y}" stroke="${GOLD}" stroke-width=".7" fill="none"/>`).join("")}` }; },
      { aliases: ["beret"], replaces: [] });
    item("antonio", 2, 1, "serenadeguitar", "back", "Serenade Guitar", "A Spanish guitar of cedar and rosewood, slung on his back on a crimson ribbon. Every balcony in the city knows its voice.",
      (C) => { const wood = C.lin([[0, "#F2C47A"], [.5, "#C8823A"], [1, "#7A3E14"]], [0, 0, 1, 1]);
        const bodyD = "M-13 2C-15 -8 -10 -14 -6 -14C-2 -14 0 -11 0 -11C0 -11 2 -14 6 -14C10 -14 15 -8 13 2C16 10 12 20 0 20C-12 20 -16 10 -13 2Z";
        return { back: `<g transform="translate(52 150) rotate(36) scale(1.18)">
            <rect x="-2.4" y="-70" width="4.8" height="58" rx="1" fill="${C.lin([[0, "#5A2E12"], [1, "#2A1206"]], [0, 0, 1, 0])}" stroke="#1A0804" stroke-width=".7"/>${[-64, -58, -52, -46, -40, -34, -28, -22].map(y => `<path d="M-2.4 ${y}h4.8" stroke="#D8C8A0" stroke-width=".45"/>`).join("")}
            ${ink(C, "M-3.4 -70L-4 -84Q0 -87 4 -84L3.4 -70Z", C.lin([[0, "#6A3A16"], [1, "#2A1206"]], [0, 0, 1, 0]), "#1A0804", { heavy: .8 })}${[-81, -77, -73].map(y => `<circle cx="-4.6" cy="${y}" r=".9" fill="${K.goldF(C)}"/><circle cx="4.6" cy="${y}" r=".9" fill="${K.goldF(C)}"/>`).join("")}
            ${ink(C, bodyD, wood, "#3A1606", { heavy: W.minor })}<circle cy="-2" r="4.4" fill="#1A0804"/><circle cy="-2" r="5.6" fill="none" stroke="#2A6A3A" stroke-width=".9"/><circle cy="-2" r="6.6" fill="none" stroke="${GOLD}" stroke-width=".5"/>
            <rect x="-5" y="11" width="10" height="2.4" rx=".8" fill="#3A1606"/><path d="M-1.4 -70V12M1.4 -70V12M0 -70V12" stroke="#F4EEE0" stroke-width=".25"/><path d="M-10 -6C-11 2 -9 10 -4 15" stroke="#FFE8B0" stroke-width="1.2" fill="none" opacity=".55" stroke-linecap="round"/></g>`,
          body: `<path d="M126 100C112 118 96 138 76 158" stroke="#3A0408" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="M126 100C112 118 96 138 76 158" stroke="${crimson(C)}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M125 101C111 119 95 139 76 157" stroke="#FF8A96" stroke-width=".6" fill="none" opacity=".6"/>${rose(C, 108, 124, 3.8, -20)}${leaf(C, 106, 127, 140, .7)}` }; },
      { aliases: ["wizhat"] });

    // ================= LEVEL 3 =================
    item("antonio", 3, 0, "lacemask", "face", "Masquerade Lace Mask", "Black Chantilly lace edged in gold, a red rose at the temple. At the masked ball everyone knows exactly who he is, and pretends not to.",
      (C, F) => { const [[lx, ly], [rx, ry]] = F.head.eyes;
        const mask = "M76 58C78 52 86 51 92 54C96 56 98 57 100 57C102 57 104 56 108 54C114 51 122 52 124 58C125 64 121 69 114 69C108 69 104 66 100 66C96 66 92 69 86 69C79 69 75 64 76 58Z";
        const eyeH = (x, y) => `M${x - 7.2} ${y + .4}C${x - 4.4} ${y - 4.6} ${x + 4.4} ${y - 4.8} ${x + 7.4} ${y - .4}C${x + 4.4} ${y + 4} ${x - 4.4} ${y + 4.2} ${x - 7.2} ${y + .4}Z`;
        return { head: `<path d="${mask} ${eyeH(lx, ly)} ${eyeH(rx, ry)}" fill-rule="evenodd" fill="#140C12" stroke="#000" stroke-width="1.1"/><path d="${mask} ${eyeH(lx, ly)} ${eyeH(rx, ry)}" fill-rule="evenodd" fill="${M.lace(C, "#5A4A5A")}" opacity=".8"/>
          ${M.scallops(78, 98, 67.6, 6, 1.6, "#140C12", "#140C12", .5)}${M.scallops(102, 122, 67.6, 6, 1.6, "#140C12", "#140C12", .5)}
          ${goldLine("M76 58C78 52 86 51 92 54C96 56 98 57 100 57C102 57 104 56 108 54C114 51 122 52 124 58", .8)}<path d="${eyeH(lx, ly)} ${eyeH(rx, ry)}" fill="none" stroke="${GOLD}" stroke-width=".6"/>
          ${leaf(C, 121, 53, -60, .8)}${leaf(C, 124, 57, 10, .7)}${rose(C, 124.6, 53.6, 3.6, 10)}<path d="M76 61C70 62 66 66 64 72M124 61C130 63 132 68 133 74" stroke="#140C12" stroke-width=".9" fill="none"/>` }; },
      { aliases: [] });
    item("antonio", 3, 1, "caballerocapa", "back", "Caballero's Capa", "A short black wool cape lined in crimson silk, thrown over one shoulder so the lining catches the light when he turns. He turns often.",
      (C) => { const back = "M88 96C72 96 58 104 52 118C46 138 44 162 42 184L54 180L60 190L70 180L80 186C82 160 86 130 96 104Z";
        const front = "M90 97C78 95 66 99 58 111C51 128 49 150 47 172L55 168L61 177L69 168C67 148 70 128 78 112C82 106 86 101 92 99Z";
        const lining = "M92 99C84 104 78 112 74 122C70 138 69 154 69 168L65.6 165.6C65.6 150 66.6 134 70.6 120C74.6 110 82 102 90 97Z";
        return { back: `${ink(C, back, C.lin([[0, "#3A3238"], [.5, "#1A1418"], [1, "#0A060A"]], [0, 0, 1, 1]), "#000", { heavy: W.minor })}<path d="M42 184L54 180L60 190L70 180L80 186" stroke="${CR}" stroke-width="1.8" fill="none"/>`,
          arms: (C2, segs, w, side) => side !== "L" ? "" : `${ink(C2, front, C2.lin([[0, "#4A4048"], [.4, "#241C22"], [1, "#0A060A"]], [1, 0, 0, 1]), "#000", { heavy: W.minor })}<g clip-path="${C2.clip(front)}"><path d="M62 118C56 136 53 154 51 170" stroke="#8A7A86" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/><path d="M68 124C64 142 62 158 60 174" stroke="#000" stroke-width="1" fill="none" opacity=".5"/></g>
            ${ink(C2, lining, crimson(C2, [0, 0, 1, 1]), "#3A0408", { heavy: .8 })}<path d="M89 99C80 106 74 116 71 128" stroke="#FF8A96" stroke-width=".7" fill="none" opacity=".7"/>
            <path d="M47 172L55 168L61 177L69 168" stroke="${GOLD}" stroke-width=".7" fill="none" stroke-dasharray="1.2 .6" transform="translate(.4 -1.4)"/>
            <g transform="translate(88 101)"><circle r="3.2" fill="${K.goldF(C2)}" stroke="#5A3A0A" stroke-width=".6"/>${K.gem(C2, 0, 0, 1.8, "#C8102A")}<path d="M3 1Q12 6 20 4" stroke="${GOLD}" stroke-width=".7" fill="none" stroke-dasharray="1.1 .5"/></g>` }; },
      { aliases: ["cape"] });

    // ================= LEVEL 4 =================
    item("antonio", 4, 0, "ridingcoat", "torso", "Velvet Riding Coat", "Long black velvet lined in crimson, silver frogging down the front and a cascade of lace at the throat. He wore it once to a duel. The duel was cancelled; everyone just wanted to look at the coat.",
      (C) => { const pL = "M72 98C61 103 57 118 60 131C63 144 70 156 74 170C72 182 68 194 64 204L84 202C86 186 88 170 90 158C88 140 86 124 87 110C87 104 85 100 82 97Z";
        const tail = "M66 150C60 170 54 190 48 206L72 207L84 168Z";
        const frill = (y, w) => `M${100 - w} ${y}C${100 - w * .6} ${y - 3} ${100 + w * .6} ${y - 3} ${100 + w} ${y}Q${100 + w * .7} ${y + 4} ${100 + w * .4} ${y + 2.4}Q${100 + w * .2} ${y + 5} 100 ${y + 3}Q${100 - w * .2} ${y + 5} ${100 - w * .4} ${y + 2.4}Q${100 - w * .7} ${y + 4} ${100 - w} ${y}Z`;
        const jabot = [104, 110, 116, 122, 128].map((y, i) => frill(y, 6 + i * .9)).join("");
        const panel = m => `<g ${m ? MIR : ""}>${ink(C, pL, velvetB(C, [m ? 1 : 0, 0, m ? 0 : 1, 1]), "#000", { heavy: W.minor })}<g clip-path="${C.clip(pL)}"><path d="M65 116C63 132 66 150 72 166" stroke="#7A6A7E" stroke-width="2.2" fill="none" opacity=".35" stroke-linecap="round"/>${K.folds({ prof: { cx: 76, pts: [[170, 10], [204, 12]] } }, 178, 204, 3, "#000", .5, 1.2)}</g>
          <path d="M84.6 202C86 186 87.6 170 89.4 158C87.6 140 85.6 124 86.6 110" stroke="${crimson(C)}" stroke-width="2.4" fill="none"/>
          ${[116, 126, 136, 146].map(y => `<path d="M${f1(87 + (y - 116) * .06)} ${y}h-6" stroke="#C8D0DA" stroke-width="1.2" stroke-linecap="round"/><path d="M${f1(81 + (y - 116) * .06)} ${y - 1.6}q-2.6 1.6 0 3.2" stroke="#C8D0DA" stroke-width=".8" fill="none"/><circle cx="${f1(87.6 + (y - 116) * .06)}" cy="${y}" r="1.2" fill="${M.steel(C)}" stroke="#30384A" stroke-width=".3"/>`).join("")}</g>`;
        return { back: `${ink(C, tail, velvetB(C), "#000", { heavy: W.minor })}<g ${MIR}>${ink(C, tail, velvetB(C), "#000", { heavy: W.minor })}</g><path d="M48 206L72 207M152 206L128 207" stroke="${CR}" stroke-width="1.8"/>`,
          body: panel(0) + panel(1) + `${[104, 110, 116, 122, 128].map((y, i) => `${ink(C, frill(y, 6 + i * .9), C.lin([[0, "#FFFFFF"], [1, "#DCD0BC"]], [0, 0, 0, 1]), "#6A5A4A", { heavy: .7 })}<path d="M${f1(100 - (6 + i * .9) * .6)} ${y + 1.2}Q100 ${y + 3.4} ${f1(100 + (6 + i * .9) * .6)} ${y + 1.2}" stroke="#B8A88E" stroke-width=".5" fill="none"/>`).join("")}${K.gem(C, 100, 102.6, 1.8, "#C8102A")}`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = sleeveOf(segs, w, .86, 1.08), [x, y, a] = at(segs, .86);
            return `${ink(C2, d, M.velvet(C2, "#2A2026", [0, 0, 1, 0]), "#000", { heavy: W.minor })}<path d="${d}" fill="none" stroke="#7A6A7E" stroke-width=".6" opacity=".4" transform="translate(-.6 0)"/>
              <g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><path d="M-2 -8.4Q-3.4 0 -2 8.4L2.4 8.4Q1 0 2.4 -8.4Z" fill="${crimson(C2, [0, 0, 0, 1])}" stroke="#3A0408" stroke-width=".7"/><path d="M2.4 -8.4Q1 0 2.4 8.4" stroke="#C8D0DA" stroke-width=".7" fill="none"/>${M.scallops(-7.6, 7.6, 0, 6, 2.2, "#B8A88E", "#FFFFFF", .5).replace("<path", `<path transform="rotate(90) translate(0 -5)"`)}</g>`; } };
      }, { aliases: ["flowers"], replaces: [] });
    item("antonio", 4, 1, "caballerohat", "head", "Plumed Caballero Hat", "A wide black brim worn at a reckless angle, a crimson ostrich plume sweeping off the back. It arrives at the party half a second before he does.",
      (C) => ({ head: `<g transform="translate(100 37) rotate(-8) scale(.84)">
          ${ink(C, "M8 -6C20 -16 36 -20 54 -16C60 -14 62 -10 58 -8C62 -6 60 -2 54 -2C58 0 56 4 50 4C52 6 48 9 42 7C40 10 34 9 30 6C24 6 14 2 8 -2Z", C.lin([[0, "#FF5A6E"], [.5, "#C8182C"], [1, "#6A0614"]], [0, 0, 1, 1]), "#3A0408", { heavy: .9 })}
          ${[[18, -10], [26, -12], [34, -12], [42, -10], [50, -8]].map(([x, y]) => `<path d="M${x} ${y}q2 4 6 6" stroke="#FF9AA6" stroke-width=".55" fill="none" opacity=".75"/>`).join("")}<path d="M8 -4C22 -12 38 -14 56 -10" stroke="#FFD0D6" stroke-width=".7" fill="none"/>
          ${ink(C, "M-48 2C-40 -4 -20 -6 0 -6C20 -6 40 -4 48 2C40 7 20 9 0 9C-20 9 -40 7 -48 2Z", M.velvet(C, "#2A2228", [0, 0, 0, 1]), "#000", { heavy: W.minor })}
          ${ink(C, "M-20 -2C-20 -14 -14 -20 0 -20C14 -20 20 -14 20 -2Q0 2 -20 -2Z", M.velvet(C, "#2A2228", [.2, 0, .8, 1]), "#000", { heavy: W.minor })}
          <path d="M-19.6 -5Q0 -1 19.6 -5L19.8 -1.6Q0 2.4 -19.8 -1.6Z" fill="${crimson(C, [0, 0, 0, 1])}" stroke="#3A0408" stroke-width=".5"/><path d="M-14 -16C-10 -19 -4 -19.6 2 -19.4" stroke="#8A7A86" stroke-width="1.2" fill="none" opacity=".6"/>
          <path d="M-46 2.6C-38 7 -20 8.6 0 8.6C20 8.6 38 7 46 2.6" stroke="#6A5A62" stroke-width=".8" fill="none" opacity=".7"/>
          <g transform="translate(13 -3)"><circle r="3" fill="${K.goldF(C)}" stroke="#5A3A0A" stroke-width=".5"/>${K.gem(C, 0, 0, 1.8, "#C8102A", "diamond")}</g></g>` }),
      { aliases: [] });

    // ================= LEVEL 5 =================
    item("antonio", 5, 0, "trajedeluces", "torso", "Traje de Luces del Corazón", "A suit of lights cut for romance rather than the ring: a crimson bolero edged in gold, a silk shirt open to the heart, a rose sash with long tails and gold-striped breeches. He has never fought a bull. He has broken a great many hearts.",
      (C) => { const embF = K.patt(C, 5, 5, `<path d="M0 2.5Q1.25 0 2.5 2.5Q3.75 5 5 2.5" stroke="#F2C860" stroke-width=".55" fill="none"/><circle cx="2.5" cy="2.5" r=".45" fill="#FFF2C0"/>`);
        const shirtL = "M74 99C64 104 60 118 62 130C64 142 72 152 82 158L97 158C93 146 90 132 89 120C88 112 90 104 93 99Z";
        const jL = "M72 98C62 103 58 116 60 128C61 134 64 138 68 140L84 136C84 124 84 112 86 104C86 101 84 99 81 97Z";
        const ruffle = s => Array.from({ length: 6 }, (_, i) => { const t = i / 5, m = x => 100 + s * (x - 100), x = m(93 - t * 2 + (t > .5 ? (t - .5) * 6 : 0)), y = 100 + t * 50; return `<path d="M${f1(x)} ${f1(y)}q${f1(s * 4)} 2 ${f1(s * 1)} 7" stroke="#C8B89E" stroke-width=".8" fill="#FFFFFF"/>`; }).join("");
        const legs = s => { const m = x => 100 + s * (x - 100); return `M${m(80)} 156C${m(78)} 168 ${m(78)} 178 ${m(80)} 186L${m(97)} 186C${m(98)} 176 ${m(99)} 166 ${m(99)} 156Z`; };
        const silk = C.lin([[0, "#FFFFFF"], [.55, "#F6F0E6"], [1, "#CDBFA8"]], [0, 0, 1, 1]);
        const sash = C.lin([[0, "#FF8AA6"], [.45, "#D8304E"], [1, "#7A0A20"]], [0, 0, 1, 1]);
        return { body: `${[-1, 1].map(s => `${ink(C, legs(s), C.lin([[0, "#3A2A30"], [1, "#0E080A"]], [0, 0, 1, 0]), "#000", { heavy: W.minor })}${goldLine(`M${100 + s * -20.6} 160C${100 + s * -21.8} 170 ${100 + s * -21.8} 178 ${100 + s * -20.6} 185`, 2)}<path d="M${100 + s * -20.6} 162C${100 + s * -21.6} 170 ${100 + s * -21.6} 177 ${100 + s * -20.6} 184" stroke="${CR}" stroke-width=".6" fill="none"/>${[0, 1, 2].map(i => `<circle cx="${100 + s * -20.4}" cy="${186.6 + i * 1.8}" r="${1.5 - i * .3}" fill="${K.goldF(C)}" stroke="#5A3A0A" stroke-width=".3"/>`).join("")}`).join("")}
            ${[0, 1].map(m => `<g ${m ? MIR : ""}>${ink(C, shirtL, silk, "#6A5A4A", { heavy: W.minor })}<path d="M68 112C66 124 68 136 74 146" stroke="#B8A88E" stroke-width=".8" fill="none" opacity=".7"/>${ruffle(-1)}</g>`).join("")}
            ${ink(C, "M80 150Q100 157 120 150L121 162Q100 169 79 162Z", sash, "#4A0610", { heavy: W.minor })}<path d="M82 155Q100 161 118 155" stroke="#FFC0CC" stroke-width="1" fill="none" opacity=".7"/>
            ${ink(C, "M118 154C124 152 128 156 126 161C122 162 118 160 117 158Z", sash, "#4A0610", { heavy: 1 })}
            ${ink(C, "M120 160C124 172 128 184 134 196C130 197 127 195 125 192C122 182 119 172 117 162Z", sash, "#4A0610", { heavy: W.fine + .4 })}${ink(C, "M118 162C118 176 117 188 120 200C116 200 113 197 112 193C112 182 113 172 115 162Z", sash, "#4A0610", { heavy: W.fine + .4 })}
            ${[0, 1].map(m => `<g ${m ? MIR : ""}>${ink(C, jL, crimson(C, [m ? 1 : 0, 0, m ? 0 : 1, 1]), "#3A0408", { heavy: W.minor })}<path d="${jL}" fill="${embF}" opacity=".85"/>${goldLine("M81.4 97.6C84 100 85.4 102 85.6 104C84 112 84 124 83.6 136L68 140", 1.5)}${soutache(72, 124, .8, -6)}</g>`).join("")}`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = sleeveOf(segs, w, .84, 1.06), [x, y, a] = at(segs, .84), [sx, sy, sa] = at(segs, .05);
            return `${ink(C2, d, crimson(C2, [0, 0, 1, 0]), "#3A0408", { heavy: W.minor })}${goldLine(segPath(ART3.subSegs(segs, .14, .82)), 1.2)}
              <g transform="translate(${f1(sx)} ${f1(sy)}) rotate(${f1(sa)})"><path d="M-4 -8.6C2 -10 6 -9 8 -6" stroke="#5A3A0A" stroke-width="3.2" fill="none" stroke-linecap="round"/><path d="M-4 -8.6C2 -10 6 -9 8 -6" stroke="${K.goldF(C2)}" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
              <g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><path d="M-2 -8Q-3.4 0 -2 8L1.6 8Q.4 0 1.6 -8Z" fill="${K.goldF(C2)}" stroke="#5A3A0A" stroke-width=".6"/>${M.scallops(-8.6, 8.6, 0, 6, 2.8, "#B8A88E", "#FFFFFF", .55).replace("<path", `<path transform="rotate(90) translate(0 -4.6)"`)}</g>`; } };
      }, { aliases: ["mantle"], replaces: SHIRT });
    item("antonio", 5, 1, "capotepaseo", "back", "Capote de Paseo", "The parade cape: ivory silk embroidered with roses, lined in crimson and edged in gold fringe. He flings it over one shoulder and lets it swirl behind him. Every entrance becomes a performance.",
      (C) => { const silk = C.lin([[0, "#FFFDF4"], [.4, "#F4E8CC"], [.8, "#D8C098"], [1, "#9A7A4A"]], [0, 0, 1, 1]);
        const swirl = "M92 96C66 92 42 104 28 126C16 146 12 172 16 204Q40 214 66 208Q92 212 116 206Q134 210 150 204C140 196 128 194 118 196C96 196 76 190 64 176C54 162 54 140 64 122C72 108 82 100 96 100Z";
        const turn = "M16 204Q40 214 66 208Q92 212 116 206Q134 210 150 204C140 196 128 194 118 196C96 196 76 190 64 176C70 194 90 202 112 202C126 202 140 200 150 204Z";
        const front = "M92 97C78 94 64 99 56 112C48 130 45 154 44 184Q60 190 74 186C72 160 72 132 80 114C84 106 88 101 94 99Z";
        const flowers = (pts) => pts.map(([x, y, r, a], i) => `${leaf(C, x - 2, y + 1, 150 + i * 20, .9)}${leaf(C, x + 2, y + 1, 20 - i * 15, .9)}${rose(C, x, y, r, a)}`).join("");
        const fringe = pts => pts.map(([x, y]) => `<path d="M${f1(x)} ${f1(y)}v5" stroke="#C8902A" stroke-width="1.2"/><path d="M${f1(x)} ${f1(y)}v4.4" stroke="#F2C860" stroke-width=".5"/>`).join("");
        return { back: `${ink(C, swirl, silk, "#6A5030", { heavy: W.minor })}<g clip-path="${C.clip(swirl)}"><path d="M40 120C28 146 24 176 26 204" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/><path d="M54 116C44 140 40 166 42 196" stroke="#9A7A4A" stroke-width="1.2" fill="none" opacity=".5"/>${flowers([[34, 150, 5.4, 0], [30, 180, 4.6, 30], [46, 196, 4, -20], [44, 128, 4, 10]])}</g>
            ${ink(C, turn, crimson(C, [0, 0, 1, 1]), "#3A0408", { heavy: W.minor })}<path d="M70 184C88 196 112 200 140 200" stroke="#FF8A96" stroke-width=".9" fill="none" opacity=".7"/>
            ${goldLine("M92 96C66 92 42 104 28 126C16 146 12 172 16 204", 1.4)}${fringe([[16, 205], [24, 207.6], [32, 209.6], [40, 210.6], [48, 210.6], [56, 209.6]])}`,
          arms: (C2, segs, w, side) => side !== "L" ? "" : `${ink(C2, front, silk, "#6A5030", { heavy: W.minor })}<g clip-path="${C2.clip(front)}"><path d="M58 118C52 138 50 160 49 182" stroke="#FFFFFF" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>${flowers([[60, 142, 5, -10], [56, 168, 4.4, 20], [70, 124, 3.6, 0]])}</g>
            ${goldLine("M92 97C78 94 64 99 56 112C48 130 45 154 44 184", 1.4)}${goldLine("M44 184Q60 190 74 186", 1.6)}${fringe([[46, 185], [52, 187], [58, 188], [64, 188], [70, 187]])}
            <g transform="translate(90 100)"><circle r="3.4" fill="${K.goldF(C2)}" stroke="#5A3A0A" stroke-width=".6"/>${rose(C2, 0, 0, 2.6, 0)}</g>` }; },
      { aliases: ["starcrown"] });
  });
})();

// ===== Professor Hoot — "Keeper of the Ancient Library": from tweedy scholar to the guardian of every book ever written =====
// claret · library green · parchment · old gold · midnight blue with starlight
// L1 scholar's quill · paisley cravat      L2 velvet scholar's cap · half-moon spectacles
// L3 bookbinder's bandolier · floating candles      L4 bibliothecary's cloak · runic stole
// L5 robe of the infinite library · the great grimoire
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const GOLD = "#D8AA4A", CLARET = "#7A1E2E", LIB = "#1E4A3A", MID = "#1A2450";
  const MIR = `transform="translate(200 0) scale(-1 1)"`;
  const goldLine = (d, w = 1) => `<path d="${d}" stroke="#5A3A0A" stroke-width="${w + .7}" fill="none" opacity=".5"/><path d="${d}" stroke="${GOLD}" stroke-width="${w}" fill="none"/>`;
  const parchment = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#FFF8E6"], [.6, "#EEDDB8"], [1, "#C8A878"]], a);
  const spine = (C, x, y, w, h, col, a = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" rx=".6" fill="${C.lin([[0, lit(col, .25)], [.5, col], [1, shd(col, .4)]], [0, 0, 1, 0])}" stroke="${shd(col, .6)}" stroke-width=".5"/><path d="M${-w / 2} ${-h * .78}h${w}M${-w / 2} ${-h * .22}h${w}" stroke="${GOLD}" stroke-width=".6"/></g>`;
  const runeG = (x, y, s, col, i, cls = "") => { const g = ["M0 -3V3M-2 -1L0 -3L2 -1", "M-2 -3L2 3M2 -3L-2 3", "M-2 3V-3L2 0L-2 3", "M0 -3A3 3 0 1 0 .1 -3M0 -1V1", "M-2 -3H2L-2 3H2"][i % 5];
    return `<path${cls ? ` class="${cls}" style="animation-delay:${(i * .4).toFixed(1)}s"` : ""} d="${g}" transform="translate(${f1(x)} ${f1(y)}) scale(${s})" stroke="${col}" stroke-width="${f1(.8 / s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; };
  const starF = (x, y, r, col = "#FFF4C8", cls = "", i = 0) => `<path${cls ? ` class="${cls}" style="animation-delay:${(i * .35).toFixed(2)}s"` : ""} d="M${x} ${y - r}l${r * .28} ${r * .72} ${r * .72} ${r * .28} -${r * .72} ${r * .28} -${r * .28} ${r * .72} -${r * .28} -${r * .72} -${r * .72} -${r * .28} ${r * .72} -${r * .28}Z" fill="${col}"/>`;
  const candle = (C, x, y, h, i) => `<g class="a3float" style="animation-delay:${i * .7}s">${K.glow(C, x, y - h - 4, 10, "#FFD870", .55)}
      ${ink(C, `M${x - 3} ${y}V${y - h}C${x - 3} ${y - h - 1} ${x + 3} ${y - h - 1} ${x + 3} ${y - h}V${y}Z`, C.lin([[0, "#FFFDF4"], [.6, "#F2E6CC"], [1, "#C8B898"]], [0, 0, 1, 0]), "#8A7A5A", { heavy: .7 })}
      <path d="M${x - 3} ${y - h + 1}q1 3 0 5M${x + 1.6} ${y - h + .6}q.8 2 0 3.4" stroke="#FFFFFF" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M${x} ${y - h - .6}v-2" stroke="#3A2A1A" stroke-width=".6"/>
      <path d="M${x} ${y - h - 2.4}C${x - 2.4} ${y - h - 5} ${x - 1} ${y - h - 9} ${x} ${y - h - 11}C${x + 1} ${y - h - 9} ${x + 2.4} ${y - h - 5} ${x} ${y - h - 2.4}Z" fill="${C.lin([[0, "#FFFFFF"], [.4, "#FFE070"], [1, "#F07A1A"]], [0, 1, 0, 0])}"/></g>`;
  K.replaceCollection("hoot", () => {
    const item = K.item;
    // ================= LEVEL 1 =================
    item("hoot", 1, 0, "scholarquill", "head", "Scholar's Quill", "A long white goose quill tucked behind one ear tuft, nib still wet. He has been looking for it for three days.",
      (C) => ({ head: `<g transform="translate(70 47) rotate(-34)">
          ${ink(C, "M0 4C-4 -6 -5 -18 -3 -34C-1 -26 2 -18 3 -10C4 -6 3 0 1 4Z", C.lin([[0, "#FFFFFF"], [.6, "#F0EADC"], [1, "#B8AE9A"]], [0, 0, 1, 0]), "#6A5A44", { heavy: .9 })}
          <path d="M.6 4C-1 -8 -2 -20 -3 -33" stroke="#B8AE9A" stroke-width=".7" fill="none"/>${[-28, -23, -18, -13, -8].map(y => `<path d="M${f1(-2.6 + (y + 33) * .05)} ${y}l-2 2.6" stroke="#D8D0C0" stroke-width=".45"/>`).join("")}
          <path d="M.4 4L1 11L-.4 4Z" fill="#2A2238" stroke="#14101C" stroke-width=".5"/><path d="M.6 6.4V10" stroke="#5A4A8A" stroke-width=".5"/><circle cx=".8" cy="11.6" r=".8" fill="#2A2238"/></g>` }),
      { aliases: ["beret"] });
    item("hoot", 1, 1, "paisleycravat", "neck", "Paisley Silk Cravat", "Claret silk printed with tiny gold paisleys, tied in a loose scholarly knot and pinned with a single pearl.",
      (C) => { const pais = K.patt(C, 6, 6, `<path d="M2 4C.4 4 .4 1.6 2 1.4C3.6 1.2 4.4 3 3.6 4.4C3 5.4 1.6 5.6 1 5" stroke="#E8B860" stroke-width=".45" fill="none"/><circle cx="2" cy="3" r=".45" fill="#E8B860"/>`);
        const knot = "M92 102C96 100 104 100 108 102C110 106 108 112 100 114C92 112 90 106 92 102Z";
        const fold = "M93 110C90 118 90 128 94 136L100 132L106 136C110 128 110 118 107 110C104 114 96 114 93 110Z";
        const sat = C.lin([[0, "#C8485A"], [.4, CLARET], [1, "#3A0610"]], [0, 0, 1, 1]);
        return { body: `${ink(C, fold, sat, "#2A0408", { heavy: W.minor })}<path d="${fold}" fill="${pais}"/><path d="M95 114C93 122 94 128 96 133M104 115C106 122 106 128 104 133" stroke="#2A0408" stroke-width=".7" fill="none" opacity=".6"/><path d="M96 116C95 122 95 126 96 130" stroke="#FFB0B8" stroke-width=".8" fill="none" opacity=".5"/>
          ${ink(C, knot, sat, "#2A0408", { heavy: W.minor })}<path d="${knot}" fill="${pais}"/><path d="M94 104Q100 102 106 104" stroke="#FFB0B8" stroke-width=".7" fill="none" opacity=".6"/>
          <circle cx="100" cy="122" r="1.8" fill="${C.rad([[0, "#FFFFFF"], [.6, "#F4EAF0"], [1, "#B8A8B8"]], { cx: .35, cy: .3 })}" stroke="#8A7A8A" stroke-width=".35"/>` }; },
      { aliases: ["bow", "scarf"] });

    // ================= LEVEL 2 =================
    item("hoot", 2, 0, "scholarcap", "head", "Velvet Scholar's Cap", "Soft claret velvet with a gold cord and a tassel that swings when he nods sagely, which is often.",
      (C) => ({ head: `<g transform="translate(100 47)">
          ${ink(C, "M-24 0C-26 -10 -18 -18 0 -19C18 -18 28 -12 26 -2C22 2 14 3 0 3C-14 3 -22 3 -24 0Z", M.velvet(C, CLARET, [.2, 0, .8, 1]), "#2A0408", { heavy: W.minor })}
          <path d="M-18 -10C-12 -16 -4 -17.6 4 -17.4" stroke="#E87A8A" stroke-width="1.6" fill="none" opacity=".4" stroke-linecap="round"/>${[-14, -6, 2, 10, 18].map(x => `<path d="M${x} -16Q${x + 1} -8 ${x - 1} 1" stroke="#3A0610" stroke-width=".6" fill="none" opacity=".5"/>`).join("")}
          ${ink(C, "M-25 -1Q0 5 26 -2L26 3Q0 9 -25 4Z", C.lin([[0, "#FFE6A0"], [.5, GOLD], [1, "#7A5410"]], [0, 0, 0, 1]), "#5A3A0A", { heavy: .7 })}<path d="M-24 1.4Q0 7.4 25 .4" stroke="#7A5410" stroke-width=".5" fill="none" stroke-dasharray=".8 .8"/>
          <circle cx="2" cy="-18.6" r="2.2" fill="${K.goldF(C)}" stroke="#5A3A0A" stroke-width=".5"/><path d="M3.6 -17.6C14 -14 22 -8 24 2" stroke="${GOLD}" stroke-width=".9" fill="none"/>
          <g transform="translate(24 3)"><rect x="-1.6" y="-1" width="3.2" height="2.4" rx=".8" fill="${K.goldF(C)}"/>${[-1.2, -.4, .4, 1.2].map(t => `<path d="M${t} 1.4L${t * 1.6} 9" stroke="${GOLD}" stroke-width=".55"/>`).join("")}</g></g>` }),
      { aliases: [] });
    item("hoot", 2, 1, "halfmoonspecs", "face", "Half-Moon Reading Spectacles", "Gold half-moon lenses perched low on his beak, so he can peer over them at anyone talking in the library. A tiny crescent hangs from the chain.",
      (C) => { const lens = s => { const x = 100 + s * 14.6; return `M${x - 11} 76Q${x} 74.6 ${x + 11} 76C${x + 11} 84 ${x + 6} 89 ${x} 89C${x - 6} 89 ${x - 11} 84 ${x - 11} 76Z`; };
        return { head: `${[-1, 1].map(s => `<path d="${lens(s)}" fill="#DDEEFF" fill-opacity=".18" stroke="#3A2A10" stroke-width="2.4"/><path d="${lens(s)}" fill="none" stroke="${C.lin([[0, "#FFEDB0"], [.5, GOLD], [1, "#8A6420"]], [0, 0, 1, 1])}" stroke-width="1.4"/><path d="M${100 + s * 14.6 - 7} 79q2 4 6 5" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/>`).join("")}
          <path d="M96.4 77.4Q100 74.6 103.6 77.4" stroke="#3A2A10" stroke-width="2.2" fill="none"/><path d="M96.4 77.4Q100 74.6 103.6 77.4" stroke="${GOLD}" stroke-width="1.1" fill="none"/>
          <path d="M74.4 76L64 72M125.6 76L136 72" stroke="#3A2A10" stroke-width="2"/><path d="M74.4 76L64 72M125.6 76L136 72" stroke="${GOLD}" stroke-width="1"/>
          <path d="M64.6 73C58 86 60 100 70 106" stroke="${GOLD}" stroke-width="1" fill="none" stroke-dasharray="1.2 1"/><g transform="translate(66 100)"><path d="M0 -3.4A3.4 3.4 0 1 0 2.6 2.2A2.6 2.6 0 1 1 0 -3.4Z" fill="${K.goldF(C)}" stroke="#5A3A0A" stroke-width=".4"/></g>` }; },
      { aliases: ["pearls"] });

    // ================= LEVEL 3 =================
    item("hoot", 3, 0, "bookbandolier", "torso", "Bookbinder's Bandolier", "A worn leather strap across his waistcoat, carrying three pocket books, an inkwell, spare quills and a bone folder. A scholar should never be without a book. Or four.",
      (C) => { const lea = M.leather(C, "#6A3A1E", [0, 0, 1, 1]);
        const strapD = "M74 114C88 126 104 140 124 158";
        const loop = (x, y, a) => `<path d="M0 -3.6V3.6" transform="translate(${x} ${y}) rotate(${a})" stroke="#2A1206" stroke-width="7.6"/><path d="M0 -3.6V3.6" transform="translate(${x} ${y}) rotate(${a})" stroke="${M.leather(C, "#5A2E14")}" stroke-width="6.4"/>`;
        return { body: `<path d="${strapD}" stroke="#2A1206" stroke-width="7" fill="none"/><path d="${strapD}" stroke="${lea}" stroke-width="5.6" fill="none"/>${M.stitch("M74 111.6C88 123.6 104 137.6 125.4 155.8M72.6 116.4C86.6 128.4 102.6 142.4 122.6 160.2", "#E8B880", .4)}
          ${spine(C, 82, 124, 5, 13, "#2A5A8A", -48)}${spine(C, 88.6, 130, 5.4, 15, CLARET, -46)}${spine(C, 95.6, 136, 4.6, 12, LIB, -44)}${loop(84, 122, 42)}${loop(97, 134, 42)}
          <g transform="translate(108 145) rotate(-40)">${ink(C, "M-3.4 0C-3.4 -2 3.4 -2 3.4 0L3 6C3 7.4 -3 7.4 -3 6Z", C.lin([[0, "#3A4A6A"], [1, "#0E1424"]], [0, 0, 1, 0]), "#06080E", { heavy: .7 })}<rect x="-2" y="-4" width="4" height="2.6" rx=".6" fill="${K.goldF(C)}"/><path d="M-1.6 1v4" stroke="#8AA0D0" stroke-width=".6" opacity=".7"/></g>
          ${[[113, 150, -20, "#FFFFFF"], [116, 152, -8, "#E8E0F4"]].map(([x, y, a, col]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C-1.6 -6 -1.4 -12 0 -18C1.6 -12 1.6 -6 .6 0Z" fill="${col}" stroke="#8A7A6A" stroke-width=".4"/><path d="M.3 0V-17" stroke="#B8AE9A" stroke-width=".35"/></g>`).join("")}
          <g transform="translate(120 156) rotate(-40)"><rect x="-4" y="-2.6" width="8" height="5.2" rx=".9" fill="none" stroke="#3A2006" stroke-width="1.8"/><rect x="-4" y="-2.6" width="8" height="5.2" rx=".9" fill="none" stroke="${K.goldF(C)}" stroke-width="1.1"/></g>` }; },
      { aliases: ["wizhat"], replaces: [] });
    item("hoot", 3, 1, "floatcandles", "back", "Floating Reading Candles", "Three beeswax candles that follow him through the stacks and lean closer when the print is small.",
      (C) => ({ back: `${candle(C, 44, 120, 18, 0)}${candle(C, 158, 104, 22, 1)}${candle(C, 150, 54, 14, 2)}
          ${[[40, 96], [52, 92], [162, 76], [146, 34]].map(([x, y], i) => starF(x, y, 1.4, "#FFE8A0", "a3twinkle", i)).join("")}` }),
      { aliases: ["flowers"] });

    // ================= LEVEL 4 =================
    item("hoot", 4, 0, "bibliocloak", "back", "Bibliothecary's Cloak", "Library-green velvet that sweeps the floor, a high collar, and a lining woven to look like endless shelves of books. The clasp is a little brass book that really opens.",
      (C) => { const cl = "M100 96C78 96 60 104 50 122C40 146 36 176 34 204Q100 214 166 204C164 176 160 146 150 122C140 104 122 96 100 96Z";
        const shelfP = K.patt(C, 14, 12, `<rect width="14" height="12" fill="#3A2614"/>${[[0, "#8A2A2E", 2.4, 9], [2.6, "#2A5A8A", 2, 8], [4.8, "#C8A050", 2.2, 9.4], [7.2, "#3A6A3A", 2.6, 8.4], [10, "#6A3A8A", 1.8, 9], [12, "#B85A2A", 2, 7.6]].map(([x, c, w, h]) => `<rect x="${x}" y="${11 - h}" width="${w}" height="${h}" fill="${c}"/><path d="M${x} ${11 - h + 1.6}h${w}" stroke="#E8C870" stroke-width=".35"/>`).join("")}<rect y="11" width="14" height="1" fill="#1A0E06"/>`);
        const collar = s => { const m = x => 100 + s * (x - 100); return `M${m(100)} 104C${m(86)} 100 ${m(72)} 92 ${m(62)} 76C${m(58)} 70 ${m(58)} 62 ${m(60)} 56C${m(66)} 66 ${m(76)} 76 ${m(90)} 84C${m(96)} 88 ${m(100)} 92 ${m(100)} 98Z`; };
        return { back: `${ink(C, cl, M.velvet(C, LIB, [0, 0, 1, 1]), "#04140C", { heavy: W.minor })}<g clip-path="${C.clip(cl)}"><path d="M34 176C40 150 46 130 54 118L62 120C54 140 48 164 44 204Z" fill="${shelfP}"/><path d="M166 176C160 150 154 130 146 118L138 120C146 140 152 164 156 204Z" fill="${shelfP}"/>
              <path d="M54 118C48 140 44 168 42 204M146 118C152 140 156 168 158 204" stroke="${GOLD}" stroke-width="1" fill="none"/><path d="M60 128C54 150 50 176 48 200" stroke="#5AA888" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/></g>
            ${goldLine("M34 204Q100 214 166 204", 1.4)}
            ${[-1, 1].map(s => `${ink(C, collar(s), M.velvet(C, LIB, [s < 0 ? 0 : 1, 0, s < 0 ? 1 : 0, 1]), "#04140C", { heavy: W.minor })}<path d="${collar(s)}" fill="none" stroke="${GOLD}" stroke-width=".8" stroke-dasharray="1.4 .8"/>`).join("")}`,
          body: `<path d="M80 108Q100 116 120 108" stroke="${GOLD}" stroke-width=".9" fill="none" stroke-dasharray="1.4 .6"/><g transform="translate(100 113)">${ink(C, "M0 -3.4C-2 -4.4 -5 -4.4 -6.4 -3.6L-6.4 3.4C-5 2.6 -2 2.6 0 3.6C2 2.6 5 2.6 6.4 3.4L6.4 -3.6C5 -4.4 2 -4.4 0 -3.4Z", K.goldF(C), "#5A3A0A", { heavy: .8 })}<path d="M0 -3.2V3.4M-5 -2Q-2.6 -2.8 -1 -2M1 -2Q2.6 -2.8 5 -2M-5 0Q-2.6 -.8 -1 0M1 0Q2.6 -.8 5 0" stroke="#5A3A0A" stroke-width=".4" fill="none"/></g>` }; },
      { aliases: ["cape"] });
    item("hoot", 4, 1, "runicstole", "neck", "Runic Archivist's Stole", "A long stole of claret silk embroidered with the shelf-marks of every lost book he has ever found. It reaches the floor and he trips on it. He refuses to shorten it.",
      (C) => { const side = s => { const m = x => 100 + s * (x - 100); return `M${m(92)} 104C${m(86)} 112 ${m(83)} 130 ${m(82)} 152C${m(81)} 170 ${m(80)} 188 ${m(80)} 206L${m(86)} 202L${m(92)} 208C${m(92)} 186 ${m(92)} 166 ${m(93)} 148C${m(94)} 130 ${m(96)} 114 ${m(100)} 108Z`; };
        const sat = s => C.lin([[0, "#C8485A"], [.4, CLARET], [1, "#3A0610"]], [s < 0 ? 0 : 1, 0, s < 0 ? 1 : 0, 0]);
        return { arms: (C2, segs, w, sd) => sd !== "wing" ? "" : [-1, 1].map(s => { const m = x => 100 + s * (x - 100);
            return `${ink(C2, side(s), sat(s), "#2A0408", { heavy: W.minor })}${goldLine(`M${m(84.6)} 140C${m(84)} 160 ${m(83.4)} 182 ${m(83)} 202`, .7)}${goldLine(`M${m(91.4)} 140C${m(91)} 160 ${m(90.6)} 182 ${m(90.4)} 204`, .7)}
              ${[150, 164, 178, 192].map((y, i) => runeG(m(87.4 - (y - 150) * .03), y, .8, "#F2C860", i + (s > 0 ? 2 : 0))).join("")}${[0, 1, 2, 3].map(i => `<path d="M${m(81 + i * 3)} ${f1(206 - (i % 2) * 2 + i * .6)}v4.6" stroke="${GOLD}" stroke-width=".9"/>`).join("")}`; }).join("") }; },
      { aliases: [], replaces: [] });

    // ================= LEVEL 5 =================
    item("hoot", 5, 0, "infiniterobe", "torso", "Robe of the Infinite Library", "Midnight-blue robes lined with the night sky as it looked when the first book was written. A collar of gold, and a hem embroidered with every shelf of the library at once.",
      (C) => { const robe = "M100 98C78 98 62 116 60 144C58 168 62 186 68 196L132 196C138 186 142 168 140 144C138 116 122 98 100 98Z";
        const midF = (a = [0, 0, 1, 1]) => C.lin([[0, "#4A5AA8"], [.3, "#24306A"], [.75, MID], [1, "#0A0E24"]], a);
        const starsP = K.patt(C, 16, 16, `<circle cx="3" cy="4" r=".5" fill="#FFF4C8"/><circle cx="11" cy="9" r=".35" fill="#FFFFFF"/><circle cx="7" cy="14" r=".45" fill="#CFE0FF"/><path d="M13 2l.3 .8.8.3-.8.3-.3.8-.3-.8-.8-.3.8-.3Z" fill="#FFF4C8"/>`);
        const hem = K.patt(C, 10, 9, `<rect width="10" height="9" fill="#2A1A0E"/>${[[0, "#8A2A2E", 1.8, 7], [2, "#2A5A8A", 1.6, 6], [3.8, "#C8A050", 1.8, 7.6], [5.8, "#3A6A3A", 2, 6.4], [8, "#6A3A8A", 1.6, 7]].map(([x, c, w, h]) => `<rect x="${x}" y="${8.4 - h}" width="${w}" height="${h}" fill="${c}"/>`).join("")}<rect y="8.4" width="10" height=".6" fill="#E8C870"/>`);
        const collar = s => { const m = x => 100 + s * (x - 100); return `M${m(100)} 108C${m(88)} 108 ${m(74)} 106 ${m(64)} 102C${m(58)} 100 ${m(56)} 96 ${m(58)} 92C${m(66)} 96 ${m(78)} 98 ${m(90)} 99C${m(96)} 100 ${m(100)} 102 ${m(100)} 104Z`; };
        const sleeve = s => { const m = x => 100 + s * (x - 100); return `M${m(66)} 110C${m(50)} 124 ${m(44)} 152 ${m(46)} 178C${m(46)} 186 ${m(50)} 192 ${m(56)} 194C${m(62)} 190 ${m(72)} 188 ${m(80)} 186C${m(78)} 172 ${m(76)} 156 ${m(78)} 140C${m(78)} 126 ${m(74)} 116 ${m(66)} 110Z`; };
        return {
          back: `${K.glow(C, 100, 70, 52, "#7A9AFF", .14)}${[-1, 1].map(s => `${ink(C, collar(s), C.lin([[0, "#FFF2C0"], [.4, "#E8C060"], [1, "#8A5A10"]], [0, 0, 1, 1]), "#5A3A0A", { heavy: W.minor })}<g clip-path="${C.clip(collar(s))}"><path d="${collar(s)}" fill="${midF()}" transform="translate(${s * 3} 3) scale(.96)" transform-origin="100 100"/><path d="${collar(s)}" fill="${starsP}" transform="translate(${s * 3} 3)"/></g>`).join("")}`,
          body: `${ink(C, robe, midF([0, 0, 1, 1]), "#04061A", { heavy: W.minor })}<path d="${robe}" fill="${starsP}"/><g clip-path="${C.clip(robe)}"><rect x="58" y="185" width="84" height="12" fill="${hem}"/>${goldLine("M60 184.4H140", 1.2)}<path d="M100 106V184" stroke="${GOLD}" stroke-width="2.2"/><path d="M100 106V184" stroke="#FFF2C0" stroke-width=".6" stroke-dasharray=".4 2"/>${[120, 140, 160, 180].map((y, i) => runeG(100, y, 1, "#7AC8FF", i, "a3twinkle")).join("")}</g>`,
          arms: (C2, segs, w, sd) => sd !== "wing" ? "" : [-1, 1].map(s => { const m = x => 100 + s * (x - 100);
            return `${ink(C2, sleeve(s), midF([s < 0 ? 0 : 1, 0, s < 0 ? 1 : 0, 1]), "#04061A", { heavy: W.minor })}<path d="${sleeve(s)}" fill="${starsP}"/><g clip-path="${C2.clip(sleeve(s))}"><path d="M${m(46)} 176C${m(52)} 184 ${m(66)} 186 ${m(80)} 182L${m(82)} 196L${m(44)} 196Z" fill="${C2.lin([[0, "#3A4A9A"], [1, "#0A0E24"]], [0, 0, 0, 1])}"/><path d="M${m(52)} 140C${m(50)} 156 ${m(50)} 170 ${m(52)} 182" stroke="#8AA0FF" stroke-width="1.8" fill="none" opacity=".35" stroke-linecap="round"/></g>${goldLine(`M${m(46)} 178C${m(46)} 186 ${m(50)} 192 ${m(56)} 194C${m(62)} 190 ${m(72)} 188 ${m(80)} 186`, 1.3)}${M.filigree(m(60), 160, .8, GOLD, .6)}`; }).join("") };
      }, { aliases: ["mantle"], replaces: ["waistcoat", "bowtie"] });
    item("hoot", 5, 1, "greatgrimoire", "back", "The Great Grimoire", "The first book, and the last. It floats open behind him, pages turning by themselves, every line glowing as it is read. Only its keeper may close it.",
      (C) => { const pageL = "M100 70C84 58 58 52 26 56L30 112C58 106 82 110 100 120Z", pageR = "M100 70C116 58 142 52 174 56L170 112C142 106 118 110 100 120Z";
        const lines = s => Array.from({ length: 8 }, (_, i) => { const m = x => 100 + s * (x - 100), y = 66 + i * 5.6; return `<path data-fine="1" d="M${m(36)} ${f1(y - 2 + i * .2)}Q${m(66)} ${f1(y - 6 + i * .6)} ${m(94)} ${f1(y + 4 + i * .4)}" stroke="#8A6A3A" stroke-width=".55" fill="none" opacity=".7"/>`; }).join("");
        const loose = [[22, 34, -24], [172, 30, 20], [180, 130, 34]].map(([x, y, a], i) => `<g data-fine="1" class="a3float" style="animation-delay:${i * .9}s"><g transform="translate(${x} ${y}) rotate(${a})"><path d="M-6 -8L6 -7L5.6 8L-5.6 7Z" fill="${parchment(C)}" stroke="#8A6A3A" stroke-width=".5"/>${[-4, -1, 2, 5].map(t => `<path d="M-4 ${t}h7" stroke="#B8986A" stroke-width=".45"/>`).join("")}</g></g>`).join("");
        return { back: `${K.glow(C, 100, 84, 80, "#FFE6A0", .28)}
          ${ink(C, "M100 74C82 62 54 56 22 60L24 118C56 112 82 116 100 126C118 116 144 112 176 118L178 60C146 56 118 62 100 74Z", C.lin([[0, "#6A1E24"], [1, "#2A060A"]], [0, 0, 0, 1]), "#1A0204", { heavy: W.minor })}
          <path d="M24 116C56 110 82 114 100 124C118 114 144 110 176 116" stroke="${GOLD}" stroke-width="1.6" fill="none"/>
          ${ink(C, pageL, parchment(C, [1, 0, 0, 1]), "#8A6A3A", { heavy: .8 })}${ink(C, pageR, parchment(C, [0, 0, 1, 1]), "#8A6A3A", { heavy: .8 })}${lines(-1)}${lines(1)}
          ${[[40, 70, 0], [54, 86, 2], [146, 70, 1], [158, 90, 3], [34, 96, 4], [164, 104, 0]].map(([x, y, i]) => runeG(x, y, 1.3, "#E8901A", i, "a3twinkle")).join("")}
          <path d="M100 70C112 60 132 56 150 58C138 64 122 70 108 80Z" fill="${parchment(C)}" stroke="#8A6A3A" stroke-width=".6" class="a3float" style="animation-delay:.4s"/>
          <path d="M100 120V128L102.6 124.6L105 128L104 118Z" fill="#C0283A" stroke="#5A0610" stroke-width=".4"/>
          ${[[30, 58], [170, 58], [24, 116], [176, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${K.goldF(C)}" stroke="#5A3A0A" stroke-width=".5"/>`).join("")}${loose}
          ${[[48, 40], [150, 36], [100, 28], [20, 84], [182, 84]].map(([x, y], i) => starF(x, y, 1.8, "#FFF0B0", "a3twinkle", i)).join("")}` }; },
      { aliases: ["starcrown"] });
  });
})();

// ===== Corvin the Undefeated — "The Raven Warlord": from swaggering sell-sword to the legend no army will face =====
// obsidian steel · lacquered black · war crimson · old gold · storm violet
// L1 crimson war paint · iron torc of victories      L2 raven-crest shield · raven-beak war axe
// L3 lamellar war coat · battle standard      L4 storm-crest helm · stormbringer glaive
// L5 armour of the undefeated · mantle of a thousand ravens
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const CR = "#A8142A", GOLD = "#E8B23A", INK = "#0A0B12";
  const steelK = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#7A82A8"], [.25, "#3A4060"], [.65, "#181C2C"], [1, "#06070E"]], a);
  const steel = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#EEF2F8"], [.3, "#A8B4C6"], [.7, "#647086"], [1, "#3A4254"]], a);
  const goldF = (C, a = [0, 0, 0, 1]) => C.lin([[0, "#FFE6A0"], [.5, GOLD], [1, "#8A6420"]], a);
  const crim = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#E8384A"], [.4, CR], [1, "#4A0610"]], a);
  const goldLine = (d, w = 1) => `<path d="${d}" stroke="#4A3008" stroke-width="${w + .7}" fill="none" opacity=".55"/><path d="${d}" stroke="${GOLD}" stroke-width="${w}" fill="none"/>`;
  // a flying raven silhouette, wings up
  const raven = (x, y, s, a = 0, op = 1, cls = "", i = 0) => `<g${cls ? ` class="${cls}" style="animation-delay:${(i * .5).toFixed(1)}s"` : ""}${i % 2 ? ' data-fine="1"' : ""}><path d="M0 1C-3 -2 -7 -5 -12 -5C-8 -3 -6 -1 -4 1L-7 2.4L-2 2.6L0 5L1.4 2.6Q4 2 6 0Q10 -4 14 -6Q8 -5 3 -1L2 -1.4L3.4 -2.6L1.4 -2.4Z" transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})" fill="#0A0B12" opacity="${op}"/></g>`;
  const ravenSigil = (C, x, y, s, col = INK) => `<path d="M0 -6C2 -6 3 -4.6 3 -3.4L6 -3L3.4 -1.6C5 0 8 1 11 4C7 3.6 4 2.6 2 2L1.6 5L3 8L0 6.4L-3 8L-1.6 5L-2 2C-5 3 -8 4 -11 4C-8 1 -5 0 -3 -1.6L-3.6 -4C-3 -5.4 -1.6 -6 0 -6Z" transform="translate(${f1(x)} ${f1(y)}) scale(${s})" fill="${col}"/>`;
  const rivet = (x, y, r = .8) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#FFE6A0" stroke="#5A3E10" stroke-width=".3"/>`;
  const bolt = (d, cls = "a3twinkle", i = 0) => `<path data-fine="1" class="${cls}" style="animation-delay:${i * .6}s" d="${d}" stroke="#B8C8FF" stroke-width="2.4" fill="none" opacity=".35" stroke-linejoin="round"/><path data-fine="1" class="${cls}" style="animation-delay:${i * .6}s" d="${d}" stroke="#F4F8FF" stroke-width=".9" fill="none" stroke-linejoin="round"/>`;
  const handOver = `<path d="M137 148C141 144 147 144 149 148C148 152 143 154 138 153Z" fill="#161A28" stroke="${INK}" stroke-width=".8"/>`;
  const ARMOR = ["armor", "pauldron"];

  K.replaceCollection("corvin", () => {
    const item = K.item;
    // ================= LEVEL 1 =================
    item("corvin", 1, 0, "warpaint", "face", "Crimson War Paint", "Three red claw-marks under the eye and a line across the brow. He paints them before every battle, every duel and every breakfast.",
      (C) => ({ head: `${[[86, 66, 90, 76], [91, 67, 95, 78], [96, 67.6, 100, 78.4]].map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0}Q${(x0 + x1) / 2 + 1.4} ${(y0 + y1) / 2} ${x1} ${y1}" stroke="${CR}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".92"/><path d="M${x0 + .4} ${y0 + 1}L${x0 + 1.4} ${y0 + 4}" stroke="#FF8A96" stroke-width=".6" stroke-linecap="round"/>`).join("")}
          <path d="M84 51.6Q96 49 108 52" stroke="${CR}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".9"/>${[[106, 70], [109, 72.6], [112, 70.4]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#F4ECE0"/>`).join("")}` }),
      { aliases: ["bow"] });
    item("corvin", 1, 1, "irontorc", "neck", "Iron Torc of Victories", "Twisted black iron ending in two gold raven heads. A notch is filed into it for every victory. It is mostly notches.",
      (C) => { const twist = Array.from({ length: 13 }, (_, i) => { const t = i / 12, x = 82 + t * 36, y = 108 + Math.sin(t * Math.PI) * 6; return `<path d="M${f1(x - 1.4)} ${f1(y - 2)}L${f1(x + 1.4)} ${f1(y + 2)}" stroke="#8A92B0" stroke-width=".6"/>`; }).join("");
        const head = s => `<g transform="translate(${100 + s * 18} 108.6) scale(${s} 1)"><path d="M0 -2.6C2.4 -3 4 -1.6 4.4 0L8 .8L4.4 1.6C3.6 2.8 1.6 3 0 2.6Z" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".5"/><circle cx="2.6" cy="-.6" r=".5" fill="${CR}"/></g>`;
        return { head: `<path d="M82 108Q100 120 118 108" stroke="#05060A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M82 108Q100 120 118 108" stroke="${steelK(C, [0, 0, 0, 1])}" stroke-width="3.6" fill="none" stroke-linecap="round"/>${twist}${head(-1)}${head(1)}
          ${[90, 96, 104, 110].map(x => `<path d="M${x} ${f1(110.6 + Math.sin((x - 82) / 36 * Math.PI) * 3)}v1.6" stroke="${GOLD}" stroke-width=".6"/>`).join("")}` }; },
      { aliases: ["scarf"] });

    // ================= LEVEL 2 =================
    item("corvin", 2, 0, "ravenshield", "arms", "Raven-Crest Shield", "A round shield of black oak, iron-rimmed, painted with a raven in flight. It has been hit by everything. It has never broken.",
      (C) => ({ arms: (C2, segs, w, side) => side !== "wing" ? "" : `<g transform="translate(75 150) scale(.84)">
          <circle r="19" fill="#06070C" opacity=".35" transform="translate(1.4 1.8)"/>
          ${ink(C2, "M-18 0A18 18 0 1 0 18 0A18 18 0 1 0 -18 0Z", C2.rad([[0, "#4A2A1E"], [.7, "#2A1610"], [1, "#160A06"]], { cx: .4, cy: .35 }), INK, { heavy: W.minor })}
          <circle r="14.6" fill="${crim(C2, [.2, 0, .8, 1])}"/>${[-60, 0, 60, 120, 180, 240].map(a => `<path d="M0 0L${f1(Math.cos(a * Math.PI / 180) * 14.6)} ${f1(Math.sin(a * Math.PI / 180) * 14.6)}" stroke="#3A0408" stroke-width=".6" opacity=".7"/>`).join("")}
          ${ravenSigil(C2, 0, 0, 1.15)}
          <circle r="16.4" fill="none" stroke="#05060A" stroke-width="4.2"/><circle r="16.4" fill="none" stroke="${steel(C2)}" stroke-width="3"/>${Array.from({ length: 10 }, (_, i) => rivet(Math.cos(i * .628) * 16.4, Math.sin(i * .628) * 16.4, .8)).join("")}
          <circle r="4.4" fill="${steel(C2)}" stroke="#1A202C" stroke-width=".8"/><circle cx="-1.2" cy="-1.4" r="1.4" fill="#FFFFFF" opacity=".7"/>
          <path d="M-12 -10Q-6 -15 2 -15.4" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".35" stroke-linecap="round"/><path d="M6 8l4 4M-9 6l3 -2" stroke="#1A0A06" stroke-width=".8" opacity=".7"/></g>` }),
      { aliases: ["beret"] });
    item("corvin", 2, 1, "ravenaxe", "held", "Raven-Beak War Axe", "A bearded axe whose blade is forged in the shape of a raven's beak, with a gold eye inlaid where the beak meets the haft.",
      (C) => ({ back: `<g transform="translate(144 154) rotate(16) scale(.92)">
          <rect x="-2.2" y="-74" width="4.4" height="90" rx="1.6" fill="${C.lin([[0, "#6A4A30"], [.5, "#3A2414"], [1, "#1A0E06"]], [0, 0, 1, 0])}" stroke="#0E0604" stroke-width=".7"/>${[-6, -2, 2, 6, 10].map(y => `<path d="M-2.2 ${y}l4.4 1.6" stroke="${CR}" stroke-width=".9"/>`).join("")}
          ${ink(C, "M2 -70C10 -74 20 -72 26 -64C22 -62 20 -58 20 -52C18 -46 12 -44 6 -46L2 -50Z", steel(C, [0, 0, 1, 1]), "#1A202C", { heavy: W.minor })}
          <path d="M3 -69C10 -72 18 -70 24 -64" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".8"/><path d="M20 -52C18 -47 13 -45.6 7 -47" stroke="#3A4254" stroke-width=".8" fill="none"/>
          ${ink(C, "M-2 -70C-6 -72 -10 -70 -12 -66L-2 -60Z", steel(C), "#1A202C", { heavy: 1 })}
          <circle cx="7" cy="-61" r="2.2" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".5"/><circle cx="7.4" cy="-61.4" r=".8" fill="${INK}"/>
          <path d="M-2.4 -76L0 -82L2.4 -76Z" fill="${steel(C)}" stroke="#1A202C" stroke-width=".6"/><circle cy="17" r="2.6" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".5"/></g>` }),
      { aliases: ["pearls"], replaces: ["sword"] });

    // ================= LEVEL 3 =================
    item("corvin", 3, 0, "lamellarcoat", "torso", "Lamellar War Coat", "Hundreds of black-lacquered plates laced together with crimson silk, a coat that whispers when he moves and rings when he's struck.",
      (C) => { const coat = "M100 92C80 95 68 112 68 134C68 156 78 174 90 184L110 184C122 174 132 156 132 134C132 112 120 95 100 92Z";
        const lam = K.patt(C, 6, 5, `<rect width="6" height="5" fill="#14161E"/><rect x=".3" y=".3" width="5.4" height="4.2" rx=".8" fill="#262A38"/><path d="M.6 .8h4.6" stroke="#5A6488" stroke-width=".4"/><path d="M3 4.6v.4" stroke="${CR}" stroke-width=".9"/>`);
        const tasset = (x, a) => `<g transform="translate(${x} 178) rotate(${a})">${ink(C, "M-7 0H7L6 18H-6Z", "#14161E", INK, { heavy: 1 })}<path d="M-7 0H7L6 18H-6Z" fill="${lam}"/>${[3, 8, 13].map(y => `<path d="M-6.6 ${y}h13" stroke="${CR}" stroke-width=".8"/>`).join("")}<path d="M-6 18H6" stroke="${GOLD}" stroke-width=".9"/></g>`;
        return { body: `${tasset(88, 8)}${tasset(112, -8)}${tasset(100, 0)}${ink(C, coat, "#14161E", INK, { heavy: W.minor })}<path d="${coat}" fill="${lam}"/><g clip-path="${C.clip(coat)}">${[112, 124, 136, 148, 160, 172].map(y => `<path d="M60 ${y}H140" stroke="${CR}" stroke-width="1.1" opacity=".85"/><path d="M60 ${y + .6}H140" stroke="#FF6A7A" stroke-width=".3" opacity=".6"/>`).join("")}<path d="M74 110C70 126 70 146 76 164" stroke="#8A96C8" stroke-width="2.2" fill="none" opacity=".3" stroke-linecap="round"/></g>
          ${ink(C, "M84 98Q100 92 116 98L114 108Q100 104 86 108Z", C.lin([[0, "#3A3E52"], [1, "#0E1018"]], [0, 0, 0, 1]), INK, { heavy: 1 })}${goldLine("M86 107Q100 103 114 107", .8)}
          ${ink(C, "M84 162Q100 168 116 162L116 170Q100 176 84 170Z", crim(C, [0, 0, 0, 1]), "#3A0408", { heavy: 1 })}<g transform="translate(100 166)"><circle r="3.6" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".6"/>${ravenSigil(C, 0, 0, .3)}</g>`,
          arms: (C2, segs, w, side) => side !== "wing" ? "" : `${[[0, 14], [7, 12.4], [14, 10.6]].reverse().map(([dy, r]) => `${ink(C2, `M${78 - r} ${104 + dy}C${78 - r} ${96 + dy} ${78 + r} ${96 + dy} ${78 + r} ${104 + dy}L${78 + r - 1} ${110 + dy}C${78 + r * .4} ${107 + dy} ${78 - r * .4} ${107 + dy} ${78 - r + 1} ${110 + dy}Z`, "#1A1C26", INK, { heavy: W.minor })}<path d="M${78 - r + 1} ${108 + dy}C${78 - r * .4} ${105 + dy} ${78 + r * .4} ${105 + dy} ${78 + r - 1} ${108 + dy}" stroke="${CR}" stroke-width="1" fill="none"/><path d="M${78 - r + 2} ${102 + dy}C${78 - r * .4} ${98 + dy} ${78 + r * .4} ${98 + dy} ${78 + r - 2} ${102 + dy}" stroke="#7A86B8" stroke-width=".6" fill="none" opacity=".6"/>`).join("")}` }; },
      { aliases: ["wizhat"], replaces: ARMOR });
    item("corvin", 3, 1, "battlestandard", "back", "Battle Standard", "His own war banner, crimson and torn from a hundred charges, carried on his back so every enemy knows exactly whom they are about to lose to.",
      (C) => { const flag = "M128 18H176L174 32L178 44L172 52L176 64L168 70L170 80L160 74L150 82L146 72L136 80L134 66L128 70Z";
        return { back: `<path d="M118 120L128 10" stroke="#1A0E06" stroke-width="3.6" stroke-linecap="round"/><path d="M118 120L128 10" stroke="${C.lin([[0, "#6A4A30"], [1, "#2A1A0E"]], [0, 0, 1, 0])}" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M124 18H180" stroke="#1A0E06" stroke-width="2.6" stroke-linecap="round"/><path d="M124 18H180" stroke="${goldF(C)}" stroke-width="1.6" stroke-linecap="round"/><circle cx="128.4" cy="8" r="2.6" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".5"/><path d="M128.4 3L130 6.6H126.8Z" fill="${steel(C)}" stroke="#1A202C" stroke-width=".4"/>
          ${ink(C, flag, crim(C, [0, 0, 1, 1]), "#3A0408", { heavy: W.minor })}<g clip-path="${C.clip(flag)}"><path d="M140 20C138 40 140 60 138 80M160 20C162 40 160 60 162 80" stroke="#4A0610" stroke-width="1.2" fill="none" opacity=".6"/><path d="M132 22C132 40 134 56 132 70" stroke="#FF7A8A" stroke-width="1.6" fill="none" opacity=".35"/></g>
          ${goldLine("M130 22H174", .8)}${ravenSigil(C, 152, 42, 1.6)}${ravenSigil(C, 152, 42, 1.6, "none")}<circle cx="152" cy="42" r="15" fill="none" stroke="${GOLD}" stroke-width=".9"/>
          ${[180, 124].map(x => `<path d="M${x} 18v6" stroke="${GOLD}" stroke-width=".8"/><circle cx="${x}" cy="25.4" r="1.4" fill="${goldF(C)}"/>`).join("")}` }; },
      { aliases: ["flowers"], replaces: ["cape"] });

    // ================= LEVEL 4 =================
    item("corvin", 4, 0, "stormhelm", "head", "Storm-Crest Helm", "Black steel with gold edges, cheek guards shaped like folded wings, and a crest of storm-black feathers tipped in crimson that streams behind him like smoke.",
      (C) => { const fe = (x, y, a, l, col) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0C-4 -3 -${l * .6} -4 -${l} -1C-${l * .6} 1 -4 2 0 2Z" fill="${C.lin([[0, col], [.7, "#1A1C2A"], [1, "#05060A"]], [1, 0, 0, 0])}" stroke="${INK}" stroke-width=".5"/><path d="M0 1C-${l * .4} -.4 -${l * .7} -.6 -${l} -1" stroke="#5464A0" stroke-width=".5" fill="none" opacity=".6"/></g>`;
        const helm = "M70 50C68 32 82 21 101 21C119 21 131 31 132 46C126 43 114 41 101 41C88 41 77 45 70 50Z";
        const cheek = "M72 50C70 58 72 66 78 72C80 66 82 60 86 56C82 54 78 52 72 50Z";
        const plume = [[92, 23, 186, 44, 4.4], [90, 25, 194, 40, 4], [88, 28, 202, 36, 3.6], [87, 31, 176, 40, 4], [86, 34, 168, 32, 3.4]].map(([x, y, a, l, w]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 -${w * .4}C${l * .3} -${w} ${l * .7} -${w} ${l} 0C${l * .7} ${w * .6} ${l * .3} ${w * .6} 0 ${w * .4}Z" fill="${C.lin([[0, "#14161E"], [.55, "#4A0A14"], [1, "#E8384A"]], [0, 0, 1, 0])}" stroke="${INK}" stroke-width=".55"/><path d="M2 0C${l * .4} -.6 ${l * .7} -.4 ${l - 2} 0" stroke="#FF7A8A" stroke-width=".45" fill="none" opacity=".7"/>${[.3, .45, .6, .75].map(t => `<path d="M${f1(l * t)} 0l3 -${f1(w * .7)}M${f1(l * t)} 0l3 ${f1(w * .5)}" stroke="#05060A" stroke-width=".35" opacity=".6"/>`).join("")}</g>`).join("");
        return { head: `${ink(C, helm, steelK(C, [.2, 0, .8, 1]), INK, { heavy: W.major })}<path d="M80 34C86 27 94 24 102 24" stroke="#A8B4E0" stroke-width="1.6" fill="none" opacity=".6" stroke-linecap="round"/>
          ${ink(C, "M100 20C99 26 99 34 101 41L104 41C103 34 103 26 104 20Z", goldF(C, [0, 0, 1, 0]), "#4A3008", { heavy: .7 })}${plume}
          ${ink(C, "M70 50C77 45 88 41 101 41C114 41 126 43 132 46L132 50C126 47 114 45 101 45C88 45 77 48 70 54Z", goldF(C), "#4A3008", { heavy: 1 })}
          ${ink(C, cheek, steelK(C, [0, 0, 1, 1]), INK, { heavy: 1 })}${[0, 1, 2].map(i => `<path d="M${73 + i * 1.6} ${54 + i * 4}C${76 + i} ${56 + i * 4} ${80} ${58 + i * 3} ${84 - i} ${57 + i * 2}" stroke="${GOLD}" stroke-width=".6" fill="none"/>`).join("")}
          ${ink(C, "M104.6 44.6L109.6 44.6L108.6 56L106.8 58.6L105.6 56Z", steelK(C, [0, 0, 1, 0]), INK, { heavy: 1 })}<path d="M105.6 46L106 55" stroke="${GOLD}" stroke-width=".5"/>
          ${[[80, 47.6], [90, 44.4], [114, 43.8], [124, 45.2]].map(([x, y]) => rivet(x, y, .9)).join("")}` }; },
      { aliases: [], replaces: ["helm"] });
    item("corvin", 4, 1, "stormglaive", "held", "Stormbringer Glaive", "A long glaive forged during a thunderstorm and quenched in the rain. Lightning still crawls along its edge, looking for somewhere to go.",
      (C) => ({ back: `${K.glow(C, 160, 58, 18, "#9AB0FF", .4)}<g transform="translate(146 158) rotate(10) scale(.7)">
          <rect x="-2" y="-138" width="4" height="160" rx="1.6" fill="${C.lin([[0, "#3A3E52"], [.5, "#14161E"], [1, "#06070C"]], [0, 0, 1, 0])}" stroke="#05060A" stroke-width=".7"/>${[-110, -60, -10].map(y => `<rect x="-2.8" y="${y}" width="5.6" height="5" rx="1" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".4"/>`).join("")}${[-100, -90, -80, -70].map(y => `<path d="M-2 ${y}l4 2.4" stroke="${CR}" stroke-width="1"/>`).join("")}
          ${ink(C, "M-2 -136C-6 -146 -6 -160 2 -172C4 -160 12 -150 10 -136C8 -132 4 -130 2 -130Z", steel(C, [0, 0, 1, 0]), "#1A202C", { heavy: W.minor })}<path d="M1 -168C-2 -158 -2 -146 2 -134" stroke="#FFFFFF" stroke-width=".8" fill="none" opacity=".8"/>
          ${ink(C, "M-2 -134C-8 -134 -12 -130 -12 -126L-2 -128Z", steelK(C), INK, { heavy: .8 })}<circle cx="2" cy="-132" r="2.4" fill="${C.rad([[0, "#FFFFFF"], [.5, "#9AB0FF"], [1, "#3A4AA8"]])}" stroke="#1A202C" stroke-width=".4"/>
          ${bolt("M4 -170L8 -160L4 -154L10 -146L6 -138", "a3twinkle", 0)}${bolt("M-4 -160L-9 -150L-5 -146L-10 -138", "a3twinkle", 1)}</g>` }),
      { aliases: ["cape"], replaces: ["sword"] });

    // ================= LEVEL 5 =================
    item("corvin", 5, 0, "undefeatedarmor", "torso", "Armour of the Undefeated", "Obsidian plate inlaid with a gold raven whose wings span his chest, pauldrons forged as layered feathers, and a crimson tabard that has never once been seen from behind.",
      (C) => { const plate = "M82 101Q100 93 118 101C126 118 124 138 117 152Q100 160 83 152C76 138 74 118 82 101Z";
        const tab = "M88 152L112 152L114 198L106 192L100 200L94 192L86 198Z";
        const lame = (y, w) => `M${100 - w} ${y}Q100 ${y + 8} ${100 + w} ${y}L${100 + w - 1.4} ${y + 7}Q100 ${y + 15} ${100 - w + 1.4} ${y + 7}Z`;
        const goldRaven = `<g transform="translate(100 120)"><path d="M0 -6C2 -6 3 -4 3 -2.6C8 -6 16 -6 20 -2C14 -2 8 0 4 2L2 6L0 10L-2 6L-4 2C-8 0 -14 -2 -20 -2C-16 -6 -8 -6 -3 -2.6C-3 -4 -2 -6 0 -6Z" fill="${goldF(C)}" stroke="#4A3008" stroke-width=".5"/>${[-14, -10, -6, 6, 10, 14].map(x => `<path d="M${x} ${-2.4 - (20 - Math.abs(x)) * .1}l${x < 0 ? -1.2 : 1.2} 2.6" stroke="#4A3008" stroke-width=".4"/>`).join("")}<circle cx="1" cy="-3.6" r=".6" fill="${CR}"/></g>`;
        return { body: `${ink(C, tab, crim(C, [0, 0, 1, 1]), "#3A0408", { heavy: W.minor })}<g clip-path="${C.clip(tab)}"><path d="M92 152V196M108 152V196" stroke="#4A0610" stroke-width=".9" opacity=".6"/></g>${goldLine("M88.6 154L86.6 197M111.4 154L113.4 197", .8)}${ravenSigil(C, 100, 176, .9, GOLD)}
          ${ink(C, lame(158, 14), steelK(C), INK, { heavy: W.minor })}${ink(C, lame(150, 16), steelK(C), INK, { heavy: W.minor })}${goldLine("M85 157Q100 164 115 157", .6)}
          ${ink(C, plate, steelK(C, [0, 0, 1, 1]), INK, { heavy: W.minor + .3 })}<path d="${plate}" fill="none" stroke="${GOLD}" stroke-width="1.3" transform="translate(100 126) scale(.9) translate(-100 -126)"/>
          <path d="M86 108Q90 102 97 100" stroke="#B8C4FF" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>${goldRaven}
          ${M.filigree(92, 140, .7, GOLD, .6)}${M.filigree(108, 140, .7, GOLD, .6)}<circle cx="100" cy="143" r="2.6" fill="${C.rad([[0, "#FF9A9A"], [1, "#9A1020"]], { cx: .35, cy: .3 })}" stroke="#4A3008" stroke-width=".6"/>
          ${ink(C, "M84 98Q100 90 116 98L115 104Q100 98 85 104Z", steelK(C, [0, 0, 0, 1]), INK, { heavy: 1 })}${goldLine("M85.4 103Q100 97 114.6 103", .7)}
          <g transform="translate(126 106)">${[0, 1, 2].map(i => ink(C, `M${-8 + i * 2} ${i * 4}C${-6 + i * 2} ${-6 + i * 4} ${8 - i} ${-6 + i * 4} ${10 - i} ${i * 4}C${4} ${-1 + i * 4} ${-2} ${-1 + i * 4} ${-8 + i * 2} ${i * 4}Z`, steelK(C), INK, { heavy: .9 })).join("")}${goldLine("M-8 0C-6 -6 8 -6 10 0", .6)}</g>`,
          arms: (C2, segs, w, side) => side !== "wing" ? "" : `<g>${[[0, 13, 0], [5, 11.4, 1], [10, 9.8, 2]].reverse().map(([dy, r, i]) => `${ink(C2, `M${78 - r} ${104 + dy}C${76 - r * .6} ${94 + dy} ${78 + r * .6} ${92 + dy} ${78 + r} ${102 + dy}L${76 + r * .4} ${110 + dy}C${78} ${106 + dy} ${72} ${106 + dy} ${70 - r * .2} ${112 + dy}Z`, steelK(C2, [0, 0, 1, 1]), INK, { heavy: W.minor })}${goldLine(`M${78 - r + 1} ${103 + dy}C${76 - r * .6} ${95 + dy} ${78 + r * .6} ${93 + dy} ${78 + r - 1} ${102 + dy}`, .6)}`).join("")}
            <path d="M68 100C72 96 78 94 84 95" stroke="#B8C4FF" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/>${ravenSigil(C2, 79, 104, .55, GOLD)}</g>` }; },
      { aliases: ["mantle"], replaces: ARMOR });
    item("corvin", 5, 1, "thousandravens", "back", "Mantle of a Thousand Ravens", "A cloak of black feathers lined in crimson that never quite ends: its edges break apart into living ravens, and where he walks, a storm follows.",
      (C) => { const cl = "M80 96C58 112 40 156 30 206Q100 216 170 206C160 156 142 112 120 96Q100 104 80 96Z";
        const feathers = K.patt(C, 8, 7, `<rect width="8" height="7" fill="#0E1018"/><path d="M0 0Q4 7 8 0" fill="#1C2034" stroke="#05060A" stroke-width=".5"/><path d="M1.6 .6Q4 4.6 6.4 .6" stroke="#5464A0" stroke-width=".35" fill="none" opacity=".6"/>`);
        const ruff = Array.from({ length: 11 }, (_, i) => { const a = (-160 + i * 14) * Math.PI / 180, r = 34 + (i % 2) * 4, x = 100 + Math.cos(a) * r, y = 100 + Math.sin(a) * r * .7;
          return `<path d="M100 98L${f1(x - 3)} ${f1(y)}Q${f1(x)} ${f1(y - 6)} ${f1(x + 3)} ${f1(y)}Z" fill="${C.lin([[0, "#3A4060"], [1, "#0A0B12"]], [0, 1, 0, 0])}" stroke="${INK}" stroke-width=".6"/>`; }).join("");
        return { back: `${K.glow(C, 100, 150, 76, "#6A4AA8", .16)}
          ${bolt("M20 40L30 56L24 62L34 78", "a3twinkle", 0)}
          <g transform="translate(100 0) scale(.86 1) translate(-100 0)">${ruff}
          ${ink(C, cl, "#0E1018", INK, { heavy: W.minor })}<path d="${cl}" fill="${feathers}"/><g clip-path="${C.clip(cl)}"><path d="M30 206C38 170 50 140 64 118L72 120C58 144 46 174 40 206Z" fill="${crim(C)}" opacity=".9"/><path d="M170 206C162 170 150 140 136 118L128 120C142 144 154 174 160 206Z" fill="${crim(C)}" opacity=".9"/><path d="M58 140C50 160 44 180 40 200" stroke="#7A86C8" stroke-width="2" fill="none" opacity=".3" stroke-linecap="round"/></g>
          ${goldLine("M30 206Q100 216 170 206", 1.2)}</g>
          ${[[30, 196, .8, -20], [22, 170, .7, -30], [24, 140, .6, -24], [170, 196, .8, 20], [178, 168, .7, 26], [176, 138, .6, 18], [20, 46, .55, -6]].map(([x, y, s, a], i) => raven(x, y, s * 1.3, a, .92 - (i % 3) * .1, "a3float", i)).join("")}` }; },
      { aliases: ["starcrown"], replaces: ["cape"] });
  });
})();

// ===== Nyx — "Guardian of Gentle Dreams": from sleepy little bat to the keeper of everyone's good dreams =====
// lavender · midnight indigo · moonlight silver · starlight gold · dawn rose
// L1 crescent moon clip · lullaby bell collar      L2 starry nightcap · dream lantern
// L3 starlight nightgown · star-charm wing ribbons      L4 constellation veil · crescent moon halo
// L5 gown of the dreamweaver · dream-bubble aura
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const LAV = "#B8A0E8", IND = "#2A2466", GOLD = "#F2D07A", SIL = "#E8ECFA", ROSE = "#F4A8C8";
  const star = (x, y, r, col = "#FFF4C8", cls = "", i = 0, stroke = "") => `<path${cls ? ` class="${cls}" style="animation-delay:${(i * .37).toFixed(2)}s"` : ""} d="M${f1(x)} ${f1(y - r)}L${f1(x + r * .3)} ${f1(y - r * .3)}L${f1(x + r)} ${f1(y - r * .2)}L${f1(x + r * .45)} ${f1(y + r * .25)}L${f1(x + r * .62)} ${f1(y + r)}L${f1(x)} ${f1(y + r * .55)}L${f1(x - r * .62)} ${f1(y + r)}L${f1(x - r * .45)} ${f1(y + r * .25)}L${f1(x - r)} ${f1(y - r * .2)}L${f1(x - r * .3)} ${f1(y - r * .3)}Z" fill="${col}"${stroke ? ` stroke="${stroke}" stroke-width=".5" stroke-linejoin="round"` : ""}/>`;
  const twinkle = (x, y, r, col = "#FFFFFF", i = 0) => `<path class="a3twinkle" style="animation-delay:${(i * .41).toFixed(2)}s" d="M${f1(x)} ${f1(y - r)}l${f1(r * .25)} ${f1(r * .75)} ${f1(r * .75)} ${f1(r * .25)} -${f1(r * .75)} ${f1(r * .25)} -${f1(r * .25)} ${f1(r * .75)} -${f1(r * .25)} -${f1(r * .75)} -${f1(r * .75)} -${f1(r * .25)} ${f1(r * .75)} -${f1(r * .25)}Z" fill="${col}"/>`;
  const moon = (C, x, y, r, a = 0) => `<path d="M0 ${-r}A${r} ${r} 0 1 0 ${f1(r * .8)} ${f1(r * .6)}A${f1(r * .78)} ${f1(r * .78)} 0 1 1 0 ${-r}Z" transform="translate(${f1(x)} ${f1(y)}) rotate(${a})" fill="${C.lin([[0, "#FFFBE8"], [.6, GOLD], [1, "#C89A3A"]], [0, 0, 1, 1])}" stroke="#8A6A2A" stroke-width=".5"/>`;
  const sheer = (C, col, op = .4) => C.lin([[0, "#FFFFFF", op * .9], [.4, col, op], [1, shd(col, .3), op * 1.2]], [0, 0, 0, 1]);
  K.replaceCollection("nyx", () => {
    const item = K.item;
    // ================= LEVEL 1 =================
    item("nyx", 1, 0, "lavenderclip", "ears", "Lavender Sprig Clip", "A sprig of real lavender, tied with a white ribbon and clipped beside her ear. It smells like the first minute of falling asleep.",
      (C) => { const bud = (x, y, r) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${r}" ry="${f1(r * 1.3)}" fill="${C.lin([[0, "#D8B8FF"], [1, "#7A4AC8"]], [0, 0, 0, 1])}" stroke="#4A2A86" stroke-width=".35"/>`;
        return { head: `<g transform="translate(80 97) rotate(-38) scale(1.35)"><path d="M0 0V-20" stroke="#5A8A4A" stroke-width="1.2"/><path d="M0 -4l-4 -4M0 -6l3.6 -3.6" stroke="#5A8A4A" stroke-width=".8"/>${[[-20, 1.6], [-17, 1.9], [-14, 2.1], [-11, 2.2], [-8, 2.1]].map(([y, r], i) => bud(i % 2 ? 1.4 : -1.4, y, r) + bud(i % 2 ? -1.2 : 1.2, y + 1.4, r * .8)).join("")}${bud(0, -22.6, 1.4)}
          <g transform="translate(0 -2)">${ink(C, "M0 0C-4 -3 -7 -1 -6 1C-7 3 -4 3.4 0 0ZM0 0C4 -3 7 -1 6 1C7 3 4 3.4 0 0Z", "#FFFFFF", "#8A7AA8", { heavy: .5 })}<path d="M0 0l-1.6 5M0 0l1.8 4.6" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/><circle r="1.1" fill="#F0E8FF" stroke="#8A7AA8" stroke-width=".3"/></g></g>` }; },
      { aliases: ["pearls"] });
    item("nyx", 1, 1, "bellcollar", "neck", "Lullaby Bell Collar", "A lavender velvet ribbon with a silver bell that rings so softly only the person falling asleep can hear it.",
      (C) => ({ body: `<path d="M84 158Q100 165 116 158" stroke="#5A3A86" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M84 158Q100 165 116 158" stroke="${M.velvet(C, "#9A7AD8", [0, 0, 1, 0])}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M86 157.4Q100 163.4 114 157.4" stroke="#E8DCFF" stroke-width=".5" fill="none"/>
        <g transform="translate(108.6 160.6)">${ink(C, "M0 0C-4 -3.4 -7 -2 -6 .6C-7 3 -4 3.6 0 0ZM0 0C4 -3.4 7 -2 6 .6C7 3 4 3.6 0 0Z", M.velvet(C, "#9A7AD8"), "#4A2A76", { heavy: .6 })}<circle r="1.1" fill="#8A6AC8"/></g>
        <g transform="translate(100 167) scale(1.45)">${ink(C, "M-3.6 2.6C-3.6 -1.6 -2.4 -4 0 -4C2.4 -4 3.6 -1.6 3.6 2.6L4.4 3.4H-4.4Z", C.lin([[0, "#FFFFFF"], [.5, "#C8D0E4"], [1, "#6A7488"]], [0, 0, 1, 0]), "#3A4254", { heavy: .7 })}<circle cy="4.4" r="1" fill="#6A7488"/><path d="M-2 -2Q-2.4 0 -2.2 2" stroke="#FFFFFF" stroke-width=".7" fill="none"/><circle cy="-4.6" r=".9" fill="none" stroke="#C8D0E4" stroke-width=".6"/></g>` }),
      { aliases: ["scarf"] });

    // ================= LEVEL 2 =================
    item("nyx", 2, 0, "nightcap", "head", "Striped Nightcap", "Soft lavender-and-cream flannel, so long it flops over to one side, with a pompom so fluffy it counts as a second pillow.",
      (C) => { const cap = "M74 97C72 84 82 72 98 70C114 68 132 72 140 86C146 96 150 106 152 116C146 112 142 106 138 100C132 96 126 94 118 94C104 94 88 96 74 97Z";
        return { head: `${ink(C, cap, M.velvet(C, "#B8A0E8", [.1, 0, .9, 1]), "#4A3A86", { heavy: W.minor })}<g clip-path="${C.clip(cap)}">${[0, 1, 2, 3, 4, 5].map(i => `<path d="M${66 + i * 16} 60C${76 + i * 16} 80 ${86 + i * 14} 100 ${92 + i * 14} 120" stroke="#FFF6EA" stroke-width="5.4" fill="none" opacity=".85"/>`).join("")}<path d="M84 80C92 74 102 72 112 72" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/><path d="M128 84C136 92 142 102 146 110" stroke="#4A3A86" stroke-width="1" fill="none" opacity=".5"/></g>
          ${ink(C, "M72 97C88 94 104 92 120 93C128 93 134 96 138 99L137 104C130 101 122 99 112 99C98 99 86 101 74 104Z", C.lin([[0, "#FFFFFF"], [.6, "#F4ECFF"], [1, "#C8B8E0"]], [0, 0, 0, 1]), "#6A5A8A", { heavy: .9 })}${[78, 86, 94, 102, 110, 118, 126, 132].map(x => `<path d="M${x} ${f1(102 - (x - 72) * .02)}q1.2 2 2.6 0" stroke="#C8B8E0" stroke-width=".6" fill="none"/>`).join("")}
          <g transform="translate(152 118)">${M.fluff(C, [[-4, 0], [0, -3], [4, 0], [0, 3], [-4, 0]], 5, "#FFFFFF", "#F4C8E0")}</g>` }; },
      { aliases: ["bow", "beret"] });
    item("nyx", 2, 1, "dreamlantern", "back", "Firefly Night-Jar", "A little glass jar of sleepy fireflies on a ribbon handle. It floats after her through the dark, glowing a bit brighter whenever she feels brave.",
      (C) => ({ back: `<g class="a3float"><path d="M152 72C150 80 152 86 154 90M164 72C166 80 164 86 162 90" stroke="${ROSE}" stroke-width="1.2" fill="none"/><path d="M152 72Q158 66 164 72" stroke="${ROSE}" stroke-width="1.2" fill="none"/>${K.glow(C, 158, 108, 22, "#D8FF8A", .45)}
          ${ink(C, "M150 92C148 92 147 94 148 96C145 100 144 108 144 114C144 122 148 126 158 126C168 126 172 122 172 114C172 108 171 100 168 96C169 94 168 92 166 92Z", C.rad([[0, "#F4FFE0", .55], [.7, "#C8E8F0", .35], [1, "#8AB0C8", .55]], { cx: .45, cy: .45 }), "#6A8AA8", { heavy: .9 })}
          <rect x="149" y="88" width="18" height="5" rx="1.6" fill="${C.lin([[0, "#E8C890"], [1, "#9A7A4A"]], [0, 0, 0, 1])}" stroke="#6A4A2A" stroke-width=".6"/><path d="M147 100C146 108 146 116 148 122" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".7" stroke-linecap="round"/>
          ${[[154, 106], [162, 112], [158, 118], [165, 102], [151, 116]].map(([x, y], i) => `<g class="a3twinkle" style="animation-delay:${i * .45}s"><circle cx="${x}" cy="${y}" r="2.4" fill="#EAFF9A" opacity=".55"/><circle cx="${x}" cy="${y}" r="1" fill="#FFFFE0"/></g>`).join("")}
          <path d="M150 90q-6 2 -8 8M166 90q6 2 7 8" stroke="${ROSE}" stroke-width=".9" fill="none"/></g>` }),
      { aliases: ["wizhat"] });
    // ================= LEVEL 3 =================
    item("nyx", 3, 0, "nightgown", "torso", "Starlight Nightgown", "Soft lavender cotton embroidered with tiny white daisies, a ruffled hem and a pink satin bow. It's the most comfortable thing in the world, and she knows it.",
      (C) => { const gown = "M86 156C82 164 78 176 76 188C74 196 72 202 70 205Q86 209 100 207Q114 209 130 205C128 202 126 196 124 188C122 176 118 164 114 156Q100 160 86 156Z";
        const embr = K.patt(C, 9, 9, `<g transform="translate(2.4 2.4)">${[0, 72, 144, 216, 288].map(a => `<ellipse rx=".7" ry="1.1" transform="rotate(${a}) translate(0 -1)" fill="#FFFFFF" opacity=".85"/>`).join("")}<circle r=".55" fill="#F4C8E0"/></g><circle cx="7" cy="7" r=".6" fill="#F4C8E0" opacity=".8"/>`);
        return { dress: `${ink(C, gown, C.lin([[0, "#E8DCFF"], [.5, LAV], [1, "#7A62B8"]], [0, 0, 1, 1]), "#4A3A86", { heavy: W.minor })}<path d="${gown}" fill="${embr}"/><g clip-path="${C.clip(gown)}">${K.folds({ prof: { cx: 100, pts: [[180, 22], [206, 30]] } }, 180, 208, 5, "#4A3A86", .4, 1.1)}<path d="M84 166C80 178 78 190 76 200" stroke="#FFFFFF" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/></g>
          ${M.scallops(70, 130, 205, 10, 3, "#6A5AA8", "#F4EEFF", .6)}<path d="M86 156Q100 161 114 156" stroke="#FFFFFF" stroke-width="1.2" fill="none" stroke-dasharray=".4 1.4"/>
          <g transform="translate(112 170)">${ink(C, "M0 0C-5 -4 -9 -2 -8 1C-9 4 -5 4 0 0ZM0 0C5 -4 9 -2 8 1C9 4 5 4 0 0Z", C.lin([[0, "#FFD0E2"], [1, "#E07AA4"]], [0, 0, 1, 1]), "#8A3A60", { heavy: .7 })}<path d="M0 0l-2 7M0 0l2.4 6.4" stroke="#E07AA4" stroke-width="1.4" stroke-linecap="round"/><circle r="1.4" fill="#F09ABA" stroke="#8A3A60" stroke-width=".4"/></g>` }; },
      { aliases: ["flowers"] });
    item("nyx", 3, 1, "wingribbons", "arms", "Charm Wing Ribbons", "Pink satin bows tied at her wrists, with tiny charms on silk threads from her wing-tips: a heart, a silver bell and a clover leaf. They chime when she flutters, very quietly.",
      (C) => ({ arms: (C2, g, w, side) => { if (side !== "wing" || !g || !g.Wr) return ""; const { Wr, F } = g;
        return `<g transform="translate(${f1(Wr[0])} ${f1(Wr[1])})">${ink(C2, "M0 0C-6 -5 -10 -2 -9 1C-10 4 -6 4 0 0ZM0 0C6 -5 10 -2 9 1C10 4 6 4 0 0Z", C2.lin([[0, "#FFD0E2"], [1, "#E07AA4"]], [0, 0, 1, 1]), "#8A3A60", { heavy: .7 })}<path d="M0 0l-3 8M0 0l3 7" stroke="#E07AA4" stroke-width="1.4" stroke-linecap="round"/><circle r="1.6" fill="#F09ABA" stroke="#8A3A60" stroke-width=".4"/></g>
          ${F.map(([x, y], i) => { const l = Math.max(2, Math.min(6 + i * 2, 210 - y)); return `<path d="M${f1(x)} ${f1(y)}v${f1(l)}" stroke="#E8ECFA" stroke-width=".4"/>${[`<path d="M0 3C-3 .6 -3.4 -1.8 -1.6 -2C-.6 -2 0 -1.4 0 -.8C0 -1.4 .6 -2 1.6 -2C3.4 -1.8 3 .6 0 3Z" fill="#F07AA4" stroke="#8A3A60" stroke-width=".35"/>`, `<path d="M-2 1.4C-2 -1.4 -1.2 -2.6 0 -2.6C1.2 -2.6 2 -1.4 2 1.4L2.4 2H-2.4Z" fill="#E8ECFA" stroke="#6A7488" stroke-width=".4"/><circle cy="2.6" r=".6" fill="#6A7488"/>`, `<path d="M0 -2.6C1.6 -1 1.6 1 0 2.6C-1.6 1 -1.6 -1 0 -2.6Z" fill="#B8E8C8" stroke="#3A8A5A" stroke-width=".35"/>`][i % 3].replace(/^/, `<g transform="translate(${f1(x)} ${f1(y + l + 2.6)}) scale(${f1(1.1 - i * .1)})">`) + "</g>"}`; }).join("")}`; } }),
      { aliases: [] });

    // ================= LEVEL 4 =================
    item("nyx", 4, 0, "dreamveil", "head", "Moth-Wing Dream Veil", "Lilac gauze embroidered with pale dream-moths, held by a wreath of tiny white flowers. It drifts behind her to the ground, and now and then a moth flutters off it.",
      (C) => { const veilBack = "M76 92C60 110 50 150 44 208Q100 216 156 208C150 150 140 110 124 92Z";
        const moth = (x, y, s, a = 0, op = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${s})" opacity="${op}"><path d="M0 0C-3 -5 -9 -6 -10 -2C-10 2 -5 2 0 1ZM0 0C3 -5 9 -6 10 -2C10 2 5 2 0 1ZM0 1C-2 3 -6 6 -7 4C-7 2 -3 1 0 1ZM0 1C2 3 6 6 7 4C7 2 3 1 0 1Z" fill="${C.lin([[0, "#FFFFFF"], [1, "#D8C8F4"]], [0, 0, 0, 1])}" stroke="#8A7AB8" stroke-width=".5"/><circle cx="-5.4" cy="-2.4" r="1.1" fill="#C8A8F0"/><circle cx="5.4" cy="-2.4" r="1.1" fill="#C8A8F0"/><path d="M0 -2V3" stroke="#6A5A8A" stroke-width="1"/><path d="M0 -2l-1.6 -2.6M0 -2l1.6 -2.6" stroke="#6A5A8A" stroke-width=".4"/></g>`;
        const flower = (x, y, c) => `<g transform="translate(${f1(x)} ${f1(y)})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="1.2" ry="1.9" transform="rotate(${a}) translate(0 -1.6)" fill="${c}" stroke="#B8A8D8" stroke-width=".3"/>`).join("")}<circle r=".9" fill="#F8D870"/></g>`;
        return { back: `<path d="${veilBack}" fill="${sheer(C, "#B8A0E8", .45)}" stroke="#C8B8F0" stroke-width=".7"/><g clip-path="${C.clip(veilBack)}">${moth(62, 156, .7, -20, .85)}${moth(138, 172, .6, 16, .85)}${moth(70, 196, .5, 10, .8)}<path d="M66 120C58 150 54 180 52 206M134 120C142 150 146 180 148 206" stroke="#FFFFFF" stroke-width="1.2" fill="none" opacity=".35"/></g>${M.scallops(44, 156, 208, 14, 2, "#C8B8F0", "none", .6)}
            <g class="a3float">${moth(40, 112, .8, -24)}</g>`,
          head: `<path d="M72 98C70 84 82 74 100 73C118 74 130 84 128 98C126 108 128 120 134 132C124 124 118 112 116 102Q100 98 84 102C82 112 76 124 66 132C72 120 74 108 72 98Z" fill="${sheer(C, "#C8B0F0", .3)}" stroke="#C8B8F0" stroke-width=".6"/>
            ${[74, 80, 87, 94, 100, 106, 113, 120, 126].map((x, i) => flower(x, 98 - Math.sin((x - 72) / 56 * Math.PI) * 4.6, i % 3 === 1 ? "#F4D8EC" : "#FFFFFF")).join("")}${moth(100, 89, .5, 0)}` }; },
      { aliases: [] });
    item("nyx", 4, 1, "dreamcloud", "back", "Drowsy Dream Cloud", "A cloud so soft it can hold a whole nap. It follows her everywhere, carrying a sleeping lamb and the end of a rainbow, and it hums lullabies when she's tired.",
      (C) => { const cl = "M30 92C22 92 18 82 24 76C22 66 32 60 40 64C44 54 58 52 64 60C70 50 86 50 90 60C98 54 110 56 112 64C120 58 134 60 136 70C146 68 152 78 146 86C152 92 148 102 140 100C134 108 122 106 118 100L42 100C36 104 28 100 30 92Z";
        return { back: `${K.glow(C, 86, 82, 56, "#FFFFFF", .22)}
          ${["#F4A0B0", "#F8D090", "#F8F0A0", "#B0E8B8", "#A8D0F4", "#C8B0F0"].map((c, i) => `<path d="M136 ${88 + i * 2.6}C150 ${70 + i * 2.6} 170 ${70 + i * 2.6} 182 ${92 + i * 2.6}" stroke="${c}" stroke-width="2.6" fill="none" opacity=".8"/>`).join("")}
          ${ink(C, cl, C.lin([[0, "#FFFFFF"], [.7, "#F0ECFF"], [1, "#C8C0E8"]], [0, 0, 0, 1]), "#9A90C8", { heavy: W.minor })}<path d="M34 80C40 70 52 66 60 68M70 62C80 56 88 58 92 62" stroke="#FFFFFF" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M42 98C70 102 104 102 138 98" stroke="#B8B0E0" stroke-width="1.2" fill="none" opacity=".7"/>
          <g transform="translate(58 58)">${M.fluff(C, [[-8, 0], [-4, -4], [2, -4], [7, -1], [6, 3], [-6, 3], [-8, 0]], 6, "#FFFFFF", "#F0E8E0")}<ellipse cx="10" cy="-1" rx="3.4" ry="2.8" fill="#4A3A5A"/><path d="M8.6 -1.4q1 .8 2 0" stroke="#FFFFFF" stroke-width=".5" fill="none"/><ellipse cx="8" cy="-3.4" rx="1.6" ry=".8" fill="#4A3A5A" transform="rotate(-30 8 -3.4)"/><path d="M-4 4v2.6M2 4v2.6" stroke="#4A3A5A" stroke-width="1.2" stroke-linecap="round"/></g>
          <text x="70" y="44" font-size="6" font-family="Georgia,serif" font-style="italic" fill="#E8ECFA" class="a3float">z</text><text x="76" y="36" font-size="4.6" font-family="Georgia,serif" font-style="italic" fill="#E8ECFA" class="a3float" style="animation-delay:.7s">z</text>` }; },
      { aliases: ["cape"] });
    // ================= LEVEL 5 =================
    item("nyx", 5, 0, "dreamweavergown", "torso", "Gown of the Dreamweaver", "Layer upon layer of sheer night, deepening from dawn rose to midnight, with a train of stardust that spills across the floor. Wherever it touches, someone sleeps a little better.",
      (C) => { const tier = (y0, w0, y1, w1, n, c0, c1, op) => { const step = 2 * w1 / n; let hem = ""; for (let i = 0; i < n; i++) hem += `Q${f1(100 - w1 + step * (i + .5))} ${f1(y1 + 4)} ${f1(100 - w1 + step * (i + 1))} ${f1(y1)}`;
            const d = `M${100 - w0} ${y0}C${100 - w0 - 4} ${y0 + (y1 - y0) * .5} ${100 - w1 + 2} ${y1 - 6} ${100 - w1} ${y1}${hem}C${100 + w1 - 2} ${y1 - 6} ${100 + w0 + 4} ${y0 + (y1 - y0) * .5} ${100 + w0} ${y0}Z`;
            return `<path d="${d}" fill="${C.lin([[0, c0, op], [1, c1, Math.min(1, op + .1)]], [0, 0, 0, 1])}" stroke="${shd(c1, .3)}" stroke-width=".6"/>`; };
        const train = "M70 196C50 200 26 204 10 210Q100 218 190 210C174 204 150 200 130 196Z";
        const nebula = C.rad([[0, "#F4A8C8", .5], [.5, "#8A6AD8", .3], [1, "#2A2466", 0]], { cx: .5, cy: .5 });
        return { far: `${K.glow(C, 100, 200, 70, "#B8A0FF", .2)}<path d="${train}" fill="${C.lin([[0, "#3A2A8A", .8], [.6, "#6A4AB0", .6], [1, "#F4A8C8", .5]], [0, 0, 0, 1])}" stroke="#AAB8FF" stroke-width=".6"/>${[[24, 208], [44, 204], [66, 210], [134, 210], [156, 204], [178, 208], [100, 214]].map(([x, y], i) => twinkle(x, y, 1.8, i % 2 ? "#FFF4C8" : "#FFFFFF", i)).join("")}`,
          dress: `${tier(156, 14, 207, 46, 11, IND, "#4A3AA0", .95)}<ellipse cx="94" cy="192" rx="26" ry="11" fill="${nebula}"/>${tier(158, 14, 201, 38, 9, "#6A5AC8", "#9A7AE0", .62)}${tier(160, 14, 193, 30, 8, "#F4C8E0", ROSE, .48)}${[[66, 202], [134, 202], [74, 194], [128, 194]].map(([x, y], i) => twinkle(x, y, 1.4, "#FFFFFF", i + 7)).join("")}
            ${[[84, 176], [90, 196], [108, 184], [116, 198], [80, 192], [100, 170], [120, 176]].map(([x, y], i) => twinkle(x, y, 1.5, i % 2 ? "#FFF4C8" : "#FFFFFF", i + 3)).join("")}
            <path d="M86 157Q100 163 114 157" stroke="${GOLD}" stroke-width="1.6" fill="none"/><path d="M86 157Q100 163 114 157" stroke="#FFFFFF" stroke-width=".5" fill="none" stroke-dasharray=".3 1.6"/>${moon(C, 100, 161, 3.4, 20)}`,
          arms: (C2, g, w, side) => { if (side !== "wing" || !g || !g.Wr) return ""; const { S, Wr } = g, mx = (S[0] + Wr[0]) / 2, my = Math.min(S[1], Wr[1]) - 6;
            const d = `M${S[0]} ${S[1] - 2}Q${f1(mx)} ${f1(my - 2)} ${f1(Wr[0])} ${f1(Wr[1] - 2)}C${f1(Wr[0] - 2)} ${f1(Wr[1] + 14)} ${f1(Wr[0] + 8)} ${f1(Wr[1] + 30)} ${f1(Wr[0] + 14)} ${f1(Wr[1] + 36)}C${f1(S[0] - 6)} ${S[1] + 24} ${S[0]} ${S[1] + 12} ${S[0] + 2} ${S[1] + 4}Z`;
            return `<path d="${d}" fill="${C2.lin([[0, "#FFE0F0", .55], [.5, "#C8A8F4", .45], [1, "#6A5AC8", .55]], [0, 0, 0, 1])}" stroke="#E8DCFF" stroke-width=".6"/><path d="M${f1(Wr[0] + 2)} ${f1(Wr[1] + 10)}C${f1(Wr[0] + 6)} ${f1(Wr[1] + 22)} ${f1(Wr[0] + 10)} ${f1(Wr[1] + 30)} ${f1(Wr[0] + 14)} ${f1(Wr[1] + 34)}" stroke="#FFFFFF" stroke-width=".7" fill="none" opacity=".6"/>${twinkle(Wr[0] + 8, Wr[1] + 20, 1.4, "#FFF4C8", 2)}${twinkle((S[0] + Wr[0]) / 2, S[1] + 6, 1.2, "#FFFFFF", 5)}<path d="M${S[0]} ${S[1] - 2}Q${f1(mx)} ${f1(my - 2)} ${f1(Wr[0])} ${f1(Wr[1] - 2)}" stroke="${GOLD}" stroke-width=".9" fill="none"/>`; } }; },
      { aliases: ["mantle"] });
    item("nyx", 5, 1, "dreamaura", "back", "Dream-Bubble Aura", "A ring of drifting dreams, each in its own shining bubble: a moon, a sheep, a book, a heart, a cloud and a little boat. She guards every one of them until morning.",
      (C) => { const icons = {
          moon: c => moon(c, 0, 0, 4.4, -20), heart: () => `<path d="M0 3.6C-4 0 -4.6 -3.4 -2 -3.6C-.8 -3.6 0 -2.6 0 -1.8C0 -2.6 .8 -3.6 2 -3.6C4.6 -3.4 4 0 0 3.6Z" fill="#F07AA4"/>`,
          sheep: () => `<g><circle cx="-1" cy="0" r="3.2" fill="#FFFFFF"/><circle cx="1.6" cy="-1" r="2.4" fill="#FFFFFF"/><circle cx="2.8" cy="0" r="1.6" fill="#4A3A5A"/><path d="M-2 3v1.6M1 3v1.6" stroke="#4A3A5A" stroke-width=".7"/></g>`,
          book: () => `<path d="M0 -2C-2 -3 -4 -3 -4.6 -2.4V3C-4 2.4 -2 2.4 0 3.4C2 2.4 4 2.4 4.6 3V-2.4C4 -3 2 -3 0 -2Z" fill="#FFF4E0" stroke="#B8986A" stroke-width=".4"/>`,
          cloud: () => `<path d="M-4.6 2C-5.6 0 -3.6 -2 -2 -1C-1.4 -3.4 2 -3.6 2.6 -1.4C4.6 -1.8 5.6 .6 4.4 2Z" fill="#FFFFFF"/>`,
          boat: () => `<path d="M-4.6 1H4.6L3 3.4H-3Z" fill="#E8A060"/><path d="M0 1V-4L3.4 .4Z" fill="#FFFFFF"/>` };
        const ring = [["moon", 34, 118, 9], ["sheep", 40, 76, 10], ["book", 62, 42, 9.4], ["heart", 100, 28, 10.4], ["cloud", 138, 42, 9.4], ["boat", 160, 76, 10], ["moon", 166, 118, 8]];
        const bubble = ([ic, x, y, r], i) => `<g class="a3float" style="animation-delay:${(i * .55).toFixed(2)}s"><g transform="translate(${x} ${y})"><circle r="${r}" fill="${C.rad([[0, "#FFFFFF", .08], [.75, "#C8B8FF", .22], [.92, "#F4A8C8", .45], [1, "#AAE0FF", .6]], { cx: .5, cy: .5 })}" stroke="#E8ECFA" stroke-width=".6"/><g transform="scale(${f1(r / 8)})">${icons[ic](C)}</g><path d="M${f1(-r * .6)} ${f1(-r * .3)}A${f1(r * .7)} ${f1(r * .7)} 0 0 1 ${f1(-r * .2)} ${f1(-r * .66)}" stroke="#FFFFFF" stroke-width="1" fill="none" stroke-linecap="round" opacity=".85"/></g></g>`;
        const aurora = "M24 140C24 70 60 22 100 22C140 22 176 70 176 140";
        return { back: `${K.glow(C, 100, 80, 80, "#B8A0FF", .2)}<path d="${aurora}" stroke="${C.lin([[0, "#7AE0C8", .0], [.3, "#7AE0C8", .35], [.6, "#B8A0FF", .4], [1, "#F4A8C8", .0]], [0, 0, 1, 0])}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="${aurora}" stroke="#E8ECFA" stroke-width=".6" fill="none" opacity=".6" stroke-dasharray="2 4"/>
          ${ring.map(bubble).join("")}${[[22, 96], [52, 56], [82, 30], [118, 30], [148, 56], [178, 96], [100, 50]].map(([x, y], i) => '<g data-fine="1">' + twinkle(x, y, 1.6, "#FFF4C8", i) + '</g>').join("")}` }; },
      { aliases: ["starcrown"] });
  });
})();

// ===== Bramble — "Discoverer of Imaginary Worlds": a small hedgehog with a very large sense of adventure =====
// khaki · forest green · map parchment · brass · sky blue · sunset gold
// L1 maps in the quills · brass compass pendant      L2 explorer's field vest · brass spyglass
// L3 explorer's pith helmet · grand expedition pack      L4 pocket hot-air balloon · cartographer's greatcoat
// L5 the doorway to elsewhere · star-compass of all worlds
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const KHAKI = "#C8A868", FOREST = "#2E5A3A", GOLD = "#E2B04A";
  const brass = (C, a) => M.brass(C, a);
  const parch = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#FFF8E6"], [.6, "#EEDDB8"], [1, "#C8A878"]], a);
  const mapP = C => K.patt(C, 12, 12, `<rect width="12" height="12" fill="#F2E4C0"/><path d="M0 4Q3 2 6 4T12 4M0 9Q3 7 6 9T12 9" stroke="#8AB0C8" stroke-width=".4" fill="none"/><path d="M2 1L4 3M8 6l1.6 1.6" stroke="#C0303A" stroke-width=".4" stroke-dasharray=".6 .5"/><circle cx="9" cy="2" r=".7" fill="#5A9A5A"/>`);
  const scroll = (C, x, y, a, l = 18, col = "#F2E4C0") => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a})"><rect x="-2.6" y="${-l}" width="5.2" height="${l}" rx="2.4" fill="${parch(C, [0, 0, 1, 0])}" stroke="#8A6A3A" stroke-width=".6"/><ellipse cx="0" cy="${-l}" rx="2.6" ry="1.2" fill="#E8D4A8" stroke="#8A6A3A" stroke-width=".5"/><path d="M-2.6 ${-l * .45}h5.2" stroke="#C0303A" stroke-width="1"/></g>`;
  const badge = (C, x, y, kind) => { const icons = {
      dragon: `<path d="M-2.4 1.6C-2 -1 0 -2.4 2 -1.6L2.6 -3L3 -1C3.6 0 3 1.6 1.6 2Z" fill="#3A8A4A"/>`, moon: `<path d="M0 -2.6A2.6 2.6 0 1 0 2 1.6A2 2 0 1 1 0 -2.6Z" fill="#F2D07A"/>`,
      castle: `<path d="M-2.6 2.4V-1H-1.6V-2.4H-.6V-1H.6V-2.4H1.6V-1H2.6V2.4Z" fill="#8A7AB8"/>`, wave: `<path d="M-2.8 .6Q-1.4 -1.4 0 .6T2.8 .6" stroke="#3A8AC8" stroke-width=".9" fill="none"/>` };
    return `<g transform="translate(${f1(x)} ${f1(y)})"><circle r="3.6" fill="#F4ECD8" stroke="#6A4A2A" stroke-width=".6"/><circle r="3" fill="none" stroke="${GOLD}" stroke-width=".4"/>${icons[kind]}</g>`; };
  const sleeve = (segs, w, t1 = .8) => ART3.tube(ART3.subSegs(segs, 0, t1), w.slice(0, -1).map(v => v * 1.18));
  K.replaceCollection("bramble", () => {
    const item = K.item;
    // ================= LEVEL 1 =================
    item("bramble", 1, 0, "quillmaps", "back", "Maps in the Quills", "Why carry a map case when you are a map case? Three rolled maps, a quill pen and a tiny paper flag, tucked into his spines.",
      (C) => ({ back: `${scroll(C, 64, 106, -48, 22)}${scroll(C, 136, 102, 44, 20, "#E8F0DC")}${scroll(C, 144, 122, 58, 16)}
          <g transform="translate(70 120) rotate(-62)"><path d="M0 0C-1.6 -8 -1.4 -16 0 -24C1.6 -16 1.6 -8 .6 0Z" fill="#FFFFFF" stroke="#8A7A6A" stroke-width=".4"/><path d="M.3 0V-23" stroke="#B8AE9A" stroke-width=".35"/></g>
          <g transform="translate(116 96) rotate(16)"><path d="M0 0V-22" stroke="#6A4A2A" stroke-width="1.2"/><path d="M0 -22L11 -19L0 -15Z" fill="#E8483A" stroke="#7A1A10" stroke-width=".5"/><path d="M2 -19.4h4" stroke="#FFF4E0" stroke-width=".6"/></g>` }),
      { aliases: ["bow"], replaces: [] });
    item("bramble", 1, 1, "compasspendant", "neck", "Brass Compass Pendant", "His very first compass. It doesn't point north. It points to wherever the next adventure is, which is usually north.",
      (C) => ({ body: `<path d="M86 156Q100 172 114 156" stroke="#6A4A2A" stroke-width="1" fill="none"/>
        <g transform="translate(100 168)"><circle r="6.6" fill="${brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".9"/><circle r="5" fill="${C.rad([[0, "#FFFFFF"], [1, "#E8E0CC"]], { cx: .4, cy: .35 })}" stroke="#6A4A10" stroke-width=".4"/>
          ${[0, 90, 180, 270].map(a => `<path d="M0 -4.4V-3.4" transform="rotate(${a})" stroke="#3A2A1A" stroke-width=".6"/>`).join("")}<path d="M0 -3.8L1 0L0 3.8L-1 0Z" fill="#C0303A"/><path d="M0 0L1 0L0 3.8L-1 0Z" fill="#3A3A4A"/><circle r=".6" fill="${GOLD}"/>
          <circle cy="-7.4" r="1.4" fill="none" stroke="${brass(C)}" stroke-width=".8"/><path d="M-3.4 -3.4Q-2 -4.6 0 -4.8" stroke="#FFFFFF" stroke-width=".7" fill="none" opacity=".8"/></g>` }),
      { aliases: ["scarf"] });

    // ================= LEVEL 2 =================
    item("bramble", 2, 0, "fieldvest", "torso", "Explorer's Field Vest", "Khaki canvas with eleven pockets and a badge from every world he has visited: a dragon's peak, the moon, a cloud castle and the Singing Sea.",
      (C) => { const v = s => { const m = x => 100 + s * (x - 100); return `M${m(99)} 160C${m(92)} 158 ${m(86)} 160 ${m(83)} 166C${m(80)} 176 ${m(80)} 188 ${m(84)} 198L${m(99)} 200Z`; };
        const can = s => C.lin([[0, "#E8D4A0"], [.5, KHAKI], [1, "#7A6030"]], [s < 0 ? 0 : 1, 0, s < 0 ? 1 : 0, 1]);
        const pocket = (x, y, w, h) => `<g transform="translate(${x} ${y})">${ink(C, `M${-w / 2} 0H${w / 2}V${h}H${-w / 2}Z`, C.lin([[0, "#D8C08A"], [1, "#9A7A44"]], [0, 0, 0, 1]), "#5A4020", { heavy: .6 })}<path d="M${-w / 2 - .3} -.3H${w / 2 + .3}V${h * .4}H${-w / 2 - .3}Z" fill="#B89A5A" stroke="#5A4020" stroke-width=".5"/><circle cy="${h * .36}" r=".6" fill="${GOLD}"/></g>`;
        return { body: `${[-1, 1].map(s => `${ink(C, v(s), can(s), "#5A4020", { heavy: W.minor })}${M.stitch(`M${100 + s * -15} 167C${100 + s * -18} 177 ${100 + s * -18} 188 ${100 + s * -15} 196`, "#FFF4D8", .4)}`).join("")}
          ${pocket(90, 180, 7, 7)}${pocket(110, 180, 7, 7)}${pocket(91, 190, 6, 5)}${pocket(109.4, 190, 6, 5)}
          ${badge(C, 90, 168, "dragon")}${badge(C, 110, 168, "moon")}${badge(C, 84.6, 175, "castle")}${badge(C, 115.4, 175, "wave")}
          <path d="M108 178V171l.8 -1.2.8 1.2V178" fill="#3A6AC8" stroke="#1A2A6A" stroke-width=".3"/><path d="M111.4 178V172" stroke="#C0303A" stroke-width="1.2" stroke-linecap="round"/>` }; },
      { aliases: ["beret"], replaces: [] });
    item("bramble", 2, 1, "spyglass", "held", "Brass Spyglass", "Three brass sections and a lens that can see all the way to the edge of the map, and a little bit past it.",
      (C) => ({ held: (C2, e, ang) => `<g class="w-held" transform="translate(${f1(e[0])} ${f1(e[1])}) rotate(-32)">
          <rect x="-4" y="-3.6" width="10" height="7.2" rx="1.6" fill="${C2.lin([[0, "#6A3A1E"], [1, "#3A1E0A"]], [0, 0, 0, 1])}" stroke="#1A0A04" stroke-width=".6"/>${M.stitch("M-3 -2.4H5M-3 2.4H5", "#C89A60", .35)}
          <rect x="6" y="-3.2" width="11" height="6.4" rx="1" fill="${brass(C2, [0, 0, 0, 1])}" stroke="#3A2006" stroke-width=".6"/><rect x="16" y="-2.6" width="9" height="5.2" rx="1" fill="${brass(C2, [0, 0, 0, 1])}" stroke="#3A2006" stroke-width=".6"/><rect x="24" y="-2.1" width="7" height="4.2" rx=".8" fill="${brass(C2, [0, 0, 0, 1])}" stroke="#3A2006" stroke-width=".5"/>
          <ellipse cx="31" cy="0" rx="1.2" ry="2.6" fill="${C2.rad([[0, "#FFFFFF"], [.6, "#9AD0F0"], [1, "#3A78A8"]], { cx: .4, cy: .3 })}" stroke="#3A2006" stroke-width=".5"/>
          <path d="M7 -2.2H16M17 -1.8H24" stroke="#FFF4C8" stroke-width=".6"/><rect x="-6" y="-2.6" width="2.4" height="5.2" rx=".8" fill="${brass(C2)}" stroke="#3A2006" stroke-width=".5"/></g>` }),
      { aliases: ["pearls"] });

    // ================= LEVEL 3 =================
    item("bramble", 3, 0, "pithhelmet", "head", "Explorer's Pith Helmet", "A proper explorer's helmet with a red silk band, a brass badge, a feather from a bird no one else has seen, and three tiny flags from three impossible places.",
      (C) => ({ head: `<g transform="rotate(-7 100 96)">
          ${ink(C, "M54 100C60 92 140 92 146 100C148 106 134 108 100 108C66 108 52 106 54 100Z", C.lin([[0, "#FFF0C8"], [.5, "#E6D0A0"], [1, "#A88A5A"]], [0, 0, 0, 1]), "#5A4020", { heavy: W.minor })}
          ${ink(C, "M70 99C68 76 82 62 100 62C118 62 132 76 130 99C118 101 82 101 70 99Z", C.vol("#F2E2B8", { hi: .35, lo: .3 }), "#5A4020", { heavy: W.minor })}
          ${[-12, 0, 12].map(t => `<path d="M${100 + t} 63C${100 + t * 1.6} 74 ${100 + t * 2.2} 86 ${100 + t * 2.4} 99" stroke="#C8B080" stroke-width=".7" fill="none"/>`).join("")}<ellipse cx="100" cy="62.6" rx="3.4" ry="1.6" fill="#D8C090" stroke="#5A4020" stroke-width=".5"/>
          <path d="M71 92C82 95 118 95 129 92L129.6 98.6C118 101 82 101 70.4 98.6Z" fill="${C.lin([[0, "#E8584A"], [1, "#8A1A10"]], [0, 0, 0, 1])}" stroke="#5A0A06" stroke-width=".6"/>
          <g transform="translate(100 95.6)"><circle r="3.2" fill="${brass(C, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".5"/><path d="M0 -2L.6 0L0 2L-.6 0Z" fill="#C0303A"/></g>
          <path d="M80 72C86 66 94 64 100 64" stroke="#FFFFFF" stroke-width="1.4" fill="none" opacity=".7" stroke-linecap="round"/>
          <path d="M124 94C132 78 144 70 158 66C150 76 140 86 126 97Z" fill="${C.lin([[0, "#FF7AC0"], [.5, "#8A4AE0"], [1, "#2A8AE0"]], [0, 0, 1, 1])}" stroke="#3A1A6A" stroke-width=".7"/><path d="M126 95C134 84 144 76 156 68" stroke="#FFFFFF" stroke-width=".5" fill="none"/>
          ${[[78, 92, -20, "#3A8AC8"], [84, 90, -10, "#F2C040"], [90, 89, -2, "#5AB05A"]].map(([x, y, a, c]) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0V-10" stroke="#6A4A2A" stroke-width=".6"/><path d="M0 -10L5 -8.6L0 -7Z" fill="${c}" stroke="#3A2A1A" stroke-width=".3"/></g>`).join("")}</g>` }),
      { aliases: ["wizhat"] });
    item("bramble", 3, 1, "expeditionpack", "back", "Grand Expedition Pack", "Bigger than he is, and packed for every world: a bedroll, a lantern, a frying pan for space pancakes, rolled maps and a flag to plant at the end.",
      (C) => { const can = C.lin([[0, "#7AA06A"], [.5, "#4A7A4A"], [1, "#22442A"]], [0, 0, 1, 1]);
        return { back: `<g transform="translate(100 120) scale(.84) translate(-100 -120)">${ink(C, "M64 92C64 82 76 76 100 76C124 76 136 82 136 92L140 176C140 186 60 186 60 176Z", can, "#14281A", { heavy: W.minor })}
            ${ink(C, "M66 74C62 70 62 62 68 60H132C138 62 138 70 134 74Z", C.lin([[0, "#E86A4A"], [1, "#8A2A1A"]], [0, 0, 0, 1]), "#4A1006", { heavy: W.minor })}${[76, 90, 110, 124].map(x => `<path d="M${x} 61V73" stroke="#5A1A10" stroke-width=".7" opacity=".6"/>`).join("")}<path d="M66 66H134" stroke="#FFB0A0" stroke-width=".8" opacity=".5"/>
            ${scroll(C, 70, 72, -16, 20)}${scroll(C, 78, 70, -6, 16, "#E8F0DC")}
            <g transform="translate(126 70) rotate(10)"><path d="M0 0V-34" stroke="#6A4A2A" stroke-width="1.4"/><path d="M0 -34L16 -30L12 -25L16 -20L0 -18Z" fill="#E8B83A" stroke="#7A5A10" stroke-width=".6"/><path d="M4 -27l3 -1.6 1 2.6-2.6 1.4Z" fill="#C0303A"/></g>
            <g transform="translate(144 136)">${K.glow(C, 0, 2, 10, "#FFD870", .5)}<path d="M-4 -8h8l-1 2H-3Z" fill="${brass(C)}" stroke="#3A2006" stroke-width=".5"/><rect x="-5" y="-6" width="10" height="13" rx="2" fill="${C.rad([[0, "#FFFBE0"], [.5, "#FFE070", .8], [1, "#E8901A", .7]])}" stroke="#3A2006" stroke-width=".7"/><path d="M-5 -2H5M-5 3H5" stroke="${brass(C)}" stroke-width=".8"/><circle cy="-10" r="1.8" fill="none" stroke="${brass(C)}" stroke-width=".8"/></g>
            <g transform="translate(54 140) rotate(-20)"><circle r="8" fill="${C.rad([[0, "#5A5A62"], [1, "#1A1A1E"]], { cx: .4, cy: .35 })}" stroke="#0A0A0E" stroke-width=".8"/><circle r="6.4" fill="none" stroke="#3A3A42" stroke-width=".6"/><rect x="-1.6" y="7" width="3.2" height="12" rx="1.2" fill="#6A3A1E" stroke="#2A1206" stroke-width=".5"/></g>
            <path d="M62 176Q100 184 138 176" stroke="#14281A" stroke-width="1" fill="none"/>${[[86, 120], [114, 120]].map(([x, y]) => `<rect x="${x - 6}" y="${y}" width="12" height="16" rx="2" fill="${C.lin([[0, "#6A9A5A"], [1, "#2A4A2A"]], [0, 0, 0, 1])}" stroke="#14281A" stroke-width=".7"/><circle cx="${x}" cy="${y + 5}" r=".8" fill="${GOLD}"/>`).join("")}</g>`,
          body: `<path d="M84 160C82 168 82 176 84 184M116 160C118 168 118 176 116 184" stroke="#14281A" stroke-width="3.6" fill="none" stroke-linecap="round"/><path d="M84 160C82 168 82 176 84 184M116 160C118 168 118 176 116 184" stroke="${M.leather(C, "#6A4A2A")}" stroke-width="2.4" fill="none" stroke-linecap="round"/>${[[83.4, 172], [116.6, 172]].map(([x, y]) => `<rect x="${x - 2}" y="${y - 1.8}" width="4" height="3.6" rx=".6" fill="none" stroke="${brass(C)}" stroke-width=".9"/>`).join("")}` }; },
      { aliases: ["flowers"], replaces: ["satchel"] });

    // ================= LEVEL 4 =================
    item("bramble", 4, 0, "pocketballoon", "back", "Pocket Hot-Air Balloon", "Folds into a backpack, unfolds into the sky. Striped silk, a wicker trim and ropes tied in knots only he knows. Altitude: as high as he dares.",
      (C) => { const env = "M100 4C76 4 62 20 62 40C62 56 74 68 84 78L116 78C126 68 138 56 138 40C138 20 124 4 100 4Z";
        const stripes = ["#E84A3A", "#F8E0A0", "#3A8AC8", "#F8E0A0", "#E84A3A", "#F8E0A0", "#3A8AC8"];
        return { back: `<g transform="translate(10 12) scale(.9)"><g class="a3float">${ink(C, env, "#F8E0A0", "#6A3A1A", { heavy: W.minor })}<g clip-path="${C.clip(env)}">${stripes.map((c, i) => { const x0 = 62 + i * (76 / 7); return `<path d="M${f1(x0)} 0C${f1(x0 + 2 - (i - 3) * 2)} 30 ${f1(84 + i * 4.6)} 60 ${f1(84 + i * 4.6)} 80L${f1(84 + (i + 1) * 4.6)} 80C${f1(84 + (i + 1) * 4.6)} 60 ${f1(x0 + 76 / 7 + 2 - (i - 3) * 2)} 30 ${f1(x0 + 76 / 7)} 0Z" fill="${c}"/>`; }).join("")}
              <path d="M70 26C72 16 80 10 90 8" stroke="#FFFFFF" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/><path d="M62 40C76 46 124 46 138 40" stroke="#6A3A1A" stroke-width=".8" fill="none" opacity=".5"/></g>
            ${ink(C, "M84 76H116L114 82H86Z", C.lin([[0, "#C8925A"], [1, "#6A4020"]], [0, 0, 0, 1]), "#3A2010", { heavy: .9 })}${[88, 94, 100, 106, 112].map(x => `<path d="M${x} 76.6L${x - 1} 81.4" stroke="#3A2010" stroke-width=".5"/>`).join("")}
            <path d="M86 82L80 116M114 82L120 116M94 82L92 112M106 82L108 112" stroke="#6A4A2A" stroke-width=".8"/>
            ${[[60, 26], [144, 34], [100, 0]].map(([x, y], i) => `<path class="a3twinkle" style="animation-delay:${i * .5}s" d="M${x} ${y - 2}l.5 1.5 1.5 .5 -1.5 .5 -.5 1.5 -.5 -1.5 -1.5 -.5 1.5 -.5Z" fill="#FFF4C8"/>`).join("").replace("M100 -2", "M100 2")}</g></g>
          <path d="M80 116C70 122 66 132 66 140M120 116C130 122 134 132 134 140" stroke="${M.leather(C, "#6A4A2A")}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` }; },
      { aliases: ["cape"], replaces: [] });
    item("bramble", 4, 1, "greatcoat", "torso", "Cartographer's Greatcoat", "Forest-green wool down to his ankles, lined with a map of everywhere he hasn't been yet. The lining redraws itself every night.",
      (C) => { const pL = "M100 158C90 156 84 160 82 168C80 178 79 190 78 204L94 205C95 192 97 176 100 162Z";
        const wool = s => C.lin([[0, "#5A8A5A"], [.4, FOREST], [1, "#12281A"]], [s < 0 ? 0 : 1, 0, s < 0 ? 1 : 0, 1]);
        const panel = s => { const m = x => 100 + s * (x - 100); const d = `M${m(100)} 158C${m(90)} 156 ${m(84)} 160 ${m(82)} 168C${m(80)} 178 ${m(79)} 190 ${m(76)} 205L${m(94)} 206C${m(95)} 192 ${m(97)} 176 ${m(100)} 162Z`, lin = `M${m(100)} 162C${m(97)} 176 ${m(95)} 192 ${m(94)} 206L${m(90)} 206C${m(92)} 190 ${m(94)} 176 ${m(97)} 160Z`;
          return `${ink(C, d, wool(s), "#0A1A10", { heavy: W.minor })}<path d="${lin}" fill="${mapP(C)}" stroke="#6A5434" stroke-width=".5"/>${[170, 180, 190].map(y => `<circle cx="${m(91 - (y - 170) * .1)}" cy="${y}" r="1.1" fill="${brass(C)}" stroke="#3A2006" stroke-width=".3"/>`).join("")}<path d="M${m(81)} 186h7" stroke="#0A1A10" stroke-width=".8"/>`; };
        return { back: `${ink(C, "M62 152C56 170 52 190 50 206L150 206C148 190 144 170 138 152Z", C.lin([[0, "#3A6A44"], [1, "#0E2014"]], [0, 0, 1, 1]), "#0A1A10", { heavy: W.minor })}<path d="M50 206L150 206" stroke="${GOLD}" stroke-width="1"/>`,
          body: `${panel(-1)}${panel(1)}${ink(C, "M82 160C86 154 94 152 100 156C106 152 114 154 118 160C114 164 106 164 100 162C94 164 86 164 82 160Z", C.lin([[0, "#E8D4B0"], [1, "#8A6A4A"]], [0, 0, 0, 1]), "#4A3020", { heavy: .9 })}${[86, 92, 100, 108, 114].map(x => `<path d="M${x} 157q1 3 0 5" stroke="#B89A7A" stroke-width=".6" fill="none"/>`).join("")}`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = sleeve(segs, w, .78), [x, y, a] = M.along(segs, .78);
            return `${ink(C2, d, C2.lin([[0, "#5A8A5A"], [.5, FOREST], [1, "#12281A"]], [0, 0, 1, 1]), "#0A1A10", { heavy: W.minor })}<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><path d="M-2 -6Q-3 0 -2 6L2 6Q1 0 2 -6Z" fill="${mapP(C2)}" stroke="#6A5434" stroke-width=".6"/><circle cy="0" r=".9" fill="${brass(C2)}"/></g>`; } }; },
      { aliases: [], replaces: [] });

    // ================= LEVEL 5 =================
    item("bramble", 5, 0, "doorway", "back", "The Doorway to Elsewhere", "He found it at the back of a wardrobe at the end of a map at the bottom of a dream. It goes wherever he decides is next: floating islands, a castle in the clouds, a whale that swims through the sky.",
      (C) => { const arch = "M40 210V80C40 40 66 14 100 14C134 14 160 40 160 80V210Z", inner = "M50 210V82C50 48 72 24 100 24C128 24 150 48 150 82V210Z";
        const sky = C.lin([[0, "#3A6AD8"], [.45, "#8AC0F8"], [.75, "#FFD8A0"], [1, "#FFA87A"]], [0, 0, 0, 1]);
        const island = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-14 0C-10 -4 10 -4 14 0C10 2 6 10 0 14C-6 10 -10 2 -14 0Z" fill="${C.lin([[0, "#8A6A4A"], [1, "#3A2A1A"]], [0, 0, 0, 1])}"/><path d="M-14 0C-10 -4 10 -4 14 0C8 -1 -8 -1 -14 0Z" fill="#6AC06A"/><path d="M-6 -2V-8M-6 -8C-9 -8 -9 -12 -6 -12C-3 -12 -3 -8 -6 -8Z" stroke="#4A3A2A" stroke-width=".6" fill="#4AA05A"/><path d="M4 0V6" stroke="#9AD8FF" stroke-width=".8" opacity=".8"/></g>`;
        const castle = `<g transform="translate(118 74)"><path d="M-12 8H12V-4H8V-10H4V-4H-4V-14H-8V-4H-12Z" fill="#F4ECFF" stroke="#8A7AB8" stroke-width=".5"/><path d="M-8 -14L-6 -20L-4 -14ZM4 -10L6 -16L8 -10Z" fill="#B87AD8"/><path d="M-14 8C-16 4 -10 2 -6 4C-4 0 4 0 6 4C10 2 16 4 14 8Z" fill="#FFFFFF"/></g>`;
        const whale = `<g transform="translate(76 52)"><path d="M-12 0C-12 -6 -4 -8 4 -6C8 -5 10 -3 12 -6L14 -9L14 -2C14 4 6 6 -2 6C-8 6 -12 4 -12 0Z" fill="#4A7AC8" stroke="#1A3A7A" stroke-width=".5"/><path d="M-10 2C-4 5 4 5 10 2" stroke="#BFE0FF" stroke-width=".8" fill="none"/><circle cx="-6" cy="-1" r=".8" fill="#0A1A3A"/><path d="M-4 -8q0 -4 2 -4M-4 -8q-2 -3 -1 -5" stroke="#BFE0FF" stroke-width=".6" fill="none"/></g>`;
        const rainbow = ["#E84A3A", "#F8A83A", "#F8E04A", "#5AC05A", "#3A8AE0", "#8A5AD8"].map((c, i) => `<path d="M54 ${150 + i * 2.4}C70 ${110 + i * 2.4} 130 ${110 + i * 2.4} 146 ${150 + i * 2.4}" stroke="${c}" stroke-width="2.4" fill="none" opacity=".75"/>`).join("");
        return { far: `${K.glow(C, 100, 110, 90, "#FFE8A0", .3)}${ink(C, arch, C.lin([[0, "#E8C890"], [.4, "#B8864A"], [1, "#5A3A1A"]], [0, 0, 1, 1]), "#3A2010", { heavy: W.minor })}
            ${[[44, 196], [44, 160], [44, 124], [52, 70], [100, 18], [148, 70], [156, 124], [156, 160], [156, 196]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${brass(C)}" stroke="#3A2006" stroke-width=".4"/>`).join("")}
            <path d="${inner}" fill="${sky}"/><g clip-path="${C.clip(inner)}">${rainbow}${island(74, 104, 1)}${island(132, 132, .8)}${castle}${whale}
              ${[[60, 40], [140, 34], [96, 40], [66, 70], [124, 50]].map(([x, y], i) => `<path data-fine="1" class="a3twinkle" style="animation-delay:${i * .4}s" d="M${x} ${y - 2}l.5 1.5 1.5 .5 -1.5 .5 -.5 1.5 -.5 -1.5 -1.5 -.5 1.5 -.5Z" fill="#FFFFFF"/>`).join("")}
              <path d="M50 176C70 168 130 168 150 176V210H50Z" fill="#8AD08A"/><path d="M50 182C80 176 120 176 150 182" stroke="#5AA05A" stroke-width="1" fill="none"/>${[[60, 188, "#F07AA4"], [76, 194, "#F8E04A"], [124, 192, "#B87AD8"], [140, 186, "#F07AA4"]].map(([x, y, c]) => `<circle data-fine="1" cx="${x}" cy="${y}" r="1.6" fill="${c}"/>`).join("")}</g>
            <path d="${inner}" fill="${C.rad([[0, "#1A1030", .42], [.55, "#1A1030", .2], [1, "#1A1030", 0]], { cx: .5, cy: .66, r: .5 })}"/><path d="${inner}" fill="none" stroke="#FFF4D8" stroke-width="1" opacity=".7"/>
            <g transform="translate(160 120)">${ink(C, "M0 -86C10 -84 18 -78 22 -70L22 86C18 88 10 90 0 90Z", C.lin([[0, "#8A5A2A"], [1, "#3A2010"]], [0, 0, 1, 0]), "#2A1406", { heavy: W.minor })}<circle cx="16" cy="10" r="2.4" fill="${brass(C)}" stroke="#3A2006" stroke-width=".5"/></g>` }; },
      { aliases: ["starcrown"] });
    item("bramble", 5, 1, "starcompass", "held", "Star-Compass of All Worlds", "A golden compass inside three spinning rings, its needle a sliver of starlight. Hold it up and a beam points the way to any world you can imagine.",
      (C) => ({ held: (C2, e) => `<g class="w-held" transform="translate(${f1(e[0])} ${f1(e[1] - 8)})">
          <path d="M0 0L40 -60L52 -50Z" fill="${C2.lin([[0, "#FFF4C8", .7], [1, "#FFF4C8", 0]], [0, 1, 1, 0])}"/>${K.glow(C2, 0, 0, 16, "#FFE070", .6)}
          <ellipse rx="11" ry="4" fill="none" stroke="${brass(C2)}" stroke-width="1.1" transform="rotate(-30)"/><ellipse rx="11" ry="4" fill="none" stroke="${brass(C2)}" stroke-width="1.1" transform="rotate(40)"/><ellipse rx="4" ry="11" fill="none" stroke="#E8C870" stroke-width=".8"/>
          <circle r="6.4" fill="${brass(C2, [0, 0, 1, 1])}" stroke="#3A2006" stroke-width=".7"/><circle r="5" fill="${C2.rad([[0, "#1A2A5A"], [1, "#0A0E24"]])}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M0 -4.4V-3.6" transform="rotate(${a})" stroke="#FFF4C8" stroke-width=".5"/>`).join("")}
          <path d="M0 -4.2L.9 0L0 4.2L-.9 0Z" fill="#FFF4C8" transform="rotate(35)"/><circle r=".9" fill="${GOLD}"/>
          ${[[14, -8], [-12, -10], [10, 10], [-10, 8]].map(([x, y], i) => `<path class="a3twinkle" style="animation-delay:${i * .4}s" d="M${x} ${y - 1.8}l.45 1.35 1.35 .45 -1.35 .45 -.45 1.35 -.45 -1.35 -1.35 -.45 1.35 -.45Z" fill="#FFF4C8"/>`).join("")}</g>` }),
      { aliases: ["mantle"] });
  });
})();

// ===== Wulfila — "Queen of Eternal Night": a gothic wolf who rules the dark through what she wears, not a crown =====
// black velvet · black lace · deep violet · silver · moonlight
// L1 bat & safety-pin ear cuffs · crescent o-ring choker      L2 lace & fishnet arm warmers · platform buckle boots
// L3 velvet corset & tulle skirt · black lace parasol      L4 raven-feather shrug · bat-wing cape
// L5 gown of eternal night · moonlit cathedral veil
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const VIO = "#6A2AA8", VIOL = "#B070F0", SIL = "#D8D8E8", BLK = "#0C0A12";
  const MIR = `transform="translate(200 0) scale(-1 1)"`;
  const silver = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#FFFFFF"], [.4, "#C8C8D8"], [.8, "#6A6A7A"], [1, "#3A3A48"]], a);
  const velvetK = (C, a = [0, 0, 1, 1]) => C.lin([[0, "#3E3A4C"], [.35, "#1C1A24"], [.8, "#0A0910"], [1, "#040308"]], a);
  const moonC = (C, x, y, r, a = 0) => `<path d="M0 ${-r}A${r} ${r} 0 1 0 ${f1(r * .8)} ${f1(r * .6)}A${f1(r * .78)} ${f1(r * .78)} 0 1 1 0 ${-r}Z" transform="translate(${f1(x)} ${f1(y)}) rotate(${a})" fill="${silver(C)}" stroke="#3A3A48" stroke-width=".4"/>`;
  const bat = (x, y, s, col = BLK) => `<path d="M0 0C-2 -2 -4 -3 -7 -2.6C-6 -1.6 -6 -.6 -6.6 .4C-5 0 -4 .4 -3.4 1.4C-2.4 .6 -1 .8 0 2C1 .8 2.4 .6 3.4 1.4C4 .4 5 0 6.6 .4C6 -.6 6 -1.6 7 -2.6C4 -3 2 -2 0 0ZM-1 -.6L-1.4 -2.4L-.4 -1.2ZM1 -.6L1.4 -2.4L.4 -1.2Z" transform="translate(${f1(x)} ${f1(y)}) scale(${s})" fill="${col}"/>`;
  const rose = (C, x, y, r, a = 0) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${r / 6})">${ink(C, "M0 6C-6 6 -7 1 -6 -3C-3 -6.4 3 -6.4 6 -3C7 1 6 6 0 6Z", C.rad([[0, "#5A4A6A"], [.6, "#1A1622"], [1, "#06040A"]], { cx: .4, cy: .35 }), "#000", { heavy: .8 })}<path d="M-2 -2C0 -4.4 3 -3.4 2.6 -1C2.4 1.4 -1 2 -1.6 0M-4.4 1.4C-2 4 3 4 4.4 .6" stroke="#6A5A7A" stroke-width=".7" fill="none"/></g>`;
  const lacePat = (C, col = "#4E4860") => K.patt(C, 5, 5, `<circle cx="2.5" cy="2.5" r="1.5" fill="none" stroke="${col}" stroke-width=".5"/><circle cx="0" cy="0" r=".7" fill="${col}"/><circle cx="5" cy="5" r=".7" fill="${col}"/><path d="M2.5 0V1M2.5 4V5M0 2.5H1M4 2.5H5" stroke="${col}" stroke-width=".4"/>`);
  const net = C => K.patt(C, 2.6, 2.6, `<path d="M0 0L2.6 2.6M2.6 0L0 2.6" stroke="#06050A" stroke-width=".45"/>`);
  const lacehem = (x0, x1, y, n, d, col = "#1A1622") => { const st = (x1 - x0) / n; let p = `M${f1(x0)} ${f1(y)}`; for (let i = 0; i < n; i++) p += `Q${f1(x0 + st * (i + .5))} ${f1(y + d)} ${f1(x0 + st * (i + 1))} ${f1(y)}`; return `<path d="${p}" stroke="${col}" stroke-width=".8" fill="none"/>${Array.from({ length: n }, (_, i) => `<circle cx="${f1(x0 + st * (i + .5))}" cy="${f1(y + d * .55)}" r=".7" fill="none" stroke="${col}" stroke-width=".4"/>`).join("")}`; };
  K.replaceCollection("wulfila", () => {
    const item = K.item;
    // ================= LEVEL 1 =================
    item("wulfila", 1, 0, "batcuffs", "ears", "Bat & Safety-Pin Ear Cuffs", "A silver cuff with a dangling bat on one ear, a row of safety pins on the other. Her mother hates them, which is half the point.",
      (C) => ({ head: `<path d="M71 51C68 48 68 43 71 41" stroke="#3A3A48" stroke-width="2.6" fill="none"/><path d="M71 51C68 48 68 43 71 41" stroke="${SIL}" stroke-width="1.8" fill="none"/><path d="M71 50C69 48 69 44 71 42" stroke="#FFFFFF" stroke-width=".5" fill="none"/><path d="M70 50V55" stroke="${SIL}" stroke-width=".5"/>${bat(70, 58, 1)}<circle cx="70" cy="56" r=".6" fill="${VIOL}"/>
        ${[[128.6, 34], [129.4, 38.4]].map(([x, y]) => `<g transform="translate(${x} ${y}) rotate(-70)"><path d="M0 0h6.4" stroke="${SIL}" stroke-width=".8" stroke-linecap="round"/><path d="M0 1.4h5.6" stroke="${SIL}" stroke-width=".7"/><circle cx="6.6" cy=".7" r="1.1" fill="none" stroke="${SIL}" stroke-width=".7"/><rect x="-1.6" y="-.3" width="1.8" height="2.2" rx=".4" fill="#B8B8C8"/></g>`).join("")}` }),
      { aliases: ["beret"] });
    item("wulfila", 1, 1, "moonchoker", "neck", "Crescent O-Ring Choker", "Black velvet, a silver O-ring, and a crescent moon on a short chain. The moon is the only one allowed to watch over her.",
      (C) => ({ body: `${ink(C, "M84 103Q100 110 116 103L116 108.6Q100 115.6 84 108.6Z", M.velvet(C, "#2A2634", [0, 0, 0, 1]), "#000", { heavy: .8 })}<path d="M85 104.6Q100 111.4 115 104.6" stroke="#6A6280" stroke-width=".5" fill="none" opacity=".7"/>
        <circle cx="100" cy="112.4" r="3" fill="none" stroke="#3A3A48" stroke-width="2"/><circle cx="100" cy="112.4" r="3" fill="none" stroke="${silver(C)}" stroke-width="1.3"/>
        <path d="M100 115.4V119M100 119l-.8 1.4M100 119l.8 1.4" stroke="${SIL}" stroke-width=".6"/>${moonC(C, 100, 124, 3.6, -30)}<circle cx="99" cy="123.4" r=".8" fill="${VIOL}"/>
        ${[88, 112].map(x => `<path d="M${x} ${f1(106.8 + (x === 88 ? 1 : 1))}l0 3" stroke="${SIL}" stroke-width=".5"/>`).join("")}` }),
      { aliases: ["bow", "scarf"], replaces: ["choker"] });

    // ================= LEVEL 2 =================
    item("wulfila", 2, 0, "lacewarmers", "arms", "Lace & Fishnet Arm Warmers", "Fishnet from elbow to wrist, finished with a frill of black lace and fingerless gloves. Three silver rings, one with a tiny amethyst skull.",
      (C) => ({ arms: (C2, segs, w) => { if (!segs) return ""; const sub = ART3.subSegs(segs, .45, .92), d = ART3.tube(sub, [w[1] * 1.12, w[w.length - 1] * 1.14]);
          const [cx, cy, ca] = M.along(segs, .47), [gx, gy, ga] = M.along(segs, .9);
          return `<path d="${d}" fill="${C2.lin([[0, "#A8A6B8"], [1, "#6A6878"]], [0, 0, 1, 0])}"/><path d="${d}" fill="${net(C2)}"/><path d="${d}" fill="none" stroke="#06050A" stroke-width=".9"/>
            <g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(ca)})"><path d="M-1.6 -7Q-3.6 -3.5 -1.6 0Q-3.6 3.5 -1.6 7L1.6 7L1.6 -7Z" fill="${BLK}"/>${lacehem(-7, 7, -1.6, 5, -2.6, "#1A1622").replace(/<path/g, '<path transform="rotate(90)"').replace(/<circle/g, '<circle transform="rotate(90)"')}<path d="M1.6 -7V7" stroke="${VIOL}" stroke-width="1.2"/></g>
            <g transform="translate(${f1(gx)} ${f1(gy)}) rotate(${f1(ga)})"><path d="M-2.6 -5.6Q-4 0 -2.6 5.6L1.6 5.4Q.6 0 1.6 -5.4Z" fill="${BLK}" stroke="#000" stroke-width=".6"/><path d="M-2.6 -5.6Q-4 0 -2.6 5.6" stroke="#4A4458" stroke-width=".5" fill="none" stroke-dasharray="1 .8"/></g>`; } }),
      { aliases: ["pearls"] });
    item("wulfila", 2, 1, "platformboots", "feet", "Platform Buckle Boots", "Five centimetres of platform, seven buckles, violet laces and steel toecaps. She is still the shortest in her friend group. She will not discuss it.",
      (C) => { const boot = x => `${ink(C, `M${x - 7.4} 186L${x + 6.6} 186L${x + 7.4} 203C${x + 10} 204 ${x + 10} 208 ${x + 8} 209L${x - 9} 209C${x - 10} 209 ${x - 10} 204 ${x - 7.4} 203Z`, C.lin([[0, "#4A4656"], [.5, "#1A1822"], [1, "#06050A"]], [0, 0, 1, 1]), "#000", { heavy: W.minor })}
          ${ink(C, `M${x - 10} 208H${x + 10}L${x + 10.4} 213.6C${x + 10.4} 215 ${x - 10.4} 215 ${x - 10.4} 213.6Z`, C.lin([[0, "#3A3846"], [1, "#0A0910"]], [0, 0, 0, 1]), "#000", { heavy: 1 })}${[0, 1, 2, 3].map(i => `<path d="M${x - 10 + i * 6.6} 214.6V209" stroke="#4A4656" stroke-width=".6"/>`).join("")}
          ${[189.6, 194.2, 198.8].map(y => `<path d="M${x - 7.6} ${y}H${x + 7}" stroke="#2A2632" stroke-width="2.6"/><rect x="${x - 2}" y="${y - 1.8}" width="4" height="3.6" rx=".5" fill="none" stroke="${silver(C)}" stroke-width=".9"/>`).join("")}
          <path d="M${x + 3} 187L${x + 5} 190M${x + 5} 187L${x + 3} 190M${x + 3.4} 192l2 2.6M${x + 5.4} 192l-2 2.6" stroke="${VIOL}" stroke-width=".7"/><path d="M${x - 6} 188C${x - 6.4} 194 ${x - 6} 200 ${x - 5} 204" stroke="#6A6478" stroke-width="1" fill="none" opacity=".6"/>
          <path d="M${x + 4} 204C${x + 8} 204 ${x + 9} 206 ${x + 8.6} 208.4" stroke="${silver(C)}" stroke-width="1.4" fill="none"/>`;
        return { body: boot(93) + boot(109) }; },
      { aliases: ["wizhat"] });

    // ================= LEVEL 3 =================
    item("wulfila", 3, 0, "corsetskirt", "torso", "Velvet Corset & Tulle Skirt", "A black velvet corset laced in violet over a mesh top, and three layers of tulle with a violet petticoat underneath. A silver chain belt holds a crescent moon.",
      (C) => { const corset = "M84 132C82 124 84 116 88 112Q100 116 112 112C116 116 118 124 116 132L118 152C112 156 88 156 82 152Z";
        const mesh = "M84 104C76 108 74 122 76 136L84 152L116 152L124 136C126 122 124 108 116 104C110 108 90 108 84 104Z";
        const sk = (w, y, n, col, op) => { const st = 2 * w / n; let h = ""; for (let i = 0; i < n; i++) h += `Q${f1(100 - w + st * (i + .5))} ${f1(y + 3.4)} ${f1(100 - w + st * (i + 1))} ${f1(y)}`;
          return `M82 150C${100 - w + 6} ${y - 30} ${100 - w} ${y - 10} ${100 - w} ${y}${h}C${100 + w} ${y - 10} ${100 + w - 6} ${y - 30} 118 150Z`; };
        return { body: `<path d="${mesh}" fill="#1A1822"/><path d="${mesh}" fill="${net(C)}"/><path d="${mesh}" fill="none" stroke="#000" stroke-width="1"/>
            <path d="${sk(28, 192, 9, "", 1)}" fill="${C.lin([[0, "#9A4AE0"], [1, "#4A1A80"]], [0, 0, 0, 1])}" stroke="#2A0A4A" stroke-width=".7"/>
            <path d="${sk(26, 188, 8, "", 1)}" fill="${C.lin([[0, "#2A2634", .92], [1, "#0A0910", .9]], [0, 0, 0, 1])}" stroke="#000" stroke-width=".7"/>
            <path d="${sk(22, 182, 7, "", 1)}" fill="${C.lin([[0, "#3A3446", .7], [1, "#14121A", .75]], [0, 0, 0, 1])}" stroke="#000" stroke-width=".6"/>
            <path d="M84 160C80 170 76 180 74 188M116 160C120 170 124 180 126 188" stroke="#5A5468" stroke-width=".8" fill="none" opacity=".6"/>
            ${ink(C, corset, velvetK(C, [0, 0, 1, 1]), "#000", { heavy: W.minor })}<g clip-path="${C.clip(corset)}">${[90, 95, 105, 110].map(x => `<path d="M${x} 112V156" stroke="#3A3446" stroke-width=".7"/>`).join("")}<path d="M86 116C85 128 85 140 86 150" stroke="#6A6280" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/></g>
            ${[118, 124, 130, 136, 142, 148].map(y => `<path d="M98 ${y}L102 ${y + 4}M102 ${y}L98 ${y + 4}" stroke="${VIOL}" stroke-width=".8"/><circle cx="98" cy="${y}" r=".6" fill="${SIL}"/><circle cx="102" cy="${y}" r=".6" fill="${SIL}"/>`).join("")}
            <path d="M88 112Q100 116 112 112" stroke="${VIO}" stroke-width="1.2" fill="none"/>${lacehem(88, 112, 112.6, 6, 2.4, "#1A1622")}
            <path d="M82 156Q100 164 118 156" stroke="${SIL}" stroke-width="1.1" fill="none" stroke-dasharray="1.6 .8"/>${moonC(C, 112, 163, 3.4, -20)}` }; },
      { aliases: ["flowers"], replaces: ["jumper"] });
    item("wulfila", 3, 1, "laceparasol", "back", "Black Lace Parasol", "For keeping the sun off. She has never once needed it for that. It's for being looked at, and for looking unimpressed.",
      (C) => { const can = "M126 34C140 20 166 18 182 30C186 34 186 38 184 42Q178 40 174 44Q168 40 162 46Q156 42 150 48Q144 44 138 50Q132 46 128 50C124 44 122 38 126 34Z";
        return { back: `<path d="M118 120L154 40" stroke="#06050A" stroke-width="2.4" stroke-linecap="round"/><path d="M118 120L154 40" stroke="${silver(C)}" stroke-width="1.2" stroke-linecap="round"/>
          ${ink(C, can, C.lin([[0, "#6A3AA0", .7], [.5, "#2A1A40", .85], [1, "#06050A", .95]], [0, 0, 1, 1]), "#000", { heavy: W.minor })}<path d="${can}" fill="${lacePat(C, "#8A80A0")}" opacity=".9"/>
          ${[[128, 50], [138, 50], [150, 48], [162, 46], [174, 44], [184, 42]].map(([x, y]) => `<path d="M154 26L${x} ${y}" stroke="#2A2632" stroke-width=".7"/>`).join("")}
          ${lacehem(128, 184, 47, 9, 3, "#06050A")}<path d="M150 28C158 24 168 24 176 28" stroke="#6A6280" stroke-width="1.2" fill="none" opacity=".6" stroke-linecap="round"/>
          <path d="M154 26V20" stroke="${silver(C)}" stroke-width="1"/><circle cx="154" cy="19" r="1.4" fill="${silver(C)}"/>${bat(176, 38, .5, VIOL)}` }; },
      { aliases: [] });

    // ================= LEVEL 4 =================
    item("wulfila", 4, 0, "feathershrug", "neck", "Raven-Feather Shrug", "A collar of glossy black feathers that rises around her shoulders like a dark halo, fastened with a silver crescent. Nobody stands too close.",
      (C) => { const fe = (x, y, a, l, w, i) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><path d="M0 0C${w} ${-l * .3} ${w} ${-l * .7} 0 ${-l}C${-w} ${-l * .7} ${-w} ${-l * .3} 0 0Z" fill="${C.lin([[0, "#3A3A5A"], [.6, "#14121E"], [1, "#04030A"]], [0, 1, 0, 0])}" stroke="#000" stroke-width=".55"/><path d="M0 -1V${f1(-l + 2)}" stroke="#6A6A9A" stroke-width=".45"/>${i % 3 === 0 ? `<path d="M${f1(w * .3)} ${f1(-l * .5)}l${f1(w * .5)} -2" stroke="${VIOL}" stroke-width=".5" opacity=".7"/>` : ""}</g>`;
        const row = (n, r0, l, w, y0) => Array.from({ length: n }, (_, i) => { const t = i / (n - 1), a = -100 + t * 200, rad = (a - 90) * Math.PI / 180;
          return fe(100 + Math.cos(rad) * r0 * 1.2, y0 + Math.sin(rad) * r0 * .7 + 8, a * .9, l * (1 - Math.abs(t - .5) * .5), w, i); }).join("");
        return { back: row(13, 22, 34, 4.4, 112), body: `${row(9, 18, 14, 3.2, 120)}<g transform="translate(100 114)">${moonC(C, 0, 0, 4.4, -30)}<circle r="1.4" cx="-1" fill="${VIOL}"/></g>` }; },
      { aliases: [], replaces: ["choker"] });
    item("wulfila", 4, 1, "batwingcape", "back", "Bat-Wing Cape", "Black velvet cut into the scalloped edge of a bat's wing, lined in violet satin, with a high collar that frames her face. It moves like it is listening.",
      (C) => { const cape = "M86 102C68 118 52 150 36 172Q48 170 54 178Q62 170 72 180Q80 172 90 186Q100 178 110 186Q120 172 128 180Q138 170 146 178Q152 170 164 172C148 150 132 118 114 102Q100 110 86 102Z";
        const lin = "M86 104C70 120 56 148 44 168Q50 168 54 172Q62 166 70 174C76 152 82 128 92 108Z";
        const collar = "M100 106C90 104 80 98 74 86C70 78 70 70 72 64C78 74 86 82 96 88C98 92 100 98 100 102Z";
        return { back: `${ink(C, cape, velvetK(C, [0, 0, 1, 1]), "#000", { heavy: W.minor })}<path d="${lin}" fill="${M.satin(C, VIO, [0, 0, 1, 1])}" opacity=".9"/><g ${MIR}><path d="${lin}" fill="${M.satin(C, VIO, [0, 0, 1, 1])}" opacity=".9"/></g>
            <g clip-path="${C.clip(cape)}">${[[60, 120, 40, 172], [80, 112, 72, 180], [120, 112, 128, 180], [140, 120, 160, 172]].map(([x0, y0, x1, y1]) => `<path d="M${x0} ${y0}Q${(x0 + x1) / 2} ${(y0 + y1) / 2 + 4} ${x1} ${y1}" stroke="#2A2632" stroke-width="1.6" fill="none"/>`).join("")}<path d="M74 120C62 140 52 156 44 168" stroke="#6A6280" stroke-width="1.6" fill="none" opacity=".35" stroke-linecap="round"/></g>
            ${[0, 1].map(m => `<g ${m ? MIR : ""}>${ink(C, collar, velvetK(C, [1, 0, 0, 1]), "#000", { heavy: 1 })}<path d="M98 100C90 92 82 86 76 72" stroke="${VIO}" stroke-width="1.6" fill="none"/><path d="M72 64C70 70 70 78 74 86C80 98 90 104 100 106" stroke="${SIL}" stroke-width=".5" fill="none" stroke-dasharray="1 .8"/></g>`).join("")}`,
          body: `<path d="M86 108Q100 114 114 108" stroke="${SIL}" stroke-width=".7" fill="none"/>${[86, 114].map(x => `<circle cx="${x}" cy="108" r="2.2" fill="${silver(C)}" stroke="#3A3A48" stroke-width=".4"/>`).join("")}` }; },
      { aliases: ["cape"] });

    // ================= LEVEL 5 =================
    item("wulfila", 5, 0, "eternalgown", "torso", "Dress of Eternal Night", "Black velvet corset, a high-low skirt of torn lace over violet tulle, chains, safety pins and a studded belt with a crescent buckle. Short at the front so everyone can see the boots. Long at the back so everyone can see her leave.",
      (C) => { const bod = "M84 104C78 110 78 122 80 134L84 154C92 158 108 158 116 154L120 134C122 122 122 110 116 104C110 108 90 108 84 104Z";
        const front = "M82 152C78 162 76 172 74 184Q86 182 92 188Q100 182 108 188Q114 182 126 184C124 172 122 162 118 152Z";
        const train = "M82 152C68 170 52 188 36 208Q50 204 58 212Q70 204 80 211Q90 205 100 212Q110 205 120 211Q130 204 142 212Q150 204 164 208C148 188 132 170 118 152Z";
        const tulle = "M80 156C72 170 66 182 62 194Q100 200 138 194C134 182 128 170 120 156Z";
        const pin = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0h6.4" stroke="${SIL}" stroke-width=".8" stroke-linecap="round"/><path d="M0 1.2h5.6" stroke="${SIL}" stroke-width=".6"/><circle cx="6.6" cy=".6" r="1" fill="none" stroke="${SIL}" stroke-width=".6"/><rect x="-1.4" y="-.3" width="1.6" height="2" rx=".3" fill="#B8B8C8"/></g>`;
        return { back: `${K.glow(C, 100, 206, 56, VIOL, .14)}${ink(C, train, velvetK(C, [0, 0, 1, 1]), "#000", { heavy: W.minor })}<path d="${train}" fill="${lacePat(C, "#5A5470")}" opacity=".85"/><g clip-path="${C.clip(train)}"><path d="M70 170C58 184 50 196 44 206M130 170C142 184 150 196 156 206" stroke="#8A5AC8" stroke-width="1.6" fill="none" opacity=".45"/></g>
            ${[[50, 205], [66, 208], [134, 208], [150, 205]].map(([x, y]) => `<path d="M${x} ${y}l2 4l1.4 -3" stroke="#2A2632" stroke-width=".8" fill="none"/>`).join("")}`,
          body: `${ink(C, tulle, C.lin([[0, "#A85AF0"], [.6, VIO], [1, "#3A0A6A"]], [0, 0, 0, 1]), "#1A0430", { heavy: W.minor })}${M.scallops(62, 138, 194, 12, 3, "#3A0A6A", "#8A3AD8", .5)}
            ${ink(C, front, velvetK(C, [0, 0, 1, 1]), "#000", { heavy: W.minor })}<path d="${front}" fill="${lacePat(C, "#6A6480")}" opacity=".9"/>${lacehem(74, 126, 185, 8, 2.6, "#4A4458")}
            <path d="M80 164C78 172 77 178 76 182" stroke="#8A5AC8" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/>${pin(82, 174, -30)}${pin(112, 178, 20)}
            <path d="M86 162Q100 172 116 162" stroke="${SIL}" stroke-width=".8" fill="none" stroke-dasharray="1.4 .6"/><path d="M90 164Q100 178 112 164" stroke="${SIL}" stroke-width=".7" fill="none" stroke-dasharray="1.4 .6"/>
            ${ink(C, bod, velvetK(C, [0, 0, 1, 1]), "#000", { heavy: W.minor })}<g clip-path="${C.clip(bod)}"><path d="M84 110C82 124 83 140 86 152" stroke="#6A6280" stroke-width="1.8" fill="none" opacity=".45" stroke-linecap="round"/>${[90, 95, 105, 110].map(x => `<path d="M${x} 108V156" stroke="#3A3446" stroke-width=".7"/>`).join("")}</g>
            ${[116, 122, 128, 134, 140, 146].map(y => `<path d="M98 ${y}L102 ${y + 4}M102 ${y}L98 ${y + 4}" stroke="${VIOL}" stroke-width=".8"/><circle cx="98" cy="${y}" r=".55" fill="${SIL}"/><circle cx="102" cy="${y}" r=".55" fill="${SIL}"/>`).join("")}
            ${[[86, 118], [114, 118], [86, 132], [114, 132]].map(([x, y]) => `<path d="M${x} ${y - 1.6}l1.2 1.6l-1.2 1.6l-1.2 -1.6Z" fill="${silver(C)}"/>`).join("")}
            ${ink(C, "M80 150Q100 157 120 150L120 156Q100 163 80 156Z", C.lin([[0, "#2A2632"], [1, "#06050A"]], [0, 0, 0, 1]), "#000", { heavy: .8 })}${[84, 89, 94, 106, 111, 116].map(x => `<circle cx="${x}" cy="${f1(153.6 + (x < 100 ? (x - 80) * .14 : (120 - x) * .14))}" r="1.1" fill="${silver(C)}"/>`).join("")}
            <g transform="translate(100 156.6)"><circle r="4.2" fill="none" stroke="#3A3A48" stroke-width="2.4"/><circle r="4.2" fill="none" stroke="${silver(C)}" stroke-width="1.5"/>${moonC(C, 0, 0, 2.8, -30)}</g>`,
          arms: (C2, segs, w) => { if (!segs) return ""; const d = ART3.tube(ART3.subSegs(segs, .04, .86), w.slice(0, -1).map(v => v * 1.1)), [x, y, a] = M.along(segs, .86);
            return `<path d="${d}" fill="${C2.lin([[0, "#8A889A"], [1, "#4A4858"]], [0, 0, 1, 0])}"/><path d="${d}" fill="${net(C2)}"/><path d="${d}" fill="none" stroke="#000" stroke-width=".9"/>
              <g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)})"><rect x="-2.6" y="-6.4" width="5.2" height="12.8" rx="1.2" fill="#14121A" stroke="#000" stroke-width=".6"/>${[-4, 0, 4].map(t => `<path d="M2.6 ${t - 1.4}l2.6 1.4l-2.6 1.4Z" fill="${silver(C2)}"/>`).join("")}</g>`; } }; },
      { aliases: ["mantle"], replaces: ["jumper"] });
    item("wulfila", 5, 1, "batveil", "head", "Bat-Wing Headdress & Torn Veil", "Lace bat wings, a cluster of black roses with a crescent moon, and a short veil she ripped herself because it looked too bridal. Pinned to the band: a tiny badge that says 'meh'.",
      (C) => { const veil = "M70 50C62 66 58 88 56 112L64 106L68 116L76 108L82 116L88 110L96 118L104 110L112 116L118 108L126 116L132 106L140 112C138 88 136 66 128 50Z";
        const wing = `M0 0C6 -10 16 -14 26 -12C22 -9 21 -6 22 -2C18 -4 15 -2 15 2C12 0 8 1 7 4C5 2 2 2 0 3Z`;
        return { back: `<path d="${veil}" fill="${C.lin([[0, "#2A2632", .6], [1, "#06050A", .78]], [0, 0, 0, 1])}" stroke="#2A2632" stroke-width=".7"/><path d="${veil}" fill="${lacePat(C, "#5A5470")}" opacity=".75"/>
`,
          head: `<path d="M72 54C78 44 88 40 100 40C112 40 122 44 128 54" stroke="#06050A" stroke-width="3" fill="none"/><path d="M72 54C78 44 88 40 100 40C112 40 122 44 128 54" stroke="${silver(C)}" stroke-width="1.2" fill="none"/>
            ${[[-1, 76], [1, 124]].map(([s, x]) => `<g transform="translate(${x} 46) scale(${s} 1) rotate(-14)"><path d="${wing}" fill="${C.lin([[0, "#3A3446", .92], [1, "#06050A", .96]], [0, 0, 1, 1])}" stroke="#000" stroke-width=".7"/><path d="${wing}" fill="${lacePat(C, "#6A6480")}" opacity=".7"/><path d="M0 0L22 -2M0 0L15 2M0 0L7 4" stroke="${SIL}" stroke-width=".4" opacity=".7"/></g>`).join("")}
            <g transform="translate(116 44) rotate(14)">${moonC(C, 0, -5, 5.4, -40)}${rose(C, -5, 3, 4.4, -10)}${rose(C, 5, 4, 3.8, 20)}<g transform="translate(-1 9)"><circle r="3" fill="#E8E0F0" stroke="#3A3446" stroke-width=".6"/><text y="1.2" font-size="2.8" font-family="sans-serif" font-weight="700" text-anchor="middle" fill="${VIO}">meh</text></g></g>
            <g transform="translate(84 45) rotate(-20)"><path d="M0 0h7" stroke="${SIL}" stroke-width=".9" stroke-linecap="round"/><path d="M0 1.4h6" stroke="${SIL}" stroke-width=".7"/><circle cx="7.4" cy=".7" r="1.1" fill="none" stroke="${SIL}" stroke-width=".7"/></g>` }; },
      { aliases: ["starcrown"] });
  });
})();

// ===== Halloween costumes: one dress-up per companion, in season only (mid October to early November) =====
// Each costume is a single piece that takes the other wardrobe pieces off while it's worn.
(() => {
  const { ink, lit, shd, W } = ART3, K = ART3.WK, M = ART3.MAT, f1 = K.f1;
  const ALL = ["head", "torso", "back", "neck", "face", "ears", "held", "arms"];
  const add = (k, slug, name, lore, draw, replaces) => { K.item(k, 1, 9, slug, "costume", name, lore, draw, { covers: ALL, replaces: replaces || [] }); const it = ART3.ITEMS[ART3.ITEMS.length - 1]; it.season = "halloween"; };
  const ORA = "#E8761A", ORL = "#FFB04A", ORD = "#8A3A08";
  // a pumpkin: ribbed, with a curled stem; carved = a lit jack-o'-lantern face
  const pumpkin = (C, x, y, rx, ry, o = {}) => {
    const body = C.rad([[0, ORL], [.55, ORA], [1, ORD]], { cx: .4, cy: .35 });
    const ribs = [-.62, -.25, .25, .62].map(t => `<path d="M${f1(x + t * rx * .55)} ${f1(y - ry * .92)}C${f1(x + t * rx * 1.25)} ${f1(y - ry * .4)} ${f1(x + t * rx * 1.25)} ${f1(y + ry * .45)} ${f1(x + t * rx * .55)} ${f1(y + ry * .95)}" stroke="${ORD}" stroke-width="${f1(Math.max(.6, rx * .045))}" fill="none" opacity=".55"/>`).join("");
    const shape = `M${f1(x)} ${f1(y - ry)}C${f1(x + rx * 1.12)} ${f1(y - ry * 1.08)} ${f1(x + rx * 1.12)} ${f1(y + ry * 1.04)} ${f1(x)} ${f1(y + ry)}C${f1(x - rx * 1.12)} ${f1(y + ry * 1.04)} ${f1(x - rx * 1.12)} ${f1(y - ry * 1.08)} ${f1(x)} ${f1(y - ry)}Z`;
    const glowF = C.rad([[0, "#FFF4B0"], [.6, "#FFC23A"], [1, "#E86A10"]]);
    const face = o.carved ? `<path d="M${f1(x - rx * .52)} ${f1(y - ry * .12)}l${f1(rx * .2)} ${f1(-ry * .36)}l${f1(rx * .2)} ${f1(ry * .36)}Z M${f1(x + rx * .12)} ${f1(y - ry * .12)}l${f1(rx * .2)} ${f1(-ry * .36)}l${f1(rx * .2)} ${f1(ry * .36)}Z M${f1(x - rx * .56)} ${f1(y + ry * .2)}Q${f1(x)} ${f1(y + ry * .78)} ${f1(x + rx * .56)} ${f1(y + ry * .2)}l${f1(-rx * .16)} ${f1(ry * .14)}l${f1(-rx * .14)} ${f1(-ry * .1)}l${f1(-rx * .13)} ${f1(ry * .16)}l${f1(-rx * .13)} ${f1(-ry * .16)}l${f1(-rx * .14)} ${f1(ry * .1)}Z" fill="${glowF}" stroke="#5A2006" stroke-width=".7"/>` : "";
    const stem = o.stem === false ? "" : `<path d="M${f1(x - rx * .1)} ${f1(y - ry * .9)}C${f1(x - rx * .12)} ${f1(y - ry * 1.3)} ${f1(x + rx * .02)} ${f1(y - ry * 1.5)} ${f1(x + rx * .22)} ${f1(y - ry * 1.42)}L${f1(x + rx * .14)} ${f1(y - ry * .9)}Z" fill="#5A7A2A" stroke="#2A3A10" stroke-width=".7"/>`;
    return `${stem}${ink(C, shape, body, "#5A2006", { heavy: W.minor })}${`<g clip-path="${C.clip(shape)}">${ribs}</g>`}<path d="M${f1(x - rx * .62)} ${f1(y - ry * .4)}Q${f1(x - rx * .5)} ${f1(y - ry * .8)} ${f1(x - rx * .18)} ${f1(y - ry * .82)}" stroke="#FFE0A8" stroke-width="${f1(Math.max(.7, rx * .07))}" fill="none" opacity=".7" stroke-linecap="round"/>${face}`;
  };
  const tinyBat = (x, y, s, col = "#16121E") => `<path transform="translate(${f1(x)} ${f1(y)}) scale(${s})" d="M0 0C-2 -2 -4 -3 -7 -2.6C-6 -1.6 -6 -.6 -6.6 .4C-5 0 -4 .4 -3.4 1.4C-2.4 .6 -1 .8 0 2C1 .8 2.4 .6 3.4 1.4C4 .4 5 0 6.6 .4C6 -.6 6 -1.6 7 -2.6C4 -3 2 -2 0 0Z" fill="${col}"/>`;
  const moon = (C, x, y, r) => `<path d="M0 ${-r}A${r} ${r} 0 1 0 ${f1(r * .8)} ${f1(r * .6)}A${f1(r * .78)} ${f1(r * .78)} 0 1 1 0 ${-r}Z" transform="translate(${f1(x)} ${f1(y)}) rotate(-20)" fill="${K.goldF(C)}" stroke="${K.GL}" stroke-width=".5"/>`;

  // ---- Natasha: the Midnight Witch ----
  add("natasha", "midnightwitch", "Midnight Witch", "A hat with a crescent charm and a cape that swishes on purpose. Her familiar, naturally, is herself.",
    (C, F) => ({
      back: K.cape(C, F, { col: "#2A1A3E", spread: 2.3, hem: 202, waves: 5, lining: "#169A6A", pattern: [[70, 150], [130, 160], [92, 186], [150, 190]].map(([x, y]) => K.star(x, y, 2.2, "#E8D8FF")).join("") }),
      body: K.capeClasp(C, F, "#C9A24E", "#169A6A"),
      head: `<g transform="translate(101 40) rotate(-10) scale(1.22) translate(-101 -38)">${K.pointyHat(C, F, { col: "#241A34", h: 27, bend: 11, wk: .95, band: "#169A6A" })}${moon(C, 111, 30, 3)}${K.star(93, 24, 1.5, "#E8D8FF")}</g>` }));

  // ---- Antonio: El Conde de la Noche ----
  add("antonio", "condenoche", "El Conde de la Noche", "A vampire count with a velvet cape and red silk lining. He bites only metaphorically. Mostly hearts.",
    (C, F) => { const col = `M60 104C52 86 52 64 60 50C68 62 74 80 80 98ZM140 104C148 86 148 64 140 50C132 62 126 80 120 98Z`;
      return {
        back: K.cape(C, F, { col: "#18121E", spread: 2.15, hem: 206, waves: 6, lining: "#B01830" }) + ink(C, col, M.velvet(C, "#1E1626"), "#06040A", { heavy: W.minor }) + `<path d="M62 100C56 84 56 66 61 55M138 100C144 84 144 66 139 55" stroke="#C8203A" stroke-width="2.2" fill="none"/>`,
        body: `<path d="M86 100Q100 112 114 100" stroke="#C9A24E" stroke-width="1" fill="none" stroke-dasharray="1.6 .8"/>${K.gem(C, 100, 110, 3.4, "#C8102A")}<circle cx="100" cy="110" r="5" fill="none" stroke="${K.goldF(C)}" stroke-width="1.6"/>` }; });

  // ---- Hoot: the Haunted Librarian ----
  add("hoot", "hauntedlibrarian", "The Haunted Librarian", "A cobweb shawl and a very polite ghost who shushes people. They met in the reference section.",
    (C, F) => { const [x, y] = F.neck;
      const web = `M${x - 30} ${y - 2}Q${x} ${y + 14} ${x + 30} ${y - 2}L${x + 26} ${y + 14}Q${x} ${y + 32} ${x - 26} ${y + 14}Z`;
      const rad = [-26, -14, 0, 14, 26].map(dx => `<path d="M${x} ${y - 4}L${x + dx} ${y + 16 + (26 - Math.abs(dx)) * .4}" stroke="#E8E4F0" stroke-width=".55" opacity=".85"/>`).join("") + [6, 12, 18].map(r => `<path d="M${x - 28 + r * .2} ${y + 2 + r * .55}Q${x} ${y + 10 + r} ${x + 28 - r * .2} ${y + 2 + r * .55}" stroke="#E8E4F0" stroke-width=".5" fill="none" opacity=".8"/>`).join("");
      const ghost = `M0 -12C-8 -12 -11 -5 -11 2L-11 12Q-8 9 -5.5 12Q-3 15 0 11Q3 15 5.5 12Q8 9 11 12L11 2C11 -5 8 -12 0 -12Z`;
      return {
        body: ink(C, web, "#2A2238", "#0E0A16", { heavy: 1 }) + `<g clip-path="${C.clip(web)}" opacity=".95">${rad}</g>` + `<path d="M${x + 18} ${y + 14}v8" stroke="#E8E4F0" stroke-width=".5"/><circle cx="${x + 18}" cy="${y + 23}" r="1.6" fill="#16121E"/>`
          + `<g class="a3float"><g transform="translate(156 74)">${K.glow(C, 0, 0, 20, "#DDE8FF", .4)}${ink(C, ghost, C.rad([[0, "#FFFFFF"], [.7, "#F2F0FA"], [1, "#C8C4DC"]], { cx: .4, cy: .3 }), "#8A86A0", { heavy: 1 })}<ellipse cx="-3.6" cy="-2" rx="1.5" ry="2" fill="#1A1622"/><ellipse cx="3.6" cy="-2" rx="1.5" ry="2" fill="#1A1622"/><ellipse cx="0" cy="3" rx="1.6" ry="1.2" fill="#1A1622"/><ellipse cx="-6.4" cy="1.6" rx="1.8" ry="1" fill="#FFB0C8" opacity=".7"/><ellipse cx="6.4" cy="1.6" rx="1.8" ry="1" fill="#FFB0C8" opacity=".7"/></g></g>` }; });

  // ---- Corvin: the Grim Reader ----
  add("corvin", "grimreader", "The Grim Reader", "A tattered reaper's hood, an hourglass and a scythe with a bookmark tied to it. He collects unfinished books, not souls. Mostly.",
    (C, F) => { const [x, y] = F.head.top, w = F.head.w;
      // the hood: a cowl in profile, over the crown and down the back of his head, leaving his eye and beak free
      const hoodOut = "M124 44C120 26 106 16 88 17C72 18 60 28 56 44C52 62 54 84 62 104C64 110 68 114 74 116L80 108C74 96 70 80 72 64C74 48 82 36 96 32C108 29 118 34 124 44Z";
      const point = "M84 18C70 12 54 14 44 26C40 31 39 36 40 42C46 34 54 30 62 30Z";
      const robe = C.lin([[0, "#6A5A82"], [.45, "#3A2E50"], [1, "#160E20"]], [0, 0, 1, 1]);
      const hood = ink(C, point, robe, "#0A0610", { heavy: W.minor }) + ink(C, hoodOut, robe, "#0A0610", { heavy: W.minor })
        + `<path d="M122 42C116 32 106 28 96 31C82 35 74 48 72 64C70 80 74 96 79 107" stroke="#A898C8" stroke-width="1.6" fill="none" opacity=".85"/>`
        + `<path d="M62 30C60 48 58 70 64 96M72 22C66 40 64 60 66 84" stroke="#0A0610" stroke-width=".8" fill="none" opacity=".5"/>`
        + `<path d="M62 104l2 7l4 -4l3 7l3 -6" stroke="#0A0610" stroke-width=".8" fill="none"/>`;
      // the scythe stands at his right, blade sweeping away from his face; a red bookmark ribbon flutters from the snath
      const scythe = `<g transform="translate(160 206) rotate(-6)">${ink(C, "M-1.8 0L-1.8 -150Q0 -153 1.8 -150L1.8 0Z", C.lin([[0, "#8A6A4A"], [.5, "#4A3018"], [1, "#22140A"]], [0, 0, 1, 0]), "#120A04", { heavy: 1 })}`
        + `<path d="M-1.8 -96h3.6M-1.8 -60h3.6" stroke="#C9A24E" stroke-width="1.4"/>`
        + ink(C, "M-1 -148C10 -170 34 -176 52 -164C38 -166 22 -160 12 -146C8 -140 4 -140 -1 -142Z", C.lin([[0, "#FFFFFF"], [.4, "#C8D2DE"], [1, "#4A5466"]], [0, 0, 1, 1]), "#1A202C", { heavy: 1.1 })
        + `<path d="M4 -147C14 -160 30 -166 46 -164" stroke="#FFFFFF" stroke-width=".9" fill="none" opacity=".8"/>`
        + `<path d="M1.8 -128C8 -126 12 -120 10 -112L14 -100L8 -104L6 -98C8 -108 4 -118 1.8 -120Z" fill="${C.lin([[0, "#E8384A"], [1, "#7A0A1A"]], [0, 0, 1, 1])}" stroke="#4A0410" stroke-width=".6"/></g>`;
      // an hourglass on a chain, sand running
      const [nx, ny] = F.neck, hg = `<g transform="translate(${nx + 8} ${ny + 14}) scale(1.25)">${ink(C, "M-4 -6H4L1 0L4 6H-4L-1 0Z", M.glass(C, "#C8D8FF", .3), "#3A3A48", { heavy: .7 })}<path d="M-3 -5H3L.6 -1.4H-.6Z M-.6 1.6H.6L3 5.4H-3Z" fill="#E8C86A"/><path d="M0 -1.4V3" stroke="#E8C86A" stroke-width=".5"/><rect x="-5" y="-7.4" width="10" height="1.6" rx=".6" fill="${K.goldF(C)}"/><rect x="-5" y="5.8" width="10" height="1.6" rx=".6" fill="${K.goldF(C)}"/></g>`;
      const wisp = (x0, y0, s) => `<g class="a3float" opacity=".75"><path transform="translate(${x0} ${y0}) scale(${s})" d="M0 0C-4 -2 -4 -8 0 -10C3 -12 6 -9 4 -6C8 -6 8 0 4 1C2 3 -2 2 0 0Z" fill="#CFE8FF" stroke="#8AA8C8" stroke-width=".5"/></g>`;
      return {
        back: K.cape(C, F, { col: "#2E2440", spread: 2.3, hem: 207, waves: 9, lining: "#7A6A9A" }) + `<path d="M50 206l4 -8l4 7l4 -9l4 8l4 -7l4 9l4 -8l4 7l4 -9l4 8l4 -7l4 9l4 -8l4 7l4 -9l4 8l4 -7l4 9l4 -8l4 7l4 -8l4 8l4 -7" stroke="#000" stroke-width="1" fill="none" opacity=".7"/>` + wisp(40, 120, 1.1) + wisp(52, 84, .8),
        body: chainNeck(F) + hg + scythe,
        head: hood }; }, ["helm", "cape", "sword"]);
  ART3.RENAMED["corvin.pumpkinknight"] = "corvin.grimreader";
  function chainNeck(F){ const [x, y, w] = F.neck; return `<path d="M${x - w * .32} ${y - 2}Q${x} ${y + 18} ${x + w * .32} ${y - 2}" stroke="#C9A24E" stroke-width=".9" fill="none" stroke-dasharray="1.4 .8"/>`; }

  // ---- Ember: Not-So-Little Red ----
  add("ember", "notsolittlered", "Not-So-Little Red", "A red riding hood, worn by the fox. The basket is for cookies. Whose cookies is a separate question.",
    (C, F) => ({
      back: K.cape(C, F, { col: "#B0182A", spread: 2.2, hem: 200, waves: 5, lining: "#F2D8A8" }),
      head: K.hood(C, F, { col: "#B0182A", trim: "#F2D8A8" }),
      body: `<g transform="translate(100 ${F.neck[1] + 2})">${K.bow(C, 0, 0, .5, "#F4EEE6")}</g>`,
      held: (C2, e) => { const [x, y] = e; return `<g transform="translate(${f1(x + 2)} ${f1(y + 6)})"><path d="M-9 -2Q0 -16 9 -2" stroke="#7A4A1A" stroke-width="1.8" fill="none"/>${ink(C2, "M-11 -2L11 -2L8 9Q0 11 -8 9Z", C2.lin([[0, "#D8A060"], [1, "#7A4A1A"]], [0, 0, 0, 1]), "#3A1A06", { heavy: 1 })}<path d="M-10 1h20M-9 4.5h18" stroke="#5A3010" stroke-width=".6"/><path d="M-9 -2L-3 -6L2 -2L8 -6L11 -2Z" fill="#E8E0D8" stroke="#8A2A2A" stroke-width=".5"/><circle cx="-2" cy="-4" r="2.4" fill="#C88A4A" stroke="#6A3A10" stroke-width=".5"/><circle cx="-2.6" cy="-4.4" r=".5" fill="#3A1A06"/></g>`; } }), ["hood", "cloak-back", "cloak", "clasp"]);

  // ---- Sir Wartsworth: Dr. Frankentoad ----
  add("wartsworth", "frankentoad", "Dr. Frankentoad", "Neck bolts, a flat-top and one heroic stitch. IT'S ALIVE! (It was always alive. He's a toad.)",
    (C, F) => { const [x, y] = F.neck;
      const hair = `M78 70L78 58Q100 52 122 58L122 70L118 66L114 71L110 66L106 71L102 66L98 71L94 66L90 71L86 66L82 71Z`;
      const bolt = s => `<g transform="translate(${100 + s * 38} 104)">${ink(C, `M${s * -6} -2.4H${s * 4}V2.4H${s * -6}Z`, M.steel(C, [0, 0, 0, 1]), "#1A202C", { heavy: .9 })}${ink(C, `M${s * 3} -4.4H${s * 7}V4.4H${s * 3}Z`, M.steel(C, [0, 0, 0, 1]), "#1A202C", { heavy: .9 })}</g>`;
      return {
        head: ink(C, hair, C.lin([[0, "#3A3A42"], [1, "#0E0E12"]], [0, 0, 0, 1]), "#000", { heavy: W.minor }) + `<path d="M84 57.4Q100 54 116 57.4" stroke="#6A6A78" stroke-width="1" fill="none" opacity=".7"/><path d="M88 76l7 -2" stroke="#2A3A20" stroke-width="1"/>${[0, 1, 2].map(i => `<path d="M${89 + i * 2.4} ${73.6 - i * .6}l.5 2.4" stroke="#2A3A20" stroke-width=".8"/>`).join("")}` + bolt(-1) + bolt(1),
        body: "" }; }, ["goggles"]);

  // ---- Nyx: Little Pumpkin ----
  add("nyx", "littlepumpkin", "Little Pumpkin", "A pumpkin hat with a leaf, and a candy pail she is far too shy to hold out. You may have one. Two if you ask nicely.",
    (C, F) => { const [x, y] = F.head.top;
      const cap = `M${x - 22} ${y + 6}C${x - 22} ${y - 14} ${x + 22} ${y - 14} ${x + 22} ${y + 6}Q${x} ${y + 10} ${x - 22} ${y + 6}Z`;
      return {
        head: ink(C, cap, C.rad([[0, ORL], [.6, ORA], [1, ORD]], { cx: .4, cy: .3 }), "#5A2006", { heavy: W.minor }) + `<g clip-path="${C.clip(cap)}">${[-12, -4, 4, 12].map(dx => `<path d="M${x + dx * .6} ${y - 9}Q${x + dx * 1.15} ${y - 2} ${x + dx} ${y + 9}" stroke="${ORD}" stroke-width=".8" fill="none" opacity=".55"/>`).join("")}</g>`
          + `<path d="M${x - 1} ${y - 8}C${x - 2} ${y - 14} ${x + 2} ${y - 17} ${x + 5} ${y - 15}" stroke="#4A6A20" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M${x + 3} ${y - 10}C${x + 10} ${y - 16} ${x + 16} ${y - 12} ${x + 15} ${y - 7}C${x + 10} ${y - 6} ${x + 6} ${y - 7} ${x + 3} ${y - 10}Z" fill="#6A9A3A" stroke="#2A3A10" stroke-width=".6"/>`,
        body: `<g transform="translate(140 186) scale(1.5)"><path d="M-8 -6Q0 -18 8 -6" stroke="#3A3A42" stroke-width="1.2" fill="none"/>${pumpkin(C, 0, 0, 9, 7.4, { carved: true, stem: false })}<circle cx="-3" cy="-7" r="1.8" fill="#E84A8A"/><circle cx="2" cy="-7.6" r="1.6" fill="#4AC8E8"/><rect x="4" y="-9" width="2" height="4" rx=".8" fill="#FFD84A" transform="rotate(20 5 -7)"/></g>` }; }, ["bow"]);

  // ---- Bramble: the Fearsome Dragon (very small) ----
  add("bramble", "tinydragon", "Fearsome Dragon (Very Small)", "Felt horns, felt wings, and a ROAR that is mostly giggling. Treasure hoard: one button.",
    (C, F) => { const [x, y] = F.head.top;
      const horn = s => `M${x + s * 13} ${y + 6}C${x + s * 14} ${y - 8} ${x + s * 22} ${y - 17} ${x + s * 30} ${y - 18}C${x + s * 25} ${y - 11} ${x + s * 23} ${y - 2} ${x + s * 22} ${y + 7}Z`;
      const spikes = [-9, 0, 9].map(dx => `M${x + dx - 4} ${y + 2}L${x + dx} ${y - 7 - (dx ? 0 : 2)}L${x + dx + 4} ${y + 2}Z`).join("");
      return {
        back: [-1, 1].map(s => { const m = v => 100 + s * v, d = `M${m(12)} 168C${m(24)} 150 ${m(40)} 140 ${m(56)} 138C${m(52)} 146 ${m(54)} 152 ${m(58)} 158C${m(50)} 158 ${m(46)} 162 ${m(46)} 168C${m(40)} 166 ${m(34)} 168 ${m(32)} 174C${m(26)} 172 ${m(18)} 174 ${m(12)} 176Z`;
          return ink(C, d, C.lin([[0, "#6AC87A"], [1, "#1E5A2A"]], [0, 0, 1, 1]), "#0E2A14", { heavy: W.minor }) + `<path d="M${m(14)} 170L${m(54)} 140M${m(16)} 172L${m(46)} 162M${m(16)} 174L${m(32)} 172" stroke="#0E2A14" stroke-width=".8" fill="none" opacity=".55"/>`; }).join(""),
        head: K.hood(C, F, { col: "#3A8A4A", trim: "#F2D86A", deco: () => "" }) + [-1, 1].map(s => ink(C, horn(s), C.lin([[0, "#FFF2C8"], [1, "#C8A860"]], [0, 0, 0, 1]), "#6A5420", { heavy: 1 })).join("") + ink(C, spikes, "#F2D86A", "#8A6A10", { heavy: .9 }) }; }, ["hat"]);

  // ---- Wulfila: Wolf in Sheep's Clothing ----
  add("wulfila", "sheepsclothing", "Wolf in Sheep's Clothing", "A fluffy fleece hood with tiny sheep ears. It's ironic. She has worn it every day this week.",
    (C, F) => { const [x, y] = F.head.top, [nx, ny, nw] = F.neck;
      const arc = Array.from({ length: 9 }, (_, i) => { const t = i / 8, a = Math.PI * (1.08 - t * 1.16); return [x + Math.cos(a) * 30, y + 12 - Math.sin(a) * 16]; });
      const ear = s => `<g transform="translate(${x + s * 30} ${y + 14}) rotate(${s * 28})">${ink(C, `M0 0C${s * 4} -3 ${s * 12} -2 ${s * 13} 2C${s * 12} 6 ${s * 4} 6 0 3Z`, C.lin([[0, "#FFF6F0"], [1, "#E8C8C0"]], [0, 0, 1, 0]), "#8A6A6A", { heavy: .9 })}<path d="M${s * 3} 1.6C${s * 6} 0 ${s * 10} .6 ${s * 11} 2.2" stroke="#F0A0B0" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>`;
      return {
        head: M.fluff(C, arc, 11, "#F8F4EE") + ear(-1) + ear(1),
        body: M.fluff(C, [[nx - nw * .7, ny - 1], [nx - nw * .3, ny + 4], [nx + nw * .3, ny + 4], [nx + nw * .7, ny - 1]], 8, "#F8F4EE") + `<path d="M${nx - 3} ${ny + 6}h6" stroke="#8A3AC8" stroke-width="1.6"/><g transform="translate(${nx} ${ny + 10})">${ink(C, "M-3.4 2.6C-3.4 -1.6 -2.2 -3.6 0 -3.6C2.2 -3.6 3.4 -1.6 3.4 2.6Z", K.goldF(C), K.GL, { heavy: .8 })}<circle cy="3" r=".9" fill="${K.GL}"/></g>` }; });
})();

// ===== Companion art v4.7: the nine companions and their wardrobes (ART3), wired into the app =====
const A3APP = (() => {
  const KEY = { cat: "natasha", lion: "antonio", owl: "hoot", raven: "corvin", fox: "ember", toad: "wartsworth", bat: "nyx", hedgehog: "bramble", wolf: "wulfila" };
  // the app's moods, drawn with the five painted expressions
  const EXPR = { idle: "neutral", talk: "neutral", sleepy: "neutral", happy: "happy", proud: "happy", wink: "happy", love: "love", shy: "love", surprised: "surprised", sad: "sad" };
  const cache = new Map(); let seq = 0;
  // keep the art's inner class names out of reach of the app's older familiar CSS
  const scope = s => s.replace(/class="([^"]*)"/g, (m, c) => `class="${c.split(/\s+/).map(t => !t || t.startsWith("a3") || t.startsWith("w-") ? t : "a3-" + t).join(" ")}"`);
  // v4.5: give the head, tail, wings and spines a hinge of their own, so they can move without redrawing the picture
  function hinge(s, tok, cls){ const open = new RegExp(`<g\\b[^>]*class="(?:[^"]*\\s)?${tok}(?:\\s[^"]*)?"[^>]*>`, "g"), at = [];
    let m; while ((m = open.exec(s))) if (!m[0].endsWith("/>")) at.push(m.index + m[0].length);
    for (let i = at.length - 1; i >= 0; i--) { const a = at[i], re = /<g\b[^>]*?(\/?)>|<\/g>/g; re.lastIndex = a; let d = 1, b = -1, t;
      while ((t = re.exec(s))) { if (t[0] === "</g>") { if (--d === 0) { b = t.index; break; } } else if (!t[1]) d++; }
      if (b > 0) s = s.slice(0, a) + `<g class="a3m ${cls}">` + s.slice(a, b) + "</g>" + s.slice(b); }
    return s; }
  const HINGES = [["a3-head", "a3m-head"], ["a3-tail", "a3m-tail"], ["a3-wing", "a3m-wing"], ["a3-spines", "a3m-spines"], ["a3-hackles", "a3m-hackles"], ["a3-ruff", "a3m-ruff"]];
  const alive = s => HINGES.reduce((x, [t, c]) => hinge(x, t, c), s);
  const raw = (k, ids, ex, lite) => { const key = `${k}|${ids.join(",")}|${ex}|${lite ? 1 : 0}`; let s = cache.get(key);
    if (!s) { s = alive(scope(ART3.wear(KEY[k] || "natasha", ex, ids, { lite }))); if (cache.size > 240) cache.clear(); cache.set(key, s); } return s; };
  // each picture blinks and sways on its own clock, so two companions on one screen never move in lockstep
  const clock = () => `--a3bd:${(-Math.random() * 6).toFixed(2)}s;--a3bp:${(4.6 + Math.random() * 2.6).toFixed(2)}s;--a3d:${(-Math.random() * 8).toFixed(2)}s`;
  function art(k, ids = [], ex = "neutral", lite = false){
    if (!KEY[k]) k = "cat"; const u = "q" + (++seq);
    const s = raw(k, ids, ex, lite).replace(/id="([a-z]+\d+_\d+)"/g, `id="$1${u}"`).replace(/url\(#([a-z]+\d+_\d+)\)/g, `url(#$1${u})`);
    return s.replace(/^<svg class="[^"]*"/, `<svg class="famart a3art ${k}" style="${clock()}" data-a3k="${k}" data-a3w="${ids.join(",")}" data-a3x="${ex}"${lite ? ' data-a3l="1"' : ""}`);
  }
  const items = k => ART3.itemsFor(KEY[k] || "natasha").map(i => ({ id: i.id, slug: i.slug, lvl: i.lvl, slot: i.slot, name: i.name, lore: i.lore, aliases: i.aliases, season: i.season }));
  const item = id => ART3.ITEMS.find(i => i.id === (ART3.RENAMED[id] || id));
  // turn whatever is saved (old outfit names such as "cape", or piece ids) into this companion's pieces
  function normalize(k, wear){ const ch = KEY[k] || "natasha", ids = [];
    for (const raw of wear || []) { let id = ART3.RENAMED[raw] || raw;
      if (!id.includes(".")) { const hit = ART3.itemsFor(ch).find(i => (i.aliases || []).includes(id)); id = hit ? hit.id : ""; }
      if (id && id.startsWith(ch + ".") && ART3.ITEMS.some(i => i.id === id) && !ids.includes(id)) ids.push(id); }
    // old outfit names are put on in level order, so the grandest piece in each slot wins; pieces chosen in the wardrobe keep their order
    const lv = id => (ART3.ITEMS.find(i => i.id === id) || {}).lvl || 0, legacy = (wear || []).some(x => !String(x).includes("."));
    return (legacy ? ids.slice().sort((a, b) => lv(a) - lv(b)) : ids).reduce((out, id) => ART3.equip(out, id), []); }
  const equip = (ids, id) => ART3.equip(ids, id);
  // when a companion's mood or size changes, repaint them in the matching expression (and the simpler small-size version below 130px)
  // measure first, then repaint: reading every size before changing anything keeps the page from re-laying itself out once per picture
  function plan(svg){ const host = svg.closest("[data-expr]"), ex = EXPR[host && host.dataset.expr] || "neutral";
    const w = svg.clientWidth || svg.getBoundingClientRect().width, lite = w > 0 && w < 130;
    return svg.dataset.a3x === ex && !!svg.dataset.a3l === lite ? null : { svg, ex, lite }; }
  function apply({ svg, ex, lite }){ if (!svg.isConnected) return;
    const t = document.createElement("div"); t.innerHTML = art(svg.dataset.a3k, svg.dataset.a3w ? svg.dataset.a3w.split(",") : [], ex, lite);
    const n = t.firstElementChild; if (n) { for (const a of ["style", "width", "height"]) if (svg.hasAttribute(a)) n.setAttribute(a, svg.getAttribute(a)); if (ro) { ro.unobserve(svg); ro.observe(n); } svg.replaceWith(n); } }
  const syncAll = list => { const todo = []; for (const s of list) { try { if (s.isConnected) { const p = plan(s); if (p) todo.push(p); } } catch (e) {} } for (const p of todo) try { apply(p); } catch (e) {} };
  const sync = svg => syncAll([svg]);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(es => syncAll(es.map(e => e.target))) : null;
  function watch(){ const mo = new MutationObserver(ms => { const todo = new Set();
      for (const m of ms) { if (m.type === "attributes") { m.target.querySelectorAll && m.target.querySelectorAll("svg.a3art").forEach(s => todo.add(s)); }
        else m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.matches && n.matches("svg.a3art")) todo.add(n); n.querySelectorAll && n.querySelectorAll("svg.a3art").forEach(s => todo.add(s)); }); }
      const list = [...todo].filter(s => s.isConnected); if (ro) list.forEach(s => ro.observe(s)); syncAll(list); });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-expr"] }); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
  return { KEY, art, items, item, normalize, equip };
})();

