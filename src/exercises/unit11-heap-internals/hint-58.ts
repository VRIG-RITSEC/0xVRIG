import { Exercise } from '../types';

const hint58: Exercise = {
  id: 'hint-58',
  unitId: 'unit11-heap-internals',
  title: '58: Coalescing & Unlink',
  desc: '<b>Goal:</b> Learn how glibc merges adjacent free chunks to reduce fragmentation. When a chunk is freed, the allocator checks its neighbors: if the previous chunk is free (<strong>backward consolidation</strong>) or the next chunk is free (<strong>forward consolidation</strong>), they are merged via the <strong>unlink</strong> macro. Corrupting unlink metadata was the basis of classic heap exploits.',
  source: {
    c: [
      { text: '// Coalescing: merging adjacent free chunks', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *A = malloc(128);', cls: 'highlight' },
      { text: '    char *B = malloc(128);', cls: 'highlight' },
      { text: '    char *C = malloc(128);', cls: 'highlight' },
      { text: '    char *guard = malloc(16);', cls: 'highlight' },
      { text: '    // guard prevents C from merging with top', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '    free(B);  // B goes to unsorted bin', cls: 'highlight vuln' },
      { text: '    free(A);  // A merges with B!', cls: 'highlight vuln' },
      { text: '    // A+B are now one big free chunk', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 1024,
  steps: [
    {
      action: 'init',
      log: ['info', 'Fragmentation is the enemy of allocators. When two adjacent chunks are both free, glibc merges them into one larger chunk -- this is called coalescing. The unlink macro removes a chunk from its bin so it can be absorbed into its neighbor. Let\'s watch it happen.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 128, name: 'A', srcLine: 4,
      log: ['action', 'malloc(128) -- chunk A: 136 bytes (128 data + 8 header). Size field = 0x89 (136 | PREV_INUSE). These are too large for fast bins, so when freed they will go to the unsorted bin and can be coalesced.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'data'); heap.annotateField?.('A', 'size', '0x89 (136|P)'); },
    },
    {
      action: 'malloc', size: 128, name: 'B', srcLine: 5,
      log: ['action', 'malloc(128) -- chunk B: 136 bytes, right after A. B\'s P bit is set (A is in use). Note: fast bins are NOT coalesced, but chunks this size (> 80 bytes) go through the normal free path which does coalesce.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('B', 'data'); heap.annotateField?.('B', 'size', '0x89 (136|P)'); },
    },
    {
      action: 'malloc', size: 128, name: 'C', srcLine: 6,
      log: ['action', 'malloc(128) -- chunk C: 136 bytes, right after B. Three contiguous chunks are now allocated.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('C', 'data'); },
    },
    {
      action: 'malloc', size: 16, name: 'guard', srcLine: 7,
      log: ['action', 'malloc(16) -- a guard chunk after C. Without this, freeing C would just merge it into the top chunk (the wilderness). The guard keeps C as a distinct free chunk.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('guard', 'data'); },
    },
    {
      action: 'free', name: 'B', srcLine: 10,
      log: ['action', 'free(B) -- B goes to the unsorted bin (too large for fast bins/tcache at this size). The allocator checks B\'s neighbors: A is still in use (P bit of B = 1), and C is still in use (P bit of the chunk after B = 1). No coalescing occurs. B\'s prev_size in the next chunk\'s header is set to 136 so C knows B\'s size.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('B', 'freed'); heap.annotateField?.('B', 'fd', 'unsorted fd'); heap.annotateField?.('B', 'bk', 'unsorted bk'); },
    },
    {
      action: 'free', name: 'A', srcLine: 11,
      log: ['warn', 'free(A) -- the allocator checks A\'s forward neighbor: B is FREE! Forward consolidation triggers. The unlink macro removes B from the unsorted bin (B->fd->bk = B->bk; B->bk->fd = B->fd), then A absorbs B. The merged chunk has size 136 + 136 = 272 bytes.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'freed'); heap.annotateField?.('A', 'size', '0x111 (272|P) merged!'); },
    },
    {
      action: 'init',
      log: ['info', 'The unlink macro performs: FD = B->fd; BK = B->bk; FD->bk = BK; BK->fd = FD. In old glibc (pre-2.3.6), there were NO checks on FD/BK. By corrupting fd/bk in a free chunk, an attacker could write an arbitrary value to an arbitrary address -- the classic "unlink exploit" (unsafe unlink).'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightField?.('A', 'fd'); heap.highlightField?.('A', 'bk'); },
    },
    {
      action: 'done',
      log: ['success', 'Coalescing reduces fragmentation by merging adjacent free chunks. The unlink macro removes a chunk from its doubly-linked bin list during consolidation. Modern glibc validates fd/bk pointers (FD->bk == P && BK->fd == P), but corrupting the size/prev_size fields to fake adjacency is still an active technique in heap exploitation.'],
    },
  ],
  check() { return false; },
  winTitle: 'Coalescing & Unlink Mastered',
  winMsg: 'You watched forward consolidation merge two adjacent free chunks via the unlink macro. Understanding coalescing is key to exploits like unsafe unlink, House of Einherjar, and overlapping chunks.',
};

export default hint58;
