import { Exercise } from '../types';

const ex10Signedness: Exercise = {
  id: 'logic-10',
  unitId: 'unit2-logic',
  title: '10: Signedness Bug',
  desc: 'The program checks <strong>if (len > 64)</strong> to reject long inputs. But len is a <strong>signed</strong> int — negative numbers are always less than 64! When it\'s cast to <strong>unsigned</strong> for memcpy, -1 becomes 4,294,967,295. Massive overflow from a "small" number.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void copy_data(int len) {', cls: '', fn: true },
      { text: '    char buf[64];', cls: '' },
      { text: '    if (len > 64) {', cls: 'highlight' },
      { text: '        printf("Too long!\\n");', cls: '' },
      { text: '        return;', cls: '' },
      { text: '    }', cls: '' },
      { text: '    memcpy(buf, input, (size_t)len);', cls: 'highlight vuln' },
      { text: '    // cast to unsigned: -1 \u2192 0xFFFFFFFF!', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    int len;', cls: '' },
      { text: '    scanf("%d", &len);', cls: '' },
      { text: '    copy_data(len);', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-signedness',
  vizMode: 'stack',
  bufSize: 64,
  showSymbols: true,
  showBuilder: true,
  aslr: false,
  signedness: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{signed_vs_unsigned}',
  winMsg: 'The negative number slipped past the bounds check, then became a huge unsigned value. memcpy happily overwrote everything. This is why mixing signed and unsigned types is dangerous!',
};

export default ex10Signedness;
