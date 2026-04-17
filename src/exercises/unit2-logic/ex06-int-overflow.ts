import { Exercise } from '../types';

const ex06IntOverflow: Exercise = {
  id: 'logic-06',
  unitId: 'unit2-logic',
  title: '06: Integer Overflow',
  desc: 'The program adds a header size (64) to your input length. But what happens when your number is so big that the addition <strong>wraps around</strong> past the maximum value? The buffer ends up tiny, but the program still reads your full input — overflow!',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void process(unsigned int user_len) {', cls: '', fn: true },
      { text: '    unsigned int total = user_len + 64;', cls: 'highlight vuln' },
      { text: '    char buf[total];', cls: '' },
      { text: '    read_input(buf, user_len);', cls: 'highlight' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    unsigned int len;', cls: '' },
      { text: '    scanf("%u", &len);', cls: '' },
      { text: '    process(len);', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-int-overflow',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  aslr: false,
  intOverflow: true,
  headerSize: 64,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{integer_wrap}',
  winMsg: 'The math wrapped around! A huge number + 64 became a tiny number, so the buffer was too small. Your input overflowed it and hijacked the go-back address. This is how integer overflows lead to memory corruption.',
};

export default ex06IntOverflow;
