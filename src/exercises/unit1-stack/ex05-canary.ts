import { Exercise } from '../types';

const ex05Canary: Exercise = {
  id: 'stack-05',
  unitId: 'unit1-stack',
  title: '05: The Tripwire',
  desc: 'The program now places a secret value (a <strong>stack canary</strong>) between your buffer and the important stuff above it — like a tripwire. If you overwrite it, the program catches you and aborts. But there\'s a bug that leaks the secret value. Put the correct canary bytes in your payload at the right spot to sneak past the tripwire.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("FLAG{canary_bypassed}\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    // format string leak — prints stack contents', cls: 'cmt' },
      { text: '    printf(buf);', cls: 'highlight' },
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
  canary: true,
  check(sim, _heap, symbols) {
    return sim.canaryIntact() && sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{canary_bypassed}',
  winMsg: 'You read the leaked secret value and carefully placed it in your payload so the tripwire stayed intact — while still overwriting the go-back address. Sneaky! This is how real attackers bypass stack canaries.',
};

export default ex05Canary;
