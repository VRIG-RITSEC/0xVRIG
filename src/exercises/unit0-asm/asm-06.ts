import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 1', comment: 'Counter starts at 1' },
  { addr: 0x08048005, bytes: [0xbb, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 0', comment: 'Accumulator starts at 0' },
  { addr: 0x0804800a, bytes: [0x01, 0xc3], mnemonic: 'add', operands: 'ebx, eax', comment: 'Add counter to accumulator' },
  { addr: 0x0804800c, bytes: [0x40], mnemonic: 'inc', operands: 'eax', comment: 'Increment counter' },
  { addr: 0x0804800d, bytes: [0x83, 0xf8, 0x06], mnemonic: 'cmp', operands: 'eax, 6', comment: 'Compare counter to 6' },
  { addr: 0x08048010, bytes: [0x7c, 0xf8], mnemonic: 'jl', operands: '0x0804800a', comment: 'Loop back if <6' },
  { addr: 0x08048012, bytes: [0x83, 0xfb, 0x0f], mnemonic: 'cmp', operands: 'ebx, 15', comment: 'Check result' },
  { addr: 0x08048015, bytes: [0x74, 0x07], mnemonic: 'je', operands: '0x0804801e', comment: 'Jump if equal' },
  { addr: 0x08048017, bytes: [0xb9, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 0', comment: 'Failure path' },
  { addr: 0x0804801c, bytes: [0xeb, 0x05], mnemonic: 'jmp', operands: '0x08048023', comment: 'Skip success' },
  { addr: 0x0804801e, bytes: [0xb9, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 1', comment: 'Success path' },
  { addr: 0x08048023, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const asm06: Exercise = {
  id: 'asm-06',
  unitId: 'unit0-asm',
  title: 'Jumps',
  desc: '<b>Goal:</b> See conditional jumps in action. This code sums 1+2+3+4+5 using a loop. JL (Jump if Less) creates the loop. JE (Jump if Equal) checks the result. Watch EIP jump backward!',
  source: {
    c: [
      { text: '// Conditional Jumps', cls: 'comment' },
      { text: '// JE/JZ  — jump if equal (ZF=1)', cls: 'comment' },
      { text: '// JNE/JNZ — jump if not equal (ZF=0)', cls: 'comment' },
      { text: '// JG/JNLE — jump if greater (signed)', cls: 'comment' },
      { text: '// JL/JNGE — jump if less (signed)', cls: 'comment' },
      { text: '// JLE/JNG — jump if less or equal', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 1        ; counter', cls: 'asm' },
      { text: 'mov ebx, 0        ; accumulator', cls: 'asm' },
      { text: 'loop:', cls: 'label' },
      { text: '  add ebx, eax', cls: 'asm' },
      { text: '  inc eax', cls: 'asm' },
      { text: '  cmp eax, 6', cls: 'asm' },
      { text: '  jl loop', cls: 'asm' },
      { text: '', cls: '' },
      { text: '  cmp ebx, 15', cls: 'asm' },
      { text: '  je success', cls: 'asm' },
      { text: '  mov ecx, 0', cls: 'asm' },
      { text: 'success:', cls: 'label' },
      { text: '  mov ecx, 1', cls: 'asm' },
      { text: '  hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What is EBX at the end? (sum of 1+2+3+4+5)', answer: 15, format: 'decimal', hint: 'The loop adds counter values 1 through 5.' },
    { question: 'How many times does the loop body execute?', answer: 5, format: 'decimal', hint: 'Counter goes 1,2,3,4,5 — the JL falls through when counter reaches 6 (6 is not less than 6).' },
  ],
  check: () => false,
  winTitle: 'Jump Master!',
  winMsg: 'You understand conditional jumps and loops in x86.',
};
