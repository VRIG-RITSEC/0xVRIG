import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 5', comment: '' },
  { addr: 0x08048005, bytes: [0xbb, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 5', comment: '' },
  { addr: 0x0804800a, bytes: [0x39, 0xd8], mnemonic: 'cmp', operands: 'eax, ebx', comment: 'Computes EAX - EBX, sets flags' },
  { addr: 0x0804800c, bytes: [0xb9, 0x0a, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 10', comment: '' },
  { addr: 0x08048011, bytes: [0x39, 0xc8], mnemonic: 'cmp', operands: 'eax, ecx', comment: 'Computes EAX - ECX, sets flags' },
  { addr: 0x08048013, bytes: [0x39, 0xd9], mnemonic: 'cmp', operands: 'ecx, ebx', comment: 'Computes ECX - EBX, sets flags' },
  { addr: 0x08048015, bytes: [0xb8, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 0', comment: '' },
  { addr: 0x0804801a, bytes: [0x85, 0xc0], mnemonic: 'test', operands: 'eax, eax', comment: 'Computes EAX AND EAX, sets flags' },
  { addr: 0x0804801c, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const asm05: Exercise = {
  id: 'asm-05',
  unitId: 'unit0-asm',
  title: 'CMP & Flags',
  desc: '<b>Goal:</b> Understand CPU flags. CMP subtracts without storing the result — it only sets flags. <b>ZF</b> (Zero Flag) = result was 0. <b>SF</b> (Sign Flag) = result\'s sign bit is set. <b>CF</b> (Carry Flag) = unsigned borrow. TEST does AND and sets flags. Note: signed less-than is SF != OF, not just SF alone.',
  source: {
    c: [
      { text: '// CMP & Flags', cls: 'comment' },
      { text: '// CMP a, b → computes a - b, sets flags', cls: 'comment' },
      { text: '// ZF = 1 if a == b (result is zero)', cls: 'comment' },
      { text: '// SF = 1 if result\'s sign bit is set (signed a < b is SF != OF)', cls: 'comment' },
      { text: '// CF = 1 if a < b  (unsigned borrow)', cls: 'comment' },
      { text: '// TEST a, b → computes a AND b, sets flags', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 5', cls: 'asm' },
      { text: 'mov ebx, 5', cls: 'asm' },
      { text: 'cmp eax, ebx', cls: 'asm' },
      { text: 'mov ecx, 10', cls: 'asm' },
      { text: 'cmp eax, ecx', cls: 'asm' },
      { text: 'cmp ecx, ebx', cls: 'asm' },
      { text: 'mov eax, 0', cls: 'asm' },
      { text: 'test eax, eax', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'After "cmp eax, ebx" where both are 5, is ZF set? (1=yes, 0=no)', answer: 1, format: 'decimal', hint: '5 - 5 = 0, so the Zero Flag is set.' },
    { question: 'After "cmp eax, ecx" (5 vs 10), is CF set? (1=yes, 0=no)', answer: 1, format: 'decimal', hint: '5 < 10 means unsigned borrow, so Carry Flag is set.' },
    { question: 'After "test eax, eax" where EAX=0, is ZF set? (1=yes, 0=no)', answer: 1, format: 'decimal', hint: '0 AND 0 = 0, so Zero Flag is set.' },
  ],
  check: () => false,
  winTitle: 'Flags Understood!',
  winMsg: 'You know how CMP sets CPU flags for conditional logic.',
};
