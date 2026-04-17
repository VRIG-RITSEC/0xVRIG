import { Exercise, Unit, Badge } from './types';
import { unit0Exercises } from './unit0-asm';
import { unit1Exercises } from './unit1-stack';
import { unit2Exercises } from './unit2-logic';
import { unit3Exercises } from './unit3-stack-ii';
import { unit4Exercises } from './unit4-heap';
import { unit5Exercises } from './unit5-heap-ii';
import { unit6Exercises } from './unit6-final';
import { unit7Exercises } from './unit7-x64';
import { unit8Exercises } from './unit8-win-stack';
import { unit9Exercises } from './unit9-win-heap';

// All exercises from all units, flattened
const ALL_EXERCISES: Exercise[] = [
  ...unit0Exercises,
  ...unit1Exercises,
  ...unit2Exercises,
  ...unit3Exercises,
  ...unit4Exercises,
  ...unit5Exercises,
  ...unit6Exercises,
  ...unit7Exercises,
  ...unit8Exercises,
  ...unit9Exercises,
];

// Exercise lookup map
const exerciseMap = new Map<string, Exercise>();
for (const ex of ALL_EXERCISES) {
  exerciseMap.set(ex.id, ex);
}

export const UNITS: Unit[] = [
  { id: 'unit0-asm', name: 'ASM', exerciseIds: ['asm-01', 'asm-02', 'asm-03', 'asm-04', 'asm-05', 'asm-06', 'asm-07', 'asm-08', 'asm-09', 'asm-10'] },
  { id: 'unit1-stack', name: 'STACK', exerciseIds: ['stack-01', 'stack-02', 'stack-03', 'stack-04', 'stack-05'] },
  { id: 'unit2-logic', name: 'LOGIC', exerciseIds: ['logic-06', 'logic-07', 'logic-08', 'logic-09', 'logic-10'] },
  { id: 'unit3-stack-ii', name: 'STACK II', exerciseIds: ['stack2-11', 'stack2-12', 'stack2-13', 'stack2-14'] },
  { id: 'unit4-heap', name: 'HEAP', exerciseIds: ['heap-15', 'heap-16', 'heap-17', 'heap-18'] },
  { id: 'unit5-heap-ii', name: 'HEAP II', exerciseIds: ['heap2-19', 'heap2-20', 'heap2-21', 'heap2-22', 'heap2-23', 'heap2-24', 'heap2-25', 'heap2-26'] },
  { id: 'unit6-final', name: 'FINAL', exerciseIds: ['final-27', 'final-28'] },
  { id: 'unit7-x64', name: 'x86-64', exerciseIds: ['x64-29', 'x64-30', 'x64-31', 'x64-32', 'x64-33', 'x64-34', 'x64-35', 'x64-36'] },
  { id: 'unit8-win-stack', name: 'WIN STACK', exerciseIds: ['win-37', 'win-38', 'win-39', 'win-40', 'win-41', 'win-42'], platform: 'windows' },
  { id: 'unit9-win-heap', name: 'WIN HEAP', exerciseIds: ['win-43', 'win-44', 'win-45', 'win-46'], platform: 'windows' },
  { id: 'unit10-challenges', name: 'CHALLENGES', exerciseIds: [] },
];

export const BADGES: Badge[] = [
  {
    id: 'asm-apprentice',
    name: 'ASM Apprentice',
    icon: '\u{1F527}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit0-asm');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
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
    id: 'full-chain',
    name: 'Full Chain',
    icon: '\u{1F517}',
    condition: (completed) => completed.has('final-27'),
  },
  {
    id: 'windows-warrior',
    name: 'Windows Warrior',
    icon: '\u{1FA9F}',
    condition: (completed) => {
      const u8 = UNITS.find(u => u.id === 'unit8-win-stack');
      const u9 = UNITS.find(u => u.id === 'unit9-win-heap');
      return !!(u8 && u9) &&
        u8.exerciseIds.every(id => completed.has(id)) &&
        u9.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'x64-master',
    name: 'x64 Master',
    icon: '\u{1F4BB}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit7-x64');
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
