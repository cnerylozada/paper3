export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

// SHA-256 of the file: the same PDF always gives the same hash
export const hashFile = async (file: File) =>
  new Uint8Array(
    await crypto.subtle.digest("SHA-256", await file.arrayBuffer()),
  );

// A kaleidoscope: one wedge drawn from the hash bytes (circles and petals),
// mirrored and repeated around the center. Every byte of the hash is used, so
// changing one dot in the PDF gives a completely different figure.
// Plain shapes and text only, so any viewer can render it
export const buildSvg = (hash: Uint8Array) => {
  const hue = (byte: number) => Math.round((byte / 255) * 360);
  const baseHue = hue(hash[0]);
  const folds = 6 + 2 * (hash[31] % 4); // 6, 8, 10 or 12 repetitions

  // Circles along the wedge's axis, 5 bytes each
  const circles = Array.from({ length: 6 }, (_, i) => {
    const [dx, size, h, light, alpha] = hash.slice(1 + i * 5, 6 + i * 5);
    const cx = 200 + ((dx - 128) / 128) * 30;
    const cy = 190 - 25 - i * 25;
    const r = 5 + (size % 16);
    const fill = `hsl(${(baseHue + hue(h) / 3) % 360} 75% ${45 + (light % 25)}%)`;
    return `<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="${fill}" fill-opacity="${(0.5 + (alpha % 50) / 100).toFixed(2)}"/>`;
  }).join("");

  // Curved petals from the center, 4 bytes each
  const petals = Array.from({ length: 4 }, (_, i) => {
    const [bend, len, h, width] = hash.slice(i * 4, i * 4 + 4);
    const tip = 190 - (60 + (len % 110));
    const side = ((bend - 128) / 128) * 60;
    const stroke = `hsl(${(baseHue + 180 + hue(h) / 4) % 360} 80% 65%)`;
    return `<path d="M200 200 Q${(200 + side).toFixed(1)} ${(200 + tip) / 2} 200 ${tip}" fill="none" stroke="${stroke}" stroke-width="${1 + (width % 4)}" stroke-linecap="round" stroke-opacity="0.8"/>`;
  }).join("");

  // The wedge, repeated around the center and mirrored
  const copies = Array.from({ length: folds }, (_, k) => {
    const rotate = `rotate(${(k * 360) / folds} 200 200)`;
    return `<use href="#w" transform="${rotate}"/><use href="#w" transform="${rotate} translate(400 0) scale(-1 1)"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420"><defs><radialGradient id="bg" cx="50%" cy="48%" r="60%"><stop offset="0" stop-color="hsl(${baseHue} 45% 20%)"/><stop offset="1" stop-color="#0b0f19"/></radialGradient><g id="w">${petals}${circles}</g></defs><rect width="400" height="420" fill="url(#bg)"/>${copies}<text x="200" y="408" text-anchor="middle" font-family="monospace" font-size="14" fill="#e5e7eb">${toHex(hash).slice(0, 12)}</text></svg>`;
};
