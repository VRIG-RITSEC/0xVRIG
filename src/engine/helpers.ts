export function hex8(v: number): string {
  return '0x' + (v >>> 0).toString(16).padStart(8, '0');
}

export function hex2(v: number): string {
  return (v & 0xff).toString(16).padStart(2, '0');
}

export function toAscii(v: number): string {
  return (v >= 0x20 && v <= 0x7e) ? String.fromCharCode(v) : '.';
}

export function addrToLE(addrStr: string): number[] | null {
  const v = parseInt(addrStr, 16);
  if (isNaN(v)) return null;
  return [(v >>> 0) & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
}

export function hexStrToBytes(str: string): number[] {
  const clean = str.replace(/\s+/g, '').replace(/^0x/i, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.substr(i, 2), 16);
    if (isNaN(b)) break;
    bytes.push(b);
  }
  return bytes;
}

export function strToBytes(str: string): number[] {
  return Array.from(str).map(c => c.charCodeAt(0) & 0xff);
}
