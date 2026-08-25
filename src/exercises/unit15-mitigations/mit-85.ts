import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'mit-85',
  unitId: 'unit15-mitigations',
  title: '85: Intel CET & Shadow Stacks',
  desc: '<b>Goal:</b> Understand Intel Control-flow Enforcement Technology. CET has two components: <strong>Shadow Stacks (SHSTK)</strong> that hardware-validate return addresses, and <strong>Indirect Branch Tracking (IBT)</strong> that requires <code>ENDBR64</code> at every valid indirect branch target. Together they provide hardware-enforced CFI without the overhead of software checks.',
  source: {
    c: [
      { text: '// Intel CET: hardware CFI', cls: 'cmt' },
      { text: '// SHSTK: shadow stack for return addrs', cls: 'cmt' },
      { text: '// IBT: indirect branch tracking', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// Normal CALL with CET:', cls: 'cmt' },
      { text: 'CALL target', cls: 'highlight' },
      { text: '  // push ret_addr to regular stack', cls: 'cmt' },
      { text: '  // push ret_addr to shadow stack', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// Normal RET with CET:', cls: 'cmt' },
      { text: 'RET', cls: 'highlight' },
      { text: '  // pop ret_addr from regular stack', cls: 'cmt' },
      { text: '  // pop shadow_ret from shadow stack', cls: 'cmt' },
      { text: '  // if ret_addr != shadow_ret -> #CP', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// IBT: indirect call/jmp targets must', cls: 'cmt' },
      { text: '// start with ENDBR64', cls: 'cmt' },
      { text: 'ENDBR64  ; valid target marker', cls: 'highlight' },
    ],
  },
  protections: [{ name: 'CET', status: 'active' }, { name: 'Shadow Stack', status: 'active' }],
  mode: 'step',
  vizMode: 'stack',
  auxViz: ['shadow-stack'],
  bufSize: 32,
  steps: [
    {
      action: 'init',
      log: ['info', 'Intel CET (Control-flow Enforcement Technology) adds two hardware mechanisms: Shadow Stacks (SHSTK) for backward-edge protection and Indirect Branch Tracking (IBT) for forward-edge protection. Both are enforced by the CPU, not software -- violations raise a #CP (Control Protection) exception.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearBlank();
        sim.clearHighlight();
        if (aux) {
          aux.clearAll();
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00401020, shadowRet: 0x00401020, mismatch: false },
          ]);
        }
      },
    },
    {
      action: 'init', srcLine: 5,
      log: ['action', 'Shadow Stack (SHSTK): on every CALL instruction, the CPU pushes the return address to both the regular stack AND a separate shadow stack. The shadow stack lives in special memory pages (marked with a new page table flag) that only CALL/RET can write to -- regular MOV/PUSH cannot modify it.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Write legit return address in the normal ret addr area
        const retOffset = sim.bufSize + sim.canarySize + sim.ebpSize;
        sim._writeLE(retOffset, 0x00401020, sim.retSize);
        sim.markRegion(retOffset, retOffset + sim.retSize);
        // Write shadow copy in the buffer area to simulate shadow stack
        sim._writeLE(0, 0x00401020, 4);  // shadow stack copy (same value)
        sim.writeWord(0, [0x20, 0x10, 0x40, 0x00]);
        sim.markRegion(0, 4);
        if (aux) {
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00401020, shadowRet: 0x00401020, mismatch: false },
          ]);
        }
      },
    },
    {
      action: 'init', srcLine: 10,
      log: ['action', 'On RET: the CPU pops the return address from both stacks and compares them. If they match, execution continues normally. If an attacker has overwritten the return address on the regular stack (via buffer overflow), it won\'t match the shadow stack copy. The CPU raises #CP and the process is terminated.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Both stacks match -- show matching addresses highlighted
        const retOffset = sim.bufSize + sim.canarySize + sim.ebpSize;
        sim.markRegion(retOffset, retOffset + sim.retSize);
        sim.markRegion(0, 4);
        if (aux) {
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00401020, shadowRet: 0x00401020, mismatch: false },
          ]);
        }
      },
    },
    {
      action: 'init',
      log: ['warn', 'Attack scenario: attacker overflows a buffer and overwrites the return address on the regular stack from 0x401020 to 0x414141. On RET, the CPU compares: regular stack = 0x414141, shadow stack = 0x401020. Mismatch detected -- #CP fault. ROP chains are blocked because every RET in the chain would fail this check.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Attacker overwrites the real return address
        const retOffset = sim.bufSize + sim.canarySize + sim.ebpSize;
        sim._writeLE(retOffset, 0x00414141, sim.retSize);  // corrupted!
        sim.markRegion(retOffset, retOffset + sim.retSize);
        // Shadow stack still has original value
        sim._writeLE(0, 0x00401020, 4);  // shadow copy unchanged
        sim.writeWord(0, [0x20, 0x10, 0x40, 0x00]);
        sim.markRegion(0, 4);
        if (aux) {
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00414141, shadowRet: 0x00401020, mismatch: true },
          ]);
        }
      },
    },
    {
      action: 'init', srcLine: 16,
      log: ['action', 'Indirect Branch Tracking (IBT): the CPU sets a state machine flag after every indirect CALL or JMP. The next instruction MUST be ENDBR64 (or ENDBR32). If it\'s anything else, the CPU raises #CP. The compiler inserts ENDBR64 at the start of every function that might be called indirectly.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearHighlight();
        // Show ENDBR64 marker bytes at the start of the buffer to illustrate valid target
        sim.writeWord(8, [0xf3, 0x0f, 0x1e, 0xfa]);  // endbr64 opcode
        sim.markRegion(8, 12);
        if (aux) {
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00401020, shadowRet: 0x00401020, mismatch: false },
          ]);
        }
      },
    },
    {
      action: 'init',
      log: ['info', 'IBT and JOP: IBT blocks Jump-Oriented Programming (JOP) by requiring ENDBR64 at every indirect call/jump target. An attacker who hijacks a function pointer to point mid-function will trigger #CP. Shadow stacks block ROP (every RET is validated); IBT blocks JOP (every indirect CALL/JMP is validated). Together they cover both forward and backward edges.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearHighlight();
        if (aux) {
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00401020, shadowRet: 0x00401020, mismatch: false },
          ]);
        }
      },
    },
    {
      action: 'done',
      log: ['success', 'Intel CET: SHSTK hardware-validates return addresses (blocks ROP), IBT requires ENDBR64 at indirect branch targets (blocks JOP and reduces gadgets). Both enforced by CPU with #CP exceptions. Supported in Windows 11 and Linux 6.6+ (user-space shadow stacks). The strongest hardware CFI currently deployed.'],
      vizAction: (sim: any, heap: any, aux?: any) => {
        if (!sim) return;
        sim.clearHighlight();
        if (aux) {
          aux.setShadow([
            { addr: 0x00700000, realRet: 0x00401020, shadowRet: 0x00401020, mismatch: false },
          ]);
        }
      },
    },
  ],
  check() { return false; },
  winTitle: 'CET Mastered!',
  winMsg: 'You understand Intel CET: shadow stacks that hardware-validate return addresses against tampering, and Indirect Branch Tracking that requires ENDBR64 at every valid indirect call/jump target.',
};

export default exercise;
