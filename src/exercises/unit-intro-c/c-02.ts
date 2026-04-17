import { Exercise } from '../types';

const c02: Exercise = {
  id: 'c-02',
  unitId: 'unit-intro-c',
  title: '02: Pointers',
  desc: '<b>Goal:</b> Learn what pointers are -- they are just numbers that hold memory addresses.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    int x = 10;', cls: 'highlight' },
      { text: '    int *p = &x;', cls: 'highlight' },
      { text: '    printf("x = %d\\n", x);', cls: '' },
      { text: '    *p = 20;', cls: 'highlight' },
      { text: '    printf("x = %d\\n", x);', cls: '' },
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
      srcLine: 3,
      log: ['info', 'First we create an integer variable x with the value 10. It lives at some address in memory -- let\'s say address 0xBFFF0010. The 4 bytes at that address hold the value 10.'],
    },
    {
      action: 'init',
      srcLine: 4,
      log: ['info', 'int *p = &x -- The & operator ("address-of") gives us the memory address where x lives. The variable p is a "pointer" -- it stores that address (0xBFFF0010). A pointer is just a number that happens to be an address.'],
    },
    {
      action: 'init',
      log: ['info', 'A pointer itself takes up 4 bytes on a 32-bit system (or 8 bytes on 64-bit). It holds the address of another variable. Think of it as a slip of paper with a house number written on it.'],
    },
    {
      action: 'init',
      srcLine: 6,
      log: ['info', '*p = 20 -- The * operator ("dereference") follows the address stored in p and modifies the value at that location. Since p points to x, this changes x from 10 to 20.'],
    },
    {
      action: 'init',
      log: ['warn', 'Here is the key insight: modifying *p and modifying x are the same operation. Both change the exact same bytes in memory. The pointer just gives us another way to reach them.'],
    },
    {
      action: 'done',
      log: ['success', 'Pointers are central to C -- and central to exploitation. If an attacker can control a pointer, they can read or write anywhere in memory. That ability to reach arbitrary addresses is what makes many attacks possible.'],
    },
  ],
  check() { return false; },
  winTitle: 'Pointers Demystified!',
  winMsg: 'You learned that pointers are just addresses stored as numbers.',
};

export default c02;
