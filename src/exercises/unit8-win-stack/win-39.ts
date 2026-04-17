import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

const instructions: AsmInstruction[] = [
  // Setting up SEH on the stack
  { addr: 0x00401000, bytes: [0x55], mnemonic: 'push', operands: 'ebp', comment: 'Function prologue' },
  { addr: 0x00401001, bytes: [0x89, 0xe5], mnemonic: 'mov', operands: 'ebp, esp', comment: '' },
  { addr: 0x00401003, bytes: [0x68], mnemonic: 'push', operands: '0x00401100', comment: 'Push exception handler address' },
  { addr: 0x00401008, bytes: [0x64, 0xff, 0x35, 0x00, 0x00, 0x00, 0x00], mnemonic: 'push', operands: '[0x00000000]', comment: 'Push previous SEH handler (from fs:[0])' },
  { addr: 0x0040100f, bytes: [0x64, 0x89, 0x25, 0x00, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: '[0x00000000], esp', comment: 'Install new handler: fs:[0] = ESP' },
  // Stack now has: [prev_SEH] [handler_addr] = EXCEPTION_REGISTRATION record
  { addr: 0x00401016, bytes: [0x83, 0xec, 0x10], mnemonic: 'sub', operands: 'esp, 16', comment: 'Allocate buffer — below SEH record!' },
  { addr: 0x00401019, bytes: [0xb8, 0x41, 0x41, 0x41, 0x41], mnemonic: 'mov', operands: 'eax, 0x41414141', comment: 'Overflow data...' },
  { addr: 0x0040101e, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'SEH chain installed on stack!' },
];

export const win39: Exercise = {
  id: 'win-39',
  unitId: 'unit8-win-stack',
  title: 'SEH Basics',
  desc: '<b>Goal:</b> Windows uses <b>Structured Exception Handling (SEH)</b> — a linked list of handlers stored <i>on the stack</i>. Each EXCEPTION_REGISTRATION record has: <code>[ptr to prev handler][handler function addr]</code>. When an exception occurs, Windows walks the chain and calls each handler. Since these are on the stack, buffer overflows can overwrite them!',
  source: {
    c: [
      { text: '// SEH — Structured Exception Handling', cls: 'comment' },
      { text: '// Exception handlers stored ON THE STACK', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// EXCEPTION_REGISTRATION struct:', cls: 'comment' },
      { text: '//   DWORD prev;     // ptr to previous handler', cls: 'comment' },
      { text: '//   DWORD handler;  // function to call', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// fs:[0] → head of SEH chain', cls: 'comment' },
      { text: '// Chain: handler1 → handler2 → ... → default', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Stack layout:', cls: 'comment' },
      { text: '//   [buffer ...]   ← overflow starts here', cls: 'comment' },
      { text: '//   [prev SEH ptr]  ← gets overwritten!', cls: 'comment' },
      { text: '//   [handler addr]  ← attacker controls this!', cls: 'comment' },
      { text: '', cls: '' },
      { text: '// Key insight: handlers are ABOVE the buffer', cls: 'comment' },
      { text: '// on the stack, so overflow reaches them', cls: 'comment' },
    ],
  },
  mode: 'asm-step',
  vizMode: 'asm',
  asmInstructions: instructions,
  check: () => true,
  winTitle: 'SEH Understood!',
  winMsg: 'You know how SEH handlers are stored on the stack — and why they\'re vulnerable.',
};
