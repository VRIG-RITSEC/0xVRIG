import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// Blind ROP (BROP): Exploit a remote service without having the binary.
// Uses a crash oracle (does the connection stay alive or die?) to:
// 1. Leak the stack canary byte-by-byte (256 guesses per byte)
// 2. Find "stop gadgets" (gadgets that hang/loop instead of crashing)
// 3. Scan for PLT entries (signature: call → jmp pattern)
// 4. Chain: write@PLT(socket, binary_base, len) to dump the binary

const instructions: AsmInstruction[] = [
  // Simulated canary leak: overwrite byte-by-byte
  { addr: 0x08048000, bytes: [0xb8, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 0', comment: 'canary_byte_0 guess = 0x00 (null terminator)' },
  { addr: 0x08048005, bytes: [0xbb, 0x41, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 0x41', comment: 'canary_byte_1 guess (try 0x00-0xFF)' },
  { addr: 0x0804800a, bytes: [0xb9, 0x72, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 0x72', comment: 'canary_byte_2 guess (try 0x00-0xFF)' },
  { addr: 0x0804800f, bytes: [0xba, 0xf3, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 0xf3', comment: 'canary_byte_3 guess (try 0x00-0xFF)' },
  // Stop gadget scanning
  { addr: 0x08048014, bytes: [0x90], mnemonic: 'nop', operands: '', comment: 'Probe addr: crash = not useful' },
  { addr: 0x08048015, bytes: [0x90], mnemonic: 'nop', operands: '', comment: 'Probe addr: hang = stop gadget found!' },
  // PLT entry signature
  { addr: 0x08048016, bytes: [0xe8, 0x10, 0x00, 0x00, 0x00], mnemonic: 'call', operands: '0x0804802b', comment: 'PLT stub: call to resolver' },
  { addr: 0x0804801b, bytes: [0xe9, 0x20, 0x00, 0x00, 0x00], mnemonic: 'jmp', operands: '0x08048040', comment: 'PLT stub: jmp to GOT entry' },
  // BROP gadget (pop rdi; ret equivalent)
  { addr: 0x08048020, bytes: [0x5f], mnemonic: 'pop', operands: 'edi', comment: 'BROP gadget: pop edi' },
  { addr: 0x08048021, bytes: [0xc3], mnemonic: 'ret', operands: '', comment: 'BROP gadget: ret — useful for write(sock, addr, len)' },
  { addr: 0x08048022, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const adv298: Exercise = {
  id: 'adv2-98',
  unitId: 'unit17-advanced-ii',
  title: '98: Blind ROP (BROP)',
  desc: '<b>Goal:</b> Understand Blind Return-Oriented Programming — exploiting a remote service <strong>without having the binary</strong>. BROP requires only a stack overflow and a crash oracle (the server forks per-connection, so ASLR and canaries stay constant across crashes). The attack proceeds in phases: <br>(1) <strong>Canary leak</strong>: overwrite the canary byte-by-byte, trying all 256 values for each byte. If the server does not crash, the guess is correct. The first byte is always 0x00 (null terminator). <br>(2) <strong>Stop gadget discovery</strong>: scan the text segment for addresses that cause the server to hang (infinite loop, blocking syscall) rather than crash. These are used as safe return targets. <br>(3) <strong>PLT scanning</strong>: identify PLT entries by their unique call+jmp signature. <br>(4) <strong>Exploitation</strong>: chain write@PLT(socket_fd, binary_base, length) to dump the binary over the socket, then build a full ROP chain from the leaked binary.',
  source: {
    c: [
      { text: '// Blind ROP (BROP) Attack Phases', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Phase 1: Canary byte-by-byte leak', cls: 'comment' },
      { text: '// Server forks → canary is constant', cls: 'comment' },
      { text: 'for (byte = 0; byte < 4; byte++)', cls: '' },
      { text: '  for (guess = 0; guess < 256; guess++)', cls: '' },
      { text: '    if (send_and_check(guess)) break;', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// Phase 2: Find stop gadgets', cls: 'comment' },
      { text: '// Scan .text for addrs that hang vs crash', cls: 'comment' },
      { text: 'for (addr = text_base; ; addr++)', cls: '' },
      { text: '  if (probe(addr) == HANG) save(addr);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// Phase 3: PLT scanning', cls: 'comment' },
      { text: '// PLT entries: [call resolver][jmp GOT]', cls: 'comment' },
      { text: '// Unique signature: call+jmp pattern', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Phase 4: Dump binary via write@PLT', cls: 'comment' },
      { text: 'write(sock, binary_base, 0x1000);', cls: 'highlight' },
      { text: '// Now build full ROP from leaked binary', cls: 'comment' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    {
      question: 'A 4-byte stack canary is leaked byte-by-byte, trying up to 256 guesses per byte. What is the worst-case total number of connection attempts? (decimal)',
      answer: 1024,
      format: 'decimal',
      hint: '4 bytes * 256 guesses per byte = 1024 total attempts in the worst case. In practice, the first byte (0x00) is known, so only 768 for the remaining 3.',
    },
    {
      question: 'What does a "stop gadget" do when returned to? (1=crash, 2=hang/block, 3=exit cleanly)',
      answer: 2,
      format: 'decimal',
      hint: 'A stop gadget causes the program to hang (infinite loop or blocking I/O) without crashing. This lets the attacker distinguish it from a crash, making it useful as a safe return target during probing.',
    },
    {
      question: 'The first byte of a standard glibc stack canary is always what value? (hex)',
      answer: 0x00,
      format: 'hex',
      hint: 'Glibc sets the first byte to 0x00 (null terminator) to prevent canary leaks via string functions like printf/puts, which stop at null bytes.',
    },
  ],
  check: () => false,
  winTitle: 'BROP Attack Mastered!',
  winMsg: 'Blind ROP turns a simple crash oracle into full binary disclosure and exploitation — no binary needed upfront. The key insight is that forking servers preserve ASLR layout and canaries across connections, enabling byte-by-byte brute force.',
};
