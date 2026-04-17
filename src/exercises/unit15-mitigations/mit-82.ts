import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'mit-82',
  unitId: 'unit15-mitigations',
  title: '82: RELRO & GOT Overwrite',
  desc: '<b>Goal:</b> Understand RELRO (Relocation Read-Only) and how it protects the Global Offset Table (GOT). With <strong>Partial RELRO</strong>, the GOT is writable -- an attacker can overwrite a GOT entry to redirect library calls. With <strong>Full RELRO</strong>, all GOT entries are resolved at load time and the GOT is marked read-only, blocking this attack.',
  source: {
    c: [
      { text: '// GOT/PLT lazy binding & RELRO', cls: 'cmt' },
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    puts("hello");', cls: 'highlight' },
      { text: '    // First call: PLT stub -> GOT -> resolver', cls: 'cmt' },
      { text: '    // Resolver fills GOT with real puts() addr', cls: 'cmt' },
      { text: '    puts("world");', cls: 'highlight' },
      { text: '    // Second call: PLT -> GOT -> puts() direct', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Partial RELRO: .got.plt is writable', cls: 'cmt' },
      { text: '// Full RELRO:    .got.plt is read-only', cls: 'cmt' },
      { text: '//   (-Wl,-z,relro,-z,now)', cls: 'cmt' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 32,
  steps: [
    {
      action: 'init',
      log: ['info', 'When a program calls puts(), execution goes through the PLT (Procedure Linkage Table). The PLT stub jumps to an address stored in the GOT (Global Offset Table). With lazy binding, the GOT initially points back to the resolver, which finds the real function address and patches the GOT.'],
    },
    {
      action: 'init', srcLine: 4,
      log: ['action', 'First call to puts(): PLT stub at .plt jumps to GOT entry. GOT contains address of resolver. Resolver looks up puts() in libc, writes the real address (e.g., 0xf7e5f150) into the GOT entry. Control transfers to puts(). Subsequent calls skip the resolver and go straight to libc.'],
    },
    {
      action: 'init', srcLine: 7,
      log: ['action', 'Second call to puts(): PLT jumps to GOT, which now holds the real libc puts() address. No resolver needed. This is fast -- but the GOT entry is writable memory. An attacker with an arbitrary write primitive can overwrite it with the address of system() or a ROP gadget.'],
    },
    {
      action: 'init',
      log: ['warn', 'GOT overwrite attack: the attacker writes system() address into the GOT entry for puts(). Next time the program calls puts("hello"), it actually calls system("hello"). If the attacker controls the argument (e.g., puts("/bin/sh")), they get a shell. This works with Partial RELRO.'],
    },
    {
      action: 'init', srcLine: 13,
      log: ['info', 'Partial RELRO (-Wl,-z,relro): reorders ELF sections so .got is before .bss, and marks some sections read-only after loading. But .got.plt (the PLT\'s GOT) remains writable for lazy binding. GOT overwrites still work.'],
    },
    {
      action: 'init', srcLine: 14,
      log: ['info', 'Full RELRO (-Wl,-z,relro,-z,now): forces all dynamic symbols to be resolved at load time (no lazy binding). After resolution, the entire GOT is remapped read-only with mprotect(). Writing to the GOT causes SIGSEGV. GOT overwrite attacks are completely blocked.'],
    },
    {
      action: 'done',
      log: ['success', 'RELRO summary: Partial RELRO leaves .got.plt writable (GOT overwrites work). Full RELRO resolves all symbols at startup and marks the GOT read-only (GOT overwrites blocked). The tradeoff: Full RELRO increases startup time because all symbols are resolved eagerly.'],
    },
  ],
  check() { return false; },
  winTitle: 'RELRO Mastered!',
  winMsg: 'You understand PLT/GOT lazy binding, how GOT overwrite attacks work with Partial RELRO, and how Full RELRO blocks them by making the GOT read-only after eager resolution.',
};

export default exercise;
