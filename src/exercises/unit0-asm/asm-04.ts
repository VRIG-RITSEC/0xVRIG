import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 10', comment: '' },
  { addr: 0x08048005, bytes: [0xbb, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 5', comment: '' },
  { addr: 0x0804800a, bytes: [0x01, 0xd8], mnemonic: 'add', operands: 'eax, ebx', comment: 'dst = dst + src' },
  { addr: 0x0804800c, bytes: [0x83, 0xe8, 0x03], mnemonic: 'sub', operands: 'eax, 3', comment: 'dst = dst - src' },
  { addr: 0x0804800f, bytes: [0x40], mnemonic: 'inc', operands: 'eax', comment: 'dst = dst + 1' },
  { addr: 0x08048010, bytes: [0x40], mnemonic: 'inc', operands: 'eax', comment: '' },
  { addr: 0x08048011, bytes: [0x48], mnemonic: 'dec', operands: 'eax', comment: 'dst = dst - 1' },
  { addr: 0x08048012, bytes: [0xb9, 0x04, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 4', comment: '' },
  { addr: 0x08048017, bytes: [0xf7, 0xe1], mnemonic: 'mul', operands: 'ecx', comment: 'EDX:EAX = EAX * operand (EDX is clobbered)' },
  { addr: 0x08048019, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const asm04: Exercise = {
  id: 'asm-04',
  unitId: 'unit0-asm',
  title: 'Arithmetic',
  desc: '<b>Goal:</b> Practice arithmetic instructions. ADD adds, SUB subtracts, INC/DEC add/subtract 1, MUL multiplies EAX by the operand (result in EDX:EAX). Trace through and predict EAX\'s final value before stepping!',
  source: {
    c: [
      { text: '// Arithmetic Instructions', cls: 'comment' },
      { text: '// ADD dst, src  → dst = dst + src', cls: 'comment' },
      { text: '// SUB dst, src  → dst = dst - src', cls: 'comment' },
      { text: '// INC dst       → dst = dst + 1', cls: 'comment' },
      { text: '// DEC dst       → dst = dst - 1', cls: 'comment' },
      { text: '// MUL src       → EDX:EAX = EAX * src (EDX clobbered)', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 10', cls: 'asm' },
      { text: 'mov ebx, 5', cls: 'asm' },
      { text: 'add eax, ebx', cls: 'asm' },
      { text: 'sub eax, 3', cls: 'asm' },
      { text: 'inc eax', cls: 'asm' },
      { text: 'inc eax', cls: 'asm' },
      { text: 'dec eax', cls: 'asm' },
      { text: 'mov ecx, 4', cls: 'asm' },
      { text: 'mul ecx', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What is EAX after: 10 + 5 - 3 + 1 + 1 - 1 = ?', answer: 13, format: 'decimal', hint: 'Trace: 10 → +5=15 → -3=12 → +1=13 → +1=14 → -1=13' },
    { question: 'What is EAX after MUL ECX (where ECX=4)?', answer: 52, format: 'decimal', hint: '13 * 4 = 52' },
  ],
  check: () => false,
  winTitle: 'Arithmetic Master!',
  winMsg: 'You can trace x86 arithmetic operations.',
};
