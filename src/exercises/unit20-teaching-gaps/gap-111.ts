import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'gap-111',
  unitId: 'unit20-teaching-gaps',
  title: '111: Info Leak Chaining',
  desc: '<b>Goal:</b> Real exploits chain multiple leaks before the final payload. This exercise walks through a 3-stage leak: <strong>Step 1:</strong> format string to leak the stack canary. <strong>Step 2:</strong> format string to leak a libc address from the GOT. <strong>Step 3:</strong> compute system() address and build a ROP chain. This is how 90% of real-world exploits work.',
  source: {
    c: [
      { text: '// Multi-stage info leak → exploit', cls: 'cmt' },
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '' },
      { text: '    char buf[32];', cls: '' },
      { text: '    // Round 1: leak canary via %x', cls: 'cmt' },
      { text: '    fgets(buf, 64, stdin);', cls: '' },
      { text: '    printf(buf);', cls: 'highlight vuln' },
      { text: '    // Round 2: leak libc via GOT', cls: 'cmt' },
      { text: '    fgets(buf, 64, stdin);', cls: '' },
      { text: '    printf(buf);', cls: 'highlight vuln' },
      { text: '    // Round 3: overflow with ROP chain', cls: 'cmt' },
      { text: '    fgets(buf, 64, stdin);', cls: '' },
      { text: '    // stack: [buf][canary][ebp][ret]', cls: 'cmt' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 32,
  canary: true,
  aslr: true,
  showSymbols: true,
  steps: [
    {
      action: 'init',
      log: ['info', 'This exercise chains three primitives: <strong>canary leak</strong>, <strong>libc leak</strong>, and <strong>ROP chain</strong>. In real CTFs, this pattern is ubiquitous — you almost never get a single-step exploit on modern binaries.'],
    },
    {
      log: ['info', '<strong>Stage 1: Leak the canary.</strong> The stack canary is at a known offset from the format string buffer. Using <code>%11$x</code> (or similar direct access) leaks the 4-byte canary value. Without this, any overflow attempt would trigger <code>__stack_chk_fail()</code>.'],
      srcLine: 8,
    },
    {
      log: ['info', '<strong>Stage 2: Leak libc base.</strong> Using <code>%s</code> with a GOT entry address as an argument, or <code>%15$x</code> to read a saved return address, we can compute the offset from a known libc function. libc_base = leaked_addr - known_offset.'],
      srcLine: 11,
    },
    {
      log: ['info', '<strong>Stage 3: Exploit.</strong> Now we know: (1) the canary, (2) libc base. We can compute system() = libc_base + system_offset, and build: <code>[padding][canary][fake_ebp][system()][dummy_ret]["/bin/sh"]</code>. The canary must be correct or __stack_chk_fail fires.'],
      srcLine: 13,
    },
    {
      log: ['success', 'Chaining complete! The three-stage pattern — <strong>leak canary → leak libc → ROP</strong> — is the most common real-world exploit structure. Each leak builds on the previous: without the canary you can\'t overflow, without the libc base you can\'t compute gadget addresses.'],
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Info Leak Chain!',
  winMsg: 'You chained canary leak → libc leak → ROP. This three-stage pattern is the backbone of modern userland exploitation.',
};

export default exercise;
