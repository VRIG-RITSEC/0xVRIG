import { Exercise } from '../types';

const c05: Exercise = {
  id: 'c-05',
  unitId: 'unit-intro-c',
  title: '05: Structs & Memory Layout',
  desc: '<b>Goal:</b> See how struct fields are arranged sequentially in memory and accessed via offsets.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'struct Player {', cls: '' },
      { text: '    int hp;        // offset 0, 4 bytes', cls: 'highlight' },
      { text: '    int score;     // offset 4, 4 bytes', cls: 'highlight' },
      { text: '    char name[8];  // offset 8, 8 bytes', cls: 'highlight' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    struct Player p;', cls: '' },
      { text: '    p.hp = 100;', cls: '' },
      { text: '    p.score = 0;', cls: '' },
      { text: '    strcpy(p.name, "Alice");', cls: '' },
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
      log: ['info', 'A struct lets you group related data together under one name. In memory, the fields are laid out one after another in the order you declare them -- no magic, just consecutive bytes.'],
    },
    {
      action: 'init',
      srcLine: 3,
      log: ['info', 'int hp sits at the very start of the struct (offset 0). It takes 4 bytes. So bytes 0-3 of the struct belong to hp.'],
    },
    {
      action: 'init',
      srcLine: 4,
      log: ['info', 'int score comes next at offset 4 (right after hp). It also takes 4 bytes, occupying bytes 4-7. The compiler calculates these offsets so it knows exactly where to read or write each field.'],
    },
    {
      action: 'init',
      srcLine: 5,
      log: ['info', 'char name[8] starts at offset 8. It occupies 8 bytes (offsets 8-15). The total struct size is 16 bytes. You can verify this with sizeof(struct Player).'],
    },
    {
      action: 'done',
      log: ['success', 'Struct fields sit at fixed offsets in memory. If you have a pointer to a struct, you can reach any field by adding its offset. Attackers use this knowledge too -- if they can overflow the name field past 8 bytes, they would overwrite whatever sits after the struct in memory.'],
    },
  ],
  check() { return false; },
  winTitle: 'Structs Explored!',
  winMsg: 'You learned how struct fields map to offsets in memory.',
};

export default c05;
