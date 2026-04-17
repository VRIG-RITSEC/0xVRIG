import { Exercise } from '../types';

const adv87: Exercise = {
  id: 'adv-87',
  unitId: 'unit16-advanced',
  title: '87: C++ Vtable Layout',
  desc: '<b>Goal:</b> Understand how C++ virtual dispatch works at the binary level. When a class has virtual methods, the compiler inserts a hidden pointer (<strong>vptr</strong>) at offset 0 of every object. This vptr points to a <strong>vtable</strong> \u2014 a static array of function pointers, one per virtual method, in declaration order. A virtual call like <code>obj->speak()</code> compiles to: load vptr from <code>[obj+0]</code>, index into the vtable, and call through the function pointer. Attackers who can overwrite the vptr or vtable entries can redirect any virtual call.',
  source: {
    c: [
      { text: '// C++ vtable layout (simplified)', cls: 'cmt' },
      { text: 'class Animal {', cls: '' },
      { text: 'public:', cls: '' },
      { text: '    virtual void speak() { puts("..."); }', cls: 'highlight' },
      { text: '    virtual void eat()   { puts("*eat*"); }', cls: 'highlight' },
      { text: '    int health;', cls: '' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: '// Object layout in memory:', cls: 'cmt' },
      { text: '// +0x00: vptr -> Animal_vtable', cls: 'cmt' },
      { text: '// +0x04: health (int)', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// Animal_vtable (static, read-only):', cls: 'cmt' },
      { text: '// [0]: &Animal::speak', cls: 'cmt' },
      { text: '// [1]: &Animal::eat', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    Animal *a = new Animal();', cls: 'highlight' },
      { text: '    a->health = 100;', cls: '' },
      { text: '    a->speak(); // virtual dispatch', cls: 'highlight' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 256,
  steps: [
    {
      action: 'init',
      log: ['info', 'C++ classes with virtual methods use a hidden mechanism called "virtual dispatch." The compiler generates a vtable (virtual method table) for each class and stores a pointer to it inside every object.'],
    },
    {
      action: 'malloc', size: 8, name: 'Animal', srcLine: 17,
      log: ['action', 'new Animal() allocates 8 bytes on the heap: 4 bytes for the vptr (hidden, at offset 0) and 4 bytes for the health field (at offset 4). The constructor automatically sets the vptr.'],
    },
    {
      action: 'init',
      log: ['info', 'The vptr at [obj+0x00] is set to the address of Animal_vtable. This vtable lives in a read-only section (.rodata) and is shared by ALL Animal objects. It contains one function pointer per virtual method.'],
    },
    {
      action: 'init', srcLine: 18,
      log: ['info', 'a->health = 100 writes to [obj+0x04]. The data fields always come after the vptr. If there were multiple inheritance, there could be multiple vptrs, but single inheritance gives exactly one at offset 0.'],
    },
    {
      action: 'init', srcLine: 19,
      log: ['action', 'a->speak() compiles to: (1) load vptr: mov eax, [ecx] where ecx = obj address, (2) index the vtable: speak is slot 0, so call [eax+0]. The CPU dereferences the vptr, finds speak\'s address in the vtable, and jumps there.'],
    },
    {
      action: 'init',
      log: ['warn', 'If an attacker overwrites the vptr to point at a fake vtable they control, the virtual call will jump to an attacker-chosen address. This is vtable hijacking \u2014 one of the most exploited vulnerability classes in browsers and document parsers.'],
    },
    {
      action: 'done',
      log: ['success', 'C++ vtable layout: object has hidden vptr at offset 0 -> points to vtable (array of function pointers in .rodata) -> virtual call dereferences vptr, indexes vtable, calls through function pointer. Corrupt the vptr = control the call target.'],
    },
  ],
  check() { return false; },
  winTitle: 'Vtable Layout Understood!',
  winMsg: 'You now understand C++ virtual dispatch: vptr at object offset 0, vtable as a static function pointer array, and how virtual calls resolve through double indirection. This is the foundation for vtable hijacking attacks.',
};

export default adv87;
