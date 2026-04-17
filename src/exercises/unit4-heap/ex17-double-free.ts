import { Exercise } from '../types';

const ex17DoubleFree: Exercise = {
  id: 'heap-17',
  unitId: 'unit4-heap',
  title: '17: Double Free',
  desc: 'What happens if you free the same block <strong>twice</strong>? The recycling list gets confused \u2014 the freed block points to itself, creating a loop. Then when you malloc, you can make the allocator return any address you want by overwriting the forward pointer.',
  source: {
    c: [
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = malloc(16);', cls: '' },
      { text: '    free(a);', cls: 'highlight vuln' },
      { text: '    free(a);  // double free!', cls: 'highlight vuln' },
      { text: '    char *b = malloc(16);', cls: '' },
      { text: '    // b points to same block as a', cls: 'cmt' },
      { text: '    // write target addr as b\'s data', cls: 'cmt' },
      { text: '    *(void**)b = TARGET;', cls: 'highlight' },
      { text: '    malloc(16); // returns a again', cls: '' },
      { text: '    char *c = malloc(16);', cls: 'highlight' },
      { text: '    // c now points to TARGET!', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-double-free',
  vizMode: 'heap',
  heapSize: 256,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{double_free}',
  winMsg: 'The double free created a cycle in the recycling list. You overwrote the forward pointer to point at the function pointer table. The allocator thought it was returning a valid free block, but it actually gave you control over the function pointer. Double free is a classic heap exploit primitive.',
  realWorld: 'CVE-2017-2636: A double-free in the Linux kernel n_hdlc driver allowed local privilege escalation. Exploited by corrupting the freed object with controlled data.',
};

export default ex17DoubleFree;
