import { Exercise } from '../types';

const ex14Srop: Exercise = {
  id: 'stack2-14',
  unitId: 'unit3-stack-ii',
  title: '14: SROP',
  desc: 'Signal Return Oriented Programming \u2014 the ultimate shortcut. When the OS handles a signal, it saves ALL registers on the stack. When the signal handler returns, <strong>sigreturn</strong> restores them. If you build a fake signal frame and call sigreturn, you set <em>every register at once</em> \u2014 including EIP (where to jump). Fill in the frame below and set EIP to <strong>win()</strong>.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <signal.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// sigreturn gadget at 0x080481b0', cls: 'cmt' },
      { text: '// When sigreturn runs, it reads a', cls: 'cmt' },
      { text: '// "signal frame" from the stack and', cls: 'cmt' },
      { text: '// sets ALL registers from it!', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'void win() {', cls: '' },
      { text: '    printf("FLAG{srop}\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    vuln();', cls: '' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: false,
  showSigframe: true,
  aslr: false,
  nx: true,
  srop: true,
  check(_sim, _heap, _symbols, flags) {
    return flags.sropWin === true;
  },
  winTitle: 'FLAG{srop}',
  winMsg: 'You faked a signal frame and used sigreturn to set every register at once! SROP is incredibly powerful \u2014 with one gadget (sigreturn) you can set up any register state you want. It\'s used in advanced exploits when gadgets are scarce.',
};

export default ex14Srop;
