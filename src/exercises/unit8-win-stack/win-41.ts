import { Exercise } from '../types';

export const win41: Exercise = {
  id: 'win-41',
  unitId: 'unit8-win-stack',
  title: '41: /GS Cookie Bypass',
  desc: 'Windows uses <b>/GS (stack cookies)</b> to detect buffer overflows. The cookie sits between your buffer and the return address — if it changes, the program aborts before returning. But if you can <b>leak the cookie value</b> (shown in the symbol table), you can include the correct value in your payload and overwrite the return address undetected.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// /GS Stack Cookie protection', cls: 'comment' },
      { text: '// Must preserve cookie while overwriting ret', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { system("cmd"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    // canary check before return', cls: 'cmt' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  canary: true,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.canaryIntact() && sim.getRetAddr() === symbols.win;
  },
  winTitle: '/GS Cookie Bypassed!',
  winMsg: 'You included the correct cookie value in your payload, keeping the stack protection intact while redirecting execution. In real exploits, attackers leak the cookie via format strings, info leaks, or brute force.',
};
