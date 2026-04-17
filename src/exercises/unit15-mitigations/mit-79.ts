import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x08048000, bytes: [0xb8, 0x00, 0x80, 0x04, 0x08], mnemonic: 'mov', operands: 'eax, 0x08048000', comment: 'Load .text base address (Run 1)' },
  { addr: 0x08048005, bytes: [0xbb, 0x00, 0xa0, 0x04, 0x08], mnemonic: 'mov', operands: 'ebx, 0x0804a000', comment: 'Load .data address (Run 1)' },
  { addr: 0x0804800a, bytes: [0xb9, 0x00, 0xd0, 0xff, 0xbf], mnemonic: 'mov', operands: 'ecx, 0xbfffd000', comment: 'Stack address (Run 1)' },
  { addr: 0x0804800f, bytes: [0xba, 0x00, 0x10, 0x00, 0x08], mnemonic: 'mov', operands: 'edx, 0x08001000', comment: 'Heap address (Run 1)' },
  { addr: 0x08048014, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const exercise: Exercise = {
  id: 'mit-79',
  unitId: 'unit15-mitigations',
  title: '79: ASLR Deep Dive',
  desc: '<b>Goal:</b> Understand Address Space Layout Randomization. ASLR randomizes the base addresses of the stack, heap, shared libraries, and (with PIE) the executable itself on each run. Typical Linux ASLR provides <strong>28 bits</strong> of entropy for libraries and 12 bits for the stack page offset. Without an info leak, an attacker must brute-force the randomized addresses.',
  source: {
    c: [
      { text: '// ASLR: randomized addresses each run', cls: 'comment' },
      { text: '// Run 1:                   Run 2:', cls: 'comment' },
      { text: '// .text  0x08048000       0x08048000 (no PIE)', cls: 'comment' },
      { text: '// .data  0x0804a000       0x0804a000 (no PIE)', cls: 'comment' },
      { text: '// stack  0xbfffd000       0xbf83e000 (random!)', cls: 'comment' },
      { text: '// heap   0x08001000       0x09a42000 (random!)', cls: 'comment' },
      { text: '// libc   0xf7d00000       0xf7a51000 (random!)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Key: without PIE, .text/.data are fixed.', cls: 'comment' },
      { text: '// With PIE + ASLR, everything moves.', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'mov eax, 0x08048000  ; .text base', cls: 'asm' },
      { text: 'mov ebx, 0x0804a000  ; .data', cls: 'asm' },
      { text: 'mov ecx, 0xbfffd000  ; stack', cls: 'asm' },
      { text: 'mov edx, 0x08001000  ; heap', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'How many attempts to brute-force 12-bit ASLR entropy? (2^12)', answer: 4096, format: 'decimal', hint: '12 bits of entropy means 2^12 = 4096 possible base addresses.' },
    { question: 'With 28-bit entropy, what is the number of possible base addresses? Give the value of 2^28.', answer: 268435456, format: 'decimal', hint: '2^28 = 256 * 1024 * 1024 = 268,435,456.' },
    { question: 'Without PIE, what is the .text base address in BOTH runs? (hex)', answer: 0x08048000, format: 'hex', hint: 'Without Position-Independent Executable, .text is at a fixed address across runs.' },
  ],
  check: () => false,
  winTitle: 'ASLR Understood!',
  winMsg: 'ASLR randomizes stack, heap, and library addresses each run. Without an information leak, brute-forcing even 12-bit entropy requires 4096 attempts. PIE randomizes the executable itself.',
};
