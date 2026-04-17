import { Exercise } from '../types';

const ex24HouseOrange: Exercise = {
  id: 'heap2-24',
  unitId: 'unit5-heap-ii',
  title: '24: House of Orange',
  desc: 'What if there\'s no <code>free()</code> call anywhere in the program? <strong>House of Orange</strong> corrupts the top chunk size via overflow, then a large <code>malloc()</code> that exceeds the (now-small) top triggers <code>sysmalloc</code>, which frees the old top chunk into the unsorted bin. Now you have a freed chunk to exploit \u2014 without ever calling free()!',
  source: {
    c: [
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void (**handler)();  // at 0x0804a040', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = malloc(16);', cls: '' },
      { text: '    // Overflow from a into top chunk size', cls: 'cmt' },
      { text: '    *(size_t*)(a+16) = 0;', cls: 'highlight' },
      { text: '    *(size_t*)(a+20) = 0x81;', cls: 'highlight vuln' },
      { text: '    // Top chunk now thinks it\'s only 0x80 bytes', cls: 'cmt' },
      { text: '    char *b = malloc(256);', cls: 'highlight' },
      { text: '    // 256 > 0x80 - triggers sysmalloc!', cls: 'cmt' },
      { text: '    // Old top chunk freed to unsorted bin', cls: 'cmt' },
      { text: '    // UAF: corrupt old top\'s bk pointer', cls: 'cmt' },
      { text: '    // malloc from unsorted writes to bk->fd', cls: 'cmt' },
      { text: '    char *c = malloc(96);', cls: 'highlight' },
      { text: '    // Triggers unsorted bin unlink!', cls: 'cmt' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-house-orange',
  vizMode: 'heap',
  heapSize: 512,
  showSymbols: true,
  showCalc: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler && heap.funcPtrs.handler.current !== symbols.normal && heap.funcPtrs.handler.current !== 0;
  },
  winTitle: 'FLAG{house_of_orange}',
  winMsg: 'No free()? No problem. By corrupting the top chunk size and triggering a large allocation, you forced the allocator to free the old top chunk itself. Then you used the freed chunk to overwrite a function pointer. This is House of Orange \u2014 creating a free without calling free().',
};

export default ex24HouseOrange;
