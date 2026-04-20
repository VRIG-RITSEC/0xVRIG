import { Exercise } from '../types';

export const ctf51: Exercise = {
  id: 'ctf-51',
  unitId: 'unit10-challenges',
  title: 'CTF: Hard',
  desc: '<b>CTF Challenge!</b> Heap exploitation with multiple primitives. Use tcache poisoning to get an arbitrary write, then overwrite a function pointer. Requires understanding of tcache free list manipulation and careful address calculation.',
  source: {
    c: [
      { text: '// CTF Hard — Tcache Poisoning', cls: 'comment' },
      { text: '// Protections: NX, ASLR disabled', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { system("/bin/sh"); }', cls: 'fn' },
      { text: '', cls: '' },
      { text: 'struct Obj {', cls: '' },
      { text: '  void (*handler)();', cls: '' },
      { text: '  char data[12];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: 'fn' },
      { text: '  Obj *a = malloc(16);', cls: '' },
      { text: '  Obj *b = malloc(16);', cls: '' },
      { text: '  a->handler = normal;', cls: '' },
      { text: '  free(a);', cls: 'vuln' },
      { text: '  free(b);', cls: 'vuln' },
      { text: '  // Tcache: b → a', cls: 'comment' },
      { text: '  // Write target addr into b\'s next ptr', cls: 'comment' },
      { text: '  // malloc returns b, then target addr', cls: 'comment' },
      { text: '  // Write win() at target → hijack!', cls: 'comment' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-tcache-poison',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 256,
  showSymbols: true,
  showCalc: true,
  check: (_sim: any, heap: any, symbols: Record<string, number>) => {
    if (!heap) return false;
    const fnPtrs = heap.funcPtrs;
    return fnPtrs?.action?.current === symbols.win || fnPtrs?.handler?.current === symbols.win;
  },
  protections: [
    { name: 'NX', status: 'active' },
    { name: 'ASLR', status: 'disabled' },
    { name: 'Canary', status: 'disabled' },
  ],
  winTitle: 'CTF Hard Solved!',
  winMsg: 'Tcache poisoning → arbitrary write → function pointer hijack. Elite!',
};
