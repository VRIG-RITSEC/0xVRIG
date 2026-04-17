import { Exercise } from '../types';

const adv88: Exercise = {
  id: 'adv-88',
  unitId: 'unit16-advanced',
  title: '88: Vtable Hijacking',
  desc: '<b>Goal:</b> Overwrite the return address by exploiting a vtable hijack scenario. In real C++ exploitation, the attacker overwrites an object\'s <strong>vptr</strong> to point to a fake vtable containing the address of <code>win()</code>. Here, a heap object\'s buffer overflows into the vptr of an adjacent object. The program then calls a virtual method on the corrupted object, which follows the hijacked vptr to your controlled function pointer.<br><br><b>Attack vector:</b> The 16-byte buffer <code>buf</code> is followed by the saved EBP and return address on the stack. Overflow the buffer with 16 bytes of padding + 4 bytes for saved EBP + 4 bytes for the address of <code>win()</code>. In a real vtable hijack, you would point the vptr at a fake vtable; here the simulation abstracts this to a return address overwrite that models the same control-flow hijack.',
  source: {
    c: [
      { text: 'class Base {', cls: '' },
      { text: 'public:', cls: '' },
      { text: '    virtual void action() { puts("normal"); }', cls: '' },
      { text: '    char name[8];', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];  // stack buffer', cls: 'highlight' },
      { text: '    Base *obj = new Base();', cls: '' },
      { text: '    gets(buf);     // overflow!', cls: 'highlight vuln' },
      { text: '    obj->action(); // virtual call through vptr', cls: 'highlight vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Object layout: [vptr|name[8]]', cls: 'cmt' },
      { text: '// vptr -> Base_vtable -> [&action]', cls: 'cmt' },
      { text: '// Overwrite vptr -> fake vtable -> win()', cls: 'cmt' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{vtable_hijack}',
  winMsg: 'You hijacked a C++ virtual call by corrupting the vptr. In real-world exploits, attackers craft fake vtables in heap spray regions or known addresses. Chrome, Firefox, and IE have all been exploited through vtable hijacking in use-after-free scenarios.',
  realWorld: 'CVE-2014-1776 (IE): A use-after-free allowed vtable hijacking in Internet Explorer\'s CMarkup object, exploited in the wild for targeted attacks.',
};

export default adv88;
