'use client';

import { X86Emulator } from '@/engine/x86/emulator';
import { AsmInstruction } from '@/engine/x86/types';
import styles from './AsmViz.module.css';

interface AsmVizProps {
  emulator: X86Emulator | null;
  renderKey: number;
  changedRegs?: Set<string>;
}

const X86_GP = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi'];
const X86_PTR = ['esp', 'ebp', 'eip'];
const X64_GP = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
const X64_PTR = ['rsp', 'rbp', 'rip'];
const FLAG_NAMES = ['ZF', 'SF', 'CF', 'OF'] as const;

const REG_TOOLTIPS: Record<string, string> = {
  eax: 'Accumulator -- return values, arithmetic',
  ebx: 'Base register -- general purpose, callee-saved',
  ecx: 'Counter -- loop counts, shift amounts',
  edx: 'Data -- I/O, multiply/divide extension',
  esi: 'Source index -- string/memory source',
  edi: 'Destination index -- string/memory destination',
  esp: 'Stack pointer -- top of stack, changes on push/pop/call/ret',
  ebp: 'Base pointer -- frame reference for local variables',
  eip: 'Instruction pointer -- address of next instruction to execute',
  rax: 'Accumulator -- return values, syscall number',
  rbx: 'Base register -- general purpose, callee-saved',
  rcx: 'Counter -- 4th argument in System V ABI',
  rdx: 'Data -- 3rd argument in System V ABI',
  rsi: 'Source index -- 2nd argument in System V ABI',
  rdi: 'Destination index -- 1st argument in System V ABI',
  rsp: 'Stack pointer -- top of stack',
  rbp: 'Base pointer -- frame reference, callee-saved',
  rip: 'Instruction pointer -- address of next instruction',
  r8: '5th argument in System V ABI', r9: '6th argument in System V ABI',
  r10: 'Temp register, caller-saved', r11: 'Temp register, caller-saved',
  r12: 'General purpose, callee-saved', r13: 'General purpose, callee-saved',
  r14: 'General purpose, callee-saved', r15: 'General purpose, callee-saved',
};

function hex(n: number, width = 8): string {
  return '0x' + (n >>> 0).toString(16).padStart(width, '0');
}

function hexBytes(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');
}

export default function AsmViz({ emulator, renderKey, changedRegs }: AsmVizProps) {
  void renderKey;
  if (!emulator) return <div className={styles.container}>No emulator loaded</div>;

  const { registers, flags, halted, arch } = emulator.state;
  const ipReg = arch === 'x86' ? 'eip' : 'rip';
  const spReg = arch === 'x86' ? 'esp' : 'rsp';
  const currentAddr = registers[ipReg];
  const stackView = emulator.getStackView(8);
  const hexW = arch === 'x86' ? 8 : 16;

  const gpRegs = arch === 'x86' ? X86_GP : X64_GP;
  const ptrRegs = arch === 'x86' ? X86_PTR : X64_PTR;

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>REGISTERS ({arch.toUpperCase()})</div>
        <div className={styles.regGrid}>
          {gpRegs.map(r => (
            <div key={r} className={`${styles.regRow} ${changedRegs?.has(r) ? styles.regChanged : ''}`} data-tooltip={REG_TOOLTIPS[r]}>
              <span className={styles.regName}>{r.toUpperCase()}</span>
              <span className={styles.regValue}>{hex(registers[r] ?? 0, hexW)}</span>
            </div>
          ))}
        </div>
        <div className={styles.regGrid}>
          {ptrRegs.map(r => (
            <div key={r} className={`${styles.regRow} ${styles.regPtr} ${changedRegs?.has(r) ? styles.regChanged : ''}`} data-tooltip={REG_TOOLTIPS[r]}>
              <span className={styles.regName}>{r.toUpperCase()}</span>
              <span className={styles.regValue}>{hex(registers[r] ?? 0, hexW)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>FLAGS</div>
        <div className={styles.flagRow}>
          {FLAG_NAMES.map(f => (
            <span key={f} className={`${styles.flag} ${flags[f] ? styles.flagSet : ''}`}>
              {f}={flags[f] ? '1' : '0'}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          INSTRUCTIONS {halted && <span className={styles.halted}>[HALTED]</span>}
        </div>
        <div className={styles.instrList}>
          {emulator.instructions.map((instr: AsmInstruction) => (
            <div
              key={instr.addr}
              className={`${styles.instrRow} ${instr.addr === currentAddr ? styles.instrCurrent : ''}`}
            >
              <span className={styles.instrAddr}>{hex(instr.addr, hexW)}</span>
              <span className={styles.instrBytes}>{hexBytes(instr.bytes)}</span>
              <span className={styles.instrMnemonic}>{instr.mnemonic}</span>
              <span className={styles.instrOperands}>{instr.operands}</span>
              {instr.comment && <span className={styles.instrComment}>; {instr.comment}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>STACK ({spReg.toUpperCase()} → ↓)</div>
        <div className={styles.stackView}>
          {stackView.map(({ addr, value }) => (
            <div key={addr} className={`${styles.stackRow} ${addr === (registers[spReg] ?? 0) ? styles.stackEsp : ''}`}>
              <span className={styles.stackAddr}>{hex(addr, hexW)}</span>
              <span className={styles.stackValue}>{hex(value, hexW)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
