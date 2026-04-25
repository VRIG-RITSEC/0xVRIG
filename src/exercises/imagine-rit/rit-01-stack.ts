import { Exercise } from '../types';

const rit01Stack: Exercise = {
  id: 'rit-01',
  unitId: 'imagine-rit',
  title: '01: The Stack Frame',
  desc: 'Think of memory like a stack of sticky notes. When a function runs, the computer sticks three notes on top: <strong>①</strong> a "go-back address" (where to return when done), <strong>②</strong> a bookmark, and <strong>③</strong> a scratchpad for your input. Click <strong>Step</strong> to watch each one appear.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];  // scratchpad: 16 bytes', cls: 'highlight' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();  // calls the function above', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: false,
  showBuilder: false,
  aslr: false,
  steps: [
    { region: 'none', log: ['info', 'main() is calling vuln()… watch what happens to memory below'] },
    { region: 'ret', log: ['action', 'Sticky note #1: the "go-back address" — so the computer remembers where to return'] },
    { region: 'ebp', log: ['action', 'Sticky note #2: a bookmark (you can ignore this one)'] },
    { region: 'buffer', log: ['action', 'Sticky note #3: the scratchpad — 16 bytes where your input goes'] },
    { region: 'all', log: ['info', 'Done! Notice: your scratchpad (green) sits RIGHT BELOW the go-back address (orange). What happens if we write too much into the scratchpad…?'] },
  ],
  check() { return false; },
  winTitle: 'Stack Frame Complete',
  winMsg: 'You\'ve seen how memory is laid out. The key insight: your input area sits right next to the go-back address with nothing protecting it.',
};

export default rit01Stack;
