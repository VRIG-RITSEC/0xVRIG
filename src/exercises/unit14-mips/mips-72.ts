import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x01, 0x09, 0x50, 0x20], mnemonic: 'add', operands: '$t2, $t0, $t1', comment: '$t2 = $t0 + $t1' },
  { addr: 0x00400004, bytes: [0x01, 0x09, 0x58, 0x22], mnemonic: 'sub', operands: '$t3, $t0, $t1', comment: '$t3 = $t0 - $t1' },
  { addr: 0x00400008, bytes: [0x00, 0x08, 0x60, 0x80], mnemonic: 'sll', operands: '$t4, $t0, 2', comment: '$t4 = $t0 << 2 (multiply by 4)' },
  { addr: 0x0040000c, bytes: [0x00, 0x09, 0x68, 0x42], mnemonic: 'srl', operands: '$t5, $t1, 1', comment: '$t5 = $t1 >> 1 (divide by 2)' },
  { addr: 0x00400010, bytes: [0x01, 0x09, 0x70, 0x24], mnemonic: 'and', operands: '$t6, $t0, $t1', comment: '$t6 = $t0 & $t1' },
  { addr: 0x00400014, bytes: [0x01, 0x09, 0x78, 0x25], mnemonic: 'or', operands: '$t7, $t0, $t1', comment: '$t7 = $t0 | $t1' },
  { addr: 0x00400018, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'hlt', operands: '', comment: '' },
];

export const mips72: Exercise = {
  id: 'mips-72',
  unitId: 'unit14-mips',
  title: 'MIPS Arithmetic',
  desc: '<b>Goal:</b> Learn MIPS arithmetic and bitwise operations. <code>add</code> and <code>sub</code> work on three registers (destination, source1, source2). <code>sll</code> (shift left logical) multiplies by powers of 2 — <code>sll $t4, $t0, 2</code> is the same as <code>$t0 * 4</code>. <code>srl</code> (shift right logical) divides by powers of 2. These shifts are critical in MIPS — the compiler uses them constantly instead of multiply instructions.',
  source: {
    c: [
      { text: '# MIPS Arithmetic & Shifts', cls: 'comment' },
      { text: '# $t0 = 15, $t1 = 7 (preloaded)', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'add $t2, $t0, $t1   # $t2 = 15 + 7', cls: 'asm' },
      { text: 'sub $t3, $t0, $t1   # $t3 = 15 - 7', cls: 'asm' },
      { text: 'sll $t4, $t0, 2     # $t4 = 15 << 2 (x4)', cls: 'asm' },
      { text: 'srl $t5, $t1, 1     # $t5 = 7 >> 1  (/2)', cls: 'asm' },
      { text: 'and $t6, $t0, $t1   # $t6 = 15 & 7', cls: 'asm' },
      { text: 'or  $t7, $t0, $t1   # $t7 = 15 | 7', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'mips',
  asmInstructions: instructions,
  asmInitialRegs: { '$t0': 15, '$t1': 7 },
  asmQuiz: [
    { question: 'What is $t4 after "sll $t4, $t0, 2"? (Hint: shift left by 2 = multiply by 4)', answer: 60, format: 'decimal', hint: '$t0 = 15. Shift left by 2 means 15 * 4 = 60.' },
    { question: 'What is $t5 after "srl $t5, $t1, 1"? (Hint: shift right by 1 = integer divide by 2)', answer: 3, format: 'decimal', hint: '$t1 = 7. Shift right by 1 means 7 / 2 = 3 (integer division, truncated).' },
    { question: 'What is $t6 after "and $t6, $t0, $t1"? ($t0=15=0b1111, $t1=7=0b0111)', answer: 7, format: 'decimal', hint: '15 in binary is 1111, 7 is 0111. AND gives 0111 = 7.' },
  ],
  check: () => false,
  winTitle: 'Arithmetic Mastered!',
  winMsg: 'You understand MIPS arithmetic, shifts, and bitwise operations. Shifts are used everywhere in MIPS — array indexing (sll by 2 for word offsets) and fast multiplication/division.',
};
