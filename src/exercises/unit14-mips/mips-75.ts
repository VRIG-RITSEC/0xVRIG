import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// JAL at 0x00400010 sets $ra = PC+8 = 0x00400018
// The function at 0x00400020 adds $a0 + $a1, puts result in $v0, then JR $ra
const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0x24, 0x04, 0x00, 0x0a], mnemonic: 'addiu', operands: '$a0, $zero, 10', comment: 'First argument = 10' },
  { addr: 0x00400004, bytes: [0x24, 0x05, 0x00, 0x19], mnemonic: 'addiu', operands: '$a1, $zero, 25', comment: 'Second argument = 25' },
  { addr: 0x00400008, bytes: [0x0c, 0x10, 0x00, 0x06], mnemonic: 'jal', operands: '0x00400018', comment: 'Call add_nums (sets $ra = PC+8)' },
  { addr: 0x0040000c, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'nop', operands: '', comment: 'Delay slot (NOP for safety)' },
  { addr: 0x00400010, bytes: [0x00, 0x02, 0x40, 0x25], mnemonic: 'or', operands: '$t0, $zero, $v0', comment: 'Save return value ($v0) to $t0' },
  { addr: 0x00400014, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'hlt', operands: '', comment: '' },
  // add_nums function
  { addr: 0x00400018, bytes: [0x00, 0x85, 0x10, 0x20], mnemonic: 'add', operands: '$v0, $a0, $a1', comment: 'add_nums: $v0 = $a0 + $a1' },
  { addr: 0x0040001c, bytes: [0x03, 0xe0, 0x00, 0x08], mnemonic: 'jr', operands: '$ra', comment: 'Return to caller' },
  { addr: 0x00400020, bytes: [0x00, 0x00, 0x00, 0x00], mnemonic: 'nop', operands: '', comment: 'Delay slot after JR' },
];

export const mips75: Exercise = {
  id: 'mips-75',
  unitId: 'unit14-mips',
  title: 'MIPS Calling Convention',
  desc: '<b>Goal:</b> Learn the MIPS calling convention. Arguments go in <code>$a0-$a3</code>, return values in <code>$v0</code>. <code>JAL</code> (Jump And Link) saves the return address in <code>$ra</code> (set to PC+8, accounting for the delay slot). <code>JR $ra</code> returns to the caller. Note: JAL also has a delay slot — the NOP after JAL executes before jumping to the function.',
  source: {
    c: [
      { text: '# MIPS Calling Convention', cls: 'comment' },
      { text: '# Arguments: $a0-$a3', cls: 'comment' },
      { text: '# Return value: $v0 (and $v1 for 64-bit)', cls: 'comment' },
      { text: '# Return address: $ra (set by JAL)', cls: 'comment' },
      { text: '# JAL sets $ra = PC + 8 (past delay slot)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '# int add_nums(int a, int b) {', cls: 'comment' },
      { text: '#     return a + b;', cls: 'comment' },
      { text: '# }', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'main:', cls: 'label' },
      { text: '  addiu $a0, $zero, 10   # arg1 = 10', cls: 'asm' },
      { text: '  addiu $a1, $zero, 25   # arg2 = 25', cls: 'asm' },
      { text: '  jal   add_nums', cls: 'asm' },
      { text: '  nop                    # delay slot', cls: 'asm' },
      { text: '  or    $t0, $zero, $v0  # use return val', cls: 'asm' },
      { text: '  hlt', cls: 'asm' },
      { text: '', cls: '' },
      { text: 'add_nums:', cls: 'label' },
      { text: '  add   $v0, $a0, $a1   # return a + b', cls: 'asm' },
      { text: '  jr    $ra             # return', cls: 'asm' },
      { text: '  nop                    # delay slot', cls: 'asm' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmArch: 'mips',
  asmInstructions: instructions,
  asmQuiz: [
    { question: 'What is $v0 after add_nums returns? (10 + 25)', answer: 35, format: 'decimal', hint: '$a0 = 10, $a1 = 25. The function does $v0 = $a0 + $a1 = 35.' },
    { question: 'What address does $ra contain after JAL executes? JAL is at 0x00400008. (Answer in hex.)', answer: 0x00400010, format: 'hex', hint: 'JAL sets $ra = PC + 8 (address of JAL + 8, past the delay slot). 0x00400008 + 8 = 0x00400010.' },
  ],
  check: () => false,
  winTitle: 'Calling Convention Mastered!',
  winMsg: 'You understand how MIPS passes arguments ($a0-$a3), returns values ($v0), and manages the return address ($ra). Controlling $ra is the key to MIPS exploitation.',
};
