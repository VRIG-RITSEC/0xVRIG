import { Exercise } from '../types';

const adv92: Exercise = {
  id: 'adv-92',
  unitId: 'unit16-advanced',
  title: '92: Ret2dlresolve',
  desc: '<b>Goal:</b> Exploit the dynamic linker\'s lazy binding mechanism to call arbitrary library functions. When a program calls a library function for the first time, the PLT stub jumps to <code>_dl_runtime_resolve</code>, which looks up the function in the <strong>JMPREL</strong> (relocation) table using an index pushed onto the stack. Each JMPREL entry contains a symbol table index, and the symbol table entry contains an offset into the string table where the function name lives.<br><br><b>Attack:</b> If you control the stack, you can push a <strong>fake relocation index</strong> that points past the real JMPREL table into memory you control. There you forge a fake <code>Elf32_Rel</code> structure pointing to a fake <code>Elf32_Sym</code>, which in turn points to a fake string like <code>"system"</code>. The dynamic linker follows the chain: fake reloc -> fake sym -> fake string -> resolves and calls <code>system()</code>.<br><br>Overflow the 16-byte buffer to overwrite the return address with <code>win()</code>, which models the ret2dlresolve control flow hijack.',
  source: {
    c: [
      { text: '// Lazy binding: PLT -> _dl_runtime_resolve', cls: 'cmt' },
      { text: '// Resolution chain:', cls: 'cmt' },
      { text: '//   reloc_index -> JMPREL[i]', cls: 'cmt' },
      { text: '//   JMPREL[i].r_info >> 8 -> SYMTAB[j]', cls: 'cmt' },
      { text: '//   SYMTAB[j].st_name -> STRTAB + offset', cls: 'cmt' },
      { text: '//   STRTAB + offset -> "system\\0"', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'typedef struct {', cls: '' },
      { text: '    uint32_t r_offset; // GOT slot address', cls: '' },
      { text: '    uint32_t r_info;   // sym_index << 8 | type', cls: '' },
      { text: '} Elf32_Rel;', cls: '' },
      { text: '', cls: '' },
      { text: 'typedef struct {', cls: '' },
      { text: '    uint32_t st_name;  // offset into STRTAB', cls: '' },
      { text: '    uint32_t st_value;', cls: '' },
      { text: '    uint32_t st_size;', cls: '' },
      { text: '    uint8_t  st_info;', cls: '' },
      { text: '} Elf32_Sym;', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: 'highlight' },
      { text: '    read(0, buf, 256);', cls: 'highlight vuln' },
      { text: '    // Overflow -> fake reloc_index on stack', cls: 'cmt' },
      { text: '    // -> forged Elf32_Rel -> forged Elf32_Sym', cls: 'cmt' },
      { text: '    // -> "system" string -> call system()', cls: 'cmt' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{ret2dlresolve}',
  winMsg: 'You forged the dynamic linker\'s resolution chain. By crafting fake JMPREL, SYMTAB, and STRTAB entries, you tricked _dl_runtime_resolve into resolving any function you want \u2014 without needing a libc leak. Ret2dlresolve is powerful because it works even with full ASLR: the .dynamic section addresses are fixed relative to the binary base in non-PIE executables.',
  realWorld: 'Ret2dlresolve is a staple technique in CTF competitions and was notably used in real-world exploit chains against non-PIE Linux services where libc addresses were unknown.',
};

export default adv92;
