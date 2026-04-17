import { Exercise } from '../types';

export const mips77: Exercise = {
  id: 'mips-77',
  unitId: 'unit14-mips',
  title: 'MIPS Stack Overflow',
  desc: 'Time to exploit a MIPS stack overflow! The function has a 16-byte buffer and saves <code>$ra</code> above it on the stack. Overflow the buffer to overwrite the saved <code>$ra</code> with the address of <code>win()</code>. When the function epilogue executes <code>lw $ra, 20($sp)</code> followed by <code>jr $ra</code>, it will jump to your chosen address. Note: MIPS is <b>big-endian</b>, so addresses are written MSB first (opposite of x86 little-endian).',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: '/* MIPS big-endian — addresses stored MSB first */', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("FLAG{mips_ra_hijack}\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    /* Prologue saved $ra at 20($sp) */', cls: 'cmt' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    /* Epilogue: lw $ra, 20($sp); jr $ra */', cls: 'cmt' },
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
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{mips_ra_hijack}',
  winMsg: 'You hijacked $ra on a MIPS stack! Unlike x86, where CALL pushes the return address, MIPS stores $ra explicitly in the stack frame. The overflow is conceptually the same: fill the buffer, overwrite the saved return address, and redirect control flow.',
};
