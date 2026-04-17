import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'whint-61',
  unitId: 'unit12-win-heap-internals',
  title: '61: Segment Heap',
  desc: '<b>Goal:</b> Understand the Windows 10+ Segment Heap, which replaces the NT Heap as the default for modern apps (UWP, system processes, and opted-in Win32). It uses four sub-components: <strong>LFH</strong> (small), <strong>Variable Size (VS)</strong> (medium), <strong>Segment Alloc</strong> (large), and <strong>Large Alloc</strong> (huge via VirtualAlloc).',
  source: {
    c: [
      { text: '// Segment Heap (Win10+)', cls: 'cmt' },
      { text: '// Default for UWP and system processes', cls: 'cmt' },
      { text: '// Opt-in for Win32 via app manifest', cls: 'cmt' },
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    HANDLE h = GetProcessHeap();', cls: '' },
      { text: '    void *s = HeapAlloc(h, 0, 128);', cls: 'highlight' },
      { text: '    void *m = HeapAlloc(h, 0, 4096);', cls: 'highlight' },
      { text: '    void *l = HeapAlloc(h, 0, 512000);', cls: 'highlight' },
      { text: '    HeapFree(h, 0, s);', cls: '' },
      { text: '    HeapFree(h, 0, m);', cls: '' },
      { text: '    HeapFree(h, 0, l);', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 256,
  steps: [
    {
      action: 'init',
      log: ['info', 'The Segment Heap (_SEGMENT_HEAP) is a complete redesign of the Windows heap introduced in Windows 10. It replaces _HEAP for modern apps. The core idea: route allocations to different backends depending on size, with stronger metadata validation and guard pages.'],
    },
    {
      action: 'malloc', size: 128, name: 'S', srcLine: 7,
      log: ['action', 'HeapAlloc(h, 0, 128) -- small allocation, handled by the LFH component. Segment Heap\'s LFH works similarly to NT Heap\'s LFH: fixed-size slots in UserBlocks, bitmap tracking, randomized selection. Sizes up to ~512 bytes go through this path once LFH is active for the bucket.'],
    },
    {
      action: 'malloc', size: 4096, name: 'M', srcLine: 8,
      log: ['action', 'HeapAlloc(h, 0, 4096) -- medium allocation, routed to the Variable Size (VS) backend. VS allocations use _HEAP_VS_SUBSEGMENT structures within larger committed pages. Each VS block has its own encoded header. The VS backend handles sizes roughly 512 bytes to 128 KB.'],
    },
    {
      action: 'malloc', size: 512000, name: 'L', srcLine: 9,
      log: ['action', 'HeapAlloc(h, 0, 512000) -- large allocation (> 128 KB). Routed directly to VirtualAlloc with dedicated pages. A _HEAP_LARGE_ALLOC_DATA record tracks the allocation. These are the easiest to find in memory -- each gets its own page-aligned region.'],
    },
    {
      action: 'init',
      log: ['warn', 'Segment Heap metadata is XOR-encoded (like NT Heap, but with a different scheme). Each _HEAP_VS_CHUNK_HEADER is encoded using RtlpHpHpContext. Guard pages are placed between segments to catch linear overflows. These mitigations make metadata corruption significantly harder than on older NT Heap.'],
    },
    {
      action: 'done',
      log: ['success', 'Segment Heap: four allocation tiers (LFH for small, VS for medium, Segment for large, VirtualAlloc for huge). Stronger metadata encoding, guard pages between segments, and per-component free lists. This is the future of Windows heap management.'],
    },
  ],
  check() { return false; },
  winTitle: 'Segment Heap Explored!',
  winMsg: 'You understand the Windows 10 Segment Heap architecture: LFH, Variable Size, Segment Alloc, and Large Alloc backends with enhanced metadata protection.',
};

export default exercise;
