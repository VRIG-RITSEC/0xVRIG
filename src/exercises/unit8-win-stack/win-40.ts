import { Exercise } from '../types';

export const win40: Exercise = {
  id: 'win-40',
  unitId: 'unit8-win-stack',
  title: '40: SEH Overwrite',
  desc: 'Classic SEH exploit! The buffer is 16 bytes inside a <code>__try</code> block, which places an SEH record on the stack. Overflow it to overwrite the return address with <code>win()</code>. The overflow corrupts the SEH handler pointer, and when the null dereference triggers an exception, the OS walks the SEH chain and dispatches through the corrupted handler. In a real SEH exploit you\'d overwrite the handler field with a POP POP RET gadget address and put a short jump in nSEH, but here just reach the return address.',
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
      { text: '    __try {', cls: '' },
      { text: '        char buf[16];', cls: '' },
      { text: '        gets(buf);  // overflow corrupts SEH record', cls: 'highlight vuln' },
      { text: '        *(int*)0 = 0;  // crash triggers SEH dispatch', cls: '' },
      { text: '    } __except(EXCEPTION_EXECUTE_HANDLER) {}', cls: '' },
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
