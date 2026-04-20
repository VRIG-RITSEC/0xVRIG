import { Exercise } from '../types';

export const win41: Exercise = {
  id: 'win-41',
  unitId: 'unit8-win-stack',
  title: '41: SafeSEH Bypass',
  desc: 'SafeSEH validates handlers against a compile-time table. But the stack overflow still works! This exercise has a <b>stack canary</b> protecting the buffer — you need to preserve the canary value (shown in the symbol table) while overwriting the return address. Like bypassing SafeSEH by keeping protections intact.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// SafeSEH + Stack Canary', cls: 'comment' },
      { text: '// Must preserve canary while overwriting ret', cls: 'comment' },
      { text: '', cls: '' },
      { text: 'void win() { system("cmd"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    // canary check before return', cls: 'cmt' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  canary: true,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.canaryIntact() && sim.getRetAddr() === symbols.win;
  },
  winTitle: 'SafeSEH Bypassed!',
  winMsg: 'You preserved the canary while redirecting execution — like bypassing SafeSEH validation by keeping the protection data intact.',
};
