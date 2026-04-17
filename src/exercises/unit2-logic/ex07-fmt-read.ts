import { Exercise } from '../types';

const ex07FmtRead: Exercise = {
  id: 'logic-07',
  unitId: 'unit2-logic',
  title: '07: Format String: Reading',
  desc: 'The program passes your input directly to <strong>printf()</strong> as the format string. Normally printf expects a fixed string like "hello %s". But if YOU control the format string, you can use <strong>%x</strong> to read values from the stack — like a secret password stored in memory.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    int secret = 0xCAFEBABE;', cls: '' },
      { text: '    char buf[64];', cls: '' },
      { text: '    fgets(buf, 64, stdin);', cls: '' },
      { text: '    printf(buf);', cls: 'highlight vuln' },
      { text: '    // BUG: user input IS the format string!', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-fmt-read',
  vizMode: 'stack',
  bufSize: 64,
  showSymbols: false,
  showBuilder: false,
  aslr: false,
  fmtRead: true,
  secretValue: 0xCAFEBABE,
  secretOffset: 3,
  check(_sim, _heap, _symbols, flags) {
    return flags.fmtLeakedSecret === true;
  },
  winTitle: 'Secret Leaked!',
  winMsg: 'You used %x to walk up the stack and read the secret value. In real exploits, this technique leaks canaries, return addresses, and heap pointers — anything stored on the stack.',
};

export default ex07FmtRead;
