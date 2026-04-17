import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x24, 0x08, 0x00, 0x0a], mnemonic: 'addiu', operands: '$t0, $zero, 10', comment: 'Load 10 into $t0 (no MOV in MIPS!)' },
  { addr: 0x00400004, bytes: [0x24, 0x09, 0x00, 0x14], mnemonic: 'addiu', operands: '$t1, $zero, 20', comment: 'Load 20 into $t1' },
  { addr: 0x00400008, bytes: [0x24, 0x0a, 0xff, 0xff], mnemonic: 'addiu', operands: '$t2, $zero, -1', comment: 'Load -1 into $t2 (sign-extended)' },
  { addr: 0x0040000c, bytes: [0x24, 0x00, 0x00, 0x2a], mnemonic: 'addiu', operands: '$zero, $zero, 42', comment: 'Try to write 42 into $zero...' },
  { addr: 0x00400010, bytes: [0x00, 0x00, 0x58, 0x25], mnemonic: 'or', operands: '$t3, $zero, $zero', comment: 'Read $zero — is it 42 or 0?' },
  { addr: 0x00400014, bytes: [0x00, 0x08, 0x60, 0x25], mnemonic: 'or', operands: '$t4, $zero, $t0', comment: 'Copy $t0 to $t4 (MIPS register move)' },
  { addr: 0x00400018, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'hlt', operands: '', comment: '' },
];

export const mips71: Exercise = {
  id: 'mips-71',
  unitId: 'unit14-mips',
  title: 'MIPS Registers',
  desc: '<b>Goal:</b> Learn MIPS register naming and the special <code>$zero</code> register. MIPS has 32 registers: <code>$zero</code> (hardwired to 0), <code>$v0-$v1</code> (return values), <code>$a0-$a3</code> (arguments), <code>$t0-$t9</code> (temporaries — caller-saved), <code>$s0-$s7</code> (saved — callee-saved), <code>$sp</code> (stack pointer), <code>$fp</code> (frame pointer), <code>$ra</code> (return address). MIPS has <b>no MOV instruction</b> — use <code>addiu $dst, $zero, imm</code> to load a constant, or <code>or $dst, $src, $zero</code> to copy a register.',
  source: {
    c: [
      { text: '# MIPS Register Conventions', cls: 'comment' },
      { text: '# $zero — always 0, writes are ignored', cls: 'comment' },
      { text: '# $v0-$v1 — function return values', cls: 'comment' },
      { text: '# $a0-$a3 — function arguments', cls: 'comment' },
      { text: '# $t0-$t9 — temporaries (caller-saved)', cls: 'comment' },
      { text: '# $s0-$s7 — saved (callee-saved)', cls: 'comment' },
      { text: '# $sp — stack pointer', cls: 'comment' },
      { text: '# $fp — frame pointer', cls: 'comment' },
      { text: '# $ra — return address (set by JAL)', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'addiu $t0, $zero, 10    # Load 10', cls: 'asm' },
      { text: 'addiu $t1, $zero, 20    # Load 20', cls: 'asm' },
      { text: 'addiu $t2, $zero, -1    # Load -1', cls: 'asm' },
      { text: 'addiu $zero, $zero, 42  # Write to $zero??', cls: 'asm' },
      { text: 'or    $t3, $zero, $zero # Read $zero', cls: 'asm' },
      { text: 'or    $t4, $zero, $t0   # Copy $t0 to $t4', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'mips',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What is in $t3 after "or $t3, $zero, $zero"? (We tried writing 42 to $zero first.)', answer: 0, format: 'decimal', hint: '$zero is hardwired to 0. Writes are silently ignored, so it is still 0.' },
    { question: 'What is in $t4 after "or $t4, $zero, $t0"?', answer: 10, format: 'decimal', hint: 'OR with $zero copies the other register. $t0 holds 10, so $t4 = 0 | 10 = 10.' },
    { question: 'What is in $t2 after "addiu $t2, $zero, -1"? (Answer in hex.)', answer: 0xffffffff, format: 'hex', hint: '-1 is sign-extended from 16 bits to 32 bits: 0xFFFF sign-extends to 0xFFFFFFFF.' },
  ],
  check: () => false,
  winTitle: 'Registers Learned!',
  winMsg: 'You understand MIPS register conventions and the hardwired $zero register. Unlike x86, MIPS has no MOV — you build moves from arithmetic and logic operations.',
};
