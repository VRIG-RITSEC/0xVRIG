import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'mit-81',
  unitId: 'unit15-mitigations',
  title: '81: Stack Canaries Deep Dive',
  desc: '<b>Goal:</b> Understand stack canary types and bypass the canary to redirect execution. The compiler inserts a secret value between the buffer and the saved return address. Three canary types exist: <strong>terminator</strong> (contains null, CR, LF, 0xFF to block string copies), <strong>random</strong> (generated at process start), and <strong>XOR</strong> (random XORed with frame pointer). Find the leaked canary value and preserve it while overwriting the return address to reach <code>win()</code>.',
  source: {
    c: [
      { text: '// Stack canary: -fstack-protector', cls: 'cmt' },
      { text: '// Canary types:', cls: 'cmt' },
      { text: '//   Terminator: 0x00 0x0d 0x0a 0xff', cls: 'cmt' },
      { text: '//   Random: from /dev/urandom at startup', cls: 'cmt' },
      { text: '//   XOR: random ^ frame_pointer', cls: 'cmt' },
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("FLAG{canary_deep_dive}\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    // Canary placed between buf and retaddr', cls: 'cmt' },
      { text: '    printf("Leaked canary: %p\\n", canary);', cls: 'highlight' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// On function return:', cls: 'cmt' },
      { text: '// if (canary != saved_canary)', cls: 'cmt' },
      { text: '//     __stack_chk_fail(); // abort!', cls: 'cmt' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  canary: true,
  showSymbols: true,
  showBuilder: true,
  check(sim, _heap, symbols) {
    return sim.canaryIntact() && sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{canary_deep_dive}',
  winMsg: 'You bypassed the stack canary by reading its leaked value and placing it at the correct offset in your payload. Terminator canaries include null bytes to block strcpy-style overflows, but if you can leak the value (via format strings, side channels, or info leaks), the canary offers no protection.',
};

export default exercise;
