import { Exercise } from '../types';

export const win38: Exercise = {
  id: 'win-38',
  unitId: 'unit8-win-stack',
  title: '38: PE Import Hijack',
  desc: 'Windows PE files use the <b>Import Address Table (IAT)</b> — like Linux\'s GOT. This program has a 20-byte buffer. Overflow it to redirect execution to <code>win()</code>. The larger buffer means more padding bytes before you hit the return address.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// PE Import Address Table (IAT)', cls: 'comment' },
      { text: '// Like GOT on Linux — holds resolved', cls: 'comment' },
      { text: '// function addresses at runtime', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    MessageBoxA(0, "pwned", "IAT", 0);', cls: '' },
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
  winTitle: 'PE Hijacked!',
  winMsg: 'Whether it\'s ELF or PE, stack overflows work the same. The IAT is another target for write-what-where attacks.',
};
