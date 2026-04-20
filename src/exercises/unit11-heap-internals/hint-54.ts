import { Exercise } from '../types';

const hint54: Exercise = {
  id: 'hint-54',
  unitId: 'unit11-heap-internals',
  title: '54: Chunk Lifecycle',
  desc: '<b>Goal:</b> Follow a chunk through its full lifecycle: allocation, use, and deallocation. See how <strong>malloc()</strong> returns a pointer past the header, how user data is written into the data area, and how <strong>free()</strong> repurposes that same data area for freelist metadata (fd/bk pointers).',
  source: {
    c: [
      { text: '// Chunk lifecycle: allocate, use, free', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *p = malloc(32);', cls: 'highlight' },
      { text: '    // p points to data area (chunk + 8)', cls: 'cmt' },
      { text: '    strcpy(p, "HELLO");', cls: 'highlight' },
      { text: '    // data sits right after the header', cls: 'cmt' },
      { text: '    free(p);', cls: 'highlight vuln' },
      { text: '    // fd pointer now overwrites "HELLO"', cls: 'cmt' },
      { text: '    // p is now a dangling pointer!', cls: 'cmt' },
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
      log: ['info', 'A heap chunk moves through three states: (1) carved from the top chunk by malloc, (2) in use by your program, (3) freed and placed on a recycling list. Let\'s watch the metadata change at each stage.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 32, name: 'A', srcLine: 5,
      log: ['action', 'malloc(32) -- allocator carves a 40-byte chunk (32 data + 8 header). It returns a pointer to the data area, which is 8 bytes past the real chunk start. The size field is 0x29 (40 | PREV_INUSE).'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'data'); },
    },
    {
      action: 'init', srcLine: 7,
      log: ['info', 'The program writes "HELLO" into the data area. This is the region from p[0] onward. The 8-byte header just before p is untouched -- the allocator trusts it to be intact. Corrupting the header is the basis of many heap exploits.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.writeData?.('A', [0x48, 0x45, 0x4c, 0x4c, 0x4f]); heap.highlightChunk?.('A', 'data'); },
    },
    {
      action: 'init', srcLine: 6,
      log: ['info', 'Important: malloc() returns (chunk_address + 8), not the chunk itself. So p[-8] through p[-1] contain the prev_size and size fields. The program should never write there -- but buffer overflows can.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'header'); },
    },
    {
      action: 'free', name: 'A', srcLine: 9,
      log: ['action', 'free(A) -- the allocator takes the chunk back. It overwrites the first bytes of the data area with a forward pointer (fd) pointing to the next free chunk in the bin. "HELLO" is gone, replaced by freelist metadata.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightField?.('A', 'fd'); },
    },
    {
      action: 'init', srcLine: 11,
      log: ['warn', 'After free, p is a dangling pointer. The memory at *p now contains freelist pointers, not "HELLO". Reading *p leaks heap addresses (info leak). Writing *p corrupts the freelist (tcache poisoning). Both are exploitable.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'freed'); },
    },
    {
      action: 'done',
      log: ['success', 'Chunk lifecycle complete. Allocated chunks store user data; freed chunks store freelist pointers in that same space. Understanding this dual use is essential -- use-after-free and double-free exploits both exploit the transition between these states.'],
    },
  ],
  check() { return false; },
  winTitle: 'Chunk Lifecycle Complete',
  winMsg: 'You traced a chunk from allocation through use to deallocation, seeing how the data area is repurposed for freelist metadata after free().',
};

export default hint54;
