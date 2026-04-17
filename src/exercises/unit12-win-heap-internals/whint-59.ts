import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'whint-59',
  unitId: 'unit12-win-heap-internals',
  title: '59: NT Heap Overview',
  desc: '<b>Goal:</b> Understand the Windows NT Heap architecture. The NT heap uses a two-tier design: a <strong>back-end allocator</strong> manages large regions via segments, while a <strong>front-end allocator</strong> (LFH) handles frequent small allocations. HeapAlloc/HeapFree are the core APIs, wrapping RtlAllocateHeap/RtlFreeHeap in ntdll.',
  source: {
    c: [
      { text: '// Windows NT Heap Architecture', cls: 'cmt' },
      { text: '// Back-end: segments, free lists, coalescing', cls: 'cmt' },
      { text: '// Front-end: LFH for small, hot allocations', cls: 'cmt' },
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    HANDLE hHeap = GetProcessHeap();', cls: 'highlight' },
      { text: '    void *a = HeapAlloc(hHeap, 0, 16);', cls: 'highlight' },
      { text: '    void *b = HeapAlloc(hHeap, 0, 64);', cls: 'highlight' },
      { text: '    HeapFree(hHeap, 0, a);', cls: 'highlight' },
      { text: '    HeapFree(hHeap, 0, b);', cls: 'highlight' },
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
      log: ['info', 'The NT Heap is the default Windows usermode allocator (pre-Win10). Every process gets a default heap via GetProcessHeap(), backed by the _HEAP structure. This struct holds segment lists, free lists, encoding keys, and LFH state. HeapAlloc() wraps RtlAllocateHeap in ntdll.dll.'],
    },
    {
      action: 'malloc', size: 16, name: 'A', srcLine: 7,
      log: ['action', 'HeapAlloc(hHeap, 0, 16) -- the back-end allocator searches the FreeLists for a chunk >= 24 bytes (16 data + 8-byte _HEAP_ENTRY header). Each chunk has an encoded header containing Size, Flags, SmallTagIndex, and PreviousSize. The back-end uses ListHints[] indexed by block size.'],
    },
    {
      action: 'malloc', size: 64, name: 'B', srcLine: 8,
      log: ['action', 'HeapAlloc(hHeap, 0, 64) -- a larger allocation. The back-end groups free chunks into 128 free lists (ListHints[0..127]). Small blocks (< 16KB) go through ListHints; larger ones use a dedicated large-block list. If no free chunk fits, the segment\'s commit boundary is extended.'],
    },
    {
      action: 'init',
      log: ['info', 'NT Heap segments are contiguous virtual memory regions. The default heap starts with one segment (_HEAP_SEGMENT). When it runs out, up to 64 additional segments can be committed. Each segment tracks its committed range, first/last valid entry, and uncommitted ranges.'],
    },
    {
      action: 'free', name: 'A', srcLine: 9,
      log: ['action', 'HeapFree(hHeap, 0, A) -- the chunk is returned to the back-end free list. Adjacent free chunks are coalesced (merged) to fight fragmentation. The freed chunk\'s user data area is overwritten with LIST_ENTRY (Flink/Blink) pointers linking it into the appropriate FreeList.'],
    },
    {
      action: 'free', name: 'B', srcLine: 10,
      log: ['action', 'HeapFree(hHeap, 0, B) -- freed and coalesced with adjacent free memory if possible. The front-end allocator (LFH) is not active yet. LFH only activates for a given size class after 17+ allocations of that size, at which point it takes over from the back-end for that bucket.'],
    },
    {
      action: 'done',
      log: ['success', 'NT Heap summary: _HEAP holds everything. The back-end manages segments and free lists with coalescing. The front-end (LFH) activates per-size-class after repeated allocations. HeapAlloc/HeapFree are thin wrappers around RtlAllocateHeap/RtlFreeHeap. Next: how LFH works internally.'],
    },
  ],
  check() { return false; },
  winTitle: 'NT Heap Mapped!',
  winMsg: 'You understand the Windows NT Heap architecture: _HEAP structure, back-end segments with free lists, and the front-end LFH that activates for hot size classes.',
};

export default exercise;
