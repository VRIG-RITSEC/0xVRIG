import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// Spectre v1: Bounds Check Bypass
// The CPU speculatively executes the load past the bounds check while
// the branch predictor resolves. The speculative load brings data into
// cache, which is architecturally rolled back but leaves a timing side
// channel via cache hits/misses.
//
// if (x < array1_size)
//   y = array2[array1[x] * 256];
//
// When branch predictor is mistrained to predict "taken," the CPU
// speculatively accesses array1[x] even if x >= array1_size, leaking
// secret data through the cache.

const instructions: AsmInstruction[] = [
  // x is in EAX, array1_size at [0x0804a000], array1 at 0x0804b000, array2 at 0x0804c000
  { addr: 0x08048000, bytes: [0xb8, 0x40, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 64', comment: 'x = 64 (attacker-controlled, out of bounds)' },
  { addr: 0x08048005, bytes: [0x3b, 0x05, 0x00, 0xa0, 0x04, 0x08], mnemonic: 'cmp', operands: 'eax, [0x0804a000]', comment: 'Compare x with array1_size (= 16)' },
  { addr: 0x0804800b, bytes: [0x7d, 0x0e], mnemonic: 'jge', operands: '0x0804801b', comment: 'If x >= size, jump to out_of_bounds' },
  // Speculative execution path (CPU predicts branch NOT taken):
  { addr: 0x0804800d, bytes: [0x8a, 0x98, 0x00, 0xb0, 0x04, 0x08], mnemonic: 'mov', operands: 'ebx, [0x0804b000 + eax]', comment: 'SPECULATIVE: load array1[x] — leaks secret byte' },
  { addr: 0x08048013, bytes: [0xc1, 0xe3, 0x08], mnemonic: 'mov', operands: 'ecx, ebx', comment: 'Multiply by 256 (shift left 8) for cache line' },
  { addr: 0x08048016, bytes: [0x8a, 0x91, 0x00, 0xc0, 0x04, 0x08], mnemonic: 'mov', operands: 'edx, [0x0804c000 + ecx]', comment: 'SPECULATIVE: access array2[secret * 256] — cache side channel' },
  // Out of bounds label
  { addr: 0x0804801b, bytes: [0x90], mnemonic: 'nop', operands: '', comment: 'out_of_bounds: branch target (architectural path)' },
  { addr: 0x0804801c, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const adv297: Exercise = {
  id: 'adv2-97',
  unitId: 'unit17-advanced-ii',
  title: '97: Spectre v1 - Bounds Check Bypass',
  desc: '<b>Goal:</b> Understand speculative execution attacks. Modern CPUs predict branch outcomes and execute instructions ahead of time. In Spectre v1, the attacker mistrains the branch predictor so the CPU speculatively executes a load past a bounds check. The loaded value is used to index into a second array, bringing a specific cache line into L1 cache. After the CPU detects the misprediction, it rolls back register/memory changes — but the <strong>cache state persists</strong>. By timing subsequent accesses to array2, the attacker determines which cache line was loaded and deduces the secret byte. The bounds check is architecturally correct, but speculation leaks data through the microarchitectural side channel.',
  source: {
    c: [
      { text: '// Spectre v1: Bounds Check Bypass', cls: 'comment' },
      { text: '// Gadget pattern (victim code):', cls: 'comment' },
      { text: 'uint8_t array1[16];', cls: '' },
      { text: 'uint8_t array2[256 * 256];', cls: '' },
      { text: 'unsigned int array1_size = 16;', cls: '' },
      { text: '', cls: '' },
      { text: 'void victim(size_t x) {', cls: '' },
      { text: '    if (x < array1_size) {', cls: 'highlight' },
      { text: '        // Branch predictor mistrains:', cls: 'cmt' },
      { text: '        // CPU speculatively executes this', cls: 'cmt' },
      { text: '        uint8_t secret = array1[x];', cls: 'highlight vuln' },
      { text: '        uint8_t tmp = array2[secret * 256];', cls: 'highlight vuln' },
      { text: '        // secret leaks via cache timing!', cls: 'cmt' },
      { text: '    }', cls: '' },
      { text: '}', cls: '' },
      { text: '// Attacker calls victim(64) — out of bounds', cls: 'cmt' },
      { text: '// CPU speculates past the if-check', cls: 'cmt' },
      { text: '// Then times array2 accesses to find', cls: 'cmt' },
      { text: '// which cache line was loaded', cls: 'cmt' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmInitialMemory: [
    { addr: 0x0804a000, value: 16, size: 4 },  // array1_size = 16
  ],
  asmQuiz: [
    {
      question: 'If x = 64 and array1 starts at 0x0804b000, what address does the speculative load access? (hex)',
      answer: 0x0804b040,
      format: 'hex',
      hint: 'array1[64] = array1 base + 64 = 0x0804b000 + 0x40 = 0x0804b040. This is past the 16-byte array.',
    },
    {
      question: 'After the CPU detects the misprediction, is the speculatively loaded value still in a register? (1=yes, 0=no)',
      answer: 0,
      format: 'decimal',
      hint: 'The CPU rolls back all architectural state (registers, memory). But the cache is NOT rolled back — that is the side channel.',
    },
    {
      question: 'If the leaked secret byte is 0x41, which byte offset into array2 gets cached? (multiply secret by 256, answer in hex)',
      answer: 0x4100,
      format: 'hex',
      hint: '0x41 * 256 = 0x41 * 0x100 = 0x4100. The attacker times access to array2[0x4100] and finds it fast (cache hit).',
    },
  ],
  check: () => false,
  winTitle: 'Spectre v1 Understood!',
  winMsg: 'Speculative execution bypasses bounds checks. The CPU rolls back architectural state but cache state persists, creating a covert timing channel. Mitigations include lfence after bounds checks, array index masking, and retpoline for indirect branches.',
  realWorld: 'CVE-2017-5753 (Spectre v1): Affected virtually all modern CPUs from Intel, AMD, and ARM.',
};
