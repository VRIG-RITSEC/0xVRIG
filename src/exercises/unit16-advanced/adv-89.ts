import { Exercise } from '../types';

const adv89: Exercise = {
  id: 'adv-89',
  unitId: 'unit16-advanced',
  title: '89: Type Confusion',
  desc: '<b>Goal:</b> Exploit a type confusion vulnerability to hijack control flow. <strong>Type confusion</strong> occurs when the program treats an object as the wrong type. If <code>Base</code> has a data field at offset 4 and <code>Admin</code> has a function pointer at offset 4, casting a <code>Base*</code> to <code>Admin*</code> means the data field is now interpreted as a callable address.<br><br><b>Attack vector:</b> The program unsafely casts a Base object to an Admin pointer, then calls the virtual method. Because the field layouts differ, user-controlled data in Base::role is read as the function pointer in Admin::callback. Overflow the 16-byte stack buffer past saved EBP and overwrite the return address with the address of <code>win()</code>.<br><br><code>Base:  [vptr(4)] [name(8)] [role(4)]</code><br><code>Admin: [vptr(4)] [level(4)] [callback(4)] [data(4)]</code><br>Offset 8 in Base is name[4..8]; offset 8 in Admin is the callback function pointer.',
  source: {
    c: [
      { text: 'class Base {', cls: '' },
      { text: 'public:', cls: '' },
      { text: '    virtual void info() {}', cls: '' },
      { text: '    char name[8];', cls: '' },
      { text: '    int role;', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'class Admin {', cls: '' },
      { text: 'public:', cls: '' },
      { text: '    virtual void info() {}', cls: '' },
      { text: '    int level;', cls: '' },
      { text: '    void (*callback)(); // offset 8!', cls: 'highlight' },
      { text: '    int data;', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: 'highlight' },
      { text: '    Base *b = new Base();', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    Admin *a = (Admin*)b;  // WRONG CAST', cls: 'highlight vuln' },
      { text: '    a->callback();', cls: 'highlight vuln' },
      { text: '}', cls: '' },
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
  winTitle: 'FLAG{type_confusion}',
  winMsg: 'You exploited a type confusion where a Base object was misinterpreted as an Admin object. The field at offset 8 in Base (user data) was treated as a function pointer in Admin. Type confusion is a leading vulnerability class in JavaScript engines and browsers.',
  realWorld: 'CVE-2017-0037 (Edge/IE): A type confusion in the JavaScript engine allowed attackers to execute arbitrary code by confusing object layouts in the Chakra JIT compiler.',
};

export default adv89;
