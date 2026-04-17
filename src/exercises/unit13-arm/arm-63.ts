import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00010000, bytes: [0xe3, 0xa0, 0x00, 0x0a], mnemonic: 'mov', operands: 'r0, #10', comment: 'Load 10 into R0' },
  { addr: 0x00010004, bytes: [0xe3, 0xa0, 0x10, 0x14], mnemonic: 'mov', operands: 'r1, #20', comment: 'Load 20 into R1' },
  { addr: 0x00010008, bytes: [0xe3, 0xa0, 0x20, 0x1e], mnemonic: 'mov', operands: 'r2, #30', comment: 'Load 30 into R2' },
  { addr: 0x0001000c, bytes: [0xe1, 0xa0, 0x30, 0x01], mnemonic: 'mov', operands: 'r3, r1', comment: 'Copy R1 into R3' },
  { addr: 0x00010010, bytes: [0xe3, 0xa0, 0xd8, 0x02], mnemonic: 'mov', operands: 'sp, #0x00800000', comment: 'Set SP (R13) to 0x00800000' },
  { addr: 0x00010014, bytes: [0xe1, 0xa0, 0x40, 0x0d], mnemonic: 'mov', operands: 'r4, sp', comment: 'Copy SP into R4 — same register as R13' },
  { addr: 0x00010018, bytes: [0xe7, 0xfe, 0xde, 0xf0], mnemonic: 'hlt', operands: '', comment: '' },
];

export const arm63: Exercise = {
  id: 'arm-63',
  unitId: 'unit13-arm',
  title: 'ARM Registers',
  desc: '<b>Goal:</b> Learn the ARM register set. ARM has 16 general-purpose 32-bit registers: <b>R0-R12</b> for general use, <b>R13 (SP)</b> as the stack pointer, <b>R14 (LR)</b> as the link register (holds return addresses), and <b>R15 (PC)</b> as the program counter. The <b>CPSR</b> holds condition flags (N, Z, C, V). Unlike x86, ARM registers are uniform — any general register can do arithmetic.',
  source: {
    c: [
      { text: '// ARM Registers', cls: 'comment' },
      { text: '// R0-R12  — general purpose', cls: 'comment' },
      { text: '// R13 (SP) — stack pointer', cls: 'comment' },
      { text: '// R14 (LR) — link register (return addr)', cls: 'comment' },
      { text: '// R15 (PC) — program counter', cls: 'comment' },
      { text: '// CPSR — flags: N, Z, C, V', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov r0, #10', cls: 'asm' },
      { text: 'mov r1, #20', cls: 'asm' },
      { text: 'mov r2, #30', cls: 'asm' },
      { text: 'mov r3, r1          ; register copy', cls: 'asm' },
      { text: 'mov sp, #0x00800000 ; set stack pointer', cls: 'asm' },
      { text: 'mov r4, sp          ; SP and R13 are the same!', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'arm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What value is in R3 after "mov r3, r1"?', answer: 20, format: 'decimal', hint: 'R1 was set to 20, and MOV copies R1 into R3.' },
    { question: 'What value is in R4 after "mov r4, sp"?', answer: 0x00800000, format: 'hex', hint: 'SP (R13) was set to 0x00800000. SP and R13 are the same register, so R4 gets that value.' },
    { question: 'What value is in R0 at the end?', answer: 10, format: 'decimal', hint: 'R0 was set to 10 and never changed after that.' },
  ],
  check: () => false,
  winTitle: 'ARM Registers Explored!',
  winMsg: 'You learned the ARM register set. Unlike x86 with its specialized registers, ARM has a clean uniform design with 16 general-purpose registers.',
};
