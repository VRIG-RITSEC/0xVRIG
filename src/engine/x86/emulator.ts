import {
  X86Register, X86Flags, X86State, AsmInstruction,
  Operand, RegisterDiff, StepResult, Architecture,
  X86_REGISTERS, X64_REGISTERS, ALL_REGISTERS,
} from './types';
import { Emulator, EmulatorState } from '../emulator-interface';

function defaultFlags(): X86Flags {
  return { ZF: false, SF: false, CF: false, OF: false };
}

function defaultRegisters(arch: Architecture): Record<string, number> {
  const regs: Record<string, number> = {};
  const list = arch === 'x86' ? X86_REGISTERS : X64_REGISTERS;
  for (const r of list) regs[r] = 0;
  return regs;
}

export class X86Emulator implements Emulator {
  state: X86State;
  instructions: AsmInstruction[];
  memory: Map<number, number>;
  private instrMap: Map<number, number>;
  private wordSize: number;
  private spReg: string;
  private bpReg: string;
  private ipReg: string;
  private registerNames: readonly string[];

  constructor(
    instructions: AsmInstruction[],
    initialRegs?: Record<string, number>,
    stackBase = 0xbfff0200,
    arch: Architecture = 'x86',
  ) {
    this.instructions = instructions;
    this.instrMap = new Map();
    for (let i = 0; i < instructions.length; i++) {
      this.instrMap.set(instructions[i].addr, i);
    }

    this.wordSize = arch === 'x86' ? 4 : 8;
    this.spReg = arch === 'x86' ? 'esp' : 'rsp';
    this.bpReg = arch === 'x86' ? 'ebp' : 'rbp';
    this.ipReg = arch === 'x86' ? 'eip' : 'rip';
    this.registerNames = arch === 'x86' ? X86_REGISTERS : X64_REGISTERS;

    this.memory = new Map();
    this.state = {
      registers: { ...defaultRegisters(arch), ...(initialRegs ?? {}) },
      flags: defaultFlags(),
      stack: [],
      stackBase,
      halted: false,
      arch,
    };

    if (initialRegs?.[this.ipReg] === undefined && instructions.length > 0) {
      this.state.registers[this.ipReg] = instructions[0].addr;
    }
    if (initialRegs?.[this.spReg] === undefined) {
      this.state.registers[this.spReg] = stackBase;
    }
    if (initialRegs?.[this.bpReg] === undefined) {
      this.state.registers[this.bpReg] = stackBase;
    }
  }

  private u32(v: number): number {
    return v >>> 0;
  }

  private mask(v: number): number {
    return this.wordSize === 4 ? v >>> 0 : v;
  }

  readMem(addr: number, size: number): number {
    let val = 0;
    for (let i = 0; i < size; i++) {
      val |= (this.memory.get((addr + i) >>> 0) ?? 0) << (i * 8);
    }
    return this.u32(val);
  }

  writeMem(addr: number, value: number, size: number): void {
    for (let i = 0; i < size; i++) {
      this.memory.set((addr + i) >>> 0, (value >> (i * 8)) & 0xff);
    }
  }

  private isRegister(s: string): boolean {
    return ALL_REGISTERS.includes(s as X86Register);
  }

  parseOperand(s: string): Operand {
    s = s.trim();

    if (this.isRegister(s)) {
      return { type: 'reg', reg: s as X86Register };
    }

    if (s.startsWith('[') && s.endsWith(']')) {
      return this.parseMemOperand(s.slice(1, -1).trim());
    }

    const sizePrefix = s.match(/^(byte|word|dword|qword)\s+\[/i);
    if (sizePrefix) {
      const inner = s.slice(s.indexOf('[') + 1, -1).trim();
      const sizes: Record<string, number> = { byte: 1, word: 2, dword: 4, qword: 8 };
      return { ...this.parseMemOperand(inner), size: sizes[sizePrefix[1].toLowerCase()] ?? this.wordSize } as Operand;
    }

    const num = this.parseNumber(s);
    if (!isNaN(num)) {
      return { type: 'imm', value: this.u32(num) };
    }

    throw new Error(`Unknown operand: ${s}`);
  }

  private parseNumber(s: string): number {
    s = s.trim();
    if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s, 16);
    if (s.startsWith('-0x') || s.startsWith('-0X')) return -parseInt(s.slice(1), 16);
    return parseInt(s, 10);
  }

