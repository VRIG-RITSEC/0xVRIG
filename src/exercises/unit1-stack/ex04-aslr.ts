import { Exercise } from '../types';

const ex04Aslr: Exercise = {
  id: 'stack-04',
  unitId: 'unit1-stack',
  title: '04: Randomized Addresses',
  desc: 'Now the computer shuffles where everything is in memory each time the program runs (<strong>ASLR</strong>). Your old address for win() won\'t work anymore! But the program accidentally prints where <strong>main()</strong> is. Since win() is always <strong>+0x150</strong> bytes after main(), you can do the math. Use the hex calculator to add the leaked address + offset.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("FLAG{aslr_defeated}\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    // info leak — but not the function we want', cls: 'cmt' },
      { text: '    printf("DEBUG: main=%p\\n", main);', cls: 'highlight' },
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
  showSymbols: false,
  showBuilder: true,
  showCalc: true,
  aslr: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{aslr_defeated}',
  winMsg: 'Even though the addresses were randomized, you figured out win()\'s address by reading the leaked main() address and doing simple math. This is exactly how real hackers beat ASLR — find one leaked address, calculate the rest.',
};

export default ex04Aslr;
