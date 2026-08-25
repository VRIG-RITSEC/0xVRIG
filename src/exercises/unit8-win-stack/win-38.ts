import { Exercise } from '../types';

export const win38: Exercise = {
  id: 'win-38',
  unitId: 'unit8-win-stack',
  title: '38: Windows Stack Overflow',
  desc: 'This program has a 20-byte buffer. Overflow it to redirect execution to <code>win()</code>. The larger buffer means more padding bytes before you hit the return address.',
  source: {
    c: [
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    MessageBoxA(0, "pwned", "win", 0);', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[20];', cls: '' },
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
  bufSize: 20,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'Stack Overflow!',
  winMsg: 'Whether it\'s ELF or PE, stack overflows work the same — overflow the buffer, overwrite the return address.',
};
