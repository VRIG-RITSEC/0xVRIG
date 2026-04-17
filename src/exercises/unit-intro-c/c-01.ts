import { Exercise } from '../types';

const c01: Exercise = {
  id: 'c-01',
  unitId: 'unit-intro-c',
  title: '01: Variables & Memory',
  desc: '<b>Goal:</b> Understand how C stores variables in memory as raw bytes.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    int x = 42;', cls: 'highlight' },
      { text: '    char c = \'A\';', cls: 'highlight' },
      { text: '    printf("%d %c\\n", x, c);', cls: '' },
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
      log: ['info', 'In C, every variable is a named slot in memory. Unlike Python or JavaScript, you must tell the compiler how big each slot is by choosing a "type." Let\'s see how two different types get stored.'],
    },
    {
      action: 'init',
      srcLine: 3,
      log: ['info', 'int x = 42 -- An "int" occupies 4 bytes (32 bits). The computer stores the value 42 in hexadecimal as 0x0000002A. Those 4 bytes sit at a specific address in memory.'],
    },
    {
      action: 'init',
      srcLine: 4,
      log: ['info', 'char c = \'A\' -- A "char" occupies just 1 byte (8 bits). Characters are stored as numbers using the ASCII code. The letter A is 65 in decimal, or 0x41 in hex.'],
    },
    {
      action: 'init',
      log: ['info', 'The sizeof operator tells you how many bytes a type uses: sizeof(int) is 4, sizeof(char) is 1. Other common types: short (2 bytes), long (4-8 bytes), double (8 bytes).'],
    },
    {
      action: 'done',
      log: ['success', 'Variables in C map directly to bytes in memory. There is no hidden layer of abstraction. Understanding this is the foundation of everything that follows -- exploits work because attackers can read and manipulate these raw bytes.'],
    },
  ],
  check() { return false; },
  winTitle: 'Variables & Memory!',
  winMsg: 'You learned how C stores data as raw bytes in memory.',
};

export default c01;
