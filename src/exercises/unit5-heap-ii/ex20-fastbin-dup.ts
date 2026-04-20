import { Exercise } from '../types';

const ex20FastbinDup: Exercise = {
  id: 'heap2-20',
  unitId: 'unit5-heap-ii',
  title: '20: Fastbin Dup',
  desc: 'Fastbins are used for small chunks when the tcache is full. Fastbins only check if the chunk being freed is the <strong>same as the head</strong> of the list. By freeing A, then B, then A again, you bypass the check and create a <strong>cycle</strong>: A \u2192 B \u2192 A \u2192 B \u2192 ... This lets you get two allocations at the same address and control where the third one lands.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void (**handler)();  // func ptr table', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    // Fill tcache (7 frees of same size)', cls: 'cmt' },
      { text: '    for (int i=0; i<7; i++)', cls: '' },
      { text: '        free(malloc(16));', cls: '' },
      { text: '    char *a = malloc(16);', cls: '' },
      { text: '    char *b = malloc(16);', cls: '' },
      { text: '    free(a);', cls: 'highlight' },
      { text: '    free(b);', cls: 'highlight' },
      { text: '    free(a);  // double free into fastbin!', cls: 'highlight vuln' },
      { text: '    // Drain tcache with 7 mallocs', cls: 'cmt' },
      { text: '    for (int i=0; i<7; i++) malloc(16);', cls: '' },
      { text: '    char *c = malloc(16); // gets A', cls: '' },
      { text: '    *(void**)c = TARGET;', cls: 'highlight vuln' },
      { text: '    malloc(16); // gets B', cls: '' },
      { text: '    malloc(16); // gets A again (cycle!)', cls: '' },
      { text: '    char *d = malloc(16); // gets TARGET!', cls: 'highlight' },
      { text: '    *(void**)d = win;', cls: 'highlight' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-fastbin-dup',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 512,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{fastbin_dup}',
  winMsg: 'Fastbin only checks if the chunk being freed is the same as the list head. By freeing B between two frees of A, you bypassed the check and created a cycle. This gave you two allocations at the same address \u2014 and control over where the third allocation lands.',
};

export default ex20FastbinDup;
