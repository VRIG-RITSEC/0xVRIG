import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x24, 0x08, 0x00, 0x05], mnemonic: 'addiu', operands: '$t0, $zero, 5', comment: 'Load 5 into $t0' },
  { addr: 0x00400004, bytes: [0x24, 0x09, 0x00, 0x05], mnemonic: 'addiu', operands: '$t1, $zero, 5', comment: 'Load 5 into $t1' },
  { addr: 0x00400008, bytes: [0x24, 0x0a, 0x00, 0x00], mnemonic: 'addiu', operands: '$t2, $zero, 0', comment: '$t2 = 0 (before branch)' },
  { addr: 0x0040000c, bytes: [0x11, 0x09, 0x00, 0x02], mnemonic: 'beq', operands: '$t0, $t1, 2', comment: 'Branch if $t0 == $t1 (they are equal!)' },
  { addr: 0x00400010, bytes: [0x24, 0x0a, 0x00, 0x01], mnemonic: 'addiu', operands: '$t2, $zero, 1', comment: 'DELAY SLOT — this ALWAYS executes!' },
  { addr: 0x00400014, bytes: [0x24, 0x0b, 0x00, 0x63], mnemonic: 'addiu', operands: '$t3, $zero, 99', comment: 'Skipped (branch taken, jumps past here)' },
  { addr: 0x00400018, bytes: [0x24, 0x0c, 0x00, 0x2a], mnemonic: 'addiu', operands: '$t4, $zero, 42', comment: 'Branch lands here (PC+4 + 2*4 = +12)' },
  { addr: 0x0040001c, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'hlt', operands: '', comment: '' },
];

export const mips74: Exercise = {
  id: 'mips-74',
  unitId: 'unit14-mips',
  title: 'MIPS Branching',
  desc: '<b>Goal:</b> Understand MIPS branches and the critical <b>branch delay slot</b>. In MIPS, the instruction <i>immediately after</i> a branch or jump <b>always executes</b>, even when the branch is taken. This is because MIPS uses a pipeline — by the time the CPU decides to branch, it has already fetched the next instruction. This is the single most important MIPS-specific concept. Compilers often place a <code>nop</code> in the delay slot, but clever compilers put useful work there.',
  source: {
    c: [
      { text: '# Branch Delay Slot — MIPS Key Concept', cls: 'comment' },
      { text: '# The instruction AFTER a branch ALWAYS executes', cls: 'comment' },
      { text: '# (even if the branch is taken!)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '# Pipeline reason:', cls: 'comment' },
      { text: '#   Fetch → Decode → Execute', cls: 'comment' },
      { text: '#   By the time BEQ decides to branch,', cls: 'comment' },
      { text: '#   the NEXT instruction is already fetched', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'addiu $t0, $zero, 5', cls: 'asm' },
      { text: 'addiu $t1, $zero, 5', cls: 'asm' },
      { text: 'addiu $t2, $zero, 0', cls: 'asm' },
      { text: 'beq   $t0, $t1, 2    # branch taken!', cls: 'asm' },
      { text: 'addiu $t2, $zero, 1   # DELAY SLOT', cls: 'asm' },
      { text: 'addiu $t3, $zero, 99  # skipped', cls: 'asm' },
      { text: 'addiu $t4, $zero, 42  # branch target', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'mips',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'Does the instruction after BEQ execute, even though the branch is taken? (1=yes, 0=no)', answer: 1, format: 'decimal', hint: 'Yes! This is the branch delay slot. In MIPS, the instruction after any branch/jump ALWAYS executes.' },
    { question: 'What is $t2 at the end? (The delay slot sets it to 1.)', answer: 1, format: 'decimal', hint: 'The delay slot instruction "addiu $t2, $zero, 1" executes before the branch takes effect, so $t2 = 1.' },
    { question: 'What is $t3 at the end? (Was the "addiu $t3, $zero, 99" instruction reached?)', answer: 0, format: 'decimal', hint: 'The branch jumps OVER this instruction (it is not the delay slot and not the branch target). $t3 stays at its initial value of 0.' },
  ],
  check: () => false,
  winTitle: 'Delay Slots Understood!',
  winMsg: 'You grasped the MIPS branch delay slot — the most common source of confusion in MIPS assembly. The delay slot instruction always executes, which matters for both correctness and exploitation.',
};
