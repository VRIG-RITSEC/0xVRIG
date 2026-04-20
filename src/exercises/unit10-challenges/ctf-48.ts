import { Exercise } from '../types';

export const ctf48: Exercise = {
  id: 'ctf-48',
  unitId: 'unit10-challenges',
  title: 'Heap Sandbox',
  desc: '<b>Free-form heap exploitation!</b> A program allocates two chunks. Chunk A has user data, Chunk B has a function pointer. Exploit a use-after-free: free A, allocate a new chunk that reuses A\'s memory, and overwrite B\'s function pointer. Use the guided steps to execute the attack.',
  source: {
    c: [
      { text: '#include <stdlib.h>', cls: 'prep' },
      { text: '', cls: '' },
      { text: 'struct Data { char name[12]; };', cls: '' },
      { text: 'struct Func { void (*action)(); };', cls: '' },
      { text: '', cls: '' },
      { text: 'void normal() { puts("normal"); }', cls: '' },
      { text: 'void win()    { puts("pwned!"); }', cls: 'fn' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: 'fn' },
      { text: '  Data *a = malloc(16);', cls: '' },
      { text: '  Func *b = malloc(16);', cls: '' },
      { text: '  b->action = normal;', cls: 'vuln' },
      { text: '  free(a);', cls: 'vuln' },
      { text: '  // a is freed but b still has fn ptr', cls: 'comment' },
      { text: '  // New alloc reuses a\'s space...', cls: 'comment' },
      { text: '  Data *c = malloc(16);', cls: '' },
      { text: '  // Write to c can corrupt b\'s fn ptr', cls: 'comment' },
      { text: '  b->action();', cls: 'vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-overflow',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 256,
  showSymbols: true,
  showCalc: true,
  check: (_sim: any, heap: any, symbols: Record<string, number>) => {
    if (!heap || !heap.funcPtrs?.handler) return false;
    return heap.funcPtrs.handler.current === symbols.win;
  },
  protections: [
    { name: 'NX', status: 'active' },
    { name: 'ASLR', status: 'disabled' },
    { name: 'Canary', status: 'disabled' },
  ],
  winTitle: 'Heap Sandbox Complete!',
  winMsg: 'You exploited a heap vulnerability in free-form mode.',
};
