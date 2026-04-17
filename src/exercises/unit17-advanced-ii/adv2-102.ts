import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// Data-Oriented Programming (DOP): Turing-complete computation using
// only legitimate data operations on corrupted memory.
// Unlike ROP (which chains code pointer redirections), DOP chains
// data-only "gadgets" — memory loads, stores, adds, and conditional
// operations that the program already performs in its normal code.
//
// The attacker corrupts a data structure (e.g., a linked list of
// "operation" records) so that the program's normal processing loop
// performs arbitrary computation without ever modifying a code pointer.
//
// DOP gadget types (all via normal program operations on corrupted data):
// - LOAD:  mov eax, [edx]           (read from attacker-chosen address)
// - STORE: mov [edx], eax           (write to attacker-chosen address)
// - ADD:   add eax, ebx             (arithmetic on loaded values)
// - CMP/BRANCH: cmp eax, ebx; jne   (conditional on corrupted data)

const instructions: AsmInstruction[] = [
  // Simulated DOP loop: processes a linked list of "operation" records
  // Each record has: {type, src_addr, dst_addr, next}
  // The attacker corrupts the linked list to perform arbitrary ops
  { addr: 0x08048000, bytes: [0xbb, 0x00, 0xa0, 0x04, 0x08], mnemonic: 'mov', operands: 'ebx, 0x0804a000', comment: 'ebx = ptr to first operation record (corrupted)' },

  // Loop: process_record:
  { addr: 0x08048005, bytes: [0x8b, 0x03], mnemonic: 'mov', operands: 'eax, [ebx]', comment: 'DOP LOAD: read op.type from corrupted record' },
  { addr: 0x08048007, bytes: [0x8b, 0x53, 0x04], mnemonic: 'mov', operands: 'edx, [ebx+4]', comment: 'DOP LOAD: read op.src_addr (attacker-controlled)' },
  { addr: 0x0804800a, bytes: [0x8b, 0x4b, 0x08], mnemonic: 'mov', operands: 'ecx, [ebx+8]', comment: 'DOP LOAD: read op.dst_addr (attacker-controlled)' },

  // Dispatch based on type
  { addr: 0x0804800d, bytes: [0x83, 0xf8, 0x01], mnemonic: 'cmp', operands: 'eax, 1', comment: 'Is op.type == LOAD (1)?' },
  { addr: 0x08048010, bytes: [0x75, 0x04], mnemonic: 'jne', operands: '0x08048016', comment: 'If not LOAD, try next type' },
  { addr: 0x08048012, bytes: [0x8b, 0x02], mnemonic: 'mov', operands: 'eax, [edx]', comment: 'DOP LOAD gadget: read [src_addr] into eax' },
  { addr: 0x08048014, bytes: [0x89, 0x01], mnemonic: 'mov', operands: '[ecx], eax', comment: 'DOP STORE gadget: write eax to [dst_addr]' },

  // Advance to next record in corrupted chain
  { addr: 0x08048016, bytes: [0x8b, 0x5b, 0x0c], mnemonic: 'mov', operands: 'ebx, [ebx+12]', comment: 'ebx = op.next (follow corrupted linked list)' },
  { addr: 0x08048019, bytes: [0x85, 0xdb], mnemonic: 'test', operands: 'ebx, ebx', comment: 'Is next == NULL?' },
  { addr: 0x0804801b, bytes: [0x75, 0xe8], mnemonic: 'jne', operands: '0x08048005', comment: 'If not NULL, process next record (loop)' },
  { addr: 0x0804801d, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: 'End of processing loop' },
];

export const adv2102: Exercise = {
  id: 'adv2-102',
  unitId: 'unit17-advanced-ii',
  title: '102: Data-Oriented Programming (DOP)',
  desc: '<b>Goal:</b> Understand Data-Oriented Programming — Turing-complete exploitation without modifying any code pointer. Unlike ROP (which hijacks the return address to chain gadgets), DOP corrupts <strong>non-control data</strong> to make the program\'s own legitimate loops perform attacker-chosen computation. A typical DOP target is a loop that processes records from a data structure (linked list, array of operations). The attacker overflows into that data structure, replacing the records with a chain of "DOP gadgets": <br>- <strong>LOAD</strong>: read from an attacker-chosen address <br>- <strong>STORE</strong>: write to an attacker-chosen address <br>- <strong>ADD/SUB</strong>: arithmetic on loaded values <br>- <strong>CMP/BRANCH</strong>: conditional execution based on corrupted data. <br>The original program code remains unmodified — the CPU follows legitimate control flow through the loop. CFI, stack canaries, and shadow stacks see nothing wrong. DOP was proven Turing-complete by Hu et al. (2016), meaning any computation (including full shellcode-equivalent behavior) can be expressed purely through data corruption.',
  source: {
    c: [
      { text: '// Data-Oriented Programming (DOP)', cls: 'comment' },
      { text: '// The program processes a linked list of operations', cls: 'comment' },
      { text: 'struct op { int type; void *src; void *dst; struct op *next; };', cls: '' },
      { text: '', cls: '' },
      { text: 'void process(struct op *head) {', cls: '' },
      { text: '    struct op *cur = head;', cls: '' },
      { text: '    while (cur != NULL) {', cls: '' },
      { text: '        if (cur->type == LOAD)', cls: 'highlight' },
      { text: '            *(int*)cur->dst = *(int*)cur->src;', cls: 'highlight vuln' },
      { text: '        else if (cur->type == ADD)', cls: '' },
      { text: '            *(int*)cur->dst += *(int*)cur->src;', cls: 'highlight vuln' },
      { text: '        cur = cur->next;', cls: '' },
      { text: '    }', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Attacker corrupts the linked list:', cls: 'comment' },
      { text: '// Each "op" record = one DOP gadget', cls: 'comment' },
      { text: '// LOAD, STORE, ADD, CMP are all available', cls: 'comment' },
      { text: '// Result: arbitrary read/write without', cls: 'comment' },
      { text: '//         touching any code pointer!', cls: 'comment' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    {
      question: 'Is DOP Turing-complete without modifying any code pointer? (1=yes, 0=no)',
      answer: 1,
      format: 'decimal',
      hint: 'Hu et al. (2016) proved DOP is Turing-complete. LOAD, STORE, ADD, and conditional branch gadgets — all using legitimate program instructions on corrupted data — are sufficient for arbitrary computation.',
    },
    {
      question: 'In the DOP loop, the instruction at 0x08048012 reads from [edx] where edx is attacker-controlled. This implements which DOP operation? (1=LOAD, 2=STORE, 3=ADD)',
      answer: 1,
      format: 'decimal',
      hint: 'mov eax, [edx] reads a value from an attacker-chosen address into eax. This is a LOAD gadget — the attacker controls WHAT gets read and from WHERE.',
    },
    {
      question: 'Does Control-Flow Integrity (CFI) detect a DOP attack? (1=yes, 0=no)',
      answer: 0,
      format: 'decimal',
      hint: 'CFI validates that indirect branches target legitimate code. DOP never modifies control flow — the CPU follows the normal loop. All branches go to intended targets. CFI sees nothing anomalous.',
    },
  ],
  check: () => false,
  winTitle: 'DOP Attack Mastered!',
  winMsg: 'Data-Oriented Programming achieves arbitrary computation without corrupting a single code pointer. The program follows its intended control flow while operating on attacker-corrupted data. This defeats CFI, stack canaries, shadow stacks, and all control-flow-only defenses. Only Data-Flow Integrity (DFI) or memory safety can fully prevent DOP.',
};
