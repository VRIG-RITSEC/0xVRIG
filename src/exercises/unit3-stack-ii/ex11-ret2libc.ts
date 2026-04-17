import { Exercise } from '../types';

const ex11Ret2libc: Exercise = {
  id: 'stack2-11',
  unitId: 'unit3-stack-ii',
  title: '11: Return to Libc',
  desc: 'The stack is marked <strong>no-execute</strong> (NX) — you can\'t run your own code there. But you can call <strong>system("/bin/sh")</strong> which already exists in the program! Overwrite the go-back address with system\'s address, then set up a fake call frame: a dummy return address (anything), then the address of the "/bin/sh" string as the argument.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// NX enabled \u2014 stack is not executable!', cls: 'cmt' },
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
      { text: '', cls: '' },
      { text: '// In libc:', cls: 'cmt' },
      { text: '// system() at 0x08048200', cls: 'cmt' },
      { text: '// "/bin/sh" string at 0x08049300', cls: 'cmt' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: false,
  aslr: false,
  nx: true,
  ret2libc: true,
  check(sim, _heap, symbols) {
    const retAddr = sim.getRetAddr();
    const argOffset = sim.bufSize + sim.canarySize + sim.ebpSize + sim.retSize + 4;
    const arg = sim._readLE(argOffset, 4);
    return retAddr === symbols.system && arg === symbols.binsh;
  },
  winTitle: 'FLAG{ret2libc}',
  winMsg: 'You called system("/bin/sh") without writing any code on the stack! By reusing functions already in memory, you bypassed NX. This technique is called "return to libc" and it was the first major NX bypass.',
};

export default ex11Ret2libc;
