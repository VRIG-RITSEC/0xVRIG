import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'gap-112',
  unitId: 'unit20-teaching-gaps',
  title: '112: TOCTOU Race Condition',
  desc: '<b>Goal:</b> Understand Time-of-Check to Time-of-Use (TOCTOU) race conditions. A privileged program checks file permissions with <code>access()</code>, then opens the file with <code>open()</code>. Between these two calls, an attacker can swap the file with a symlink to a sensitive target. This is a classic race condition attack.',
  source: {
    c: [
      { text: '// TOCTOU: access() then open()', cls: 'cmt' },
      { text: '#include <unistd.h>', cls: '' },
      { text: '#include <fcntl.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void read_file(char *path) {', cls: '' },
      { text: '    // CHECK: does user own the file?', cls: 'cmt' },
      { text: '    if (access(path, R_OK) == 0) {', cls: 'highlight' },
      { text: '        /* RACE WINDOW */', cls: 'highlight vuln' },
      { text: '        // USE: open and read it', cls: 'cmt' },
      { text: '        int fd = open(path, O_RDONLY);', cls: 'highlight vuln' },
      { text: '        read(fd, buf, sizeof(buf));', cls: '' },
      { text: '    }', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Attacker (in parallel):', cls: 'cmt' },
      { text: '// while true; do', cls: 'cmt' },
      { text: '//   ln -sf /etc/shadow userfile', cls: 'cmt highlight vuln' },
      { text: '//   ln -sf owned.txt userfile', cls: 'cmt' },
      { text: '// done', cls: 'cmt' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 16,
  steps: [
    {
      action: 'init',
      log: ['info', 'TOCTOU (Time-of-Check to Time-of-Use) is a race condition where the state checked by a security decision can change before it\'s used. The gap between <code>access()</code> and <code>open()</code> is the <strong>race window</strong>.'],
    },
    {
      log: ['action', '<strong>access("userfile", R_OK)</strong> — the kernel checks: does the <em>real</em> UID have read permission on "userfile"? The file currently points to the attacker\'s owned file, so access() returns 0 (success).'],
      srcLine: 6,
    },
    {
      log: ['error', '<strong>RACE WINDOW!</strong> Between access() returning and open() being called, the attacker\'s script swaps the symlink: <code>ln -sf /etc/shadow userfile</code>. The filename hasn\'t changed, but what it points to has.'],
      srcLine: 7,
    },
    {
      log: ['action', '<strong>open("userfile", O_RDONLY)</strong> — the program opens the file. But "userfile" now points to <code>/etc/shadow</code>. Since this is a setuid program, open() uses the <em>effective</em> UID (root), and succeeds. The program reads /etc/shadow into buf.'],
      srcLine: 9,
    },
    {
      log: ['success', 'The attacker read /etc/shadow! <strong>Defense:</strong> use <code>open()</code> first (gets an fd), then <code>fstat()</code> on the fd to check ownership — the fd is bound to the inode, immune to symlink swaps. Or use <code>O_NOFOLLOW</code> to refuse symlinks.'],
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Race Won!',
  winMsg: 'TOCTOU races exploit the gap between security checks and operations. Use fd-based checks (fstat, fchmod) instead of path-based checks (access, stat) to prevent them.',
};

export default exercise;
