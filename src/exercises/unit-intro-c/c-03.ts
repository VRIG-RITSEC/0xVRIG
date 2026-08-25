import { Exercise } from '../types';

const c03: Exercise = {
  id: 'c-03',
  unitId: 'unit-intro-c',
  title: '03: Arrays & Strings',
  desc: '<b>Goal:</b> See how arrays and strings are stored in memory, and why C does not prevent you from going past the end.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char name[8] = "Alice";', cls: 'highlight' },
      { text: '    char buf[8];', cls: 'highlight' },
      { text: '    // Memory layout:', cls: 'cmt' },
      { text: '    // name: [A][l][i][c][e][\\0][ ][ ]', cls: 'cmt' },
      { text: '    // buf:  [ ][ ][ ][ ][ ][ ][ ][ ]', cls: 'cmt' },
      { text: '    name[7] = \'Z\';', cls: '' },
      { text: '    name[10] = \'!\';  // out of bounds!', cls: 'highlight vuln' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 32,
  steps: [
    {
      action: 'init',
      srcLine: 4,
      log: ['info', 'char name[8] declares an array of 8 bytes. The string "Alice" fills the first 5 bytes with the ASCII values for A, l, i, c, e. The 6th byte is automatically set to 0x00 -- the "null terminator" -- which marks the end of the string.'],
      vizAction: (sim: any) => { if (!sim) return; sim.clearBlank(); sim.writeWord(0, [0x41, 0x6C, 0x69, 0x63, 0x65, 0x00]); sim.markRegion(0, 8); },
    },
    {
      action: 'init',
      srcLine: 5,
      log: ['info', 'char buf[8] creates another 8-byte block. Elements within a single array are always contiguous in C. However, the compiler decides where to place separate local variables -- in this simplified model they happen to be adjacent, but that is not guaranteed by the language.'],
      vizAction: (sim: any) => { if (!sim) return; sim.markRegion(8, 16); },
    },
    {
      action: 'init',
      log: ['info', 'The null terminator (0x00) is how C knows where a string ends. Functions like printf and strlen scan forward byte by byte until they hit 0x00. If that byte is missing or overwritten, the function will keep reading into whatever memory comes next.'],
      vizAction: (sim: any) => { if (!sim) return; sim.markRegion(5, 6); },
    },
    {
      action: 'init',
      srcLine: 9,
      log: ['info', 'name[7] = \'Z\' is fine -- index 7 is the last valid position in an 8-element array (indices 0 through 7). This writes one byte within bounds.'],
      vizAction: (sim: any) => { if (!sim) return; sim.writeWord(7, [0x5A]); sim.markRegion(7, 8); },
    },
    {
      action: 'init',
      srcLine: 10,
      log: ['warn', 'name[10] = \'!\' is OUT OF BOUNDS. Index 10 is past the end of the 8-byte array. But C does not check! It happily writes to whatever memory is 10 bytes past the start of name. This could overwrite data belonging to buf or other variables.'],
      vizAction: (sim: any) => { if (!sim) return; sim.writeWord(10, [0x21]); sim.markRegion(8, 16); },
    },
    {
      action: 'done',
      log: ['success', 'C arrays have no bounds checking. Writing past the end of an array overwrites whatever happens to be next in memory. This is the fundamental reason buffer overflows exist -- and it is exactly what attackers exploit.'],
    },
  ],
  check() { return false; },
  winTitle: 'Arrays & Strings!',
  winMsg: 'You learned how C arrays work and why they are vulnerable to out-of-bounds access.',
};

export default c03;
