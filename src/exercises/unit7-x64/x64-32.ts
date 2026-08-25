import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // __libc_csu_init gadgets (universal in glibc-linked x64 binaries)
  // NOTE: __libc_csu_init was removed in glibc 2.34 (August 2021)
  // Gadget 2 (at end of __libc_csu_init): pop rbx; pop rbp; pop r12; pop r13; pop r14; pop r15; ret
  { addr: 0x0040089a, bytes: [0x5b], mnemonic: 'pop', operands: 'rbx', comment: 'gadget2: RBX = 0 (index)' },
  { addr: 0x0040089b, bytes: [0x5d], mnemonic: 'pop', operands: 'rbp', comment: 'RBP = 1 (loop condition: RBX+1 == RBP)' },
  { addr: 0x0040089c, bytes: [0x41, 0x5c], mnemonic: 'pop', operands: 'r12', comment: 'R12 = addr of function ptr to call' },
  { addr: 0x0040089e, bytes: [0x41, 0x5d], mnemonic: 'pop', operands: 'r13', comment: 'R13 → RDX (3rd arg)' },
  { addr: 0x004008a0, bytes: [0x41, 0x5e], mnemonic: 'pop', operands: 'r14', comment: 'R14 → RSI (2nd arg)' },
  { addr: 0x004008a2, bytes: [0x41, 0x5f], mnemonic: 'pop', operands: 'r15', comment: 'R15 → EDI (1st arg)' },
  { addr: 0x004008a4, bytes: [0xc3], mnemonic: 'ret', operands: '', comment: 'Return to gadget1' },
  // Gadget 1 (in __libc_csu_init body): uses R12-R15 to set up call
  { addr: 0x00400880, bytes: [0x4c, 0x89, 0xea], mnemonic: 'mov', operands: 'rdx, r13', comment: 'gadget1: RDX = R13 (3rd arg)' },
  { addr: 0x00400883, bytes: [0x4c, 0x89, 0xf6], mnemonic: 'mov', operands: 'rsi, r14', comment: 'RSI = R14 (2nd arg)' },
  { addr: 0x00400886, bytes: [0x44, 0x89, 0xff], mnemonic: 'mov', operands: 'edi, r15d', comment: 'EDI = R15d (1st arg, 32-bit)' },
  { addr: 0x00400889, bytes: [0x41, 0xff, 0x14, 0xdc], mnemonic: 'call', operands: '[r12+rbx*8]', comment: 'Call function at [R12 + RBX*8]' },
  { addr: 0x0040088d, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Function called with controlled args!' },
];

export const x6432: Exercise = {
  id: 'x64-32',
  unitId: 'unit7-x64',
  title: 'ret2csu',
  desc: '<b>Goal:</b> <code>__libc_csu_init</code> is present in almost every x64 binary. It contains two "universal gadgets" that let you control RDI, RSI, RDX (first 3 args) and call any function pointer. Gadget2 pops 6 registers; gadget1 moves them into arg registers and calls [R12].',
  source: {
    c: [
      { text: '// ret2csu — Universal ROP Gadgets', cls: 'comment' },
      { text: '// Found in __libc_csu_init of most x64 ELF binaries', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Gadget 2 (0x40089a):', cls: 'comment' },
      { text: '//   pop rbx; pop rbp; pop r12; pop r13;', cls: 'comment' },
      { text: '//   pop r14; pop r15; ret', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Gadget 1 (0x400880):', cls: 'comment' },
      { text: '//   mov rdx, r13  ; 3rd arg', cls: 'comment' },
      { text: '//   mov rsi, r14  ; 2nd arg', cls: 'comment' },
      { text: '//   mov edi, r15d ; 1st arg', cls: 'comment' },
      { text: '//   call [r12+rbx*8]', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Chain: gadget2 → gadget1 → function', cls: 'comment' },
      { text: 'gadget2:', cls: 'label' },
      { text: '  pop rbx/rbp/r12/r13/r14/r15; ret', cls: 'asm' },
      { text: 'gadget1:', cls: 'label' },
      { text: '  rdx=r13; rsi=r14; edi=r15d', cls: 'asm' },
      { text: '  call [r12+rbx*8]', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  asmInitialRegs: { rsp: 0x7fff0100 },
  asmStackBase: 0x7fff0100,
  asmInitialMemory: [
    // Stack data for gadget2 pops
    { addr: 0x7fff0100, value: 0, size: 8 },       // rbx = 0
    { addr: 0x7fff0108, value: 1, size: 8 },       // rbp = 1
    { addr: 0x7fff0110, value: 0x00601000, size: 8 }, // r12 = ptr to function table
    { addr: 0x7fff0118, value: 0x42, size: 8 },    // r13 → rdx (arg3)
    { addr: 0x7fff0120, value: 0x41, size: 8 },    // r14 → rsi (arg2)
    { addr: 0x7fff0128, value: 0x40, size: 8 },    // r15 → edi (arg1)
    { addr: 0x7fff0130, value: 0x00400880, size: 8 }, // ret → gadget1
    // Function table at 0x601000
    { addr: 0x00601000, value: 0x00400500, size: 8 }, // target function addr
  ],
  asmQuiz: [
    { question: 'How many registers does gadget2 pop?', answer: 6, format: 'decimal', hint: 'pop rbx, rbp, r12, r13, r14, r15 — six total.' },
    { question: 'Which register holds the 3rd argument (RDX) value before gadget1 moves it?', answer: 13, format: 'decimal', hint: 'R13 → RDX. Enter the register number (13 for R13).' },
  ],
  check: () => false,
  winTitle: 'ret2csu Expert!',
  winMsg: 'You understand the universal __libc_csu_init gadgets for x64 ROP.',
};
