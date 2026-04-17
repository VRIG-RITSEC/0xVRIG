import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // Simulating SEH overwrite exploit
  { addr: 0x00401000, bytes: [0xb8], mnemonic: 'mov', operands: 'eax, 0x41414141', comment: 'Overflow buffer with padding As' },
  { addr: 0x00401005, bytes: [0xbb], mnemonic: 'mov', operands: 'ebx, 0x42424242', comment: 'Overwrite prev SEH ptr (nSEH) with short jmp' },
  { addr: 0x0040100a, bytes: [0xb9], mnemonic: 'mov', operands: 'ecx, 0x00401200', comment: 'Overwrite handler with POP POP RET gadget' },
  // When exception triggers:
  { addr: 0x0040100f, bytes: [0xba], mnemonic: 'mov', operands: 'edx, 0x00401200', comment: 'Windows calls handler at 0x00401200' },
  // POP POP RET gadget
  { addr: 0x00401200, bytes: [0x58], mnemonic: 'pop', operands: 'eax', comment: 'PPR gadget: pop (skip exception record ptr)' },
  { addr: 0x00401201, bytes: [0x58], mnemonic: 'pop', operands: 'eax', comment: 'PPR gadget: pop (skip establish frame ptr)' },
  { addr: 0x00401202, bytes: [0xc3], mnemonic: 'ret', operands: '', comment: 'PPR gadget: ret → lands on nSEH field!' },
  // nSEH contains short jump
  { addr: 0x00401014, bytes: [0xeb, 0x06], mnemonic: 'jmp', operands: '0x0040101c', comment: 'nSEH = short jump over handler → shellcode' },
  { addr: 0x0040101c, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'Shellcode would be here!' },
];

export const win40: Exercise = {
  id: 'win-40',
  unitId: 'unit8-win-stack',
  title: 'SEH Overwrite',
  desc: '<b>Goal:</b> Classic SEH exploit: overflow buffer → overwrite the SEH handler with a <b>POP POP RET</b> gadget address, and the nSEH field with a <b>short jump</b>. When an exception occurs, Windows calls your POP POP RET, which returns to nSEH, which jumps to your shellcode!',
  source: {
    c: [
      { text: '// SEH Overwrite Exploit', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Payload layout:', cls: 'comment' },
      { text: '// [AAAA...padding...]        ← fill buffer', cls: 'comment' },
      { text: '// [\\xEB\\x06\\x90\\x90]         ← nSEH: short jmp +6', cls: 'comment' },
      { text: '// [POP POP RET addr]          ← handler overwrite', cls: 'comment' },
      { text: '// [shellcode...]              ← after handler', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// How POP POP RET works:', cls: 'comment' },
      { text: '// 1. Exception triggers', cls: 'comment' },
      { text: '// 2. Windows pushes args, calls handler', cls: 'comment' },
      { text: '// 3. POP skips ExceptionRecord ptr', cls: 'comment' },
      { text: '// 4. POP skips EstablisherFrame ptr', cls: 'comment' },
      { text: '// 5. RET returns to nSEH on stack', cls: 'comment' },
      { text: '// 6. nSEH is "jmp +6" → jumps to shellcode', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Why not just overwrite handler directly?', cls: 'comment' },
      { text: '// Handler validation checks (SafeSEH/SEHOP)', cls: 'comment' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'SEH Exploited!',
  winMsg: 'You understand the POP POP RET technique for SEH exploitation.',
};
