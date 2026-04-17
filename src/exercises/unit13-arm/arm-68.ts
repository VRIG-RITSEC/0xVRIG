import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // Function prologue
  { addr: 0x00010000, bytes: [0xe9, 0x2d, 0x48, 0x00], mnemonic: 'push', operands: '{fp, lr}', comment: 'Save frame pointer and return address' },
  { addr: 0x00010004, bytes: [0xe1, 0xa0, 0xb0, 0x0d], mnemonic: 'mov', operands: 'fp, sp', comment: 'Set frame pointer to current SP' },
  { addr: 0x00010008, bytes: [0xe2, 0x4d, 0xd0, 0x10], mnemonic: 'sub', operands: 'sp, sp, #16', comment: 'Allocate 16 bytes for local variables' },
  // Function body — store locals
  { addr: 0x0001000c, bytes: [0xe3, 0xa0, 0x00, 0x0a], mnemonic: 'mov', operands: 'r0, #10', comment: 'R0 = 10' },
  { addr: 0x00010010, bytes: [0xe5, 0x0b, 0x00, 0x08], mnemonic: 'str', operands: 'r0, [fp, #-8]', comment: 'Store local var x at [fp-8]' },
  { addr: 0x00010014, bytes: [0xe3, 0xa0, 0x10, 0x14], mnemonic: 'mov', operands: 'r1, #20', comment: 'R1 = 20' },
  { addr: 0x00010018, bytes: [0xe5, 0x0b, 0x10, 0x0c], mnemonic: 'str', operands: 'r1, [fp, #-12]', comment: 'Store local var y at [fp-12]' },
  // Function epilogue
  { addr: 0x0001001c, bytes: [0xe1, 0xa0, 0xd0, 0x0b], mnemonic: 'mov', operands: 'sp, fp', comment: 'Deallocate locals (restore SP)' },
  { addr: 0x00010020, bytes: [0xe8, 0xbd, 0x48, 0x00], mnemonic: 'pop', operands: '{fp, lr}', comment: 'Restore frame pointer and return address' },
  { addr: 0x00010024, bytes: [0xe1, 0x2f, 0xff, 0x1e], mnemonic: 'bx', operands: 'lr', comment: 'Return to caller' },
  { addr: 0x00010028, bytes: [0xe7, 0xfe, 0xde, 0xf0], mnemonic: 'hlt', operands: '', comment: '' },
];

export const arm68: Exercise = {
  id: 'arm-68',
  unitId: 'unit13-arm',
  title: 'ARM Stack Frame',
  desc: '<b>Goal:</b> Understand the ARM function prologue and epilogue. <b>Prologue:</b> <code>PUSH {fp, lr}</code> saves the frame pointer and return address, <code>MOV fp, sp</code> sets the new frame, <code>SUB sp, sp, #N</code> allocates local space. <b>Epilogue:</b> <code>MOV sp, fp</code> deallocates, <code>POP {fp, lr}</code> restores, <code>BX lr</code> returns. The saved LR on the stack is the target for buffer overflow attacks on ARM.',
  source: {
    c: [
      { text: '// ARM Stack Frame', cls: 'comment' },
      { text: '// Prologue: push {fp, lr}', cls: 'comment' },
      { text: '//           mov fp, sp', cls: 'comment' },
      { text: '//           sub sp, sp, #N', cls: 'comment' },
      { text: '// Epilogue: mov sp, fp', cls: 'comment' },
      { text: '//           pop {fp, lr}', cls: 'comment' },
      { text: '//           bx lr', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Stack layout (high → low):', cls: 'comment' },
      { text: '//   [fp+0]  → saved old FP', cls: 'comment' },
      { text: '//   [fp-4]  → saved LR (return addr!)', cls: 'comment' },
      { text: '//   [fp-8]  → local var x', cls: 'comment' },
      { text: '//   [fp-12] → local var y', cls: 'comment' },
      { text: '', cls: '' },
      { text: '; — Prologue —', cls: 'label' },
      { text: 'push {fp, lr}', cls: 'asm' },
      { text: 'mov fp, sp', cls: 'asm' },
      { text: 'sub sp, sp, #16', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'mov r0, #10', cls: 'asm' },
      { text: 'str r0, [fp, #-8]   ; x = 10', cls: 'asm' },
      { text: 'mov r1, #20', cls: 'asm' },
      { text: 'str r1, [fp, #-12]  ; y = 20', cls: 'asm' },
      { text: '', cls: '' },
      { text: '; — Epilogue —', cls: 'label' },
      { text: 'mov sp, fp', cls: 'asm' },
      { text: 'pop {fp, lr}', cls: 'asm' },
      { text: 'bx lr', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm-stack',
  asmArch: 'arm',
  asmInstructions: instructions,
  asmStackBase: 0xbfff0200,
  asmInitialRegs: { lr: 0x00008080, fp: 0xbfff0240 },
  asmQuiz: [
    { question: 'What is SP after "push {fp, lr}"? (SP starts at 0xBFFF0200, two 4-byte values pushed)', answer: 0xbfff01f8, format: 'hex', hint: 'PUSH {fp, lr} pushes two 4-byte registers. SP decreases by 8: 0xBFFF0200 - 8 = 0xBFFF01F8.' },
    { question: 'What is SP after "sub sp, sp, #16"?', answer: 0xbfff01e8, format: 'hex', hint: 'After the push, SP = 0xBFFF01F8. Subtracting 16: 0xBFFF01F8 - 0x10 = 0xBFFF01E8.' },
    { question: 'How many bytes total does this function use on the stack (pushed regs + locals)?', answer: 24, format: 'decimal', hint: 'PUSH {fp, lr} = 8 bytes, SUB sp, sp, #16 = 16 bytes. Total = 8 + 16 = 24 bytes.' },
  ],
  check: () => false,
  winTitle: 'ARM Stack Frames Mastered!',
  winMsg: 'You understand the ARM prologue/epilogue. The saved LR on the stack is the ARM equivalent of the saved return address on x86 — and the target for stack buffer overflow attacks.',
};
