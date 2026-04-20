import { Exercise } from '../types';

const hint53: Exercise = {
  id: 'hint-53',
  unitId: 'unit11-heap-internals',
  title: '53: ptmalloc2 Overview',
  desc: '<b>Goal:</b> Understand the structure of a heap chunk in glibc\'s ptmalloc2 allocator. Every call to <strong>malloc()</strong> returns a pointer past an 8-byte header containing <strong>prev_size</strong> and <strong>size</strong> fields, with the lowest bits of size encoding flags (P, M, A).',
  source: {
    c: [
      { text: '// ptmalloc2 chunk anatomy', cls: 'cmt' },
      { text: '// Chunk layout (32-bit):', cls: 'cmt' },
      { text: '//   [prev_size] [size|P|M|A] [user data...]', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *p = malloc(16);', cls: 'highlight' },
      { text: '    // p points here --------^', cls: 'cmt' },
      { text: '    // chunk header is at p - 8', cls: 'cmt' },
      { text: '    size_t *hdr = (size_t*)(p - 8);', cls: 'highlight' },
      { text: '    // hdr[0] = prev_size (unused when prev in-use)', cls: 'cmt' },
      { text: '    // hdr[1] = size | flags', cls: 'cmt' },
      { text: '    printf("size field: 0x%x\\n", hdr[1]);', cls: 'highlight' },
      { text: '    // Expect 0x19 = 24 | PREV_INUSE', cls: 'cmt' },
      { text: '    free(p);', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 256,
  steps: [
    {
      action: 'init',
      log: ['info', 'glibc uses ptmalloc2, a thread-aware allocator derived from dlmalloc. Memory is divided into "chunks" with metadata headers. Let\'s allocate a chunk and examine its internal structure.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 16, name: 'A', srcLine: 6,
      log: ['action', 'malloc(16) -- the allocator carves a 24-byte chunk from the top. Why 24? The 8-byte header (prev_size + size) plus 16 bytes of user data.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'header'); },
    },
    {
      action: 'init',
      log: ['info', 'The first 4 bytes of the header are prev_size. This field is only meaningful when the previous chunk is free (P bit = 0). Right now P = 1, so prev_size is unused.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightField?.('A', 'prev_size'); },
    },
    {
      action: 'init', srcLine: 12,
      log: ['info', 'The next 4 bytes are the size field. The chunk size is always 8-byte aligned, so the bottom 3 bits encode flags: bit 0 = PREV_INUSE (P), bit 1 = IS_MMAPPED (M), bit 2 = NON_MAIN_ARENA (A).'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightField?.('A', 'size'); },
    },
    {
      action: 'init', srcLine: 13,
      log: ['info', 'For our 24-byte chunk: size field = 0x19 = 25 decimal. Strip the flags: 24 (chunk size). The P bit is set (1) because the previous chunk (or arena boundary) is in use.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.annotateField?.('A', 'size', '0x19 = 24 | P'); },
    },
    {
      action: 'free', name: 'A', srcLine: 14,
      log: ['action', 'free(A) -- the chunk is returned to the allocator. Its user data area is now repurposed to store freelist pointers (fd, bk). The header remains, but the chunk is marked as free.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightField?.('A', 'fd'); },
    },
    {
      action: 'done',
      log: ['success', 'Key takeaway: every malloc\'d chunk has a hidden 8-byte header before your data. The size field encodes both the chunk size and the P/M/A flags in its lowest bits. Exploits that corrupt these fields can trick the allocator into dangerous behavior.'],
    },
  ],
  check() { return false; },
  winTitle: 'ptmalloc2 Internals',
  winMsg: 'You now understand chunk header layout: prev_size, size with P/M/A flag bits, and how the data pointer sits 8 bytes past the chunk start.',
};

export default hint53;
