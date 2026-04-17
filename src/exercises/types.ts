export type ExerciseMode =
  | 'step'
  | 'input-hex'
  | 'input-text'
  | 'input-fmt-read'
  | 'input-fmt-write'
  | 'input-int-overflow'
  | 'input-signedness'
  | 'heap-uaf'
  | 'heap-double-free'
  | 'heap-overflow'
  | 'heap-tcache-poison'
  | 'heap-fastbin-dup'
  | 'heap-unsorted-bin'
  | 'heap-house-force'
  | 'heap-house-spirit'
  | 'heap-house-orange'
  | 'heap-house-einherjar'
  | 'heap-house-lore'
  | 'final-chain'
  | 'final-blind'
  | 'asm-step'
  | 'asm-registers'
  | 'asm-quiz'
  | 'windows-seh'
  | 'windows-heap'
  | 'sandbox-stack'
  | 'sandbox-heap';

export type VizMode =
  | 'stack'
  | 'heap'
  | 'both'
  | 'asm'
  | 'asm-stack'
  | 'windows-seh'
  | 'windows-heap';

export interface CodeLine {
  text: string;
  cls: string;
  fn?: boolean;
}

export interface SourceView {
  c: CodeLine[];
  asm?: CodeLine[];
}

export interface GuidedStep {
  region?: string;
  action?: string;
  log: [string, string];
  srcLine?: number;
  name?: string;
  size?: number;
  done?: boolean;
}

export interface Exercise {
  id: string;
  unitId: string;
  title: string;
  desc: string;
  source: SourceView;
  mode: ExerciseMode;
  vizMode: VizMode;
  bufSize?: number;
  canary?: boolean;
  aslr?: boolean;
  nx?: boolean;
  offByOne?: boolean;
  signedness?: boolean;
  intOverflow?: boolean;
  headerSize?: number;
  ret2libc?: boolean;
  rop?: boolean;
  pivot?: boolean;
  srop?: boolean;
  heapSize?: number;
  heapSetup?: (heap: any) => void;
  funcPtrAddr?: number;
  gadgets?: Record<number, string>;
  flagAddr?: number;
  magicValue?: number;
  showSigframe?: boolean;
  fmtRead?: boolean;
  fmtWrite?: boolean;
  secretValue?: number;
  secretOffset?: number;
  targetAddr?: number;
  asmCode?: Uint8Array;
  asmArch?: 'x86' | 'x86-64';
  asmBaseAddr?: number;
  asmInstructions?: import('@/engine/x86/types').AsmInstruction[];
  asmInitialRegs?: Partial<Record<import('@/engine/x86/types').X86Register, number>>;
  asmStackBase?: number;
  asmInitialMemory?: Array<{ addr: number; value: number; size: number }>;
  asmQuiz?: AsmQuizQuestion[];
  sehChainSize?: number;
  safeSEH?: boolean;
  sehop?: boolean;
  windowsHeapType?: 'lfh' | 'segment';
  showSymbols?: boolean;
  showBuilder?: boolean;
  showCalc?: boolean;
  showGadgetTable?: boolean;
  showLabels?: boolean;
  steps?: GuidedStep[];
  check: (sim: any, heap: any, symbols: Record<string, number>, flags: Record<string, boolean>) => boolean;
  winTitle: string;
  winMsg: string;
  realWorld?: string;
}

export interface AsmQuizQuestion {
  question: string;
  hint?: string;
  answer: number;
  format?: 'hex' | 'decimal';
}

export interface Unit {
  id: string;
  name: string;
  exerciseIds: string[];
  platform?: 'linux' | 'windows' | 'both';
}

export interface Track {
  id: string;
  name: string;
  unitIds: string[];
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  condition: (completed: Set<string>) => boolean;
}