  private parseMemOperand(inner: string): Operand {
    const result: Operand = { type: 'mem' };
    const parts = inner.replace(/\s/g, '').match(/([+-]?[a-z0-9*]+)/gi) ?? [];

    for (const part of parts) {
      const clean = part.replace(/^\+/, '');

      if (clean.includes('*')) {
        const [a, b] = clean.split('*');
        if (this.isRegister(a)) {
          (result as any).index = a;
          (result as any).scale = parseInt(b);
        } else {
          (result as any).index = b;
          (result as any).scale = parseInt(a);
        }
      } else if (this.isRegister(clean)) {
        if (!(result as any).base) {
          (result as any).base = clean;
        } else {
          (result as any).index = clean;
          (result as any).scale = 1;
        }
      } else {
        const num = this.parseNumber(clean);
        if (!isNaN(num)) {
          (result as any).disp = ((result as any).disp ?? 0) + num;
        }
      }
    }

    return result;
  }

  private resolveOperandAddr(op: Operand): number {
    if (op.type !== 'mem') throw new Error('Not a memory operand');
    let addr = 0;
    if (op.base) addr += this.state.registers[op.base] ?? 0;
    if (op.index) addr += (this.state.registers[op.index] ?? 0) * (op.scale ?? 1);
    if (op.disp) addr += op.disp;
    return this.u32(addr);
  }

  private readOperand(op: Operand): number {
    if (op.type === 'reg') return this.state.registers[op.reg] ?? 0;
    if (op.type === 'imm') return op.value;
    return this.readMem(this.resolveOperandAddr(op), op.size ?? this.wordSize);
  }

  private writeOperand(op: Operand, value: number): void {
    value = this.mask(value);
    if (op.type === 'reg') {
      this.state.registers[op.reg] = value;
    } else if (op.type === 'mem') {
      this.writeMem(this.resolveOperandAddr(op), value, op.size ?? this.wordSize);
    } else {
      throw new Error('Cannot write to immediate');
    }
  }

  private updateFlags(result: number, size = 32): void {
    const masked = this.u32(result);
    this.state.flags.ZF = masked === 0;
    this.state.flags.SF = (masked & (1 << (size - 1))) !== 0;
  }

  private push(value: number): void {
    this.state.registers[this.spReg] = this.mask(this.state.registers[this.spReg] - this.wordSize);
    this.writeMem(this.state.registers[this.spReg], value, this.wordSize);
  }

  private pop(): number {
    const val = this.readMem(this.state.registers[this.spReg], this.wordSize);
    this.state.registers[this.spReg] = this.mask(this.state.registers[this.spReg] + this.wordSize);
    return val;
  }

  getCurrentInstruction(): AsmInstruction | null {
    const idx = this.instrMap.get(this.state.registers[this.ipReg]);
    if (idx === undefined) return null;
    return this.instructions[idx];
  }

  step(): StepResult | null {
    if (this.state.halted) return null;

    const instr = this.getCurrentInstruction();
    if (!instr) {
      this.state.halted = true;
      return null;
    }

    const prevRegs = { ...this.state.registers };
    const prevFlags = { ...this.state.flags };
    const memWrites: StepResult['memoryWrites'] = [];
    const memReads: StepResult['memoryReads'] = [];

    const origWriteMem = this.writeMem.bind(this);
    const origReadMem = this.readMem.bind(this);
    this.writeMem = (addr, value, size) => {
      memWrites.push({ addr, value: this.u32(value), size });
      origWriteMem(addr, value, size);
    };
    this.readMem = (addr, size) => {
      const val = origReadMem(addr, size);
      memReads.push({ addr, value: val, size });
      return val;
    };

    this.executeInstruction(instr);

    this.writeMem = origWriteMem;
    this.readMem = origReadMem;

    const diffs: RegisterDiff[] = [];
    for (const r of this.registerNames) {
      if (prevRegs[r] !== this.state.registers[r]) {
        diffs.push({ reg: r, oldValue: prevRegs[r], newValue: this.state.registers[r] });
      }
    }

    const flagChanges: Partial<X86Flags> = {};
    for (const f of ['ZF', 'SF', 'CF', 'OF'] as (keyof X86Flags)[]) {
      if (prevFlags[f] !== this.state.flags[f]) {
        flagChanges[f] = this.state.flags[f];
      }
    }

    const log = this.formatLog(instr, diffs, flagChanges);

    return {
      instruction: instr,
      diffs,
      flagChanges,
      memoryWrites: memWrites,
      memoryReads: memReads,
      log,
      halted: this.state.halted,
    };
  }

