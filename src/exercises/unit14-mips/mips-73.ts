import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x8e, 0x08, 0x00, 0x00], mnemonic: 'lw', operands: '$t0, 0($s0)', comment: 'Load word from mem[$s0 + 0]' },
  { addr: 0x00400004, bytes: [0x8e, 0x09, 0x00, 0x04], mnemonic: 'lw', operands: '$t1, 4($s0)', comment: 'Load word from mem[$s0 + 4]' },
  { addr: 0x00400008, bytes: [0x82, 0x0a, 0x00, 0x00], mnemonic: 'lb', operands: '$t2, 0($s0)', comment: 'Load BYTE from mem[$s0 + 0] (big-endian: MSB first!)' },
  { addr: 0x0040000c, bytes: [0x24, 0x0b, 0x00, 0x63], mnemonic: 'addiu', operands: '$t3, $zero, 99', comment: 'Load 99 into $t3' },
  { addr: 0x00400010, bytes: [0xae, 0x0b, 0x00, 0x08], mnemonic: 'sw', operands: '$t3, 8($s0)', comment: 'Store word: mem[$s0 + 8] = 99' },
  { addr: 0x00400014, bytes: [0x8e, 0x0c, 0x00, 0x08], mnemonic: 'lw', operands: '$t4, 8($s0)', comment: 'Load it back to verify' },
  { addr: 0x00400018, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'hlt', operands: '', comment: '' },
];

export const mips73: Exercise = {
  id: 'mips-73',
  unitId: 'unit14-mips',
  title: 'MIPS Memory',
  desc: '<b>Goal:</b> Learn MIPS memory access. MIPS is a <b>load/store architecture</b> — you cannot operate directly on memory. You must load values into registers, operate, then store back. Addressing is always <code>offset($reg)</code>. MIPS uses <b>big-endian</b> byte ordering — the most significant byte is at the lowest address. When you <code>lb</code> (load byte) from address N, you get the MSB of the word at that address.',
  source: {
    c: [
      { text: '# MIPS Memory Access (Big-Endian)', cls: 'comment' },
      { text: '# $s0 = 0x10010000 (base address, preloaded)', cls: 'comment' },
      { text: '# mem[0x10010000] = 0xDEADBEEF', cls: 'comment' },
      { text: '# mem[0x10010004] = 0x00000042', cls: 'comment' },
      { text: '', cls: '' },
      { text: '# Big-endian layout at 0x10010000:', cls: 'comment' },
      { text: '#   byte 0: 0xDE  (MSB first!)', cls: 'comment' },
      { text: '#   byte 1: 0xAD', cls: 'comment' },
      { text: '#   byte 2: 0xBE', cls: 'comment' },
      { text: '#   byte 3: 0xEF', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'lw  $t0, 0($s0)     # Load full word', cls: 'asm' },
      { text: 'lw  $t1, 4($s0)     # Load next word', cls: 'asm' },
      { text: 'lb  $t2, 0($s0)     # Load first BYTE', cls: 'asm' },
      { text: 'addiu $t3, $zero, 99', cls: 'asm' },
      { text: 'sw  $t3, 8($s0)     # Store 99 to memory', cls: 'asm' },
      { text: 'lw  $t4, 8($s0)     # Read it back', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'mips',
  asmInstructions: instructions,
  asmInitialRegs: { '$s0': 0x10010000 },
  asmInitialMemory: [
    { addr: 0x10010000, value: 0xDEADBEEF, size: 4 },
    { addr: 0x10010004, value: 0x00000042, size: 4 },
  ],
  asmQuiz: [
    { question: 'What is $t0 after "lw $t0, 0($s0)"? (Answer in hex.)', answer: 0xDEADBEEF, format: 'hex', hint: 'LW loads a full 32-bit word from memory. mem[0x10010000] = 0xDEADBEEF.' },
    { question: 'What is $t2 after "lb $t2, 0($s0)"? MIPS is big-endian, so byte 0 is the MSB. LB sign-extends. (Answer in hex.)', answer: 0xFFFFFFDE, format: 'hex', hint: 'Big-endian: byte 0 of 0xDEADBEEF is 0xDE. LB sign-extends: 0xDE has bit 7 set, so it becomes 0xFFFFFFDE.' },
    { question: 'What is $t4 after storing 99 and loading it back?', answer: 99, format: 'decimal', hint: 'We stored 99 with SW, then loaded it back with LW. The value round-trips correctly.' },
  ],
  check: () => false,
  winTitle: 'Memory Access Learned!',
  winMsg: 'You understand MIPS load/store architecture and big-endian byte ordering. Remember: LB loads just one byte (the MSB in big-endian) and sign-extends it to 32 bits.',
};
