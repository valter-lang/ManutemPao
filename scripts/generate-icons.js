// Gera os ícones PNG do PWA ManutenPão sem dependências externas.
// Fundo azul (#1E3A5F), círculo laranja (#F5A623) e "pão" branco estilizado.
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const NAVY = [30, 58, 95];
const ORANGE = [245, 166, 35];
const CREAM = [255, 248, 238];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function png(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filtro 0
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function draw(N, circleR) {
  const buf = Buffer.alloc(N * N * 4);
  const cx = N / 2, cy = N / 2;
  const r = N * circleR;
  // banda do "pão": retângulo arredondado central
  const bw = N * 0.46, bh = N * 0.20, bx = cx - bw / 2, by = cy - bh / 2, br = bh / 2;
  const set = (x, y, [R, G, B]) => {
    const i = (y * N + x) * 4;
    buf[i] = R; buf[i + 1] = G; buf[i + 2] = B; buf[i + 3] = 255;
  };
  const inRounded = (x, y) => {
    const lx = Math.max(bx + br - x, x - (bx + bw - br), 0);
    const ly = Math.max(by + br - y, y - (by + bh - br), 0);
    return (x >= bx + br || x <= bx + bw - br || true) && (lx * lx + ly * ly) <= br * br &&
      x >= bx && x <= bx + bw && y >= by && y <= by + bh;
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      set(x, y, NAVY);
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) set(x, y, ORANGE);
      // pão branco dentro do círculo
      if (d <= r && inRoundedBand(x, y, bx, by, bw, bh, br)) set(x, y, CREAM);
      // cortes (scores) do pão em azul
      if (d <= r && inRoundedBand(x, y, bx, by, bw, bh, br)) {
        const rel = (x - bx) / bw;
        const cut = Math.abs(((rel * 3) % 1) - 0.5) < 0.06;
        if (cut && y > by + bh * 0.18 && y < by + bh * 0.82) set(x, y, NAVY);
      }
    }
  }
  return png(N, N, buf);
}
function inRoundedBand(x, y, bx, by, bw, bh, br) {
  if (x < bx || x > bx + bw || y < by || y > by + bh) return false;
  const lx = Math.max(bx + br - x, x - (bx + bw - br), 0);
  const ly = Math.max(by + br - y, y - (by + bh - br), 0);
  return (lx * lx + ly * ly) <= br * br;
}

const out = path.join(__dirname, "..", "icons");
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "icon-192.png"), draw(192, 0.42));
fs.writeFileSync(path.join(out, "icon-512.png"), draw(512, 0.42));
fs.writeFileSync(path.join(out, "icon-maskable-512.png"), draw(512, 0.32)); // margem de segurança
console.log("Ícones gerados em /icons");
