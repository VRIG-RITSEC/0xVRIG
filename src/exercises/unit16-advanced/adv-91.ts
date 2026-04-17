import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// Simulate virtual dispatch: load vptr from object, index vtable, call through it
// Object at 0x0804c000: vptr = 0x08049000
// Vtable at 0x08049000: [0] = 0x08048100 (speak), [1] = 0x08048200 (act)
// Second object at 0x0804c010: vptr = 0x08049010
// Vtable2 at 0x08049010: [0] = 0x08048300 (gadget1), [1] = 0x08048400 (gadget2)
const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb9, 0x00, 0xc0, 0x04, 0x08], mnemonic: 'mov', operands: 'ecx, 0x0804c000', comment: 'ecx = obj1 (this pointer)' },
  { addr: 0x08048005, bytes: [0x8b, 0x01], mnemonic: 'mov', operands: 'eax, [ecx]', comment: 'eax = obj1->vptr (load vtable pointer)' },
  { addr: 0x08048007, bytes: [0x8b, 0x10], mnemonic: 'mov', operands: 'edx, [eax]', comment: 'edx = vtable[0] (first virtual method)' },
  { addr: 0x08048009, bytes: [0x8b, 0x58, 0x04], mnemonic: 'mov', operands: 'ebx, [eax+4]', comment: 'ebx = vtable[1] (second virtual method)' },
  { addr: 0x0804800c, bytes: [0xb9, 0x10, 0xc0, 0x04, 0x08], mnemonic: 'mov', operands: 'ecx, 0x0804c010', comment: 'ecx = obj2 (second object)' },
  { addr: 0x08048011, bytes: [0x8b, 0x01], mnemonic: 'mov', operands: 'eax, [ecx]', comment: 'eax = obj2->vptr' },
  { addr: 0x08048013, bytes: [0x8b, 0x70, 0x04], mnemonic: 'mov', operands: 'esi, [eax+4]', comment: 'esi = obj2_vtable[1] (COOP: chain another virtual call)' },
  { addr: 0x08048016, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'End of dispatch sequence' },
];

const adv91: Exercise = {
  id: 'adv-91',
  unitId: 'unit16-advanced',
  title: '91: Counterfeit OOP (COOP)',
  desc: '<b>Goal:</b> Understand Counterfeit Object-Oriented Programming (COOP), an advanced code-reuse attack that chains existing virtual method calls from legitimate vtables to bypass Control-Flow Integrity (CFI). Unlike ROP which chains gadgets ending in <code>ret</code>, COOP chains <strong>virtual function calls</strong> (vfgadgets) that are already present in the program\'s vtables. Because each call goes through a legitimate vtable entry, coarse-grained CFI cannot distinguish malicious calls from normal virtual dispatch.<br><br>The assembly below simulates loading two C++ objects and resolving their virtual methods through vtable indirection. Study how the vptr is dereferenced and vtable entries are indexed.',
  source: {
    c: [
      { text: '// COOP: Counterfeit Object-Oriented Programming', cls: 'comment' },
      { text: '// Instead of ROP gadgets, reuse virtual methods', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Object layout:', cls: 'comment' },
      { text: '// obj1 @ 0x0804c000: vptr -> 0x08049000', cls: 'comment' },
      { text: '// vtable1 @ 0x08049000: [speak=0x08048100, act=0x08048200]', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// obj2 @ 0x0804c010: vptr -> 0x08049010', cls: 'comment' },
      { text: '// vtable2 @ 0x08049010: [gadget1=0x08048300, gadget2=0x08048400]', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov ecx, 0x0804c000   ; this = obj1', cls: 'asm' },
      { text: 'mov eax, [ecx]        ; load vptr', cls: 'asm' },
      { text: 'mov edx, [eax]        ; vtable[0] = speak', cls: 'asm' },
      { text: 'mov ebx, [eax+4]      ; vtable[1] = act', cls: 'asm' },
      { text: 'mov ecx, 0x0804c010   ; this = obj2', cls: 'asm' },
      { text: 'mov eax, [ecx]        ; load vptr', cls: 'asm' },
      { text: 'mov esi, [eax+4]      ; vtable2[1] = gadget2', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmInitialMemory: [
    // obj1 at 0x0804c000: vptr = 0x08049000
    { addr: 0x0804c000, value: 0x08049000, size: 4 },
    // vtable1 at 0x08049000: [0] = 0x08048100, [1] = 0x08048200
    { addr: 0x08049000, value: 0x08048100, size: 4 },
    { addr: 0x08049004, value: 0x08048200, size: 4 },
    // obj2 at 0x0804c010: vptr = 0x08049010
    { addr: 0x0804c010, value: 0x08049010, size: 4 },
    // vtable2 at 0x08049010: [0] = 0x08048300, [1] = 0x08048400
    { addr: 0x08049010, value: 0x08048300, size: 4 },
    { addr: 0x08049014, value: 0x08048400, size: 4 },
  ],
  asmQuiz: [
    {
      question: 'After loading obj1\'s vptr, what address is in EAX (the vtable address)?',
      answer: 0x08049000,
      format: 'hex',
      hint: 'obj1 is at 0x0804c000 and its first 4 bytes (the vptr) contain the vtable address 0x08049000.',
    },
    {
      question: 'What address does EDX hold after "mov edx, [eax]"? This is vtable1[0] \u2014 the first virtual method.',
      answer: 0x08048100,
      format: 'hex',
      hint: 'EAX = 0x08049000 (vtable1). The first entry at [0x08049000] is the speak function at 0x08048100.',
    },
    {
      question: 'What address ends up in ESI? This is the second virtual method from obj2\'s vtable \u2014 the "vfgadget" COOP would chain.',
      answer: 0x08048400,
      format: 'hex',
      hint: 'obj2\'s vptr points to vtable2 at 0x08049010. Entry [1] is at offset +4 = 0x08049014, which contains 0x08048400.',
    },
  ],
  check: () => false,
  winTitle: 'COOP Dispatch Understood!',
  winMsg: 'You traced virtual dispatch through two objects and their vtables. COOP chains these existing virtual calls as "vfgadgets" \u2014 each legitimate on its own, but together they form an exploit payload. Because every call goes through a real vtable, coarse-grained CFI sees nothing wrong. This was published by Schuster et al. in 2015 and demonstrated practical attacks against C++ programs even with CFI enabled.',
};

export default adv91;
