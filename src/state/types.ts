export interface AppState {
  currentExerciseId: string | null;
  completed: Set<string>;
  logMessages: Array<{ cls: string; msg: string }>;
  inputMode: 'text' | 'hex';
  stepIndex: number;
  symbols: Record<string, number>;
  aslrBase: number;
  running: boolean;
  execStepIndex: number;
  execStepsTotal: number;
  heapPhase: string;
  heapStep: number;
  heapNames: Record<string, number>;
  registers: Record<string, number> | null;
  fmtLeakedSecret: boolean;
  fmtWriteSuccess: boolean;
  oboWin: boolean;
  ropWin: boolean;
  sropWin: boolean;
  vizRenderKey: number;
  showSuccess: { title: string; msg: string } | null;
}

export type Action =
  | { type: 'LOAD_EXERCISE'; exerciseId: string }
  | { type: 'LOG'; cls: string; msg: string }
  | { type: 'LOG_BATCH'; messages: Array<{ cls: string; msg: string }> }
  | { type: 'CLEAR_LOG' }
  | { type: 'SET_INPUT_MODE'; mode: 'text' | 'hex' }
  | { type: 'SET_STEP_INDEX'; index: number }
  | { type: 'INCREMENT_STEP' }
  | { type: 'SET_RUNNING'; running: boolean }
  | { type: 'EXERCISE_COMPLETED'; exerciseId: string }
  | { type: 'SET_HEAP_PHASE'; phase: string }
  | { type: 'SET_HEAP_STEP'; step: number }
  | { type: 'SET_HEAP_NAME'; name: string; addr: number }
  | { type: 'SET_SYMBOLS'; symbols: Record<string, number> }
  | { type: 'UPDATE_REGISTER'; name: string; value: number }
  | { type: 'SET_REGISTERS'; registers: Record<string, number> }
  | { type: 'SET_FLAG'; flag: string; value: boolean }
  | { type: 'BUMP_VIZ' }
  | { type: 'SHOW_SUCCESS'; title: string; msg: string }
  | { type: 'DISMISS_SUCCESS' }
  | { type: 'RESET' };
