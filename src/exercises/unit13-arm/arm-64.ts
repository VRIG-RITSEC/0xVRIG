import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00010000, bytes: [0xe3, 0xa0, 0x10, 0x07], mnemonic: 'mov', operands: 'r1, #7', comment: 'R1 = 7' },
  { addr: 0x00010004, bytes: [0xe3, 0xa0, 0x20, 0x03], mnemonic: 'mov', operands: 'r2, #3', comment: 'R2 = 3' },
  { addr: 0x00010008, bytes: [0xe0, 0x81, 0x00, 0x02], mnemonic: 'add', operands: 'r0, r1, r2', comment: 'R0 = R1 + R2' },
  { addr: 0x0001000c, bytes: [0xe2, 0x40, 0x30, 0x05], mnemonic: 'sub', operands: 'r3, r0, #5', comment: 'R3 = R0 - 5' },
  { addr: 0x00010010, bytes: [0xe0, 0x04, 0x40, 0x91], mnemonic: 'mul', operands: 'r4, r1, r0', comment: 'R4 = R1 * R0' },
  { addr: 0x00010014, bytes: [0xe1, 0xa0, 0x51, 0x01], mnemonic: 'mov', operands: 'r5, r1, LSL #2', comment: 'R5 = R1 shifted left by 2 (R1 * 4)' },
  { addr: 0x00010018, bytes: [0xe0, 0x00, 0x60, 0x02], mnemonic: 'and', operands: 'r6, r0, r2', comment: 'R6 = R0 AND R2' },
  { addr: 0x0001001c, bytes: [0xe1, 0x81, 0x70, 0x02], mnemonic: 'orr', operands: 'r7, r1, r2', comment: 'R7 = R1 OR R2' },
  { addr: 0x00010020, bytes: [0xe7, 0xfe, 0xde, 0xf0], mnemonic: 'hlt', operands: '', comment: '' },
];

export const arm64: Exercise = {
  id: 'arm-64',
  unitId: 'unit13-arm',
  title: 'Data Processing',
  desc: '<b>Goal:</b> Learn ARM data processing instructions. ARM uses a 3-operand format: <code>ADD Rd, Rn, Op2</code> means Rd = Rn + Op2. The barrel shifter lets you shift or rotate the second operand for free: <code>MOV R5, R1, LSL #2</code> shifts R1 left by 2 before storing (equivalent to multiplying by 4). This is unique to ARM and extremely powerful.',
  source: {
    c: [
      { text: '// ARM Data Processing', cls: 'comment' },
      { text: '// Format: OP Rd, Rn, Operand2', cls: 'comment' },
      { text: '// Barrel shifter: LSL, LSR, ASR, ROR', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov r1, #7', cls: 'asm' },
      { text: 'mov r2, #3', cls: 'asm' },
      { text: 'add r0, r1, r2      ; r0 = 7 + 3', cls: 'asm' },
      { text: 'sub r3, r0, #5      ; r3 = r0 - 5', cls: 'asm' },
      { text: 'mul r4, r1, r0      ; r4 = r1 * r0', cls: 'asm' },
      { text: 'mov r5, r1, LSL #2  ; r5 = r1 << 2 (r1 * 4)', cls: 'asm' },
      { text: 'and r6, r0, r2      ; r6 = r0 AND r2', cls: 'asm' },
      { text: 'orr r7, r1, r2      ; r7 = r1 OR r2', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'arm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What is R0 after "add r0, r1, r2" (7 + 3)?', answer: 10, format: 'decimal', hint: 'ADD Rd, Rn, Op2 computes Rn + Op2. R1=7, R2=3, so R0 = 7 + 3 = 10.' },
    { question: 'What is R5 after "mov r5, r1, LSL #2" (R1=7, shifted left 2)?', answer: 28, format: 'decimal', hint: 'LSL #2 shifts left by 2 bits, which is the same as multiplying by 4. R1=7, so 7 * 4 = 28.' },
    { question: 'What is R3 after "sub r3, r0, #5" (R0=10)?', answer: 5, format: 'decimal', hint: 'SUB Rd, Rn, Op2 computes Rn - Op2. R0=10, so R3 = 10 - 5 = 5.' },
  ],
  check: () => false,
  winTitle: 'Data Processing Mastered!',
  winMsg: 'You understand ARM arithmetic and the barrel shifter. The ability to shift an operand for free in every instruction is one of ARM\'s most distinctive features.',
};
