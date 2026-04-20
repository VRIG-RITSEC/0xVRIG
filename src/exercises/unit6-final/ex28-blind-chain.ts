import { Exercise } from '../types';

const ex28BlindChain: Exercise = {
  id: 'final-28',
  unitId: 'unit6-final',
  title: '28: Blind Chain',
  desc: 'Good luck.',
  source: {
    c: [
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// Good luck.', cls: 'cmt' },
      { text: 'void ???() { /* 0x08048150 */ }', cls: '' },
      { text: 'void normal() { /* ... */ }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    void *ptrs[4];', cls: '' },
      { text: '    for (int i = 0; i < 4; i++)', cls: '' },
      { text: '        ptrs[i] = malloc(32);', cls: '' },
      { text: '    ptrs[0]->fn = normal;', cls: '' },
      { text: '', cls: '' },
      { text: '    free(ptrs[1]);', cls: '' },
      { text: '    free(ptrs[2]);', cls: '' },
      { text: '    // ptrs[2] is freed but still accessible', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '    read(0, ptrs[2], 32);', cls: '' },
      { text: '    void *x = malloc(32);', cls: '' },
      { text: '    void *y = malloc(32);', cls: '' },
      { text: '    read(0, y, 4);', cls: '' },
      { text: '', cls: '' },
      { text: '    ptrs[0]->fn();', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'final-blind',
  vizMode: 'heap',
  heapSize: 512,
  showSymbols: false,
  showLabels: false,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.fn?.current === symbols.win;
  },
  winTitle: 'FLAG{you_are_ready}',
  winMsg: 'You solved the final challenge with minimal guidance. You identified the vulnerability, figured out the memory layout, calculated the right addresses, and chained it all together. You\'re ready for real CTF challenges and vulnerability research. Welcome to the field.',
};

export default ex28BlindChain;
