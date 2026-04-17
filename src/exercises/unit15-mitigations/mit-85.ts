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
  mode: 'step',
  vizMode: 'stack',
  bufSize: 32,
  steps: [
    {
      action: 'init',
      log: ['info', 'Intel CET (Control-flow Enforcement Technology) adds two hardware mechanisms: Shadow Stacks (SHSTK) for backward-edge protection and Indirect Branch Tracking (IBT) for forward-edge protection. Both are enforced by the CPU, not software -- violations raise a #CP (Control Protection) exception.'],
    },
    {
      action: 'init', srcLine: 5,
      log: ['action', 'Shadow Stack (SHSTK): on every CALL instruction, the CPU pushes the return address to both the regular stack AND a separate shadow stack. The shadow stack lives in special memory pages (marked with a new page table flag) that only CALL/RET can write to -- regular MOV/PUSH cannot modify it.'],
    },
    {
      action: 'init', srcLine: 10,
      log: ['action', 'On RET: the CPU pops the return address from both stacks and compares them. If they match, execution continues normally. If an attacker has overwritten the return address on the regular stack (via buffer overflow), it won\'t match the shadow stack copy. The CPU raises #CP and the process is terminated.'],
    },
    {
      action: 'init',
      log: ['warn', 'Attack scenario: attacker overflows a buffer and overwrites the return address on the regular stack from 0x401020 to 0x414141. On RET, the CPU compares: regular stack = 0x414141, shadow stack = 0x401020. Mismatch detected -- #CP fault. ROP chains are blocked because every RET in the chain would fail this check.'],
    },
    {
      action: 'init', srcLine: 16,
      log: ['action', 'Indirect Branch Tracking (IBT): the CPU sets a state machine flag after every indirect CALL or JMP. The next instruction MUST be ENDBR64 (or ENDBR32). If it\'s anything else, the CPU raises #CP. The compiler inserts ENDBR64 at the start of every function that might be called indirectly.'],
    },
    {
      action: 'init',
      log: ['info', 'IBT and ROP: a ROP gadget typically starts in the middle of a function (not at ENDBR64). With IBT, the first indirect jump in a ROP chain would land at a non-ENDBR64 instruction and trigger #CP. This dramatically reduces the usable gadget space -- only function entries are valid targets.'],
    },
    {
      action: 'done',
      log: ['success', 'Intel CET: SHSTK hardware-validates return addresses (blocks ROP), IBT requires ENDBR64 at indirect branch targets (blocks JOP and reduces gadgets). Both enforced by CPU with #CP exceptions. Supported in Windows 11 and Linux 5.18+. The strongest hardware CFI currently deployed.'],
    },
  ],
  check() { return false; },
  winTitle: 'CET Mastered!',
  winMsg: 'You understand Intel CET: shadow stacks that hardware-validate return addresses against tampering, and Indirect Branch Tracking that requires ENDBR64 at every valid indirect call/jump target.',
};

export default exercise;
