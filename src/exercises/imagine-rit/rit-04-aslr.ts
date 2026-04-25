import { Exercise } from '../types';

const rit04Aslr: Exercise = {
  id: 'rit-04',
  unitId: 'imagine-rit',
  title: '04: Randomized Addresses',
  desc: 'The computer got smarter — it <strong>scrambles</strong> where everything lives in memory each time. Your old win() address won\'t work! But the program accidentally leaks where <strong>main()</strong> is. Since win() is always <strong>+0x150</strong> after main, you just add: <em>leaked address + 0x150 = win()</em>. Use the calculator on the right, then build your payload the same way as before.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {  // SECRET FUNCTION', cls: '' },
      { text: '    printf("FLAG{aslr_defeated}\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    // Oops! Program leaks an address:', cls: 'cmt' },
      { text: '    printf("DEBUG: main is at %p\\n", main);', cls: 'highlight' },
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
  protections: [{ name: 'ASLR', status: 'bypassed' }],
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{aslr_defeated}',
  winMsg: 'Even though the addresses were scrambled, you beat it with simple addition! One leaked address was all you needed. This is how real hackers defeat address randomization — find one leak, calculate the rest.',
  realWorld: 'Nearly every modern hack needs to beat address randomization first. Hackers hunt for any place where a program accidentally reveals an address.',
};

export default rit04Aslr;
