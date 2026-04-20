import { Exercise } from '../types';

export const win46: Exercise = {
  id: 'win-46',
  unitId: 'unit9-win-heap',
  title: '46: WinAPI Heap UAF',
  desc: 'Custom heaps created with <code>HeapCreate(HEAP_NO_SERIALIZE, ...)</code> skip thread locking and may lack LFH mitigations. This is a use-after-free on a private heap — free the object, allocate a note in the same spot, write <code>win()</code> address to hijack the function pointer.',
  source: {
    c: [
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// Private Heap — fewer mitigations', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'struct Handler {', cls: '' },
      { text: '    void (*callback)();', cls: 'highlight' },
      { text: '    char buf[12];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { WinExec("calc", 0); }', cls: '' },
      { text: '', cls: '' },
      { text: 'HANDLE h = HeapCreate(', cls: '' },
      { text: '    HEAP_NO_SERIALIZE, 0x1000, 0);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: 'Handler *obj = HeapAlloc(h, 0, 16);', cls: '' },
      { text: 'obj->callback = safe_handler;', cls: '' },
      { text: 'HeapFree(h, 0, obj);', cls: 'highlight vuln' },
      { text: 'char *note = HeapAlloc(h, 0, 16);', cls: 'highlight' },
      { text: 'read(0, note, 16);', cls: 'highlight vuln' },
      { text: 'obj->callback();', cls: 'highlight vuln' },
    ],
  },
  mode: 'heap-uaf',
  vizMode: 'heap',
  heapSize: 256,
  winVersion: 'win7',
  showSymbols: true,
  showCalc: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.action?.current === symbols.win || heap?.funcPtrs?.callback?.current === symbols.win;
  },
  winTitle: 'WinAPI Heap Pwned!',
  winMsg: 'Custom heaps with HEAP_NO_SERIALIZE are easy targets — no LFH activation, no locking, fewer checks.',
};
