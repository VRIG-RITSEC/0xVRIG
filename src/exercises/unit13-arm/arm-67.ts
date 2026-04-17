import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // main: set up arguments in R0-R3 per AAPCS
  { addr: 0x00010000, bytes: [0xe3, 0xa0, 0x00, 0x0c], mnemonic: 'mov', operands: 'r0, #12', comment: 'First argument = 12' },
  { addr: 0x00010004, bytes: [0xe3, 0xa0, 0x10, 0x08], mnemonic: 'mov', operands: 'r1, #8', comment: 'Second argument = 8' },
  { addr: 0x00010008, bytes: [0xeb, 0x00, 0x00, 0x02], mnemonic: 'bl', operands: '0x00010018', comment: 'Call add_values — BL saves return addr in LR' },
  { addr: 0x0001000c, bytes: [0xe1, 0xa0, 0x40, 0x00], mnemonic: 'mov', operands: 'r4, r0', comment: 'Save return value (R0) into R4' },
  { addr: 0x00010010, bytes: [0xe7, 0xfe, 0xde, 0xf0], mnemonic: 'hlt', operands: '', comment: '' },
  // add_values function
  { addr: 0x00010014, bytes: [0xe7, 0xfe, 0xde, 0xf0], mnemonic: 'hlt', operands: '', comment: 'padding' },
  { addr: 0x00010018, bytes: [0xe0, 0x80, 0x00, 0x01], mnemonic: 'add', operands: 'r0, r0, r1', comment: 'R0 = R0 + R1 (return value in R0)' },
  { addr: 0x0001001c, bytes: [0xe1, 0x2f, 0xff, 0x1e], mnemonic: 'bx', operands: 'lr', comment: 'Return to caller (jump to LR)' },
];

export const arm67: Exercise = {
  id: 'arm-67',
  unitId: 'unit13-arm',
  title: 'ARM Calling Convention',
  desc: '<b>Goal:</b> Learn the ARM calling convention (AAPCS). Arguments go in <b>R0-R3</b> (not on the stack like x86!). The return value goes in <b>R0</b>. <b>BL</b> (Branch with Link) calls a function by saving the return address in <b>LR (R14)</b>, and <b>BX LR</b> returns by jumping to that address. No PUSH/POP needed for simple leaf functions.',
  source: {
    c: [
      { text: '// ARM Calling Convention (AAPCS)', cls: 'comment' },
      { text: '// R0-R3  — function arguments', cls: 'comment' },
      { text: '// R0     — return value', cls: 'comment' },
      { text: '// LR(R14)— return address (set by BL)', cls: 'comment' },
      { text: '// BX LR  — return to caller', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// C equivalent:', cls: 'comment' },
      { text: '// int add_values(int a, int b) {', cls: 'comment' },
      { text: '//   return a + b;', cls: 'comment' },
      { text: '// }', cls: 'comment' },
      { text: '// int main() {', cls: 'comment' },
      { text: '//   int result = add_values(12, 8);', cls: 'comment' },
      { text: '// }', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'main:', cls: 'label' },
      { text: '  mov r0, #12       ; arg1', cls: 'asm' },
      { text: '  mov r1, #8        ; arg2', cls: 'asm' },
      { text: '  bl add_values      ; call (saves ret addr in LR)', cls: 'asm' },
      { text: '  mov r4, r0        ; save result', cls: 'asm' },
      { text: '  hlt', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'add_values:', cls: 'label' },
      { text: '  add r0, r0, r1    ; return a + b in R0', cls: 'asm' },
      { text: '  bx lr             ; return', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'arm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What address does BL store in LR (the return address)?', answer: 0x0001000c, format: 'hex', hint: 'BL saves the address of the instruction AFTER the BL. The BL is at 0x00010008, so LR = 0x0001000C.' },
    { question: 'What is R0 after add_values returns (add_values(12, 8))?', answer: 20, format: 'decimal', hint: 'The function computes R0 + R1 = 12 + 8 = 20 and returns it in R0.' },
    { question: 'What is R4 at the end?', answer: 20, format: 'decimal', hint: 'R4 copies the return value from R0, which is 20.' },
  ],
  check: () => false,
  winTitle: 'Calling Convention Mastered!',
  winMsg: 'You understand AAPCS. ARM passes arguments in registers (R0-R3) instead of the stack, making function calls faster. BL/BX LR replaces x86\'s CALL/RET.',
};
