import { Exercise } from '../types';

const ex02Overflow: Exercise = {
  id: 'stack-02',
  unitId: 'unit1-stack',
  title: '02: The Overflow',
  desc: 'This function reads your input with <strong>gets()</strong> — a dangerous function that doesn\'t check how much you type. Fill the 16-byte buffer, then <strong>keep typing</strong>. Watch what happens when your input spills into the saved bookmark and go-back address above it.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    printf("You entered: %s\\n", buf);', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    printf("Enter your name: ");', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-text',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: false,
  showBuilder: false,
  aslr: false,
  check(sim, _heap, symbols) {
    const ret = sim.getRetAddr();
    return ret !== sim.origRetAddr && !Object.values(symbols).includes(ret);
  },
  winTitle: 'Crash! Segmentation Fault',
  winMsg: 'The program crashed because you overwrote the go-back address with garbage. The computer tried to jump to a nonsense location and exploded. Nice work — in exercise 3, you\'ll control WHERE it jumps instead of just crashing it.',
  realWorld: 'CVE-2023-4911 (Looney Tunables): A buffer overflow in glibc ld.so GLIBC_TUNABLES parsing gave root on most Linux distros.',
};

export default ex02Overflow;
