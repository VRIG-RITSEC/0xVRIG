import { Exercise } from '../types';

export const win43: Exercise = {
  id: 'win-43',
  unitId: 'unit9-win-heap',
  title: '43: LFH Use-After-Free',
  desc: 'The Windows Low Fragmentation Heap (LFH) is like glibc\'s tcache — freed chunks get reused. A <b>User</b> struct with a function pointer is freed, then a same-size <b>Note</b> is allocated in the same spot. Write the address of <code>win()</code> into the first 4 bytes to hijack the function pointer.',
  source: {
    c: [
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// LFH — Low Fragmentation Heap', cls: 'comment' },
      { text: '// Like tcache: freed chunks get reused', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'struct User {', cls: '' },
      { text: '    void (*action)();', cls: 'highlight' },
      { text: '    char name[12];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { WinExec("calc", 0); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    User *u = HeapAlloc(h, 0, 16);', cls: '' },
      { text: '    u->action = normal;', cls: '' },
      { text: '    HeapFree(h, 0, u);', cls: 'highlight vuln' },
      { text: '    char *note = HeapAlloc(h, 0, 16);', cls: 'highlight' },
      { text: '    read(0, note, 16);', cls: 'highlight vuln' },
      { text: '    u->action();', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-uaf',
  vizMode: 'heap',
  heapSize: 256,
  winVersion: 'win10',
  showSymbols: true,
  showCalc: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.action?.current === symbols.win;
  },
  winTitle: 'LFH UAF!',
  winMsg: 'Even on Windows LFH, use-after-free lets you hijack function pointers via same-size allocation reuse.',
};
