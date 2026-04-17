import { Exercise } from '../types';

const c08: Exercise = {
  id: 'c-08',
  unitId: 'unit-intro-c',
  title: '08: Spot the Bug',
  desc: '<b>Goal:</b> Read a short C program, find the vulnerability, and understand what an attacker could do with it.',
  source: {
    c: [
      { text: '#include <stdio.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void check_password() {', cls: '' },
      { text: '    int authorized = 0;', cls: 'highlight' },
      { text: '    char input[16];', cls: 'highlight' },
      { text: '    printf("Enter password: ");', cls: '' },
      { text: '    gets(input);', cls: 'highlight vuln' },
      { text: '    if (strcmp(input, "s3cret") == 0)', cls: '' },
      { text: '        authorized = 1;', cls: '' },
      { text: '    if (authorized)', cls: 'highlight' },
      { text: '        printf("Access granted!\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    check_password();', cls: '' },
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
      log: ['info', 'This program asks for a password and checks it against "s3cret." If the password matches, it sets authorized = 1. Looks reasonable, right? Let\'s examine it more carefully.'],
    },
    {
      action: 'init',
      srcLine: 4,
      log: ['info', 'On the stack, authorized (4 bytes) sits right after input (16 bytes). The layout is: [input - 16 bytes] [authorized - 4 bytes] [saved base pointer] [return address].'],
    },
    {
      action: 'init',
      srcLine: 7,
      log: ['warn', 'There it is: gets(input). The function gets() reads from the keyboard until a newline, with NO limit on how many bytes it reads. If the user types more than 16 characters, the extra bytes overflow past input and overwrite whatever comes next.'],
    },
    {
      action: 'init',
      log: ['warn', 'Attack 1: Type 16 garbage characters followed by any non-zero byte. The overflow overwrites authorized with a non-zero value, so the "if (authorized)" check passes -- access is granted without knowing the password.'],
    },
    {
      action: 'init',
      log: ['warn', 'Attack 2: Type even more characters to overwrite past authorized, past the saved base pointer, and into the return address. By crafting the right bytes, the attacker can redirect the program to execute any code they want.'],
    },
    {
      action: 'done',
      log: ['success', 'The gets() function is so dangerous that modern compilers warn against it, and it was actually removed from the C standard in 2011. In the units ahead, you will learn to exploit exactly this kind of vulnerability -- overwriting the return address to hijack program execution.'],
    },
  ],
  check() { return false; },
  winTitle: 'Bug Spotted!',
  winMsg: 'You can identify a classic buffer overflow vulnerability. You are ready for the exploitation units!',
};

export default c08;
