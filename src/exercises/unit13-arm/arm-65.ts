import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00010000, bytes: [0xe3, 0xa0, 0x18, 0x02], mnemonic: 'mov', operands: 'r1, #0x00020000', comment: 'R1 = base address of our data' },
  { addr: 0x00010004, bytes: [0xe5, 0x91, 0x00, 0x00], mnemonic: 'ldr', operands: 'r0, [r1]', comment: 'Load word at [R1] into R0' },
  { addr: 0x00010008, bytes: [0xe5, 0x91, 0x20, 0x04], mnemonic: 'ldr', operands: 'r2, [r1, #4]', comment: 'Load word at [R1+4] into R2' },
  { addr: 0x0001000c, bytes: [0xe5, 0x91, 0x30, 0x08], mnemonic: 'ldr', operands: 'r3, [r1, #8]', comment: 'Load word at [R1+8] into R3' },
  { addr: 0x00010010, bytes: [0xe3, 0xa0, 0x40, 0x42], mnemonic: 'mov', operands: 'r4, #0x42', comment: 'R4 = 0x42' },
  { addr: 0x00010014, bytes: [0xe5, 0x81, 0x40, 0x0c], mnemonic: 'str', operands: 'r4, [r1, #12]', comment: 'Store R4 at [R1+12]' },
  { addr: 0x00010018, bytes: [0xe5, 0x91, 0x50, 0x0c], mnemonic: 'ldr', operands: 'r5, [r1, #12]', comment: 'Load back what we just stored' },
  { addr: 0x0001001c, bytes: [0xe7, 0xfe, 0xde, 0xf0], mnemonic: 'hlt', operands: '', comment: '' },
];

export const arm65: Exercise = {
  id: 'arm-65',
  unitId: 'unit13-arm',
  title: 'Memory Access',
  desc: '<b>Goal:</b> Learn ARM memory instructions. <b>LDR</b> loads a word from memory into a register. <b>STR</b> stores a register value to memory. Addressing uses a base register with an optional offset: <code>LDR R0, [R1, #4]</code> loads from address R1+4. Unlike x86, ARM can only access memory through LDR/STR — arithmetic instructions work only on registers (load-store architecture).',
  source: {
    c: [
      { text: '// ARM Memory Access (Load-Store Architecture)', cls: 'comment' },
      { text: '// LDR Rd, [Rn]       — load from [Rn]', cls: 'comment' },
      { text: '// LDR Rd, [Rn, #off] — load from [Rn + offset]', cls: 'comment' },
      { text: '// STR Rd, [Rn, #off] — store to [Rn + offset]', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Memory at 0x00020000:', cls: 'comment' },
      { text: '//   +0: 0xDEADBEEF', cls: 'comment' },
      { text: '//   +4: 0xCAFEBABE', cls: 'comment' },
      { text: '//   +8: 0x00000064 (100)', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov r1, #0x00020000  ; base address', cls: 'asm' },
      { text: 'ldr r0, [r1]         ; load first word', cls: 'asm' },
      { text: 'ldr r2, [r1, #4]     ; load second word', cls: 'asm' },
      { text: 'ldr r3, [r1, #8]     ; load third word', cls: 'asm' },
      { text: 'mov r4, #0x42', cls: 'asm' },
      { text: 'str r4, [r1, #12]    ; store to memory', cls: 'asm' },
      { text: 'ldr r5, [r1, #12]    ; load it back', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'arm',
  asmInstructions: instructions,
  asmInitialRegs: { r1: 0x00020000 },
  asmInitialMemory: [
    { addr: 0x00020000, value: 0xDEADBEEF, size: 4 },
    { addr: 0x00020004, value: 0xCAFEBABE, size: 4 },
    { addr: 0x00020008, value: 0x00000064, size: 4 },
  ],
  asmQuiz: [
    { question: 'What value is in R0 after "ldr r0, [r1]"?', answer: 0xDEADBEEF, format: 'hex', hint: 'R1 points to 0x00020000, which contains 0xDEADBEEF.' },
    { question: 'What value is in R3 after "ldr r3, [r1, #8]"?', answer: 100, format: 'decimal', hint: 'R1=0x00020000, offset +8 = 0x00020008, which holds 0x64 = 100 in decimal.' },
    { question: 'What value is in R5 after loading back the stored value?', answer: 0x42, format: 'hex', hint: 'We stored R4 (0x42) to [R1+12], then loaded it back into R5.' },
  ],
  check: () => false,
  winTitle: 'Memory Access Mastered!',
  winMsg: 'You understand ARM\'s load-store architecture. This separation of memory access from computation is a key RISC design principle.',
};
