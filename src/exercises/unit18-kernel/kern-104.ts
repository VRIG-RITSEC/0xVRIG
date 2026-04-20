import { Exercise } from '../types';

const kern104: Exercise = {
  id: 'kern-104',
  unitId: 'unit18-kernel',
  title: '104: Kernel Stack Overflow',
  desc: 'A vulnerable <strong>ioctl handler</strong> copies user data into a fixed-size kernel buffer without bounds checking. This is the kernel equivalent of a classic stack overflow. Overflow <code>kbuf[64]</code>, overwrite the saved return address with <code>commit_creds(prepare_kernel_cred(0))</code> to escalate to root. No SMEP, no SMAP, no canary.',
  source: {
    c: [
      { text: '#include <linux/module.h>', cls: '' },
      { text: '#include <linux/fs.h>', cls: '' },
      { text: '#include <linux/uaccess.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// Kernel symbols:', cls: 'cmt' },
      { text: '// commit_creds:         0x08048150', cls: 'cmt highlight' },
      { text: '// prepare_kernel_cred:  0x08048200', cls: 'cmt highlight' },
      { text: '', cls: '' },
      { text: 'static long vuln_ioctl(struct file *f,', cls: '', fn: true },
      { text: '    unsigned int cmd, unsigned long arg) {', cls: '' },
      { text: '    char kbuf[64];', cls: 'highlight' },
      { text: '    // BUG: no size check on user input', cls: 'cmt' },
      { text: '    copy_from_user(kbuf, (void*)arg, 256);', cls: 'highlight vuln' },
      { text: '    // kbuf is only 64 bytes but we copy 256!', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Attacker goal: overflow kbuf to overwrite', cls: 'cmt' },
      { text: '// the return address with commit_creds addr', cls: 'cmt' },
      { text: '// When ioctl returns, kernel jumps to', cls: 'cmt' },
      { text: '// commit_creds -> privilege escalation', cls: 'cmt' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 64,
  canary: false,
  aslr: false,
  showSymbols: true,
  showBuilder: true,
  showCalc: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{kernel_stack_smash}',
  winMsg: 'You overflowed the kernel stack buffer and overwrote the return address with commit_creds. When the ioctl handler returned, the kernel executed your chosen address, escalating privileges to root. In a real exploit, this would chain prepare_kernel_cred(0) and commit_creds() to get a root shell. Without SMEP/SMAP/canaries, kernel stack overflows are as straightforward as userspace ones.',
  realWorld: 'CVE-2017-11176: A race condition in the Linux kernel mq_notify syscall led to a use-after-free exploitable via kernel stack manipulation for local privilege escalation.',
  protections: [
    { name: 'Stack Canary', status: 'disabled' },
    { name: 'SMEP', status: 'disabled' },
    { name: 'SMAP', status: 'disabled' },
    { name: 'KASLR', status: 'disabled' },
  ],
};

export default kern104;
