'use client';

import React, { createContext, useContext, useReducer, useRef, useEffect } from 'react';
import { AppState, Action } from './types';
import { reducer, createInitialState } from './reducer';
import { saveProgress } from './persistence';
import { StackSim } from '@/engine/simulators/StackSim';
import { HeapSim } from '@/engine/simulators/HeapSim';
import { Exercise } from '@/exercises/types';
import { getExercise } from '@/exercises/registry';

interface ExerciseContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  stackSim: React.MutableRefObject<StackSim | null>;
  heapSim: React.MutableRefObject<HeapSim | null>;
  currentExercise: Exercise | null;
}

const ExerciseContext = createContext<ExerciseContextValue | null>(null);

export function ExerciseContextProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const stackSim = useRef<StackSim | null>(null);
  const heapSim = useRef<HeapSim | null>(null);

  const currentExercise = state.currentExerciseId
    ? getExercise(state.currentExerciseId) ?? null
    : null;

  // Persist completed exercises whenever they change
  const completedRef = useRef(state.completed);
  useEffect(() => {
    if (completedRef.current !== state.completed) {
      completedRef.current = state.completed;
      saveProgress(state.completed);
    }
  }, [state.completed]);

  const value: ExerciseContextValue = {
    state,
    dispatch,
    stackSim,
    heapSim,
    currentExercise,
  };

  return (
    <ExerciseContext.Provider value={value}>
      {children}
    </ExerciseContext.Provider>
  );
}

export function useExerciseContext(): ExerciseContextValue {
  const ctx = useContext(ExerciseContext);
  if (!ctx) {
    throw new Error('useExerciseContext must be used within ExerciseContextProvider');
  }
  return ctx;
}
