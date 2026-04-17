import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x0000555555554000, bytes: [0x55], mnemonic: 'push', operands: 'rbp', comment: 'PIE: base address randomized each run' },
  { addr: 0x0000555555554001, bytes: [0x48, 0x89, 0xe5], mnemonic: 'mov', operands: 'rbp, rsp', comment: 'Frame pointer setup' },
  { addr: 0x0000555555554004, bytes: [0x48, 0x8d, 0x05, 0xf5, 0x0f, 0x00, 0x00], mnemonic: 'lea', operands: 'rax, [rip + 0xff5]', comment: 'RIP-relative: rax = 0x555555555000' },
  { addr: 0x000055555555400b, bytes: [0x48, 0x8d, 0x1d, 0xee, 0x1f, 0x00, 0x00], mnemonic: 'lea', operands: 'rbx, [rip + 0x1fee]', comment: 'RIP-relative: rbx = 0x555555556000' },
  { addr: 0x0000555555554012, bytes: [0x48, 0xc7, 0xc1, 0x00, 0x50, 0x55, 0x55], mnemonic: 'mov', operands: 'rcx, 0x55555000', comment: 'Absolute address -- breaks under ASLR!' },
  { addr: 0x0000555555554019, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const exercise: Exercise = {
  id: 'mit-83',
  unitId: 'unit15-mitigations',
  title: '83: PIE',
  desc: '<b>Goal:</b> Understand Position-Independent Executables. A PIE binary uses <strong>RIP-relative addressing</strong> instead of absolute addresses. Combined with ASLR, the entire executable is loaded at a random base address each run. The key instruction is <code>lea reg, [rip + offset]</code> -- it computes addresses relative to the current instruction pointer, so the code works at any base address.',
  source: {
    c: [
      { text: '// Position-Independent Executable (PIE)', cls: 'comment' },
      { text: '// Compiled with: gcc -pie -fpie', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// RIP-relative addressing: works at any base', cls: 'comment' },
      { text: '// lea rax, [rip + 0xff5]', cls: 'comment' },
      { text: '//   = current_rip + 0xff5', cls: 'comment' },
      { text: '//   -> always points to the right data', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Absolute addressing: breaks if base moves', cls: 'comment' },
      { text: '// mov rcx, 0x55555000', cls: 'comment' },
      { text: '//   -> hardcoded! Wrong if ASLR moves us', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'push rbp', cls: 'asm' },
      { text: 'mov rbp, rsp', cls: 'asm' },
      { text: 'lea rax, [rip + 0xff5]', cls: 'asm' },
      { text: 'lea rbx, [rip + 0x1fee]', cls: 'asm' },
      { text: 'mov rcx, 0x55555000  ; bad!', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'x86-64',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What value does "lea rax, [rip + 0xff5]" compute? RIP after this instruction is 0x55555400b. Give rax in hex.', answer: 0x555555000, format: 'hex', hint: 'lea with [rip + offset] computes rip_after_instruction + offset. 0x55555400b + 0xff5 = 0x555555000.' },
    { question: 'If the PIE binary is reloaded at base 0x7fff00000000 instead of 0x555555554000, does "lea rax, [rip + 0xff5]" still compute the correct address? (1=yes, 0=no)', answer: 1, format: 'decimal', hint: 'RIP-relative addressing automatically adjusts -- the offset from the instruction to the target is the same regardless of where the binary is loaded.' },
    { question: 'Does "mov rcx, 0x55555000" (absolute address) still work if the binary is loaded at a different base? (1=yes, 0=no)', answer: 0, format: 'decimal', hint: 'Absolute addresses are hardcoded at compile time. If ASLR moves the binary, the hardcoded address points to the wrong location.' },
  ],
  check: () => false,
  winTitle: 'PIE Understood!',
  winMsg: 'PIE binaries use RIP-relative addressing so every code and data reference is an offset from the current instruction, not a hardcoded address. Combined with ASLR, the entire binary loads at a random base each run.',
};
