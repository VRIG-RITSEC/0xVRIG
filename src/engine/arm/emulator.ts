import { AsmInstruction, RegisterDiff, StepResult } from '../x86/types';
import { Emulator, EmulatorState } from '../emulator-interface';

/* ------------------------------------------------------------------ */
/*  ARM register constants                                            */
/* ------------------------------------------------------------------ */

const ARM_REGISTERS = [
  'r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7',
  'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15',
] as const;

/** Map aliases to canonical register names. */
const REGISTER_ALIASES: Record<string, string> = {
  sp: 'r13',
  lr: 'r14',
  pc: 'r15',
};

/** Reverse aliases for display (canonical -> alias). */
const REGISTER_DISPLAY: Record<string, string> = {
  r13: 'sp',
  r14: 'lr',
  r15: 'pc',
};

/* ------------------------------------------------------------------ */
/*  ARM condition codes                                               */
/* ------------------------------------------------------------------ */

type ConditionCode =
  | 'eq' | 'ne' | 'gt' | 'lt' | 'ge' | 'le'
  | 'cs' | 'hs' | 'cc' | 'lo' | 'mi' | 'pl'
  | 'al' | '';

const CONDITION_CODES: ConditionCode[] = [
  'eq', 'ne', 'gt', 'lt', 'ge', 'le',
  'cs', 'hs', 'cc', 'lo', 'mi', 'pl',
  'al',
];

/* Base mnemonics the emulator recognises. */
const BASE_MNEMONICS = [
  'mov', 'add', 'sub', 'mul', 'and', 'orr', 'eor',
  'ldr', 'str', 'push', 'pop',
  'b', 'bl', 'bx',
  'cmp', 'tst',
];

/* ------------------------------------------------------------------ */
/*  ARM flags                                                         */
/* ------------------------------------------------------------------ */

interface ArmFlags {
  [key: string]: boolean;
  N: boolean;
  Z: boolean;
  C: boolean;
  V: boolean;
}

function defaultFlags(): ArmFlags {
  return { N: false, Z: false, C: false, V: false };
}

/* ------------------------------------------------------------------ */
/*  State type (internal, wider than EmulatorState)                    */
/* ------------------------------------------------------------------ */

interface ArmState {
  registers: Record<string, number>;
  flags: ArmFlags;
  halted: boolean;
  arch: 'arm';
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function defaultRegisters(): Record<string, number> {
  const regs: Record<string, number> = {};
  for (const r of ARM_REGISTERS) regs[r] = 0;
  return regs;
}

function u32(v: number): number {
  return v >>> 0;
}

function toSigned32(v: number): number {
  return v | 0;
}

/* ------------------------------------------------------------------ */
/*  ArmEmulator                                                       */
/* ------------------------------------------------------------------ */

export class ArmEmulator implements Emulator {
  state: ArmState;
  instructions: AsmInstruction[];
  memory: Map<number, number>;
  private instrMap: Map<number, number>;
  private stackBase: number;
  private initRegs: Record<string, number> | undefined;

  constructor(
    instructions: AsmInstruction[],
    initialRegs?: Record<string, number>,
    stackBase = 0xbfff0200,
  ) {
    this.instructions = instructions;
    this.instrMap = new Map();
    for (let i = 0; i < instructions.length; i++) {
      this.instrMap.set(instructions[i].addr, i);
    }

    this.stackBase = stackBase;
    this.initRegs = initialRegs;
    this.memory = new Map();
    this.state = this.buildInitialState(initialRegs, stackBase);
  }

  /* ---------- public interface ------------------------------------ */

  readMem(addr: number, size: number): number {
    let val = 0;
    for (let i = 0; i < size; i++) {
      val |= (this.memory.get(u32(addr + i)) ?? 0) << (i * 8);
    }
    return u32(val);
  }

  writeMem(addr: number, value: number, size: number): void {
    for (let i = 0; i < size; i++) {
      this.memory.set(u32(addr + i), (value >> (i * 8)) & 0xff);
    }
  }

  getCurrentInstruction(): AsmInstruction | null {
    const pc = this.getReg('pc');
    const idx = this.instrMap.get(pc);
    if (idx === undefined) return null;
    return this.instructions[idx];
  }

  getStackView(count = 16): Array<{ addr: number; value: number }> {
    const sp = this.getReg('sp');
    const entries: Array<{ addr: number; value: number }> = [];
    for (let i = 0; i < count; i++) {
      const addr = u32(sp + i * 4);
      entries.push({ addr, value: this.readMem(addr, 4) });
    }
    return entries;
  }

