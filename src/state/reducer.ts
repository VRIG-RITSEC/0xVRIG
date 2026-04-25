import { AppState, Action } from './types';
import { BASE_SYMBOLS } from '@/exercises/shared/symbols';
import { loadProgress } from './persistence';

export function createInitialState(): AppState {
  return {
    currentExerciseId: null,
    completed: loadProgress(),
    logMessages: [],
    inputMode: 'text',
    inputProgress: null,
    stepIndex: 0,
    symbols: { ...BASE_SYMBOLS },
    aslrBase: 0,
    running: false,
    execStepIndex: 0,
    execStepsTotal: 0,
    heapPhase: '',
    heapStep: 0,
    heapNames: {},
    registers: null,
    fmtLeakedSecret: false,
    fmtWriteSuccess: false,
    oboWin: false,
    ropWin: false,
    sropWin: false,
    execLine: -1,
    vizRenderKey: 0,
    showSuccess: null,
    toast: null,
    showSolutionGuide: false,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOAD_EXERCISE':
      return {
        ...state,
        currentExerciseId: action.exerciseId,
        logMessages: [],
        stepIndex: 0,
        inputProgress: null,
        running: false,
        execStepIndex: 0,
        execStepsTotal: 0,
        heapPhase: '',
        heapStep: 0,
        heapNames: {},
        registers: null,
        fmtLeakedSecret: false,
        fmtWriteSuccess: false,
        oboWin: false,
        ropWin: false,
        sropWin: false,
        execLine: -1,
        vizRenderKey: state.vizRenderKey + 1,
        showSuccess: null,
        toast: null,
        showSolutionGuide: false,
      };

    case 'LOG':
      return {
        ...state,
        logMessages: [...state.logMessages, { cls: action.cls, msg: action.msg }],
      };

    case 'LOG_BATCH':
      return {
        ...state,
        logMessages: [...state.logMessages, ...action.messages],
      };

    case 'CLEAR_LOG':
      return { ...state, logMessages: [] };

    case 'SET_INPUT_MODE':
      return { ...state, inputMode: action.mode };

    case 'SET_INPUT_PROGRESS':
      return { ...state, inputProgress: action.progress };

    case 'SET_STEP_INDEX':
      return { ...state, stepIndex: action.index };

    case 'INCREMENT_STEP':
      return { ...state, stepIndex: state.stepIndex + 1 };

    case 'SET_RUNNING':
      return { ...state, running: action.running };

    case 'EXERCISE_COMPLETED': {
      const newCompleted = new Set(state.completed);
      newCompleted.add(action.exerciseId);
      return { ...state, completed: newCompleted };
    }

    case 'SET_HEAP_PHASE':
      return { ...state, heapPhase: action.phase };

    case 'SET_HEAP_STEP':
      return { ...state, heapStep: action.step };

    case 'SET_HEAP_NAME':
      return {
        ...state,
        heapNames: { ...state.heapNames, [action.name]: action.addr },
      };

    case 'SET_SYMBOLS':
      return { ...state, symbols: action.symbols };

    case 'UPDATE_REGISTER':
      return {
        ...state,
        registers: { ...(state.registers ?? {}), [action.name]: action.value },
      };

    case 'SET_REGISTERS':
      return { ...state, registers: action.registers };

    case 'SET_FLAG': {
      const flagMap: Record<string, keyof AppState> = {
        fmtLeakedSecret: 'fmtLeakedSecret',
        fmtWriteSuccess: 'fmtWriteSuccess',
        oboWin: 'oboWin',
        ropWin: 'ropWin',
        sropWin: 'sropWin',
      };
      const key = flagMap[action.flag];
      if (key) {
        return { ...state, [key]: action.value };
      }
      return state;
    }

    case 'SET_EXEC_LINE':
      return { ...state, execLine: action.line };

    case 'BUMP_VIZ':
      return { ...state, vizRenderKey: state.vizRenderKey + 1 };

    case 'SHOW_SUCCESS':
      return {
        ...state,
        showSuccess: { title: action.title, msg: action.msg },
      };

    case 'DISMISS_SUCCESS':
      return { ...state, showSuccess: null };

    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message } };

    case 'DISMISS_TOAST':
      return { ...state, toast: null };

    case 'SHOW_SOLUTION_GUIDE':
      return { ...state, showSolutionGuide: true };

    case 'DISMISS_SOLUTION_GUIDE':
      return { ...state, showSolutionGuide: false };

    case 'RESET':
      return {
        ...createInitialState(),
        completed: state.completed,
      };

    default:
      return state;
  }
}
