import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00000830, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x0000555555554830', comment: 'Leaked PIE address (e.g., from format string)' },
  { addr: 0x0000083a, bytes: [0x48, 0x25], mnemonic: 'and', operands: 'rax, 0xfffff000', comment: 'Mask to page boundary → PIE base' },
  { addr: 0x00000844, bytes: [0x48, 0x89, 0xc3], mnemonic: 'mov', operands: 'rbx, rax', comment: 'RBX = PIE base address' },
  { addr: 0x00000847, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x830', comment: 'win() offset from binary base' },
  { addr: 0x00000851, bytes: [0x48, 0x01, 0xd8], mnemonic: 'add', operands: 'rax, rbx', comment: 'RAX = pie_base + win_offset' },
  { addr: 0x00000854, bytes: [0x48, 0x89, 0xc2], mnemonic: 'mov', operands: 'rdx, rax', comment: 'RDX = absolute address of win()' },
  // Partial overwrite approach
  { addr: 0x00000857, bytes: [0x48, 0xb8], mnemonic: 'mov', operands: 'rax, 0x0000555555554900', comment: 'Original return address' },
  { addr: 0x00000861, bytes: [0x66, 0xb8, 0x30, 0x48], mnemonic: 'mov', operands: 'ax, 0x4830', comment: 'Overwrite just last 2 bytes → win()' },
  { addr: 0x00000865, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Partial overwrite bypasses full ASLR!' },
];

export const x6435: Exercise = {
  id: 'x64-35',
  unitId: 'unit7-x64',
  title: 'PIE Bypass',
  desc: '<b>Goal:</b> PIE (Position Independent Executable) randomizes the binary\'s base address. But within the binary, <b>offsets are fixed</b>. A partial overwrite of the return address (just the last 1-2 bytes) stays within the same binary page. If you can leak any code address, compute the base and find win().',
  source: {
    c: [
      { text: '// PIE — Position Independent Executable', cls: 'comment' },
      { text: '// Base address is random, but offsets are fixed', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Without PIE: win() always at 0x08048150', cls: 'comment' },
      { text: '// With PIE:    win() at base + 0x830', cls: 'comment' },
      { text: '//   base changes every run!', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Bypass strategies:', cls: 'comment' },
      { text: '// 1. Leak any code address, subtract offset', cls: 'comment' },
      { text: '//    → compute base → add win() offset', cls: 'comment' },
      { text: '// 2. Partial overwrite: only change last', cls: 'comment' },
      { text: '//    1-2 bytes of return address', cls: 'comment' },
      { text: '//    → stays in same page (12-bit aligned)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Note: PIE + ASLR randomizes 28+ bits', cls: 'comment' },
      { text: '// but last 12 bits (page offset) are fixed', cls: 'comment' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  protections: [{ name: 'PIE', status: 'bypassed' }],
  asmQuiz: [
    { question: 'How many bits of the address are fixed (page offset) regardless of ASLR/PIE?', answer: 12, format: 'decimal', hint: 'Pages are 4KB = 2^12, so the last 12 bits are always the same.' },
    { question: 'If win() is at offset 0x830 in the binary (loaded at 0x555555554000), what 2 bytes would you overwrite the return address with?', answer: 0x4830, format: 'hex', hint: 'win() loaded address is 0x555555554830. The bottom 2 bytes are 0x4830.' },
  ],
  check: () => false,
  winTitle: 'PIE Bypassed!',
  winMsg: 'You understand PIE bypass via partial overwrites and base calculation.',
};
