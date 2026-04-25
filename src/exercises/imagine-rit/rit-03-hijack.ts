import { Exercise } from '../types';

const rit03Hijack: Exercise = {
  id: 'rit-03',
  unitId: 'imagine-rit',
  title: '03: Hijack Execution',
  desc: 'There\'s a secret function called <strong>win()</strong> that prints the flag — but the program never calls it. Your job: overwrite the go-back address with <strong>win()\'s address</strong> so the program jumps there. Use the payload builder: <strong>①</strong> Add 20 bytes of padding (fills scratchpad + bookmark), <strong>②</strong> Add the address of win() from the symbols table. The builder handles the byte ordering for you!',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {  // SECRET FUNCTION', cls: '' },
      { text: '    printf("FLAG{you_own_the_program}\\n");', cls: 'highlight' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);  // no size check!', cls: 'highlight vuln' },
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
  winTitle: 'FLAG{you_own_the_program}',
  winMsg: 'You just hacked a program! You made it run a function it was never supposed to call by controlling the go-back address. This is exactly how real hackers take over computers.',
  realWorld: 'In 2020, hackers used this same technique to remotely take over Windows computers just by sending a crafted network message (CVE-2020-0796).',
};

export default rit03Hijack;
