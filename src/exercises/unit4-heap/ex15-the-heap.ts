import { Exercise } from '../types';

const ex15TheHeap: Exercise = {
  id: 'heap-15',
  unitId: 'unit4-heap',
  title: '15: The Heap',
  desc: 'The <strong>heap</strong> is another region of memory, used when the program asks for memory at runtime with <strong>malloc()</strong>. Each block has a small header (metadata) followed by your data. When you <strong>free()</strong> a block, it goes on a recycling list \u2014 and the next malloc of the same size gets it back.',
  source: {
    c: [
      { text: '// How dynamic memory works', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = malloc(16);', cls: 'highlight' },
      { text: '    char *b = malloc(16);', cls: 'highlight' },
      { text: '    free(a);', cls: 'highlight vuln' },
      { text: '    free(b);', cls: 'highlight vuln' },
      { text: '    char *c = malloc(16);', cls: 'highlight' },
      { text: '    // c gets recycled memory!', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 256,
  steps: [
    { action: 'init', log: ['info', 'The heap starts as one big block of empty memory \u2014 the "top chunk" (leftover space). Click Step to watch malloc() and free() in action.'] },
    { action: 'malloc', size: 16, name: 'A', srcLine: 4, log: ['action', 'malloc(16) \u2014 carves a 24-byte block from the top (16 bytes data + 8 bytes header metadata)'] },
    { action: 'malloc', size: 16, name: 'B', srcLine: 5, log: ['action', 'malloc(16) \u2014 second block carved, right after the first'] },
    { action: 'free', name: 'A', srcLine: 6, log: ['action', 'free(A) \u2014 block A goes to the recycling list (tcache). Notice the pointer (fd) in its data area \u2014 it points to the next free block.'] },
    { action: 'free', name: 'B', srcLine: 7, log: ['action', 'free(B) \u2014 block B also freed. Its fd pointer points to A, forming a chain: B \u2192 A \u2192 nil'] },
    { action: 'malloc', size: 16, name: 'C', srcLine: 8, log: ['action', 'malloc(16) \u2014 the allocator checks the recycling list FIRST. B was most recently freed, so it comes back (last in, first out)!'] },
    { action: 'done', log: ['success', 'The heap allocator recycles freed blocks. When you free memory and it gets reused, the new data occupies the SAME spot as the old data. This recycling behavior is what makes heap exploits possible!'] },
  ],
  check() { return false; },
  winTitle: 'Heap Basics Complete',
  winMsg: 'You have observed how the heap allocator works.',
  realWorld: 'CVE-2021-22555: A heap out-of-bounds write in Linux Netfilter was used for local privilege escalation from unprivileged user to root.',
};

export default ex15TheHeap;
