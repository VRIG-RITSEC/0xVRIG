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
      { text: '    // LFH tier: small allocs (<512 bytes)', cls: 'cmt' },
      { text: '    void *s = HeapAlloc(h, 0, 32);', cls: 'highlight' },
      { text: '    // VS tier: medium allocs (512B-128KB)', cls: 'cmt' },
      { text: '    void *m = HeapAlloc(h, 0, 512);', cls: 'highlight' },
      { text: '    // Large alloc tier: huge allocs (>128KB)', cls: 'cmt' },
      { text: '    void *l = HeapAlloc(h, 0, 1024);', cls: 'highlight' },
      { text: '    HeapFree(h, 0, s);', cls: '' },
      { text: '    HeapFree(h, 0, m);', cls: '' },
      { text: '    HeapFree(h, 0, l);', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 2048,
  winVersion: 'win10',
  steps: [
    {
      action: 'init',
      log: ['info', 'The Segment Heap (_SEGMENT_HEAP) is a complete redesign of the Windows heap introduced in Windows 10. It replaces _HEAP for modern apps. The core idea: route allocations to different backends depending on size, with stronger metadata validation and guard pages.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 32, name: 'S', srcLine: 8,
      log: ['action', 'HeapAlloc(h, 0, 32) -- small allocation, handled by the LFH component. Segment Heap\'s LFH works similarly to NT Heap\'s LFH: fixed-size slots in UserBlocks, bitmap tracking, randomized selection. Sizes up to ~512 bytes go through this path once LFH is active for the bucket.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('S', 'data'); heap.annotateField?.('S', 'size', 'LFH tier (<512B)'); },
    },
    {
      action: 'malloc', size: 512, name: 'M', srcLine: 10,
      log: ['action', 'HeapAlloc(h, 0, 512) -- medium allocation, routed to the Variable Size (VS) backend. VS allocations use _HEAP_VS_SUBSEGMENT structures within larger committed pages. Each VS block has its own encoded header. The VS backend handles sizes roughly 512 bytes to 128 KB.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('M', 'data'); heap.annotateField?.('M', 'size', 'VS tier (512B-128KB)'); },
    },
    {
      action: 'malloc', size: 1024, name: 'L', srcLine: 12,
      log: ['action', 'HeapAlloc(h, 0, 1024) -- large allocation. In a real system, allocations over 128 KB are routed directly to VirtualAlloc with dedicated pages. A _HEAP_LARGE_ALLOC_DATA record tracks the allocation. These are the easiest to find in memory -- each gets its own page-aligned region.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('L', 'data'); heap.annotateField?.('L', 'size', 'Large (>128KB: VirtualAlloc)'); },
    },
    {
      action: 'init',
      log: ['warn', 'Segment Heap metadata is XOR-encoded (like NT Heap, but with a different scheme). Each _HEAP_VS_CHUNK_HEADER is encoded using RtlpHpHpContext. Guard pages are placed between segments to catch linear overflows. These mitigations make metadata corruption significantly harder than on older NT Heap.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('S', 'header'); heap.highlightChunk?.('M', 'header'); },
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
