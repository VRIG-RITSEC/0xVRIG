import { Exercise } from '../types';

const ex26HouseLore: Exercise = {
  id: 'heap2-26',
  unitId: 'unit5-heap-ii',
  title: '26: House of Lore',
  desc: 'The <strong>smallbin</strong> is a doubly-linked list with both fd and bk pointers. When malloc removes a chunk from a smallbin, it checks that <code>victim->bk->fd == victim</code> (a consistency check). By corrupting a freed chunk\'s bk to point to a <strong>fake chunk</strong> whose fd points back to the real chunk, you pass the check. Two mallocs later, the allocator hands you the fake chunk \u2014 at YOUR chosen address.',
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
      { text: '    // Fill tcache for size 24', cls: 'cmt' },
      { text: '    char *a = malloc(80);', cls: '' },
      { text: '    char *guard = malloc(16);', cls: '' },
      { text: '    free(a); // goes to unsorted bin (big)', cls: '' },
      { text: '    malloc(120); // triggers sort into smallbin', cls: '' },
      { text: '    // a is now in smallbin', cls: 'cmt' },
      { text: '    // UAF: corrupt a\'s bk to point to fake chunk', cls: 'cmt' },
      { text: '    fake_chunk.fd = &a; // pass bk->fd == victim', cls: 'highlight vuln' },
      { text: '    a->bk = &fake_chunk;', cls: 'highlight vuln' },
      { text: '    char *p1 = malloc(80); // returns a', cls: 'highlight' },
      { text: '    char *p2 = malloc(80); // returns fake!', cls: 'highlight' },
      { text: '    *(void**)p2 = win;', cls: 'highlight' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-house-lore',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 512,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{house_of_lore}',
  winMsg: 'You bypassed the doubly-linked list check by setting up both pointers correctly \u2014 the fake chunk\'s fd pointed back to the real bin. The allocator followed bk to your fake chunk and handed it out as a valid allocation. This is House of Lore \u2014 trick the linked list validation.',
};

export default ex26HouseLore;
