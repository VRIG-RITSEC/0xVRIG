import { Exercise } from '../types';

const adv2101: Exercise = {
  id: 'adv2-101',
  unitId: 'unit17-advanced-ii',
  title: '101: Data-Only Attacks',
  desc: '<b>Goal:</b> Overflow a buffer to corrupt a non-control-data variable without touching any code pointer. Modern mitigations (stack canaries, CFI, shadow stacks) protect return addresses and function pointers. But <strong>data is still vulnerable</strong>. Here, <code>isAdmin</code> sits directly above <code>buf[16]</code> on the stack. Overflow buf to write any non-zero value into <code>isAdmin</code> — the program grants admin access and calls <code>win()</code>. No return address corruption needed. Craft a hex payload: 16 bytes of buffer fill, then at least one non-zero byte to set isAdmin.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("Admin access granted!\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    int isAdmin = 0;', cls: 'highlight' },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    if (isAdmin) {', cls: 'highlight' },
      { text: '        win();', cls: '' },
      { text: '    } else {', cls: '' },
      { text: '        printf("Access denied.\\n");', cls: '' },
      { text: '    }', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Stack layout:', cls: 'cmt' },
      { text: '// [buf 16 bytes] [isAdmin 4 bytes] [EBP] [RET]', cls: 'cmt' },
      { text: '// Overflow buf → corrupt isAdmin!', cls: 'cmt' },
      { text: '// No code pointer modification needed.', cls: 'cmt' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{data_only_attack}',
  winMsg: 'You corrupted a non-control variable (isAdmin) without modifying any code pointer. Stack canaries, CFI, and shadow stacks would not have caught this — they only protect control flow. Data-only attacks remain effective against all control-flow integrity defenses, which is why Data-Flow Integrity (DFI) research is an active area.',
  realWorld: 'CVE-2013-2028: Nginx data-only attack via stack buffer overflow — corrupting a signed integer to bypass length checks without modifying return addresses.',
};

export default adv2101;
