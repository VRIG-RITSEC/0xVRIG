import { Exercise, Unit, Badge } from './types';
import { unit1Exercises } from './unit1-stack';

// All exercises from all units, flattened
const ALL_EXERCISES: Exercise[] = [
  ...unit1Exercises,
];

// Exercise lookup map
const exerciseMap = new Map<string, Exercise>();
for (const ex of ALL_EXERCISES) {
  exerciseMap.set(ex.id, ex);
}

export const UNITS: Unit[] = [
  { id: 'unit1-stack', name: 'STACK', exerciseIds: ['stack-01'] },
  { id: 'unit2-logic', name: 'LOGIC', exerciseIds: [] },
  { id: 'unit3-stack-ii', name: 'STACK II', exerciseIds: [] },
  { id: 'unit4-heap', name: 'HEAP', exerciseIds: [] },
  { id: 'unit5-heap-ii', name: 'HEAP II', exerciseIds: [] },
  { id: 'unit6-final', name: 'FINAL', exerciseIds: [] },
  { id: 'unit7-x64', name: 'x86-64', exerciseIds: [] },
  { id: 'unit8-win-stack', name: 'WIN STACK', exerciseIds: [] },
  { id: 'unit9-win-heap', name: 'WIN HEAP', exerciseIds: [] },
  { id: 'unit10-challenges', name: 'CHALLENGES', exerciseIds: [] },
  { id: 'unit0-asm', name: 'ASM', exerciseIds: [] },
];

export const BADGES: Badge[] = [
  {
    id: 'stack-smasher',
    name: 'Stack Smasher',
    icon: '\u{1F528}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit1-stack');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'logic-hacker',
    name: 'Logic Hacker',
    icon: '\u{1F9E9}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit2-logic');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'stack-master',
    name: 'Stack Master',
    icon: '\u26A1',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit3-stack-ii');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'heap-explorer',
    name: 'Heap Explorer',
    icon: '\u{1F5FA}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit4-heap');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'heap-wizard',
    name: 'Heap Wizard',
    icon: '\u{1F9D9}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit5-heap-ii');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'certified-hacker',
    name: 'Certified Hacker',
    icon: '\u{1F3C6}',
    condition: (completed) => ALL_EXERCISES.every(ex => completed.has(ex.id)),
  },
];

export function getExercise(id: string): Exercise | undefined {
  return exerciseMap.get(id);
}

export function getAllExercises(): Exercise[] {
  return [...ALL_EXERCISES];
}
