import { Exercise } from '../types';

const ex25HouseEinherjar: Exercise = {
  id: 'heap2-25',
  unitId: 'unit5-heap-ii',
  title: '25: House of Einherjar',
  desc: 'An <strong>off-by-one null byte</strong> overflow clears the PREV_IN_USE flag of the next chunk. When that chunk is freed, the allocator thinks the previous chunk is also free and does <strong>backward consolidation</strong> \u2014 merging them into one huge chunk. By crafting a fake prev_size, you control where the merged chunk starts, giving you an overlapping allocation.',
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
      { text: '    char *b = malloc(16);', cls: '' },
      { text: '    char *c = malloc(16);', cls: '' },
      { text: '    char *guard = malloc(16);', cls: '' },
      { text: '    // Off-by-one from A: null byte into B header', cls: 'cmt' },
      { text: '    a[16] = 0x00;', cls: 'highlight vuln' },
      { text: '    // B\'s size 0x19 becomes 0x18 (PREV_INUSE cleared!)', cls: 'cmt' },
      { text: '    // Set B\'s prev_size to span back to A', cls: 'cmt' },
      { text: '    *(size_t*)(b-4) = 0x18;', cls: 'highlight' },
      { text: '    free(c);', cls: 'highlight' },
      { text: '    // Backward consolidation merges B+C into A', cls: 'cmt' },
      { text: '    char *d = malloc(64);', cls: 'highlight' },
      { text: '    // d overlaps with original chunks!', cls: 'cmt' },
      { text: '    *(void**)d = win;', cls: 'highlight' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-house-einherjar',
  vizMode: 'heap',
  heapSize: 512,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{house_of_einherjar}',
  winMsg: 'A single null byte changed the prev_in_use flag, tricking the allocator into thinking the previous chunk was free. Backward consolidation merged chunks together, creating an overlapping allocation. This is House of Einherjar \u2014 one byte to control heap layout.',
};

export default ex25HouseEinherjar;
