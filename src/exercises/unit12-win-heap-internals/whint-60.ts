import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'whint-60',
  unitId: 'unit12-win-heap-internals',
  title: '60: LFH Internals',
  desc: '<b>Goal:</b> Understand the Low Fragmentation Heap (LFH). The LFH activates after <strong>17+ allocations</strong> of the same size class. Once active, it pre-allocates a <strong>UserBlocks</strong> region divided into fixed-size slots, and randomizes which slot is returned. This reduces fragmentation and adds exploit difficulty through unpredictable allocation order.',
  source: {
    c: [
      { text: '// LFH activation demo', cls: 'cmt' },
      { text: '// LFH triggers after 17+ same-size allocs', cls: 'cmt' },
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    HANDLE h = GetProcessHeap();', cls: '' },
      { text: '    void *ptrs[20];', cls: '' },
      { text: '    for (int i = 0; i < 18; i++) {', cls: 'highlight' },
      { text: '        ptrs[i] = HeapAlloc(h, 0, 32);', cls: 'highlight' },
      { text: '    }', cls: '' },
      { text: '    // After 17 allocs of size 32, LFH', cls: 'cmt' },
      { text: '    // is now active for this bucket.', cls: 'cmt' },
      { text: '    // Alloc #18 comes from LFH UserBlocks', cls: 'cmt' },
      { text: '    for (int i = 0; i < 18; i++)', cls: '' },
      { text: '        HeapFree(h, 0, ptrs[i]);', cls: '' },
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
      log: ['info', 'The LFH is the front-end allocator for the NT Heap. It groups allocation sizes into 128 buckets (size classes). Bucket selection: sizes 1-256 use 8-byte granularity (bucket = ceil(size/8)), sizes 257-16384 use wider granularity. The LFH is NOT active by default -- it activates per-bucket.'],
    },
    {
      action: 'malloc', size: 32, name: 'A', srcLine: 8,
      log: ['action', 'HeapAlloc(h, 0, 32) -- first allocation of size 32. The back-end handles this (LFH not yet active). Internally, _HEAP.FrontEndHeapUsageData[] counts how many times each bucket is hit. This counter increments with each HeapAlloc call for this size class.'],
    },
    {
      action: 'init',
      log: ['info', 'After 17 consecutive allocations of size class 32, the counter crosses the activation threshold. The heap manager calls RtlpActivateLowFragmentationHeap() for bucket 4 (32/8). This creates an _LFH_HEAP structure and links it to this bucket.'],
    },
    {
      action: 'malloc', size: 32, name: 'B', srcLine: 8,
      log: ['action', 'Allocation #18 (post-activation) -- now served by LFH. The LFH allocates a UserBlocks region: a contiguous memory block subdivided into fixed-size slots. Each slot is exactly (header + 32) bytes. The LFH picks a slot using a randomized bitmap scan, not FIFO.'],
    },
    {
      action: 'init',
      log: ['info', 'UserBlocks structure: _HEAP_USERDATA_HEADER at the start, followed by N fixed-size subsegment entries. A bitmap tracks which slots are busy/free. The LFH randomizes the starting position in the bitmap scan, so consecutive HeapAlloc calls do NOT return sequential addresses.'],
    },
    {
      action: 'init',
      log: ['warn', 'LFH randomization was added in Windows 8 to make heap spraying harder. Before Win8, LFH returned slots in a deterministic pattern. The randomization means an attacker spraying 1000 objects cannot predict which slot index will be adjacent to a target -- but statistical attacks still work with enough spray.'],
    },
    {
      action: 'done',
      log: ['success', 'LFH summary: activates per-bucket after 17+ allocs of the same size. Allocates from a UserBlocks region of fixed-size slots. Uses bitmap-based tracking with randomized slot selection (Win8+). Reduces fragmentation and raises the bar for heap manipulation attacks.'],
    },
  ],
  check() { return false; },
  winTitle: 'LFH Internals Mastered!',
  winMsg: 'You understand how the Low Fragmentation Heap activates, how UserBlocks subdivide memory into fixed-size slots, and how bitmap randomization affects exploitation.',
};

export default exercise;
