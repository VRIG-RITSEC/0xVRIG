import { Exercise } from '../types';

const ex19TcachePoison: Exercise = {
  id: 'heap2-19',
  unitId: 'unit5-heap-ii',
  title: '19: Tcache Poisoning',
  desc: 'The <strong>tcache</strong> is a per-thread cache of recently freed chunks. Each bin is a singly-linked list \u2014 freed chunks have a <em>forward pointer (fd)</em> that points to the next free chunk. If you can overwrite that fd pointer (via a use-after-free or overflow), the allocator will follow it and return <strong>any address you choose</strong> as a valid allocation.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: 'void normal() { printf("Normal\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void (**handler)();  // func ptr table', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = malloc(16);', cls: '' },
      { text: '    char *b = malloc(16);', cls: '' },
      { text: '    free(b);', cls: 'highlight' },
      { text: '    // b is freed but pointer still exists (UAF)', cls: 'cmt' },
      { text: '    // Overwrite b\'s fd pointer:', cls: 'cmt' },
      { text: '    *(void**)b = TARGET_ADDR;', cls: 'highlight vuln' },
      { text: '    char *c = malloc(16);', cls: '' },
      { text: '    // c = b (from tcache)', cls: 'cmt' },
      { text: '    char *d = malloc(16);', cls: 'highlight' },
      { text: '    // d = TARGET_ADDR! (poisoned fd)', cls: 'cmt' },
      { text: '    *(void**)d = win;', cls: 'highlight' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-tcache-poison',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 256,
  showSymbols: true,
  funcPtrAddr: 0x0804a040,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{tcache_poison}',
  winMsg: 'You poisoned the tcache forward pointer. The allocator blindly followed it and gave you a chunk at YOUR chosen address. Tcache has minimal security checks \u2014 overwrite fd, get arbitrary allocation.',
  realWorld: 'Tcache poisoning became a dominant heap exploitation technique after glibc 2.26 (2017). CVE-2020-6449: A Chrome use-after-free exploited tcache to achieve RCE.',
};

export default ex19TcachePoison;
