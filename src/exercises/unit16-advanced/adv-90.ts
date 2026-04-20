import { Exercise } from '../types';

const adv90: Exercise = {
  id: 'adv-90',
  unitId: 'unit16-advanced',
  title: '90: UAF + Vtable',
  desc: '<b>Goal:</b> Combine use-after-free with vtable hijacking. A C++ object with virtual methods is allocated, freed, and then the dangling pointer is used to call a virtual method. Because the object was freed, its heap memory is returned to the allocator. If you allocate a new buffer of the same size, it lands in the same slot. You now control the bytes that the dangling pointer reads as the vptr.<br><br><b>Attack:</b> The freed <code>Widget</code> object was 16 bytes: <code>[vptr(4)][id(4)][data(8)]</code>. A new <code>malloc(16)</code> reclaims the same memory, and you write 16 bytes into it. The first 4 bytes overwrite where vptr was. When <code>w->action()</code> dereferences the vptr, it reads your controlled data. Write the address of <code>win()</code> in the first 4 bytes to hijack the virtual call.',
  source: {
    c: [
      { text: 'class Widget {', cls: '' },
      { text: 'public:', cls: '' },
      { text: '    virtual void action() {', cls: '' },
      { text: '        puts("widget action");', cls: '' },
      { text: '    }', cls: '' },
      { text: '    int id;', cls: '' },
      { text: '    char data[8];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: 'void normal() { printf("normal\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    Widget *w = new Widget();', cls: '' },
      { text: '    w->action = normal;', cls: '' },
      { text: '    delete w;', cls: 'highlight vuln' },
      { text: '    // w is freed but pointer still exists!', cls: 'cmt' },
      { text: '    char *buf = (char*)malloc(16);', cls: 'highlight' },
      { text: '    read(0, buf, 16);  // you control this', cls: 'highlight vuln' },
      { text: '    w->action();  // UAF: reads freed memory', cls: 'highlight vuln' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'heap-uaf',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 256,
  showSymbols: true,
  check(_, heap, symbols) {
    return heap?.funcPtrs?.action?.current === symbols.win;
  },
  winTitle: 'FLAG{uaf_vtable_hijack}',
  winMsg: 'You combined use-after-free with vtable hijacking. The freed C++ object\'s memory was reclaimed by a new allocation, and you overwrote the vptr with a pointer to win(). When the dangling pointer called the virtual method, it followed your fake vptr. This is exactly how major browser exploits work \u2014 free a DOM object, reclaim its memory, and hijack the vtable.',
  protections: [
    { name: 'NX', status: 'active' },
    { name: 'ASLR', status: 'disabled' },
    { name: 'Canary', status: 'disabled' },
    { name: 'CFI', status: 'disabled' },
  ],
  realWorld: 'CVE-2019-5786 (Chrome FileReader UAF): A use-after-free in Chrome\'s FileReader API allowed attackers to overwrite a freed C++ object\'s vtable and achieve code execution, exploited as a 0-day in the wild.',
};

export default adv90;
