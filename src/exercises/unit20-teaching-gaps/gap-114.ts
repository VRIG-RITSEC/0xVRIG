import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'gap-114',
  unitId: 'unit20-teaching-gaps',
  title: '114: Partial Overwrite & ASLR Brute Force',
  desc: '<b>Goal:</b> When ASLR randomizes addresses, you can still exploit by overwriting only the <strong>lowest 1-2 bytes</strong> of a return address. The bottom 12 bits (page offset) are never randomized. A 1-byte overwrite has 1/16 probability (4 bits of entropy), a 2-byte overwrite has 1/4096. Real exploits retry thousands of times.',
  source: {
    c: [
      { text: '// Partial overwrite — bypass ASLR', cls: 'cmt' },
      { text: '// Bottom 12 bits are NOT randomized', cls: 'cmt' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { /* at offset 0x???7b0 */ }', cls: '' },
      { text: 'void vuln() { /* ret at offset 0x???825 */ }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '' },
      { text: '    char buf[16];', cls: '' },
      { text: '    read(0, buf, 24);', cls: 'highlight vuln' },
      { text: '    // Only overflows into low bytes of ret', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Attack: overwrite last 2 bytes of ret', cls: 'cmt' },
      { text: '// to 0x??b0 (page offset of win)', cls: 'cmt' },
      { text: '// 4 bits of entropy → 1/16 chance', cls: 'highlight' },
      { text: '// Run exploit in a loop until it hits!', cls: 'highlight' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 16,
  aslr: true,
  steps: [
    {
      action: 'init',
      log: ['info', 'ASLR randomizes the base address, but the <strong>page offset</strong> (bottom 12 bits) stays fixed. If you can only overflow 1-2 bytes of the return address, you\'re changing the page offset — which you know — plus a few random bits.'],
    },
    {
      log: ['info', '<strong>Full address:</strong> <code>0xf7d2a825</code> (return to vuln+offset). ASLR randomizes <code>0xf7d2a</code>, but <code>0x825</code> is always the same. Similarly, win() is always at offset <code>0x7b0</code> within the page.'],
      srcLine: 4,
    },
    {
      log: ['info', '<strong>1-byte overwrite:</strong> Change <code>0x25</code> to <code>0xb0</code>. This changes the return from <code>0xf7d2a825</code> to <code>0xf7d2a8b0</code>. But we need <code>0xf7d2a7b0</code> — the high nibble is wrong! There\'s 4 bits of entropy in that nibble → <strong>1/16 probability</strong>.'],
      srcLine: 15,
    },
    {
      log: ['info', '<strong>2-byte overwrite:</strong> Change last 2 bytes to <code>0x07b0</code>. Now we control 16 bits, but 12 are deterministic (page offset). Only 4 bits are random → still <strong>1/16 probability</strong>. In practice, exploits retry in a loop: <code>while ! ./exploit; do :; done</code>.'],
      srcLine: 16,
    },
    {
      log: ['success', 'Partial overwrites are a powerful ASLR bypass when you can\'t leak addresses. Key insight: with 4 bits of entropy, the exploit succeeds in ~16 attempts on average. Many servers fork() (child inherits parent\'s ASLR layout), making this even more reliable — only need to brute-force once.'],
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'ASLR Brute Forced!',
  winMsg: 'Partial overwrites exploit the fact that page offsets are deterministic. 4 bits of entropy = 1/16 success rate, practical for remote exploits against forking servers.',
};

export default exercise;
