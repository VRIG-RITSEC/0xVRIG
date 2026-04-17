import { Exercise } from '../types';

const ex03Hijack: Exercise = {
  id: 'stack-03',
  unitId: 'unit1-stack',
  title: '03: Hijack Execution',
  desc: 'Now instead of crashing, make the program jump to <strong>win()</strong>. Use the payload builder to craft your input: 16 bytes of filler (fills the buffer), 4 bytes of junk (overwrites saved bookmark), then the address of win() written <strong>backwards</strong> (little-endian — the least significant byte goes first).',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("FLAG{you_own_the_eip}\\n");', cls: '' },
      { text: '    // you redirected execution here!', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
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
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  aslr: false,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{you_own_the_eip}',
  winMsg: 'You made the program run a function it was never supposed to call! In a real attack, this is how hackers take control of a computer — they overwrite the go-back address to run whatever they want.',
};

export default ex03Hijack;
