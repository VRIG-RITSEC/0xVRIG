import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  { addr: 0x00400000, bytes: [0xb8], mnemonic: 'mov', operands: 'eax, 0x5A4D', comment: 'PE magic: "MZ" (0x4D5A little-endian)' },
  { addr: 0x00400005, bytes: [0xbb], mnemonic: 'mov', operands: 'ebx, 0x00004550', comment: 'PE signature: "PE\\0\\0"' },
  { addr: 0x0040000a, bytes: [0xb9], mnemonic: 'mov', operands: 'ecx, 0x0040', comment: 'PE: ImageBase typically 0x00400000' },
  { addr: 0x0040000f, bytes: [0xba], mnemonic: 'mov', operands: 'edx, 0x1000', comment: 'PE: Section alignment = 0x1000 (4KB pages)' },
  { addr: 0x00400014, bytes: [0xbe], mnemonic: 'mov', operands: 'esi, 0x2000', comment: '.text section RVA (code lives here)' },
  { addr: 0x00400019, bytes: [0xbf], mnemonic: 'mov', operands: 'edi, 0x3000', comment: '.data section RVA (globals)' },
  { addr: 0x0040001e, bytes: [0xb8], mnemonic: 'mov', operands: 'eax, 0x4000', comment: '.idata section RVA (imports / IAT)' },
  { addr: 0x00400023, bytes: [0xbb], mnemonic: 'mov', operands: 'ebx, 0x5000', comment: '.rsrc section RVA (resources)' },
  { addr: 0x00400028, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'PE layout loaded!' },
];

export const win38: Exercise = {
  id: 'win-38',
  unitId: 'unit8-win-stack',
  title: 'PE Format',
  desc: '<b>Goal:</b> Understand the PE (Portable Executable) format — Windows\' ELF equivalent. Key differences: "MZ" header, IAT (Import Address Table) instead of GOT/PLT, sections (.text, .data, .idata, .rsrc). The IAT is a prime target for overwrites — like GOT overwrite on Linux.',
  source: {
    c: [
      { text: '// PE Format vs ELF', cls: 'comment' },
      { text: '// PE (Windows)         ELF (Linux)', cls: 'comment' },
      { text: '// ─────────────────────────────────', cls: 'comment' },
      { text: '// MZ header            ELF header', cls: 'comment' },
      { text: '// PE signature         (none)', cls: 'comment' },
      { text: '// COFF header          Program headers', cls: 'comment' },
      { text: '// Optional header      Section headers', cls: 'comment' },
      { text: '// Section table        Section table', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Key PE Sections:', cls: 'comment' },
      { text: '// .text  — executable code', cls: 'comment' },
      { text: '// .data  — initialized globals', cls: 'comment' },
      { text: '// .idata — Import Address Table (IAT)', cls: 'comment' },
      { text: '//          Like GOT — overwrite target!', cls: 'comment' },
      { text: '// .rsrc  — resources (icons, strings)', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// ImageBase: where PE prefers to load', cls: 'comment' },
      { text: '// (ASLR randomizes this on modern Windows)', cls: 'comment' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'PE Format!',
  winMsg: 'You understand the PE executable format and its key sections.',
};
