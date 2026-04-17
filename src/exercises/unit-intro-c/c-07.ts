import { Exercise } from '../types';

const c07: Exercise = {
  id: 'c-07',
  unitId: 'unit-intro-c',
  title: '07: Common Pitfalls',
  desc: '<b>Goal:</b> See the most common memory bugs in C -- the same bugs that attackers exploit in real software.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    int secret = 0x42;', cls: 'highlight' },
      { text: '    char buf[8];', cls: 'highlight' },
      { text: '    // buf is 8 bytes, but we write 16!', cls: 'cmt' },
      { text: '    strcpy(buf, "AAAAAAAAAAAAAAAA");', cls: 'highlight vuln' },
      { text: '    printf("secret = 0x%x\\n", secret);', cls: '' },
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
      srcLine: 4,
      log: ['info', 'We declare int secret = 0x42, then char buf[8]. On the stack, secret sits right after buf in memory. The layout is: [buf - 8 bytes] [secret - 4 bytes] [saved base pointer] [return address].'],
    },
    {
      action: 'init',
      srcLine: 7,
      log: ['warn', 'strcpy(buf, "AAAAAAAAAAAAAAAA") copies 16 bytes (16 A characters + a null terminator) into buf, which is only 8 bytes. strcpy does not check the destination size -- it just keeps copying until it hits the null byte in the source string.'],
    },
    {
      action: 'init',
      log: ['warn', 'The first 8 bytes of "A"s fill buf correctly. But bytes 9-16 overflow past buf and overwrite whatever comes next -- in this case, the variable secret gets overwritten with 0x41414141 (AAAA in ASCII).'],
    },
    {
      action: 'init',
      log: ['info', 'This is a buffer overflow. The safer alternative is strncpy(buf, src, 8), which limits the copy to at most 8 bytes. Modern code should use strlcpy or snprintf instead of strcpy entirely.'],
    },
    {
      action: 'init',
      log: ['warn', 'Other common pitfalls: off-by-one errors (writing exactly 1 byte past the end), dangling pointers (using memory after free), and double-free (freeing the same pointer twice). Each of these creates opportunities for attackers.'],
    },
    {
      action: 'done',
      log: ['success', 'C trusts the programmer to get sizes right, and it never checks. When the programmer gets it wrong, adjacent memory is corrupted. This is not a theoretical problem -- buffer overflows in strcpy and gets have caused countless real-world security breaches.'],
    },
  ],
  check() { return false; },
  winTitle: 'Pitfalls Identified!',
  winMsg: 'You learned about the most common memory bugs in C and why they are dangerous.',
};

export default c07;
