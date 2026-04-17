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
  check: (...args: any[]) => boolean;
  winTitle: string;
  winMsg: string;
}

export interface Unit {
  id: string;
  name: string;
  exerciseIds: string[];
  platform?: 'linux' | 'windows' | 'both';
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  condition: (completed: Set<string>) => boolean;
}
