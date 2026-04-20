import { Exercise } from '../types';

export const win44: Exercise = {
  id: 'win-44',
  unitId: 'unit9-win-heap',
  title: '44: LFH Overflow',
  desc: 'LFH heap overflow — chunk A is adjacent to chunk B which contains a function pointer. Overflow A\'s data into B to overwrite the function pointer with <code>win()</code>. Despite LFH randomization, heap spraying makes adjacent placement likely.',
  source: {
    c: [
      { text: '#include <windows.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// LFH Heap Overflow', cls: 'comment' },
      { text: '// Spray heap to get adjacent chunks', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'struct Target {', cls: '' },
      { text: '    char data[12];', cls: '' },
      { text: '    void (*handler)();', cls: 'highlight' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { WinExec("calc", 0); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *a = HeapAlloc(h, 0, 16);', cls: '' },
      { text: '    Target *b = HeapAlloc(h, 0, 16);', cls: '' },
      { text: '    b->handler = normal;', cls: '' },
      { text: '    // overflow a into b', cls: 'cmt' },
      { text: '    read(0, a, 32);', cls: 'highlight vuln' },
      { text: '    b->handler();', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-overflow',
  vizMode: 'heap',
  heapSize: 256,
  winVersion: 'win10',
  showSymbols: true,
  showCalc: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'LFH Overflow!',
  winMsg: 'Heap overflow into adjacent chunk\'s function pointer — works on both glibc and Windows LFH.',
};
