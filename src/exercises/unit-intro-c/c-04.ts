import { Exercise } from '../types';

const c04: Exercise = {
  id: 'c-04',
  unitId: 'unit-intro-c',
  title: '04: Functions & the Call Stack',
  desc: '<b>Goal:</b> Understand what happens in memory when a function is called and when it returns.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void greet() {', cls: '' },
      { text: '    int x = 5;', cls: 'highlight' },
      { text: '    printf("Hello!\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    greet();', cls: 'highlight' },
      { text: '    printf("Back in main\\n");', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 16,
  steps: [
    {
      action: 'init',
      log: ['info', 'The "stack" is a region of memory that grows and shrinks as functions are called and return. Think of it like a stack of trays in a cafeteria -- you add trays on top, and remove them from the top. The stack grows downward in memory (toward lower addresses).'],
    },
    {
      action: 'init',
      srcLine: 8,
      log: ['info', 'When main() calls greet(), the computer must remember where to come back to after greet() finishes. It saves a "return address" -- the address of the next instruction in main() -- by pushing it onto the stack.'],
    },
    {
      action: 'init',
      srcLine: 3,
      log: ['info', 'greet() then creates its own "stack frame" -- a section of the stack for its local variables. The variable int x = 5 is stored in this frame. The frame also includes a saved "base pointer" that bookmarks the previous frame.'],
    },
    {
      action: 'init',
      log: ['info', 'The stack frame for greet() now looks like this (from top to bottom): local variable x, saved base pointer, then the return address pointing back to main(). The return address is the critical piece -- it controls where execution goes next.'],
    },
    {
      action: 'init',
      srcLine: 5,
      log: ['info', 'When greet() hits its closing brace, it "returns." The computer restores the saved base pointer, then reads the return address from the stack and jumps back to that location in main(). The greet() frame is discarded.'],
    },
    {
      action: 'done',
      log: ['success', 'The call stack is how C tracks function calls. The return address on the stack controls where a function jumps back to. If an attacker can overwrite that return address, they can redirect execution anywhere they want. This is the core idea behind stack-based exploits.'],
    },
  ],
  check() { return false; },
  winTitle: 'Call Stack Understood!',
  winMsg: 'You learned how function calls use the stack and why the return address matters.',
};

export default c04;
