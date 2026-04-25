import { Exercise } from '../types';

const babyRop: Exercise = {
  id: 'rit-rop',
  unitId: 'imagine-rit',
  title: "05: Baby's First ROP",
  desc: 'Final boss! The program blocks new code, but there\'s a <strong>gadget</strong> — a reusable snippet already in memory. This one loads two values from the stack and writes one into the other. Your chain: <strong>①</strong> 20 bytes padding, <strong>②</strong> gadget address (from the table), <strong>③</strong> the magic value 0xdeadbeef, <strong>④</strong> the target address 0x0804a040, <strong>⑤</strong> win() address. The gadget writes the magic value into flag_check, then you jump to win()!',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// New code is blocked...', cls: 'cmt' },
      { text: '// But this gadget already exists in the program:', cls: 'cmt' },
      { text: '// 0x08048300: load two values, write one to the other\'s address', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'int flag_check = 0;  // at address 0x0804a040', cls: 'highlight' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    if (flag_check == 0xdeadbeef)', cls: '' },
      { text: '        printf("FLAG{baby_rop}\\n");', cls: 'highlight' },
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
  showBuilder: false,
  showGadgetTable: true,
  aslr: false,
  nx: true,
  rop: true,
  protections: [{ name: 'NX/DEP', status: 'bypassed' }],
  gadgets: {
    0x08048300: 'pop eax; pop ebx; mov [ebx], eax; ret',
  },
  flagAddr: 0x0804a040,
  magicValue: 0xdeadbeef,
  check(_sim, _heap, _symbols, flags) {
    return flags.ropWin === true;
  },
  winTitle: 'FLAG{baby_rop}',
  winMsg: 'You used one gadget to write a value into memory, then jumped to win(). That\'s a real ROP chain — reusing existing code to do what you want! Workshop complete!',
  realWorld: 'This "code reuse" technique is behind almost every modern hack — it was used to jailbreak iPhones, hack game consoles, and break into browsers.',
};

export default babyRop;
