import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'mit-84',
  unitId: 'unit15-mitigations',
  title: '84: CFI',
  desc: '<b>Goal:</b> Understand Control Flow Integrity. CFI validates that indirect branches (calls through function pointers, virtual calls, returns) transfer control only to <strong>legitimate targets</strong>. <strong>Forward-edge CFI</strong> checks indirect call/jump targets. <strong>Backward-edge CFI</strong> (shadow call stacks) validates return addresses. Together they block ROP and vtable hijacking.',
  source: {
    c: [
      { text: '// Control Flow Integrity (CFI)', cls: 'cmt' },
      { text: '// Forward-edge: indirect call validation', cls: 'cmt' },
      { text: '// Backward-edge: return address validation', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// Without CFI:', cls: 'cmt' },
      { text: 'void (*fptr)(int) = target;', cls: '' },
      { text: 'fptr(42);  // calls whatever fptr points to', cls: 'highlight vuln' },
      { text: '', cls: '' },
      { text: '// With CFI (Clang -fsanitize=cfi):', cls: 'cmt' },
      { text: 'void (*fptr)(int) = target;', cls: '' },
      { text: '// Check: is fptr a valid (int)->void ?', cls: 'cmt' },
      { text: '__cfi_check(fptr, type_id);', cls: 'highlight' },
      { text: 'fptr(42);  // only if check passes', cls: '' },
      { text: '', cls: '' },
      { text: '// Shadow call stack (backward-edge):', cls: 'cmt' },
      { text: '// CALL: push ret addr to both stacks', cls: 'cmt' },
      { text: '// RET: compare return addr vs shadow', cls: 'cmt' },
    ],
  },
  mode: 'step',
  vizMode: 'stack',
  bufSize: 32,
  steps: [
    {
      action: 'init',
      log: ['info', 'CFI (Control Flow Integrity) restricts where indirect branches can go. Without CFI, overwriting a function pointer or return address lets you jump anywhere. With CFI, each indirect branch is validated against a set of allowed targets determined at compile time.'],
    },
    {
      action: 'init', srcLine: 6,
      log: ['action', 'Forward-edge CFI: before an indirect call (call *fptr), the compiler inserts a runtime check. It verifies that fptr points to a function with the correct type signature. Clang\'s CFI uses type metadata tables -- each valid call target has an entry. Invalid targets cause an abort.'],
    },
    {
      action: 'init', srcLine: 11,
      log: ['info', 'Example: fptr is declared as void (*)(int). CFI checks that the target address is in the set of all functions with signature void(int). If an attacker overwrites fptr to point to system() (which is int(const char*)), the type check fails and the program aborts.'],
    },
    {
      action: 'init',
      log: ['warn', 'CFI limitation: if two functions share the same type signature, CFI cannot distinguish them. An attacker who can redirect void(*)(int) to any other void(int) function still has options. Finer-grained CFI narrows the target set, but perfect precision is undecidable in general.'],
    },
    {
      action: 'init', srcLine: 15,
      log: ['action', 'Backward-edge CFI: protects return addresses. A shadow call stack (separate, protected memory region) stores a copy of each return address on CALL. On RET, the CPU or runtime compares the return address on the regular stack with the shadow stack copy. A mismatch means corruption -- abort.'],
    },
    {
      action: 'done',
      log: ['success', 'CFI summary: forward-edge validates indirect call/jump targets against compile-time type information. Backward-edge (shadow stacks) validates return addresses. Together they block vtable hijacking, function pointer overwrites, and ROP chains. Bypass requires data-only attacks that don\'t corrupt control flow.'],
    },
  ],
  check() { return false; },
  winTitle: 'CFI Explored!',
  winMsg: 'You understand forward-edge CFI (indirect call validation by type), backward-edge CFI (shadow call stacks for return addresses), and their limitations against same-type and data-only attacks.',
};

export default exercise;
