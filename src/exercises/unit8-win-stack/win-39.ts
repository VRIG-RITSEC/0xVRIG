import { Exercise } from '../types';

export const win39: Exercise = {
  id: 'win-39',
  unitId: 'unit8-win-stack',
  title: '39: SEH on Stack',
  desc: 'Windows SEH (Structured Exception Handling) stores handler records <b>on the stack</b>. This exercise has an 8-byte buffer with a simulated SEH record above it (4 bytes nSEH + 4 bytes handler). The total distance to the return address is 24 bytes (8 buf + 4 canary-like nSEH + 4 handler + 4 EBP + 4 ret). Overflow through everything to reach the return address.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// SEH handler lives ON the stack!', cls: 'comment' },
      { text: '// Stack layout:', cls: 'comment' },
      { text: '//   [buf 8 bytes]', cls: 'comment' },
      { text: '//   [nSEH ptr]  [handler ptr]', cls: 'comment' },
      { text: '//   [saved EBP]', cls: 'comment' },
      { text: '//   [ret addr]', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { system("cmd"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    EXCEPTION_REGISTRATION seh;', cls: '' },
      { text: '    char buf[8];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 24,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'SEH Overwritten!',
  winMsg: 'You overflowed through the SEH record to reach the return address. In real SEH exploits, you target the handler field itself.',
};