  private executeInstruction(instr: AsmInstruction): void {
    const mnemonic = instr.mnemonic.toLowerCase();
    const nextAddr = this.mask(instr.addr + instr.bytes.length);

    const ops = instr.operands
      ? instr.operands.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    switch (mnemonic) {
      case 'nop':
        this.state.registers[this.ipReg] = nextAddr;
        break;

      case 'mov': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        this.writeOperand(dst, this.readOperand(src));
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'lea': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        if (src.type === 'mem') {
          this.writeOperand(dst, this.resolveOperandAddr(src));
        }
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'push': {
        const src = this.parseOperand(ops[0]);
        this.push(this.readOperand(src));
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'pop': {
        const dst = this.parseOperand(ops[0]);
        this.writeOperand(dst, this.pop());
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'add': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const result = a + b;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = result > 0xffffffff;
        this.state.flags.OF = ((a ^ result) & (b ^ result) & 0x80000000) !== 0;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'sub': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const a = this.readOperand(dst);
        const b = this.readOperand(src);
        const result = a - b;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = a < b;
        this.state.flags.OF = ((a ^ b) & (a ^ this.u32(result)) & 0x80000000) !== 0;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'inc': {
        const dst = this.parseOperand(ops[0]);
        const a = this.readOperand(dst);
        const result = a + 1;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.OF = a === 0x7fffffff;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'dec': {
        const dst = this.parseOperand(ops[0]);
        const a = this.readOperand(dst);
        const result = a - 1;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.OF = a === 0x80000000;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'mul': {
        const src = this.parseOperand(ops[0]);
        const accReg = this.state.arch === 'x86' ? 'eax' : 'rax';
        const hiReg = this.state.arch === 'x86' ? 'edx' : 'rdx';
        const a = this.state.registers[accReg] >>> 0;
        const b = this.readOperand(src) >>> 0;
        // Split into 16-bit halves to compute full 64-bit result without BigInt
        const aLo = a & 0xFFFF, aHi = (a >>> 16) & 0xFFFF;
        const bLo = b & 0xFFFF, bHi = (b >>> 16) & 0xFFFF;
        const p0 = aLo * bLo;
        const p1 = aHi * bLo + aLo * bHi;
        const p2 = aHi * bHi;
        const lo = (p0 + ((p1 & 0xFFFF) << 16)) >>> 0;
        const carry = ((p0 >>> 16) + (p1 & 0xFFFF)) >>> 16;
        const hi = (p2 + Math.trunc(p1 / 65536) + carry) >>> 0;
        this.state.registers[accReg] = lo;
        this.state.registers[hiReg] = hi;
        this.updateFlags(lo);
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'imul': {
        if (ops.length === 2) {
          const dst = this.parseOperand(ops[0]);
          const src = this.parseOperand(ops[1]);
          const result = Math.imul(this.readOperand(dst) | 0, this.readOperand(src) | 0);
          this.writeOperand(dst, result);
          this.updateFlags(result);
        } else if (ops.length === 3) {
          const dst = this.parseOperand(ops[0]);
          const src = this.parseOperand(ops[1]);
          const imm = this.parseOperand(ops[2]);
          const result = Math.imul(this.readOperand(src) | 0, this.readOperand(imm) | 0);
          this.writeOperand(dst, result);
          this.updateFlags(result);
        }
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'xor': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const result = this.readOperand(dst) ^ this.readOperand(src);
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'and': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const result = this.readOperand(dst) & this.readOperand(src);
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'or': {
        const dst = this.parseOperand(ops[0]);
        const src = this.parseOperand(ops[1]);
        const result = this.readOperand(dst) | this.readOperand(src);
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'not': {
        const dst = this.parseOperand(ops[0]);
        this.writeOperand(dst, ~this.readOperand(dst));
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'shl':
      case 'sal': {
        const dst = this.parseOperand(ops[0]);
        const cnt = this.readOperand(this.parseOperand(ops[1])) & 0x1f;
        const val = this.readOperand(dst);
        const result = val << cnt;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'shr': {
        const dst = this.parseOperand(ops[0]);
        const cnt = this.readOperand(this.parseOperand(ops[1])) & 0x1f;
        const val = this.readOperand(dst);
        const result = val >>> cnt;
        this.writeOperand(dst, result);
        this.updateFlags(result);
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'cmp': {
        const a = this.readOperand(this.parseOperand(ops[0]));
        const b = this.readOperand(this.parseOperand(ops[1]));
        const result = a - b;
        this.updateFlags(result);
        this.state.flags.CF = a < b;
        this.state.flags.OF = ((a ^ b) & (a ^ this.u32(result)) & 0x80000000) !== 0;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'test': {
        const a = this.readOperand(this.parseOperand(ops[0]));
        const b = this.readOperand(this.parseOperand(ops[1]));
        const result = a & b;
        this.updateFlags(result);
        this.state.flags.CF = false;
        this.state.flags.OF = false;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'jmp': {
        const target = this.parseOperand(ops[0]);
        this.state.registers[this.ipReg] = this.readOperand(target);
        break;
      }

      case 'je': case 'jz':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.ZF); break;
      case 'jne': case 'jnz':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.ZF); break;
      case 'jg': case 'jnle':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.ZF && this.state.flags.SF === this.state.flags.OF); break;
      case 'jge': case 'jnl':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.SF === this.state.flags.OF); break;
      case 'jl': case 'jnge':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.SF !== this.state.flags.OF); break;
      case 'jle': case 'jng':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.ZF || this.state.flags.SF !== this.state.flags.OF); break;
      case 'ja': case 'jnbe':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.CF && !this.state.flags.ZF); break;
      case 'jb': case 'jnae': case 'jc':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.CF); break;
      case 'jae': case 'jnb': case 'jnc':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.CF); break;
      case 'jbe': case 'jna':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.CF || this.state.flags.ZF); break;
      case 'js':
        this.conditionalJump(ops[0], nextAddr, this.state.flags.SF); break;
      case 'jns':
        this.conditionalJump(ops[0], nextAddr, !this.state.flags.SF); break;

      case 'call': {
        const target = this.parseOperand(ops[0]);
        this.push(nextAddr);
        this.state.registers[this.ipReg] = this.readOperand(target);
        break;
      }

      case 'ret': {
        const retAddr = this.pop();
        this.state.registers[this.ipReg] = retAddr;
        if (!this.instrMap.has(retAddr)) {
          this.state.halted = true;
        }
        break;
      }

      case 'leave': {
        this.state.registers[this.spReg] = this.state.registers[this.bpReg];
        this.state.registers[this.bpReg] = this.pop();
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'syscall':
      case 'int': {
        this.state.halted = true;
        this.state.registers[this.ipReg] = nextAddr;
        break;
      }

      case 'hlt': {
        this.state.halted = true;
        break;
      }

      default:
        this.state.registers[this.ipReg] = nextAddr;
        break;
    }
  }

  private conditionalJump(targetOp: string, nextAddr: number, condition: boolean): void {
    if (condition) {
      const target = this.parseOperand(targetOp);
      this.state.registers[this.ipReg] = this.readOperand(target);
    } else {
      this.state.registers[this.ipReg] = nextAddr;
    }
  }

  private formatLog(instr: AsmInstruction, diffs: RegisterDiff[], flagChanges: Partial<X86Flags>): string {
    const w = this.wordSize === 4 ? 8 : 16;
    const hex = (n: number) => '0x' + (n >>> 0).toString(16).padStart(w, '0');
    let log = `${hex(instr.addr)}: ${instr.mnemonic} ${instr.operands}`;

    if (diffs.length > 0) {
      const changes = diffs
        .filter(d => d.reg !== this.ipReg)
        .map(d => `${d.reg.toUpperCase()}=${hex(d.newValue)}`)
        .join(', ');
      if (changes) log += ` → ${changes}`;
    }

    const fKeys = Object.keys(flagChanges) as (keyof X86Flags)[];
    if (fKeys.length > 0) {
      const fStr = fKeys.map(f => `${f}=${flagChanges[f] ? '1' : '0'}`).join(' ');
      log += ` [${fStr}]`;
    }

    return log;
  }

  reset(initialRegs?: Record<string, number>): void {
    this.memory.clear();
    this.state = {
      registers: { ...defaultRegisters(this.state.arch), ...(initialRegs ?? {}) },
      flags: defaultFlags(),
      stack: [],
      stackBase: this.state.stackBase,
      halted: false,
      arch: this.state.arch,
    };
    if (!initialRegs?.[this.ipReg] && this.instructions.length > 0) {
      this.state.registers[this.ipReg] = this.instructions[0].addr;
    }
    if (!initialRegs?.[this.spReg]) {
      this.state.registers[this.spReg] = this.state.stackBase;
    }
    if (!initialRegs?.[this.bpReg]) {
      this.state.registers[this.bpReg] = this.state.stackBase;
    }
  }

  getStackView(count = 16): Array<{ addr: number; value: number }> {
    const sp = this.state.registers[this.spReg];
    const entries: Array<{ addr: number; value: number }> = [];
    for (let i = 0; i < count; i++) {
      const addr = this.u32(sp + i * this.wordSize);
      entries.push({ addr, value: this.readMem(addr, this.wordSize) });
    }
    return entries;
  }
}
