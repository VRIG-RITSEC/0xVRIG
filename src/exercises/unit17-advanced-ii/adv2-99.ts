import { Exercise } from '../types';

const adv299: Exercise = {
  id: 'adv2-99',
  unitId: 'unit17-advanced-ii',
  title: '99: Heap Feng Shui',
  desc: '<b>Goal:</b> Achieve a deterministic heap layout to overflow into a function pointer. Heap Feng Shui (a term from browser exploitation) uses three phases: <strong>spray</strong> — allocate many same-sized objects to fill free lists and align the heap; <strong>poke holes</strong> — free strategic objects to create gaps at predictable positions; <strong>target allocation</strong> — allocate the target object so it lands in a gap adjacent to a surviving object. Once the layout is controlled, overflow the vulnerable buffer into the adjacent chunk\'s function pointer. This technique turns the non-deterministic heap into a predictable exploitation surface.',
  source: {
    c: [
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: 'void normal() { printf("Normal\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    // Phase 1: Spray — fill heap with same-sized objects', cls: 'cmt' },
      { text: '    void *spray[100];', cls: '' },
      { text: '    for (int i = 0; i < 100; i++)', cls: '' },
      { text: '        spray[i] = malloc(32);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '    // Phase 2: Poke holes — free every other one', cls: 'cmt' },
      { text: '    for (int i = 1; i < 100; i += 2)', cls: '' },
      { text: '        free(spray[i]);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '    // Phase 3: Allocate target into hole', cls: 'cmt' },
      { text: '    char *vuln_buf = malloc(32);', cls: 'highlight vuln' },
      { text: '    // vuln_buf lands next to spray[i-1]', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '    // Allocate handler in adjacent hole', cls: 'cmt' },
      { text: '    void (**handler)() = malloc(32);', cls: '' },
      { text: '    *handler = normal;', cls: '' },
      { text: '', cls: '' },
      { text: '    // Overflow vuln_buf into handler!', cls: 'cmt' },
      { text: '    read(0, vuln_buf, 128);', cls: 'highlight vuln' },
      { text: '    (*handler)();', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-overflow',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 512,
  showSymbols: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.handler?.current === symbols.win;
  },
  winTitle: 'FLAG{heap_feng_shui}',
  winMsg: 'You shaped the heap deterministically: spray to normalize layout, poke holes to create gaps, then place your buffer adjacent to the target. Heap Feng Shui originated in browser exploitation (particularly IE and Firefox) where attackers needed to reliably position JavaScript-controlled allocations next to victim objects in the heap.',
  protections: [
    { name: 'NX', status: 'active' },
    { name: 'ASLR', status: 'disabled' },
    { name: 'Canary', status: 'disabled' },
  ],
  realWorld: 'Heap Feng Shui was pioneered by Alexander Sotirov for browser exploitation (2007) and remains fundamental to all modern browser exploit chains.',
};

export default adv299;
