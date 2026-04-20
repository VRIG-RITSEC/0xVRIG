import { Exercise } from '../types';

export const win40: Exercise = {
  id: 'win-40',
  unitId: 'unit8-win-stack',
  title: '40: SEH Overwrite',
  desc: 'Classic SEH exploit! The buffer is 16 bytes. Overflow it to overwrite the return address with <code>win()</code>. In a real SEH exploit you\'d overwrite the handler field with a POP POP RET gadget address and put a short jump in nSEH, but here just reach the return address.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// Classic SEH Overwrite Pattern', cls: 'comment' },
      { text: '// Real exploit: overflow → nSEH (jmp) + handler (PPR)', cls: 'comment' },
      { text: '// Trigger exception → PPR → jmp → shellcode', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { WinExec("calc", 0); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    *(int*)0 = 0;  // trigger exception', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'SEH Exploited!',
  winMsg: 'In real Windows exploits, you\'d point the handler at a POP POP RET gadget and use nSEH to jump to shellcode.',
};
