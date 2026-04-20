import { Exercise } from '../types';

const ex18HeapOverflow: Exercise = {
  id: 'heap-18',
  unitId: 'unit4-heap',
  title: '18: Heap Overflow',
  desc: 'Just like stack overflows, heap blocks can overflow into each other. If you write past the end of block A, you overwrite block B\'s header and data. Corrupt B\'s data (which contains a function pointer) to redirect execution.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: 'void normal() { printf("Normal\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = malloc(16);', cls: '' },
      { text: '    // b holds a function pointer at offset 0', cls: 'cmt' },
      { text: '    void (**b)() = malloc(16);', cls: '' },
      { text: '    *b = normal;', cls: '' },
      { text: '    // Bug: reads too many bytes into a!', cls: 'cmt' },
      { text: '    read(0, a, 64);', cls: 'highlight vuln' },
      { text: '    (*b)();  // calls the function pointer', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-overflow',
  vizMode: 'heap',
  heapSize: 256,
  showSymbols: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{heap_overflow}',
  winMsg: 'You wrote past the end of block A, through B\'s header, and overwrote B\'s function pointer with win()\'s address. Heap overflows can corrupt adjacent chunks \u2014 their headers, their data, whatever comes next in memory.',
};

export default ex18HeapOverflow;
