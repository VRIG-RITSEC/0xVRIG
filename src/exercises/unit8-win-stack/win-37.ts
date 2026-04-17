import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // cdecl
  { addr: 0x00401000, bytes: [0x6a, 0x03], mnemonic: 'push', operands: '3', comment: 'cdecl: push args right-to-left' },
  { addr: 0x00401002, bytes: [0x6a, 0x05], mnemonic: 'push', operands: '5', comment: 'cdecl: caller pushes all args' },
  { addr: 0x00401004, bytes: [0xe8, 0x00, 0x00, 0x00, 0x00], mnemonic: 'call', operands: '0x00401020', comment: 'cdecl: call add(5, 3)' },
  { addr: 0x00401009, bytes: [0x83, 0xc4, 0x08], mnemonic: 'add', operands: 'esp, 8', comment: 'cdecl: CALLER cleans stack (2*4=8 bytes)' },
  // stdcall
  { addr: 0x0040100c, bytes: [0x6a, 0x03], mnemonic: 'push', operands: '3', comment: 'stdcall: same push order...' },
  { addr: 0x0040100e, bytes: [0x6a, 0x05], mnemonic: 'push', operands: '5', comment: 'stdcall: caller pushes args' },
  { addr: 0x00401010, bytes: [0xe8, 0x00, 0x00, 0x00, 0x00], mnemonic: 'call', operands: '0x00401030', comment: 'stdcall: call add(5, 3)' },
  { addr: 0x00401015, bytes: [0x90], mnemonic: 'nop', operands: '', comment: 'stdcall: NO cleanup needed — callee did it!' },
  // fastcall
  { addr: 0x00401016, bytes: [0xb9, 0x05, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ecx, 5', comment: 'fastcall: arg1 in ECX (register!)' },
  { addr: 0x0040101b, bytes: [0xba, 0x03, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 3', comment: 'fastcall: arg2 in EDX' },
  { addr: 0x00401020, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'fastcall: 3rd+ args go on stack' },
  // add function (cdecl version)
  { addr: 0x00401020, bytes: [0x8b, 0x44, 0x24, 0x04], mnemonic: 'mov', operands: 'eax, [esp+4]', comment: 'cdecl add: load arg1' },
  { addr: 0x00401024, bytes: [0x03, 0x44, 0x24, 0x08], mnemonic: 'add', operands: 'eax, [esp+8]', comment: 'cdecl add: eax += arg2' },
  { addr: 0x00401028, bytes: [0xc3], mnemonic: 'ret', operands: '', comment: 'cdecl: plain ret (caller cleans)' },
  // add function (stdcall version)
  { addr: 0x00401030, bytes: [0x8b, 0x44, 0x24, 0x04], mnemonic: 'mov', operands: 'eax, [esp+4]', comment: 'stdcall add: load arg1' },
  { addr: 0x00401034, bytes: [0x03, 0x44, 0x24, 0x08], mnemonic: 'add', operands: 'eax, [esp+8]', comment: 'stdcall add: eax += arg2' },
  { addr: 0x00401038, bytes: [0xc2, 0x08, 0x00], mnemonic: 'ret', operands: '8', comment: 'stdcall: ret 8 — CALLEE cleans 8 bytes!' },
];

export const win37: Exercise = {
  id: 'win-37',
  unitId: 'unit8-win-stack',
  title: 'Calling Conventions',
  desc: '<b>Goal:</b> Compare three Windows calling conventions: <b>cdecl</b> (caller cleans stack — same as Linux), <b>stdcall</b> (callee cleans with <code>ret N</code> — used by WinAPI), and <b>fastcall</b> (first 2 args in ECX/EDX — faster). stdcall uses <code>ret 8</code> to pop args!',
  source: {
    c: [
      { text: '// Windows Calling Conventions', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// cdecl: caller cleans stack', cls: 'comment' },
      { text: '//   push 3; push 5; call add; add esp, 8', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// stdcall: callee cleans (WinAPI default)', cls: 'comment' },
      { text: '//   push 3; push 5; call add', cls: 'comment' },
      { text: '//   function uses "ret 8" to clean', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// fastcall: first 2 args in ECX, EDX', cls: 'comment' },
      { text: '//   mov ecx, 5; mov edx, 3; call add', cls: 'comment' },
      { text: '//   callee cleans any stack args', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Impact on exploits:', cls: 'comment' },
      { text: '// stdcall ROP is trickier because', cls: 'comment' },
      { text: '// functions clean their own args', cls: 'comment' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'Calling Conventions!',
  winMsg: 'You understand cdecl, stdcall, and fastcall — essential for Windows exploitation.',
};
