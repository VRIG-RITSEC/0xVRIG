import { Exercise } from '../types';

const ex08FmtWrite: Exercise = {
  id: 'logic-08',
  unitId: 'unit2-logic',
  title: '08: Format String: Writing',
  desc: 'The <strong>%n</strong> format specifier doesn\'t print — it <strong>writes</strong>. It stores the number of characters printed so far into a memory address on the stack. Put the right address in your input, advance with %x, then %n writes to it. Change <strong>authorized</strong> from 0 to anything else.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int authorized = 0;  // at 0x0804a020', cls: 'highlight' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[64];', cls: '' },
      { text: '    fgets(buf, 64, stdin);', cls: '' },
      { text: '    printf(buf);', cls: 'highlight vuln' },
      { text: '    if (authorized) win();', cls: 'highlight' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-fmt-write',
  vizMode: 'stack',
  bufSize: 64,
  showSymbols: false,
  showBuilder: false,
  aslr: false,
  fmtWrite: true,
  targetAddr: 0x0804a020,
  check(_sim, _heap, _symbols, flags) {
    return flags.fmtWriteSuccess === true;
  },
  winTitle: 'FLAG{format_string_write}',
  winMsg: 'You used %n to write a value to the authorized variable! Format string bugs are powerful — they let you read AND write arbitrary memory, all through printf.',
  realWorld: 'CVE-2012-0809: A format string vulnerability in sudo allowed local users to escalate to root via crafted environment strings passed to sudo_debug().',
};

export default ex08FmtWrite;
