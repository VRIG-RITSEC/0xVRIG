import { Exercise } from '../types';

export const win42: Exercise = {
  id: 'win-42',
  unitId: 'unit8-win-stack',
  title: '42: CFG Challenge',
  desc: 'Control Flow Guard (CFG) validates indirect call targets. But <b>direct return address overwrites bypass CFG</b> — CFG only protects forward-edge calls, not backward-edge returns. Overflow the 12-byte buffer to overwrite the return address. CFG can\'t stop this!',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// CFG — Control Flow Guard', cls: 'comment' },
      { text: '// Protects: indirect calls (call [eax])', cls: 'comment' },
      { text: '// Does NOT protect: return addresses!', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { WinExec("calc", 0); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[12];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 12,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'CFG Bypassed!',
  winMsg: 'CFG protects indirect calls but NOT return addresses. ROP and ret2win attacks still work even with CFG enabled.',
};
