import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'gap-115',
  unitId: 'unit20-teaching-gaps',
  title: '115: Uninitialized Memory Leak',
  desc: '<b>Goal:</b> Uninitialized stack and heap memory can contain sensitive data from previous function calls or freed allocations. This exercise demonstrates how reading uninitialized buffers can leak canaries, pointers, and other secrets — a stepping stone for full exploitation.',
  source: {
    c: [
      { text: '// Uninitialized memory info leak', cls: 'cmt' },
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void setup() {', cls: '' },
      { text: '    char secret[32];', cls: '' },
      { text: '    memcpy(secret, canary, 4);', cls: 'highlight' },
      { text: '    memcpy(secret+4, &libc_addr, 4);', cls: 'highlight' },
      { text: '    // returns — secret stays on stack', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'void leak() {', cls: '' },
      { text: '    char buf[32]; // NOT zeroed!', cls: 'highlight vuln' },
      { text: '    // buf overlaps setup()\'s stack frame', cls: 'cmt' },
      { text: '    write(1, buf, 32);', cls: 'highlight vuln' },
      { text: '    // Leaks whatever setup() left behind', cls: 'cmt' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    setup();', cls: '' },
      { text: '    leak();  // prints canary + libc addr!', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 32,
  steps: [
    {
      action: 'init',
      log: ['info', 'The C language does NOT zero-initialize local variables. When a function returns, its stack frame is abandoned but <strong>not wiped</strong>. The next function call reuses the same stack memory — and inherits whatever data was left behind.'],
    },
    {
      log: ['action', '<strong>setup()</strong> runs first. It writes the canary and a libc address into its local buffer <code>secret[32]</code>. When setup() returns, the stack pointer moves back, but the data remains in memory.'],
      srcLine: 6,
    },
    {
      log: ['action', '<strong>leak()</strong> runs next. Its local buffer <code>buf[32]</code> is allocated at the same stack position as setup()\'s <code>secret[32]</code>. Since buf is not initialized, it contains setup()\'s leftover data — the canary and libc address!'],
      srcLine: 12,
    },
    {
      log: ['action', '<code>write(1, buf, 32)</code> sends the raw buffer contents to stdout. The attacker receives the canary value and a libc pointer — two critical leaks from a single uninitialized read.'],
      srcLine: 14,
    },
    {
      log: ['success', 'Uninitialized memory leaks are common in real code. <strong>Heap variant:</strong> freed chunks retain user data. <code>malloc(32)</code> followed by <code>read()</code> without zeroing can leak data from the previous allocation. <strong>Defense:</strong> always initialize buffers (<code>= {0}</code>, <code>memset</code>), use <code>-ftrivial-auto-var-init=zero</code> (GCC 12+/Clang).'],
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Memory Leaked!',
  winMsg: 'Uninitialized stack/heap memory preserves data from previous uses. Always zero-initialize sensitive buffers, or use compiler flags to auto-initialize locals.',
};

export default exercise;
