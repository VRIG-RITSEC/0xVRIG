import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// JIT Spraying: XOR constants compile to instructions that, when jumped
// into at offset +1, decode as NOP sleds + shellcode.
//
// JavaScript: var x = 0x3c909090 ^ 0x3c909090 ^ 0x3c909090;
// JIT compiles each XOR as:  xor eax, 0x3c909090  (5 bytes: 35 90 90 90 3c)
// Aligned decode:   35 90 90 90 3c  →  xor eax, 0x3c909090
// Unaligned (+1):   90 90 90 3c 35  →  nop; nop; nop; cmp al, 0x35
//
// The 0x90 bytes are NOP and 0x3c is CMP AL, imm8.

const instructions: AsmInstruction[] = [
  // Aligned view — what the JIT compiler intended
  { addr: 0x08048000, bytes: [0xb8, 0x90, 0x90, 0x90, 0x3c], mnemonic: 'mov', operands: 'eax, 0x3c909090', comment: 'JIT loads XOR constant into EAX' },
  { addr: 0x08048005, bytes: [0x35, 0x90, 0x90, 0x90, 0x3c], mnemonic: 'xor', operands: 'eax, 0x3c909090', comment: 'JIT: first XOR operation' },
  { addr: 0x0804800a, bytes: [0x35, 0x90, 0x90, 0x90, 0x3c], mnemonic: 'xor', operands: 'eax, 0x3c909090', comment: 'JIT: second XOR operation' },
  { addr: 0x0804800f, bytes: [0x35, 0x90, 0x90, 0x90, 0x3c], mnemonic: 'xor', operands: 'eax, 0x3c909090', comment: 'JIT: third XOR operation' },
  // What the attacker sees jumping to addr+1 (unaligned):
  // 0x08048006: 90        nop
  // 0x08048007: 90        nop
  // 0x08048008: 90        nop
  // 0x08048009: 3c 35     cmp al, 0x35
  // 0x0804800b: 90        nop
  // 0x0804800c: 90        nop
  // 0x0804800d: 90        nop
  // ... repeating NOP sled
  { addr: 0x08048014, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'End of JIT page' },
];

export const adv295: Exercise = {
  id: 'adv2-95',
  unitId: 'unit17-advanced-ii',
  title: '95: JIT Spraying',
  desc: '<b>Goal:</b> Understand how JIT compilers inadvertently create attacker-controlled machine code. When a JIT engine compiles JavaScript like <code>var x = 0x3c909090 ^ 0x3c909090 ^ 0x3c909090</code>, it emits x86 <code>xor eax, 0x3c909090</code> instructions. Each is 5 bytes: <code>35 90 90 90 3c</code>. Jumping one byte into the instruction reinterprets the constant bytes as code: three <code>0x90</code> NOPs followed by <code>0x3c</code> (CMP AL, imm8). The attacker gets a NOP sled and can embed arbitrary shellcode in the constants. JIT pages are typically RWX (readable, writable, executable), bypassing DEP/NX entirely.',
  source: {
    c: [
      { text: '// JIT Spray attack concept', cls: 'comment' },
      { text: '// JavaScript source:', cls: 'comment' },
      { text: 'var x = 0x3c909090 ^ 0x3c909090', cls: '' },
      { text: '      ^ 0x3c909090 ^ 0x3c909090;', cls: '' },
      { text: '', cls: '' },
      { text: '// JIT compiles each XOR to x86:', cls: 'comment' },
      { text: '// 35 90 90 90 3c  = xor eax, 0x3c909090', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Aligned (intended) decode:', cls: 'comment' },
      { text: '//   xor eax, 0x3c909090', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Unaligned (+1 byte) decode:', cls: 'comment' },
      { text: '//   90 = nop', cls: 'highlight' },
      { text: '//   90 = nop', cls: 'highlight' },
      { text: '//   90 = nop', cls: 'highlight' },
      { text: '//   3c 35 = cmp al, 0x35', cls: '' },
      { text: '//   90 = nop  (from next XOR constant)', cls: 'highlight' },
      { text: '//   ... repeating NOP sled!', cls: 'comment' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    {
      question: 'The JIT emits "xor eax, 0x3c909090" as bytes 35 90 90 90 3c. If you jump to offset +1, what is the first single-byte instruction? (answer as hex opcode)',
      answer: 0x90,
      format: 'hex',
      hint: 'The second byte of "35 90 90 90 3c" is 0x90. Opcode 0x90 is NOP.',
    },
    {
      question: 'How many consecutive NOP (0x90) bytes appear when decoding "35 90 90 90 3c" starting at offset +1?',
      answer: 3,
      format: 'decimal',
      hint: 'Bytes at positions 1, 2, 3 are all 0x90. Byte 4 (0x3c) starts a new instruction (CMP AL, imm8).',
    },
    {
      question: 'JIT-compiled pages are typically mapped with what memory protection that makes this attack possible? (enter the number of protection flags: R+W+X)',
      answer: 3,
      format: 'decimal',
      hint: 'JIT pages need to be Readable, Writable (to emit code), and eXecutable (to run it). That is 3 flags: RWX.',
    },
  ],
  check: () => false,
  winTitle: 'JIT Spray Understood!',
  winMsg: 'JIT compilers embed attacker-chosen constants directly into executable code pages. By jumping mid-instruction, those constants decode as attacker-controlled shellcode. Modern JIT engines now use constant blinding, W^X policies, and random NOP insertion to mitigate this.',
  realWorld: 'CVE-2017-5121: Chrome V8 JIT spray was used in a Pwn2Own exploit chain.',
};
