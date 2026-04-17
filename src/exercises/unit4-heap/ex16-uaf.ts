import { Exercise } from '../types';

const ex16Uaf: Exercise = {
  id: 'heap-16',
  unitId: 'unit4-heap',
  title: '16: Use-After-Free',
  desc: 'A <strong>use-after-free (UAF)</strong> happens when the program frees memory but keeps using the old pointer. If new data gets allocated in that same spot, the old pointer now points to YOUR data. Here, a struct with a function pointer gets freed, then a note with the same size takes its place.',
  source: {
    c: [
      { text: 'struct User {', cls: '' },
      { text: '    void (*action)();', cls: 'highlight' },
      { text: '    char name[12];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: 'void greet() { printf("Hello!\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    User *u = malloc(16);', cls: '' },
      { text: '    u->action = greet;', cls: '' },
      { text: '    free(u);', cls: 'highlight vuln' },
      { text: '    // ... u is freed but pointer still exists', cls: 'cmt' },
      { text: '    char *note = malloc(16);', cls: 'highlight' },
      { text: '    read(0, note, 16);', cls: 'highlight vuln' },
      { text: '    u->action();', cls: 'highlight vuln' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-uaf',
  vizMode: 'heap',
  heapSize: 256,
  showSymbols: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.action?.current === symbols.win;
  },
  winTitle: 'FLAG{use_after_free}',
  winMsg: 'The freed User struct was recycled for the Note allocation. Your data overwrote the function pointer. When the program called u->action(), it jumped to YOUR address. This is use-after-free \u2014 one of the most common vulnerability classes in browsers and kernels.',
  realWorld: 'CVE-2022-0847 (Dirty Pipe): A use-after-free-like bug in Linux pipe handling allowed any user to overwrite read-only files, including /etc/passwd.',
};

export default ex16Uaf;
