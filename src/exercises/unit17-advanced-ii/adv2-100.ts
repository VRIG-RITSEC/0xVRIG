import { Exercise } from '../types';
import { AsmInstruction } from '@/engine/x86/types';

// Sandboxing & Escape: seccomp-bpf syscall filtering
// seccomp-bpf attaches a BPF program that inspects every syscall number.
// The filter can ALLOW, KILL, ERRNO, or TRACE each syscall.
// Bypass strategies:
// 1. Use allowed syscalls creatively (e.g., mprotect + shellcode)
// 2. Exploit 32-bit vs 64-bit syscall number confusion (x32 ABI)
// 3. TOCTOU: race between filter check and syscall execution
// 4. Namespace escapes if seccomp doesn't block unshare/clone

const instructions: AsmInstruction[] = [
  // Attempt a blocked syscall (execve = 0x0b via int 0x80)
  { addr: 0x08048000, bytes: [0xb8, 0x0b, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 11', comment: 'syscall number 11 = execve' },
  { addr: 0x08048005, bytes: [0xbb, 0x00, 0x93, 0x04, 0x08], mnemonic: 'mov', operands: 'ebx, 0x08049300', comment: 'ebx = pointer to "/bin/sh"' },
  { addr: 0x0804800a, bytes: [0x31, 0xc9], mnemonic: 'xor', operands: 'ecx, ecx', comment: 'ecx = NULL (argv)' },
  { addr: 0x0804800c, bytes: [0x31, 0xd2], mnemonic: 'xor', operands: 'edx, edx', comment: 'edx = NULL (envp)' },
  { addr: 0x0804800e, bytes: [0xcd, 0x80], mnemonic: 'nop', operands: '', comment: 'int 0x80 — BLOCKED by seccomp! Process killed with SIGSYS.' },
  // Allowed syscall path: use write(1, ...) to exfiltrate data instead
  { addr: 0x08048010, bytes: [0xb8, 0x04, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'eax, 4', comment: 'syscall number 4 = write (ALLOWED)' },
  { addr: 0x08048015, bytes: [0xbb, 0x01, 0x00, 0x00, 0x00], mnemonic: 'mov', operands: 'ebx, 1', comment: 'fd = 1 (stdout)' },
  { addr: 0x0804801a, bytes: [0xb9, 0x00, 0x93, 0x04, 0x08], mnemonic: 'mov', operands: 'ecx, 0x08049300', comment: 'buf = address of data to leak' },
  { addr: 0x0804801f, bytes: [0xba, 0x00, 0x10, 0x00, 0x00], mnemonic: 'mov', operands: 'edx, 4096', comment: 'len = 4096 bytes to exfiltrate' },
  { addr: 0x08048024, bytes: [0x90], mnemonic: 'nop', operands: '', comment: 'write(1, data, 4096) — succeeds, leaks memory contents' },
  { addr: 0x08048025, bytes: [0xf4], mnemonic: 'hlt', operands: '', comment: '' },
];

export const adv2100: Exercise = {
  id: 'adv2-100',
  unitId: 'unit17-advanced-ii',
  title: '100: Sandboxing & Escape',
  desc: '<b>Goal:</b> Understand seccomp-BPF syscall filtering and sandbox escape techniques. Linux seccomp-BPF attaches a BPF (Berkeley Packet Filter) program that inspects every syscall before execution. The filter examines the syscall number and arguments, returning an action: <code>SECCOMP_RET_ALLOW</code>, <code>SECCOMP_RET_KILL</code>, <code>SECCOMP_RET_ERRNO</code>, or <code>SECCOMP_RET_TRACE</code>. A typical sandbox blocks dangerous syscalls like <code>execve</code>, <code>fork</code>, and <code>ptrace</code> while allowing <code>read</code>, <code>write</code>, <code>mmap</code>, and <code>exit</code>. Escape strategies include: using allowed syscalls creatively (e.g., <code>mprotect</code> to make pages executable, then jump to shellcode), exploiting architecture confusion between x86 <code>int 0x80</code> and x86-64 <code>syscall</code> (different syscall number tables), and TOCTOU races on syscall arguments in shared memory.',
  source: {
    c: [
      { text: '// seccomp-BPF sandbox setup', cls: 'comment' },
      { text: '#include <seccomp.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'void setup_sandbox() {', cls: '' },
      { text: '    scmp_filter_ctx ctx;', cls: '' },
      { text: '    ctx = seccomp_init(SCMP_ACT_KILL);', cls: 'highlight' },
      { text: '    // Default: KILL any syscall not allowed', cls: 'cmt' },
      { text: '    seccomp_rule_add(ctx, SCMP_ACT_ALLOW,', cls: '' },
      { text: '        SCMP_SYS(read), 0);', cls: 'highlight' },
      { text: '    seccomp_rule_add(ctx, SCMP_ACT_ALLOW,', cls: '' },
      { text: '        SCMP_SYS(write), 0);', cls: 'highlight' },
      { text: '    seccomp_rule_add(ctx, SCMP_ACT_ALLOW,', cls: '' },
      { text: '        SCMP_SYS(exit), 0);', cls: '' },
      { text: '    // execve, fork, ptrace = BLOCKED', cls: 'cmt' },
      { text: '    seccomp_load(ctx);', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Bypass: use allowed write() to exfil data', cls: 'comment' },
      { text: '// Or: mprotect (if allowed) + shellcode', cls: 'comment' },
      { text: '// Or: x32 ABI confusion (bit 30 trick)', cls: 'comment' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmInstructions: instructions,
  asmQuiz: [
    {
      question: 'The seccomp filter default action is SCMP_ACT_KILL. Syscall 11 (execve) is not in the allow list. What signal is sent to the process? (signal number for SIGSYS)',
      answer: 31,
      format: 'decimal',
      hint: 'SIGSYS (Bad system call) is signal number 31. seccomp sends SIGSYS when a blocked syscall is attempted.',
    },
    {
      question: 'On x86-64, the "int 0x80" instruction uses the 32-bit syscall table where write=4. The 64-bit "syscall" instruction uses a different table where write=1. What is the 64-bit syscall number for write?',
      answer: 1,
      format: 'decimal',
      hint: 'The x86-64 syscall table has write at number 1. If a seccomp filter only checks the 64-bit table, using int 0x80 with 32-bit numbers may bypass it.',
    },
    {
      question: 'A seccomp filter allows mprotect (syscall 125 on x86). An attacker can use it to change page permissions to RWX (7 = read+write+exec). What is the decimal value of PROT_READ|PROT_WRITE|PROT_EXEC?',
      answer: 7,
      format: 'decimal',
      hint: 'PROT_READ=1, PROT_WRITE=2, PROT_EXEC=4. Combined: 1+2+4=7. If mprotect is allowed, the attacker can make any page executable.',
    },
  ],
  check: () => false,
  winTitle: 'Sandbox Escape Understood!',
  winMsg: 'Seccomp-BPF is a powerful defense but has attack surface: allowed syscalls can be chained creatively, architecture confusion between 32/64-bit syscall tables can bypass filters, and TOCTOU races on shared memory arguments can defeat argument-level filtering. Defense in depth (namespaces + seccomp + capability dropping) is essential.',
};
