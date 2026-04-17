import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// Stack starts at 0x7ffffffc.
// Prologue: $sp -= 24 (0x7ffffffc - 24 = 0x7fffffe4)
// Then save $ra at 20($sp) = 0x7fffffe4 + 20 = 0x7ffffff8
// Save $fp at 16($sp) = 0x7fffffe4 + 16 = 0x7ffffff4
// Set $fp = $sp
// Local var x at 0($fp) = 0x7fffffe4
// Epilogue reverses everything
const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x27, 0xbd, 0xff, 0xe8], mnemonic: 'addiu', operands: '$sp, $sp, -24', comment: 'Prologue: allocate 24 bytes on stack' },
  { addr: 0x00400004, bytes: [0xaf, 0xbf, 0x00, 0x14], mnemonic: 'sw', operands: '$ra, 20($sp)', comment: 'Save return address on stack' },
  { addr: 0x00400008, bytes: [0xaf, 0xbe, 0x00, 0x10], mnemonic: 'sw', operands: '$fp, 16($sp)', comment: 'Save old frame pointer on stack' },
  { addr: 0x0040000c, bytes: [0x03, 0xa0, 0xf0, 0x25], mnemonic: 'or', operands: '$fp, $sp, $zero', comment: 'Set frame pointer = stack pointer' },
  { addr: 0x00400010, bytes: [0x24, 0x08, 0x00, 0x07], mnemonic: 'addiu', operands: '$t0, $zero, 7', comment: 'Local variable x = 7' },
  { addr: 0x00400014, bytes: [0xaf, 0xc8, 0x00, 0x00], mnemonic: 'sw', operands: '$t0, 0($fp)', comment: 'Store x on stack at 0($fp)' },
  { addr: 0x00400018, bytes: [0x8f, 0xc9, 0x00, 0x00], mnemonic: 'lw', operands: '$t1, 0($fp)', comment: 'Load x back from stack' },
  { addr: 0x0040001c, bytes: [0x03, 0xc0, 0xe8, 0x25], mnemonic: 'or', operands: '$sp, $fp, $zero', comment: 'Epilogue: restore $sp from $fp' },
  { addr: 0x00400020, bytes: [0x8f, 0xbf, 0x00, 0x14], mnemonic: 'lw', operands: '$ra, 20($sp)', comment: 'Restore return address' },
  { addr: 0x00400024, bytes: [0x8f, 0xbe, 0x00, 0x10], mnemonic: 'lw', operands: '$fp, 16($sp)', comment: 'Restore old frame pointer' },
  { addr: 0x00400028, bytes: [0x27, 0xbd, 0x00, 0x18], mnemonic: 'addiu', operands: '$sp, $sp, 24', comment: 'Deallocate stack frame' },
  { addr: 0x0040002c, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'hlt', operands: '', comment: '' },
];

export const mips76: Exercise = {
  id: 'mips-76',
  unitId: 'unit14-mips',
  title: 'MIPS Stack Frame',
  desc: '<b>Goal:</b> Understand the MIPS stack frame. The prologue saves <code>$ra</code> and <code>$fp</code> on the stack, then sets up a new frame. The epilogue restores them. <b>Key insight for exploitation:</b> the saved <code>$ra</code> on the stack is what a buffer overflow overwrites to hijack control flow — just like the saved return address in x86, but MIPS stores it explicitly because <code>$ra</code> is a register, not pushed by CALL.',
  source: {
    c: [
      { text: '# MIPS Stack Frame Layout', cls: 'comment' },
      { text: '# $sp initially at 0x7ffffffc', cls: 'comment' },
      { text: '', cls: '' },
      { text: '# After prologue (24 bytes allocated):', cls: 'comment' },
      { text: '#   20($sp) — saved $ra', cls: 'comment' },
      { text: '#   16($sp) — saved $fp', cls: 'comment' },
      { text: '#    0($sp) — local var x', cls: 'comment' },
      { text: '', cls: '' },
      { text: '# --- Prologue ---', cls: 'label' },
      { text: 'addiu $sp, $sp, -24     # allocate', cls: 'asm' },
      { text: 'sw    $ra, 20($sp)      # save $ra', cls: 'asm' },
      { text: 'sw    $fp, 16($sp)      # save $fp', cls: 'asm' },
      { text: 'or    $fp, $sp, $zero   # set frame ptr', cls: 'asm' },
      { text: '', cls: '' },
      { text: '# --- Function body ---', cls: 'label' },
      { text: 'addiu $t0, $zero, 7     # x = 7', cls: 'asm' },
      { text: 'sw    $t0, 0($fp)       # store on stack', cls: 'asm' },
      { text: 'lw    $t1, 0($fp)       # load from stack', cls: 'asm' },
      { text: '', cls: '' },
      { text: '# --- Epilogue ---', cls: 'label' },
      { text: 'or    $sp, $fp, $zero   # restore $sp', cls: 'asm' },
      { text: 'lw    $ra, 20($sp)      # restore $ra', cls: 'asm' },
      { text: 'lw    $fp, 16($sp)      # restore $fp', cls: 'asm' },
      { text: 'addiu $sp, $sp, 24      # deallocate', cls: 'asm' },
      { text: 'hlt', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm-stack',
  asmArch: 'mips',
  asmInstructions: instructions,
  asmStackBase: 0x7ffffffc,
  asmQuiz: [
    { question: 'What is $sp after "addiu $sp, $sp, -24"? $sp starts at 0x7ffffffc. (Answer in hex.)', answer: 0x7fffffe4, format: 'hex', hint: '0x7ffffffc - 24 = 0x7ffffffc - 0x18 = 0x7fffffe4.' },
    { question: 'At what address is $ra saved on the stack? ($sp after prologue + 20, in hex.)', answer: 0x7ffffff8, format: 'hex', hint: '$sp = 0x7fffffe4 after allocation. 0x7fffffe4 + 20 = 0x7fffffe4 + 0x14 = 0x7ffffff8.' },
    { question: 'An attacker overflows a buffer at 0($sp). How many bytes past the buffer start is the saved $ra?', answer: 20, format: 'decimal', hint: 'The saved $ra is at 20($sp). A buffer overflow starting at 0($sp) needs 20 bytes of padding to reach $ra.' },
  ],
  check: () => false,
  winTitle: 'Stack Frame Expert!',
  winMsg: 'You understand the MIPS stack frame layout. The saved $ra on the stack is the primary target for MIPS buffer overflow exploits — overwrite it to redirect execution when the function returns via JR $ra.',
};