  reset(initialRegs?: Record<string, number>): void {
    this.memory.clear();
    const regs = initialRegs ?? this.initRegs;
    this.state = this.buildInitialState(regs, this.stackBase);
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

    /* Intercept memory access to record reads / writes. */
    const origWriteMem = this.writeMem.bind(this);
    const origReadMem = this.readMem.bind(this);
    this.writeMem = (addr, value, size) => {
      memWrites.push({ addr, value: u32(value), size });
      origWriteMem(addr, value, size);
    };
    this.readMem = (addr, size) => {
      const val = origReadMem(addr, size);
      memReads.push({ addr, value: val, size });
      return val;
    };

    this.executeInstruction(instr);

    /* Restore originals. */
    this.writeMem = origWriteMem;
    this.readMem = origReadMem;

    /* Build diffs. */
    const diffs: RegisterDiff[] = [];
    for (const r of ARM_REGISTERS) {
      if (prevRegs[r] !== this.state.registers[r]) {
        diffs.push({ reg: r, oldValue: prevRegs[r], newValue: this.state.registers[r] });
      }
    }

    const flagChanges: Partial<Record<string, boolean>> = {};
    for (const f of ['N', 'Z', 'C', 'V']) {
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

  /* ---------- internal state helpers ------------------------------ */

  private buildInitialState(initialRegs: Record<string, number> | undefined, stackBase: number): ArmState {
    const regs = { ...defaultRegisters() };

    /* Apply caller-supplied overrides (handle aliases). */
    if (initialRegs) {
      for (const [key, val] of Object.entries(initialRegs)) {
        const canon = this.canonReg(key);
        regs[canon] = u32(val);
      }
    }

    /* Defaults for sp and pc if not explicitly provided. */
    if (!initialRegs || (initialRegs['sp'] === undefined && initialRegs['r13'] === undefined)) {
      regs['r13'] = stackBase;
    }
    if (!initialRegs || (initialRegs['pc'] === undefined && initialRegs['r15'] === undefined)) {
      if (this.instructions.length > 0) {
        regs['r15'] = this.instructions[0].addr;
      }
    }

    return {
      registers: regs,
      flags: defaultFlags(),
      halted: false,
      arch: 'arm',
    };
  }

  /** Resolve alias -> canonical register name. */
  private canonReg(name: string): string {
    const lower = name.toLowerCase();
    return REGISTER_ALIASES[lower] ?? lower;
  }

  private getReg(name: string): number {
    return this.state.registers[this.canonReg(name)] ?? 0;
  }

  private setReg(name: string, value: number): void {
    this.state.registers[this.canonReg(name)] = u32(value);
  }

  private isRegName(s: string): boolean {
    const lower = s.toLowerCase();
    return ARM_REGISTERS.includes(lower as (typeof ARM_REGISTERS)[number]) || lower in REGISTER_ALIASES;
  }

  /* ---------- operand2 / barrel-shifter parsing ------------------- */

  /** Parse an ARM "operand2" string and return its computed value. */
  private resolveOperand2(raw: string): number {
    raw = raw.trim();

    /* Immediate: #42, #0xFF, #-10 */
    if (raw.startsWith('#')) {
      return u32(this.parseNumber(raw.slice(1)));
    }

    /* Check for shifted register: "r3, LSL #2" or "r3, LSR r4" */
    const shiftMatch = raw.match(/^(\w+)\s*,\s*(LSL|LSR|ASR|ROR)\s+(#?[\w-]+)$/i);
    if (shiftMatch) {
      const baseVal = this.getReg(shiftMatch[1]);
      const shiftType = shiftMatch[2].toUpperCase();
      let shiftAmount: number;
      const shiftOp = shiftMatch[3].trim();
      if (shiftOp.startsWith('#')) {
        shiftAmount = this.parseNumber(shiftOp.slice(1));
      } else {
        shiftAmount = this.getReg(shiftOp) & 0xff;
      }
      return this.applyShift(baseVal, shiftType, shiftAmount);
    }

    /* Plain register. */
    if (this.isRegName(raw)) {
      return this.getReg(raw);
    }

    /* Fallback: try as bare number (shouldn't normally happen). */
    return u32(this.parseNumber(raw));
  }

  private applyShift(value: number, shiftType: string, amount: number): number {
    amount = amount & 0x1f;
    switch (shiftType) {
      case 'LSL': return u32(value << amount);
      case 'LSR': return value >>> amount;
      case 'ASR': return u32(toSigned32(value) >> amount);
      case 'ROR': return u32((value >>> amount) | (value << (32 - amount)));
      default: return value;
    }
  }

  private parseNumber(s: string): number {
    s = s.trim();
    if (s.startsWith('0x') || s.startsWith('0X')) return parseInt(s, 16);
    if (s.startsWith('-0x') || s.startsWith('-0X')) return -parseInt(s.slice(1), 16);
    return parseInt(s, 10);
  }

  /* ---------- memory-addressing helpers for LDR/STR --------------- */

  /**
   * Parse "[rn]" or "[rn, #offset]" or "[rn, rm]" or "[rn, rm, LSL #2]"
   * and return the effective address.
   */
  private resolveMemAddress(operand: string): number {
    let inner = operand.trim();
    if (inner.startsWith('[') && inner.endsWith(']')) {
      inner = inner.slice(1, -1).trim();
    }

    const parts = inner.split(',').map(p => p.trim());
    let addr = this.getReg(parts[0]);

    if (parts.length >= 2) {
      /* Remaining parts form an operand2 expression. */
      const rest = parts.slice(1).join(',').trim();
      addr = u32(addr + toSigned32(this.resolveOperand2(rest)));
    }

    return u32(addr);
  }

  /* ---------- register list parsing for PUSH/POP ------------------ */

  /**
   * Parse "{r0, r1, r4-r6, lr}" into an ordered array of canonical
   * register names.
   */
  private parseRegList(operands: string): string[] {
    let inner = operands.trim();
    if (inner.startsWith('{') && inner.endsWith('}')) {
      inner = inner.slice(1, -1).trim();
    }

    const regs: string[] = [];
    const parts = inner.split(',').map(p => p.trim());

    for (const part of parts) {
      const rangeMatch = part.match(/^(r\d+)\s*-\s*(r\d+)$/i);
      if (rangeMatch) {
        const lo = parseInt(rangeMatch[1].slice(1));
        const hi = parseInt(rangeMatch[2].slice(1));
        for (let i = lo; i <= hi; i++) regs.push(`r${i}`);
      } else {
        regs.push(this.canonReg(part));
      }
    }

    /* Sort ascending by register number (ARM convention). */
    regs.sort((a, b) => {
      const na = parseInt(a.slice(1));
      const nb = parseInt(b.slice(1));
      return na - nb;
    });

    return regs;
  }

  /* ---------- condition evaluation -------------------------------- */

  /**
   * Strip condition suffix from a mnemonic.
   * Returns [baseMnemonic, conditionCode, hasSuffix_S].
   */
  private parseMnemonic(raw: string): { base: string; cond: ConditionCode; setFlags: boolean } {
    const mnem = raw.toLowerCase().trim();

    /* Check for S suffix (e.g. "adds", "subs") -- must come before
       condition stripping so that "addseq" parses correctly. */
    /* Strategy: try longest match first.  Start with full mnemonic
       and try to find a base + optional S + optional cond. */

    /* Try each known base mnemonic. */
    for (const base of BASE_MNEMONICS) {
      if (!mnem.startsWith(base)) continue;

      const rest = mnem.slice(base.length); // e.g. "seq" from "addseq"

      /* Try S + condition. */
      if (rest.startsWith('s')) {
        const afterS = rest.slice(1);
        if (afterS === '' || afterS === 'al') {
          return { base, cond: afterS === 'al' ? 'al' : '', setFlags: true };
        }
        if (CONDITION_CODES.includes(afterS as ConditionCode)) {
          return { base, cond: afterS as ConditionCode, setFlags: true };
        }
      }

      /* Try condition only. */
      if (rest === '' || rest === 'al') {
        return { base, cond: rest === 'al' ? 'al' : '', setFlags: false };
      }
      if (CONDITION_CODES.includes(rest as ConditionCode)) {
        return { base, cond: rest as ConditionCode, setFlags: false };
      }
    }

    /* Fallback: unknown mnemonic, no condition, no S. */
    return { base: mnem, cond: '', setFlags: false };
  }

  private evaluateCondition(cond: ConditionCode): boolean {
    const { N, Z, C, V } = this.state.flags;
    switch (cond) {
      case '':
      case 'al': return true;
      case 'eq': return Z;
      case 'ne': return !Z;
      case 'gt': return !Z && N === V;
      case 'lt': return N !== V;
      case 'ge': return N === V;
      case 'le': return Z || N !== V;
      case 'cs':
      case 'hs': return C;
      case 'cc':
      case 'lo': return !C;
      case 'mi': return N;
      case 'pl': return !N;
      default: return true;
    }
  }

  /* ---------- flag helpers ---------------------------------------- */

  private updateNZ(result: number): void {
    const val = u32(result);
    this.state.flags.Z = val === 0;
    this.state.flags.N = (val & 0x80000000) !== 0;
  }

  private updateFlagsAdd(a: number, b: number, result: number): void {
    const r = u32(result);
    this.updateNZ(r);
    this.state.flags.C = result > 0xffffffff;
    this.state.flags.V = ((u32(a) ^ r) & (u32(b) ^ r) & 0x80000000) !== 0;
  }

  private updateFlagsSub(a: number, b: number, result: number): void {
    const r = u32(result);
    this.updateNZ(r);
    /* ARM: C is set when there is NO borrow (opposite of x86). */
    this.state.flags.C = u32(a) >= u32(b);
    this.state.flags.V = ((u32(a) ^ u32(b)) & (u32(a) ^ r) & 0x80000000) !== 0;
  }

  /* ---------- instruction execution ------------------------------- */

  /** Tracks whether the last executed instruction was skipped. */
  private lastSkipped = false;

  private executeInstruction(instr: AsmInstruction): void {
    const { base, cond, setFlags } = this.parseMnemonic(instr.mnemonic);
    const nextAddr = u32(instr.addr + instr.bytes.length);

    /* Evaluate condition. */
    if (!this.evaluateCondition(cond)) {
      this.lastSkipped = true;
      this.setReg('pc', nextAddr);
      return;
    }
    this.lastSkipped = false;

    /* Split operands by comma, but respect brackets and braces. */
    const ops = this.splitOperands(instr.operands ?? '');

    switch (base) {
      /* ----- data processing ------------------------------------ */
      case 'mov': {
        const rd = ops[0];
        const val = this.resolveOperand2(ops[1]);
        this.setReg(rd, val);
        if (setFlags) this.updateNZ(val);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'add': {
        const rd = ops[0];
        const rn = this.getReg(ops[1]);
        const op2 = this.resolveOperand2(ops[2]);
        const result = rn + op2;
        this.setReg(rd, result);
        if (setFlags) this.updateFlagsAdd(rn, op2, result);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'sub': {
        const rd = ops[0];
        const rn = this.getReg(ops[1]);
        const op2 = this.resolveOperand2(ops[2]);
        const result = rn - op2;
        this.setReg(rd, result);
        if (setFlags) this.updateFlagsSub(rn, op2, result);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'mul': {
        const rd = ops[0];
        const rm = this.getReg(ops[1]);
        const rs = this.getReg(ops[2]);
        const result = Math.imul(rm, rs) >>> 0;
        this.setReg(rd, result);
        if (setFlags) this.updateNZ(result);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'and': {
        const rd = ops[0];
        const rn = this.getReg(ops[1]);
        const op2 = this.resolveOperand2(ops[2]);
        const result = u32(rn & op2);
        this.setReg(rd, result);
        if (setFlags) this.updateNZ(result);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'orr': {
        const rd = ops[0];
        const rn = this.getReg(ops[1]);
        const op2 = this.resolveOperand2(ops[2]);
        const result = u32(rn | op2);
        this.setReg(rd, result);
        if (setFlags) this.updateNZ(result);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'eor': {
        const rd = ops[0];
        const rn = this.getReg(ops[1]);
        const op2 = this.resolveOperand2(ops[2]);
        const result = u32(rn ^ op2);
        this.setReg(rd, result);
        if (setFlags) this.updateNZ(result);
        this.setReg('pc', nextAddr);
        break;
      }

      /* ----- comparison (always update flags) -------------------- */
      case 'cmp': {
        const rn = this.getReg(ops[0]);
        const op2 = this.resolveOperand2(ops[1]);
        const result = rn - op2;
        this.updateFlagsSub(rn, op2, result);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'tst': {
        const rn = this.getReg(ops[0]);
        const op2 = this.resolveOperand2(ops[1]);
        const result = u32(rn & op2);
        this.updateNZ(result);
        this.state.flags.C = false;
        this.state.flags.V = false;
        this.setReg('pc', nextAddr);
        break;
      }

      /* ----- load / store ---------------------------------------- */
      case 'ldr': {
        const rd = ops[0];
        /* Build the address from the remaining operands joined back. */
        const addrStr = ops.slice(1).join(',');
        const addr = this.resolveMemAddress(addrStr);
        const value = this.readMem(addr, 4);
        this.setReg(rd, value);
        this.setReg('pc', nextAddr);
        break;
      }

      case 'str': {
        const rd = ops[0];
        const addrStr = ops.slice(1).join(',');
        const addr = this.resolveMemAddress(addrStr);
        this.writeMem(addr, this.getReg(rd), 4);
        this.setReg('pc', nextAddr);
        break;
      }

      /* ----- stack ------------------------------------------------ */
      case 'push': {
        const regList = this.parseRegList(instr.operands ?? '');
        /* PUSH stores registers in descending order of register number.
           sp is decremented by 4 * count first, then registers are
           stored lowest-numbered at lowest address. */
        const count = regList.length;
        this.setReg('sp', this.getReg('sp') - count * 4);
        const base = this.getReg('sp');
        for (let i = 0; i < count; i++) {
          this.writeMem(u32(base + i * 4), this.getReg(regList[i]), 4);
        }
        this.setReg('pc', nextAddr);
        break;
      }

      case 'pop': {
        const regList = this.parseRegList(instr.operands ?? '');
        const base = this.getReg('sp');
        for (let i = 0; i < regList.length; i++) {
          const value = this.readMem(u32(base + i * 4), 4);
          this.setReg(regList[i], value);
        }
        this.setReg('sp', this.getReg('sp') + regList.length * 4);
        /* If pc was in reglist it already got set above; don't overwrite. */
        if (!regList.includes('r15')) {
          this.setReg('pc', nextAddr);
        }
        break;
      }

      /* ----- branch ---------------------------------------------- */
      case 'b': {
        const target = this.resolveOperand2(ops[0]);
        this.setReg('pc', target);
        break;
      }

      case 'bl': {
        const target = this.resolveOperand2(ops[0]);
        this.setReg('lr', nextAddr);
        this.setReg('pc', target);
        break;
      }

      case 'bx': {
        const target = this.getReg(ops[0]);
        this.setReg('pc', target);
        /* If the target is not a known instruction address, halt. */
        if (!this.instrMap.has(u32(target))) {
          this.state.halted = true;
        }
        break;
      }

      /* ----- unknown --------------------------------------------- */
      default:
        this.setReg('pc', nextAddr);
        break;
    }
  }

  /**
   * Split operand string by commas while respecting brackets [] and
   * braces {}.  Content inside those delimiters is kept together.
   *
   * e.g. "r0, [r1, #4]" -> ["r0", "[r1, #4]"]
   *      "{r0, r1, lr}" -> ["{r0, r1, lr}"]
   */
  private splitOperands(raw: string): string[] {
    if (!raw || !raw.trim()) return [];

    const result: string[] = [];
    let depth = 0;
    let current = '';

    for (const ch of raw) {
      if (ch === '[' || ch === '{') {
        depth++;
        current += ch;
      } else if (ch === ']' || ch === '}') {
        depth--;
        current += ch;
      } else if (ch === ',' && depth === 0) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  }

  /* ---------- logging -------------------------------------------- */

  private formatLog(
    instr: AsmInstruction,
    diffs: RegisterDiff[],
    flagChanges: Partial<Record<string, boolean>>,
  ): string {
    const hex = (n: number) => '0x' + u32(n).toString(16).padStart(8, '0');
    let log = `${hex(instr.addr)}: ${instr.mnemonic} ${instr.operands}`;

    if (this.lastSkipped) {
      log += ' (skipped, condition false)';
      return log;
    }

    if (diffs.length > 0) {
      const changes = diffs
        .filter(d => d.reg !== 'r15')
        .map(d => {
          const display = REGISTER_DISPLAY[d.reg] ?? d.reg;
          return `${display.toUpperCase()}=${hex(d.newValue)}`;
        })
        .join(', ');
      if (changes) log += ` -> ${changes}`;
    }

    const fKeys = Object.keys(flagChanges);
    if (fKeys.length > 0) {
      const fStr = fKeys.map(f => `${f}=${flagChanges[f] ? '1' : '0'}`).join(' ');
      log += ` [${fStr}]`;
    }

    return log;
  }
}
