import { Exercise } from '../types';

const rit02Overflow: Exercise = {
  id: 'rit-02',
  unitId: 'imagine-rit',
  title: '02: The Overflow',
  desc: 'The scratchpad only fits 16 bytes, but the program doesn\'t check how much you send! Use the <strong>payload builder</strong> to add padding — keep going past 16 bytes and watch your data spill into the go-back address. Once you trash it, the program won\'t know where to go and it crashes.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];  // only 16 bytes!', cls: '' },
      { text: '    gets(buf);     // no size check!', cls: 'highlight vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    printf("What is your name? ");', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: false,
  showBuilder: true,
  aslr: false,
  check(sim, _heap, symbols) {
    const ret = sim.getRetAddr();
    return ret !== sim.origRetAddr && !Object.values(symbols).includes(ret);
  },
  winTitle: 'CRASH! The program broke.',
  winMsg: 'You just crashed the program by sending too much data! Your extra bytes overwrote the go-back address with garbage, so the computer tried to jump to a nonsense location and exploded. Next up — what if we control WHERE it jumps instead of just crashing?',
  realWorld: 'This is exactly how hackers crashed programs in the real world — the famous "Morris Worm" (1988) used this same trick to infect 10% of the entire internet.',
};

export default rit02Overflow;
