import { Exercise } from '../types';

const hint57: Exercise = {
  id: 'hint-57',
  unitId: 'unit11-heap-internals',
  title: '57: Arena & Threads',
  desc: '<b>Goal:</b> Understand how ptmalloc2 manages concurrency with <strong>arenas</strong>. The main thread uses the <strong>main arena</strong> (backed by brk/sbrk). Additional threads get their own arenas (backed by mmap), up to a limit of <strong>8 * CPU cores</strong>. Each arena has its own set of bins, mutex, and top chunk.',
  source: {
    c: [
      { text: '// Arena concept (pseudocode)', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '#include <pthread.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void *worker(void *arg) {', cls: '' },
      { text: '    // Thread gets its own arena', cls: 'cmt' },
      { text: '    char *t = malloc(32);', cls: 'highlight' },
      { text: '    // NON_MAIN_ARENA bit (A) set in size', cls: 'cmt' },
      { text: '    free(t);', cls: 'highlight' },
      { text: '    return NULL;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *m = malloc(32);', cls: 'highlight' },
      { text: '    // Main arena, A bit = 0', cls: 'cmt' },
      { text: '    pthread_t th;', cls: '' },
      { text: '    pthread_create(&th, NULL, worker, NULL);', cls: 'highlight' },
      { text: '    pthread_join(th, NULL);', cls: '' },
      { text: '    free(m);', cls: 'highlight' },
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
      log: ['info', 'ptmalloc2 uses arenas to handle multithreaded allocation. An arena is a complete allocator instance with its own bins, top chunk, and mutex. The main arena uses brk() to grow; thread arenas use mmap(). Let\'s see how they differ.'],
    },
    {
      action: 'malloc', size: 32, name: 'M', srcLine: 13,
      log: ['action', 'malloc(32) in main thread -- served from the main arena. The chunk\'s size field has the A (NON_MAIN_ARENA) bit cleared (bit 2 = 0), indicating it belongs to the main arena. Main arena memory is contiguous, grown via brk().'],
    },
    {
      action: 'init', srcLine: 16,
      log: ['info', 'A new thread is created. When it calls malloc, ptmalloc2 calls arena_get() to find an arena. First it tries to reuse an unlocked existing arena. If all are locked, it creates a new one (up to 8 * number_of_cores). Each arena is independent -- its own mutex, its own bins, its own top chunk.'],
    },
    {
      action: 'init', srcLine: 6,
      log: ['info', 'The thread arena allocates memory via mmap() in 64 MB chunks called "heaps" (not to be confused with "the heap"). Each heap has a heap_info struct linking it to its arena. The A bit (bit 2) in chunk size fields will be SET for thread-arena chunks.'],
    },
    {
      action: 'free', name: 'M', srcLine: 18,
      log: ['action', 'free(M) -- the allocator uses the A bit to determine which arena owns this chunk. A = 0 means main arena. For thread arenas (A = 1), the arena pointer is found via the heap_info struct at the base of the mmap\'d region.'],
    },
    {
      action: 'done',
      log: ['success', 'Arena summary: (1) Main arena uses brk(), thread arenas use mmap(). (2) Max arenas = 8 * cores to limit memory overhead. (3) The A bit in each chunk\'s size field identifies its arena. (4) Each arena has independent bins -- a tcache-poisoned chunk in one arena cannot directly affect another. Understanding arenas is critical for multi-threaded heap exploitation.'],
    },
  ],
  check() { return false; },
  winTitle: 'Arenas Understood',
  winMsg: 'You learned how ptmalloc2 uses arenas to manage concurrent allocations, with the main arena using brk() and thread arenas using mmap(), each with independent bins and metadata.',
};

export default hint57;
