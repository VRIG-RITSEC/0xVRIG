import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'mit-80',
  unitId: 'unit15-mitigations',
  title: '80: DEP / NX (W^X)',
  desc: '<b>Goal:</b> Understand Data Execution Prevention (DEP), also called NX (No-eXecute) or W^X. Modern systems mark memory pages as either <strong>writable OR executable, never both</strong>. This prevents classic shellcode injection: even if you can write to the stack, the CPU refuses to execute instructions from it. Attackers bypass DEP using <strong>Return-Oriented Programming (ROP)</strong>.',
  source: {
    c: [
      { text: '// DEP / NX: non-executable stack', cls: 'cmt' },
      { text: '// Page permissions: R=read, W=write, X=exec', cls: 'cmt' },
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'char shellcode[] = "\\x31\\xc0\\x50...";', cls: 'highlight' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '' },
      { text: '    char buf[64];', cls: '' },
      { text: '    gets(buf); // overflow!', cls: 'highlight vuln' },
      { text: '    // attacker puts shellcode in buf', cls: 'cmt' },
      { text: '    // overwrites ret addr to &buf', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Memory map:', cls: 'cmt' },
      { text: '// .text  0x08048000  R-X (exec)', cls: 'cmt' },
      { text: '// .data  0x0804a000  RW- (no exec)', cls: 'cmt' },
      { text: '// stack  0xbfff0000  RW- (no exec!)', cls: 'cmt' },
      { text: '// heap   0x08050000  RW- (no exec)', cls: 'cmt' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 64,
  steps: [
    {
      action: 'init',
      log: ['info', 'DEP (Data Execution Prevention) enforces W^X: each memory page is either writable or executable, never both. The stack is marked RW- (read-write, no execute). The .text section is R-X (read-execute, no write). This is enforced by the CPU\'s NX bit (AMD) or XD bit (Intel) in page table entries.'],
    },
    {
      action: 'init', srcLine: 5,
      log: ['info', 'Classic attack: inject shellcode into a stack buffer, then overwrite the return address to point at the buffer. Before DEP, this worked because the CPU didn\'t check if the stack page was executable.'],
    },
    {
      action: 'init', srcLine: 9,
      log: ['action', 'The attacker overflows buf[64] with shellcode bytes (\\x31\\xc0\\x50...) and overwrites the saved return address to point at buf on the stack.'],
    },
    {
      action: 'init', srcLine: 11,
      log: ['warn', 'BLOCKED! When the function returns and EIP jumps to the stack address, the CPU checks page table permissions. The stack page has NX=1 (no execute). The CPU raises a hardware exception (SIGSEGV on Linux, STATUS_ACCESS_VIOLATION on Windows). The shellcode never runs.'],
    },
    {
      action: 'init',
      log: ['info', 'Bypass technique: Return-Oriented Programming (ROP). Instead of injecting code, the attacker chains small sequences of existing executable code ("gadgets") ending in RET. Each gadget performs one operation. The chain of return addresses on the stack drives execution through these gadgets, never executing data.'],
    },
    {
      action: 'init',
      log: ['info', 'Another bypass: mprotect()/VirtualProtect() calls via ROP to mark a page RWX, then jump to shellcode. Or use mmap() to allocate executable memory and copy shellcode there. DEP alone is not enough -- it must be combined with ASLR, canaries, and CFI.'],
    },
    {
      action: 'done',
      log: ['success', 'DEP/NX prevents executing injected shellcode by marking writable pages non-executable. The CPU enforces this via the NX/XD bit in page tables. Bypassed by ROP (reusing existing code), mprotect-based attacks, or JIT spraying. Essential but not sufficient on its own.'],
    },
  ],
  check() { return false; },
  winTitle: 'DEP/NX Mastered!',
  winMsg: 'You understand how DEP uses hardware NX bits to prevent shellcode execution on the stack, and how ROP bypasses it by reusing existing executable code.',
};

export default exercise;
