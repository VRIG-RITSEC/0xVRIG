import { Exercise } from '../types';

const ex09OffByOne: Exercise = {
  id: 'logic-09',
  unitId: 'unit2-logic',
  title: '09: Off-by-One',
  desc: 'The loop uses <strong>&lt;=</strong> instead of <strong>&lt;</strong>, writing one extra byte past the buffer. That single byte overwrites the low byte of the saved bookmark (EBP). This shifts where the <strong>next</strong> function reads its go-back address from — giving you sneaky indirect control.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    int i;', cls: '' },
      { text: '    for (i = 0; i <= 16; i++) {', cls: 'highlight vuln' },
      { text: '        buf[i] = read_byte();', cls: '' },
      { text: '    }', cls: '' },
      { text: '    // writes 17 bytes — one past buf!', cls: 'cmt' },
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
  showBuilder: false,
  aslr: false,
  offByOne: true,
  check(_sim, _heap, _symbols, flags) {
    return flags.oboWin === true;
  },
  winTitle: 'FLAG{off_by_one}',
  winMsg: 'One byte! You changed the low byte of the saved bookmark, which shifted where main() reads its go-back address from. On main\'s return, it jumped to win(). Off-by-one errors are dangerous even when you can\'t directly reach the return address.',
};

export default ex09OffByOne;
