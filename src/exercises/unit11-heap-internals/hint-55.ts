import { Exercise } from '../types';

const hint55: Exercise = {
  id: 'hint-55',
  unitId: 'unit11-heap-internals',
  title: '55: Bin Types',
  desc: '<b>Goal:</b> Learn the four bin categories that glibc uses to organize freed chunks. <strong>Fast bins</strong> (LIFO, sizes 16-80) for speed, the <strong>unsorted bin</strong> (staging area for recently freed chunks), <strong>small bins</strong> (exact-size FIFO lists), and <strong>large bins</strong> (sorted ranges for big allocations).',
  source: {
    c: [
      { text: '// Observing different bin types', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    // Small chunk (fastbin/tcache range)', cls: 'cmt' },
      { text: '    char *s = malloc(24);', cls: 'highlight' },
      { text: '    // Medium chunk (small bin range)', cls: 'cmt' },
      { text: '    char *m = malloc(256);', cls: 'highlight' },
      { text: '    // Prevent top-chunk consolidation', cls: 'cmt' },
      { text: '    char *guard = malloc(16);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '    free(s);  // -> tcache or fastbin', cls: 'highlight' },
      { text: '    free(m);  // -> unsorted bin', cls: 'highlight vuln' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 512,
  steps: [
    {
      action: 'init',
      log: ['info', 'When chunks are freed, they go into bins -- linked lists organized by size. glibc maintains four types: fast bins, unsorted bin, small bins, and large bins. Let\'s allocate different sizes and see where they land after free.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 24, name: 'S', srcLine: 5,
      log: ['action', 'malloc(24) -- allocates a 32-byte chunk (24 data + 8 header). This is in the "small" range. When freed, it will first go to the tcache (or fastbin if tcache is full). Chunk sizes up to 80 bytes qualify for fast bins.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('S', 'data'); heap.annotateField?.('S', 'size', '0x21 (32|P)'); },
    },
    {
      action: 'malloc', size: 256, name: 'M', srcLine: 7,
      log: ['action', 'malloc(256) -- allocates a 264-byte chunk. This is too large for fast bins (max ~80 bytes). When freed, it will go to the unsorted bin first, then get sorted into a small bin (exact size) or large bin (size range).'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('M', 'data'); heap.annotateField?.('M', 'size', '0x109 (264|P)'); },
    },
    {
      action: 'malloc', size: 16, name: 'guard', srcLine: 9,
      log: ['action', 'malloc(16) -- a guard allocation to prevent M from merging with the top chunk when freed. Without this, free(M) would just extend the top chunk instead of going into a bin.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('guard', 'data'); },
    },
    {
      action: 'free', name: 'S', srcLine: 11,
      log: ['action', 'free(S) -- the 32-byte chunk goes to the tcache (per-thread cache, LIFO). Tcache is checked first on both malloc and free. If the tcache bin for this size is full (7 entries), it would go to the corresponding fast bin instead.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('S', 'freed'); heap.annotateField?.('S', 'fd', 'tcache fd'); },
    },
    {
      action: 'init',
      log: ['info', 'Fast bins are singly-linked LIFO lists. There is one fast bin per chunk size (16, 24, 32, ... up to 80 bytes). They are never coalesced with neighbors -- speed over memory efficiency.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('S', 'freed'); },
    },
    {
      action: 'free', name: 'M', srcLine: 12,
      log: ['action', 'free(M) -- the 264-byte chunk is too big for fast bins. It goes to the unsorted bin, a single doubly-linked list that acts as a staging area. On the next malloc, the allocator scans the unsorted bin and sorts chunks into the correct small or large bin.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('M', 'freed'); heap.annotateField?.('M', 'fd', 'unsorted fd'); heap.annotateField?.('M', 'bk', 'unsorted bk'); },
    },
    {
      action: 'init',
      log: ['info', 'Bin summary: (1) Tcache/Fast bins: small chunks, LIFO, no coalescing, fastest path. (2) Unsorted bin: staging area, doubly-linked. (3) Small bins: exact-size FIFO lists for chunks < 512 bytes. (4) Large bins: sorted lists for chunks >= 512 bytes.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clearHighlight?.(); },
    },
    {
      action: 'done',
      log: ['success', 'You\'ve seen how chunk size determines which bin receives a freed chunk. Exploits target specific bins: tcache poisoning attacks the tcache, fastbin dup attacks fast bins, unsorted bin attacks exploit the sorting step. Knowing which bin your chunk lands in is step one of any heap exploit.'],
    },
  ],
  check() { return false; },
  winTitle: 'Bin Types Explored',
  winMsg: 'You now know the four bin types: tcache/fast bins for small chunks (LIFO, fast), unsorted bin as a staging area, small bins for exact-size recycling, and large bins for big allocations.',
};

export default hint55;
