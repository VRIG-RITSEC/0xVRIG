import { Exercise } from '../types';

const hint56: Exercise = {
  id: 'hint-56',
  unitId: 'unit11-heap-internals',
  title: '56: Tcache Deep Dive',
  desc: '<b>Goal:</b> Understand the thread-local cache (tcache) introduced in glibc 2.26. Each thread has a <strong>tcache_perthread_struct</strong> with 64 singly-linked bins (chunk sizes 12-516 on 32-bit, 24-1032 on 64-bit). Each bin holds at most <strong>7 entries</strong> in LIFO order. The 8th free of the same size overflows to the fast bin or unsorted bin.',
  source: {
    c: [
      { text: '// Filling a tcache bin to capacity', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *p[9];', cls: '' },
      { text: '    // Allocate 9 chunks of the same size', cls: 'cmt' },
      { text: '    for (int i = 0; i < 9; i++)', cls: '' },
      { text: '        p[i] = malloc(24);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '    // Free them -- first 7 fill tcache', cls: 'cmt' },
      { text: '    for (int i = 0; i < 7; i++)', cls: '' },
      { text: '        free(p[i]);  // tcache count++', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '    free(p[7]);  // tcache full -> fastbin!', cls: 'highlight vuln' },
      { text: '    free(p[8]);  // also fastbin', cls: 'highlight vuln' },
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
      log: ['info', 'The tcache (thread cache) is glibc\'s fastest allocation path. Each thread has a tcache_perthread_struct at the start of the heap containing 64 bins (one per size class) and a count array. Each bin holds at most 7 entries. Let\'s fill one up.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 24, name: 'P0', srcLine: 7,
      log: ['action', 'malloc(24) -- first of 9 identical 32-byte chunks. All will go into the same tcache bin (size 32) when freed, until the bin is full.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P0', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P1', srcLine: 7,
      log: ['action', 'malloc(24) -- second chunk. The tcache is organized by exact chunk size: all 32-byte chunks share one bin, all 48-byte chunks share another, etc.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P1', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P2', srcLine: 7,
      log: ['action', 'malloc(24) -- third chunk. On malloc, the tcache is checked first. If the right bin has an entry, it is returned immediately with almost no overhead (no locking, no coalescing checks).'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P2', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P3', srcLine: 7,
      log: ['action', 'malloc(24) -- fourth chunk allocated.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P3', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P4', srcLine: 7,
      log: ['action', 'malloc(24) -- fifth chunk.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P4', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P5', srcLine: 7,
      log: ['action', 'malloc(24) -- sixth chunk.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P5', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P6', srcLine: 7,
      log: ['action', 'malloc(24) -- seventh chunk.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P6', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P7', srcLine: 7,
      log: ['action', 'malloc(24) -- eighth chunk. This one will be the first to overflow past the tcache limit.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P7', 'data'); },
    },
    {
      action: 'malloc', size: 24, name: 'P8', srcLine: 7,
      log: ['action', 'malloc(24) -- ninth chunk. Both P7 and P8 will go to fastbin when freed, since the tcache will be full.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P8', 'data'); },
    },
    {
      action: 'free', name: 'P0', srcLine: 11,
      log: ['action', 'free(P0) -- tcache bin for size 32: count = 1/7. The chunk\'s data area stores an fd pointer to NULL (end of list). Tcache entries form a singly-linked LIFO list.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P0', 'freed'); heap.annotateField?.('P0', 'fd', 'tcache 1/7'); },
    },
    {
      action: 'free', name: 'P1', srcLine: 11,
      log: ['action', 'free(P1) -- tcache count = 2/7. P1\'s fd points to P0. List: P1 -> P0 -> NULL.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P1', 'freed'); heap.annotateField?.('P1', 'fd', 'tcache 2/7'); },
    },
    {
      action: 'free', name: 'P2', srcLine: 11,
      log: ['action', 'free(P2) -- tcache count = 3/7. List: P2 -> P1 -> P0 -> NULL.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P2', 'freed'); heap.annotateField?.('P2', 'fd', 'tcache 3/7'); },
    },
    {
      action: 'free', name: 'P3', srcLine: 11,
      log: ['action', 'free(P3) -- tcache count = 4/7.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P3', 'freed'); heap.annotateField?.('P3', 'fd', 'tcache 4/7'); },
    },
    {
      action: 'free', name: 'P4', srcLine: 11,
      log: ['action', 'free(P4) -- tcache count = 5/7.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P4', 'freed'); heap.annotateField?.('P4', 'fd', 'tcache 5/7'); },
    },
    {
      action: 'free', name: 'P5', srcLine: 11,
      log: ['action', 'free(P5) -- tcache count = 6/7.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P5', 'freed'); heap.annotateField?.('P5', 'fd', 'tcache 6/7'); },
    },
    {
      action: 'free', name: 'P6', srcLine: 11,
      log: ['action', 'free(P6) -- tcache count = 7/7. The bin is now FULL. Any further frees of this size will bypass the tcache entirely.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P6', 'freed'); heap.annotateField?.('P6', 'fd', 'tcache FULL 7/7'); },
    },
    {
      action: 'free', name: 'P7', srcLine: 13,
      log: ['warn', 'free(P7) -- tcache bin is full (7/7)! This chunk falls through to the fast bin instead. The fast bin has different security checks (and fewer in older glibc). Many exploits deliberately fill the tcache to force chunks into the more exploitable fast bin path.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P7', 'freed'); heap.annotateField?.('P7', 'fd', 'FASTBIN (overflow)'); },
    },
    {
      action: 'free', name: 'P8', srcLine: 14,
      log: ['warn', 'free(P8) -- also goes to fast bin (tcache still full). Fastbin[32]: P8 \u2192 P7 \u2192 NULL. Both P7 and P8 bypassed tcache and went straight to the classic fast bin path.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('P8', 'freed'); heap.annotateField?.('P8', 'fd', 'FASTBIN #2'); },
    },
    {
      action: 'done',
      log: ['success', 'Tcache deep dive complete. Key facts: (1) 64 bins, one per size class, max 7 entries each. (2) LIFO singly-linked via fd pointer in the data area. (3) Minimal security checks in early glibc versions (no double-free detection until 2.29). (4) Filling the tcache forces chunks to the classic bin paths, which is a common exploit setup step.'],
    },
  ],
  check() { return false; },
  winTitle: 'Tcache Mastered',
  winMsg: 'You filled a tcache bin to its 7-entry limit and saw the 8th free overflow to the fast bin. This tcache-fill technique is the setup step for fastbin dup and other classic heap attacks.',
};

export default hint56;
