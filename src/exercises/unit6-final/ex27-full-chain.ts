import { Exercise } from '../types';

const ex27FullChain: Exercise = {
  id: 'final-27',
  unitId: 'unit6-final',
  title: '27: Full Chain',
  desc: 'Real exploits chain multiple bugs together. This program has <strong>four</strong> vulnerabilities: an integer overflow in the allocation size, an info leak that reveals a heap address, a heap overflow that lets you write past the buffer, and a function pointer that gets called at the end. Chain all four to redirect execution to <code>win()</code>.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: 'void normal() { printf("OK\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'struct Config {', cls: '' },
      { text: '    void (*handler)();  // function pointer', cls: '' },
      { text: '    char name[12];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    unsigned short count;', cls: '' },
      { text: '    printf("How many items? ");', cls: '' },
      { text: '    scanf("%u", &count);', cls: 'highlight vuln' },
      { text: '    // Bug 1: count is 16-bit, count*4 can wrap!', cls: 'cmt' },
      { text: '    char *buf = malloc(count * 4);', cls: 'highlight vuln' },
      { text: '    Config *cfg = malloc(16);', cls: '' },
      { text: '    cfg->handler = normal;', cls: '' },
      { text: '', cls: '' },
      { text: '    // Bug 2: info leak', cls: 'cmt' },
      { text: '    printf("DEBUG: cfg at %p\\n", cfg);', cls: 'highlight vuln' },
      { text: '', cls: '' },
      { text: '    // Bug 3: reads 256 bytes into tiny buf', cls: 'cmt' },
      { text: '    read(0, buf, 256);', cls: 'highlight vuln' },
      { text: '', cls: '' },
      { text: '    cfg->handler();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'final-chain',
  vizMode: 'both',
  glibcVersion: '2.27',
  heapSize: 256,
  showSymbols: true,
  funcPtrAddr: undefined,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{full_chain_master}',
  winMsg: 'You chained four vulnerabilities together: integer overflow \u2192 small allocation, info leak \u2192 know the target address, heap overflow \u2192 corrupt the function pointer, control flow hijack \u2192 jump to win(). This is how real exploits work \u2014 no single bug is enough, but together they give you full control.',
};

export default ex27FullChain;
