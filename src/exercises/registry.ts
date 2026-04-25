import { Exercise, Unit, Badge, Track } from './types';
import { unitIntroCExercises } from './unit-intro-c';
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
import { unit10Exercises } from './unit10-challenges';
import { unit11Exercises } from './unit11-heap-internals';
import { unit12Exercises } from './unit12-win-heap-internals';
import { unit13Exercises } from './unit13-arm';
import { unit14Exercises } from './unit14-mips';
import { unit15Exercises } from './unit15-mitigations';
import { unit16Exercises } from './unit16-advanced';
import { unit17Exercises } from './unit17-advanced-ii';
import { unit18Exercises } from './unit18-kernel';
import { unit19Exercises } from './unit19-glibc-bypass';
import { unit20Exercises } from './unit20-teaching-gaps';
import { imagineRitExercises } from './imagine-rit';

const ALL_EXERCISES: Exercise[] = [
  ...unitIntroCExercises,
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
  ...unit10Exercises,
  ...unit11Exercises,
  ...unit12Exercises,
  ...unit13Exercises,
  ...unit14Exercises,
  ...unit15Exercises,
  ...unit16Exercises,
  ...unit17Exercises,
  ...unit18Exercises,
  ...unit19Exercises,
  ...unit20Exercises,
  ...imagineRitExercises,
];

const exerciseMap = new Map<string, Exercise>();
for (const ex of ALL_EXERCISES) {
  exerciseMap.set(ex.id, ex);
}

export const UNITS: Unit[] = [
  // Foundations
  { id: 'unit-intro-c', name: 'Intro to C', exerciseIds: ['c-01', 'c-02', 'c-03', 'c-04', 'c-05', 'c-06', 'c-07', 'c-08'] },
  { id: 'unit0-asm', name: 'ASM', exerciseIds: ['asm-01', 'asm-02', 'asm-03', 'asm-04', 'asm-05', 'asm-06', 'asm-07', 'asm-08', 'asm-09', 'asm-10'] },
  { id: 'unit7-x64', name: 'x86-64', exerciseIds: ['x64-29', 'x64-30', 'x64-31', 'x64-32', 'x64-33', 'x64-34', 'x64-35', 'x64-36'] },
  { id: 'unit1-stack', name: 'STACK', exerciseIds: ['stack-01', 'stack-02', 'stack-03', 'stack-04', 'stack-05'] },
  { id: 'unit3-stack-ii', name: 'STACK II', exerciseIds: ['stack2-11', 'stack2-12', 'stack2-13', 'stack2-14'] },
  // Logic & Input
  { id: 'unit2-logic', name: 'Logic & Input Mismatches', exerciseIds: ['logic-06', 'logic-07', 'logic-08', 'logic-09', 'logic-10'] },
  // Linux Heap
  { id: 'unit11-heap-internals', name: 'Heap Internals', exerciseIds: ['hint-53', 'hint-54', 'hint-55', 'hint-56', 'hint-57', 'hint-58'] },
  { id: 'unit4-heap', name: 'HEAP', exerciseIds: ['heap-15', 'heap-18', 'heap-16', 'heap-17'] },
  { id: 'unit5-heap-ii', name: 'HEAP II', exerciseIds: ['heap2-19', 'heap2-20', 'heap2-21', 'heap2-22', 'heap2-23', 'heap2-24', 'heap2-25', 'heap2-26'] },
  // Windows
  { id: 'unit8-win-stack', name: 'WIN STACK', exerciseIds: ['win-37', 'win-38', 'win-40', 'win-39', 'win-41', 'win-42'], platform: 'windows' },
  { id: 'unit12-win-heap-internals', name: 'Win Heap Internals', exerciseIds: ['whint-59', 'whint-60', 'whint-61', 'whint-62'], platform: 'windows' },
  { id: 'unit9-win-heap', name: 'WIN HEAP', exerciseIds: ['win-43', 'win-44', 'win-45', 'win-46'], platform: 'windows' },
  // Architectures
  { id: 'unit13-arm', name: 'ARM', exerciseIds: ['arm-63', 'arm-64', 'arm-65', 'arm-66', 'arm-67', 'arm-68', 'arm-69', 'arm-70'] },
  { id: 'unit14-mips', name: 'MIPS', exerciseIds: ['mips-71', 'mips-72', 'mips-73', 'mips-74', 'mips-75', 'mips-76', 'mips-77', 'mips-78'] },
  // Defense & Theory
  { id: 'unit15-mitigations', name: 'Mitigations', exerciseIds: ['mit-79', 'mit-83', 'mit-80', 'mit-81', 'mit-82', 'mit-84', 'mit-85', 'mit-86'] },
  // Advanced
  { id: 'unit6-final', name: 'Exploit Chains', exerciseIds: ['final-27', 'final-28'] },
  { id: 'unit16-advanced', name: 'Advanced I', exerciseIds: ['adv-87', 'adv-88', 'adv-89', 'adv-90', 'adv-91', 'adv-92', 'adv-93', 'adv-94'] },
  { id: 'unit17-advanced-ii', name: 'Advanced II', exerciseIds: ['adv2-95', 'adv2-99', 'adv2-98', 'adv2-96', 'adv2-97', 'adv2-100', 'adv2-101', 'adv2-102'] },
  // Challenges
  // Kernel
  { id: 'unit18-kernel', name: 'Kernel PWN', exerciseIds: ['kern-103', 'kern-104', 'kern-105', 'kern-106', 'kern-107'] },
  { id: 'unit19-glibc-bypass', name: 'glibc Version Bypasses', exerciseIds: ['glibc-108', 'glibc-109', 'glibc-110'] },
  { id: 'unit20-teaching-gaps', name: 'Exploitation Techniques', exerciseIds: ['gap-111', 'gap-112', 'gap-113', 'gap-114', 'gap-115'] },
  // Challenges
  { id: 'unit10-challenges', name: 'CTF Lab', exerciseIds: ['ctf-47', 'ctf-48', 'ctf-49', 'ctf-50', 'ctf-51', 'ctf-52'] },
];

export const TRACKS: Track[] = [
  { id: 'foundations', name: 'Foundations', unitIds: ['unit-intro-c', 'unit0-asm', 'unit7-x64', 'unit1-stack', 'unit3-stack-ii'] },
  { id: 'logic-input', name: 'Logic & Input', unitIds: ['unit2-logic'] },
  { id: 'linux-heap', name: 'Linux Heap', unitIds: ['unit11-heap-internals', 'unit4-heap', 'unit5-heap-ii'] },
  { id: 'windows', name: 'Windows', unitIds: ['unit8-win-stack', 'unit12-win-heap-internals', 'unit9-win-heap'] },
  { id: 'architectures', name: 'Architectures', unitIds: ['unit13-arm', 'unit14-mips'] },
  { id: 'defense', name: 'Defense & Theory', unitIds: ['unit15-mitigations'] },
  { id: 'advanced', name: 'Advanced', unitIds: ['unit6-final', 'unit16-advanced', 'unit17-advanced-ii'] },
  { id: 'kernel', name: 'Kernel', unitIds: ['unit18-kernel'] },
  { id: 'glibc-bypass', name: 'glibc Bypasses', unitIds: ['unit19-glibc-bypass'] },
  { id: 'techniques', name: 'Exploitation Techniques', unitIds: ['unit20-teaching-gaps'] },
  { id: 'challenges', name: 'Challenges', unitIds: ['unit10-challenges'] },
];

export const BADGES: Badge[] = [
  {
    id: 'c-beginner',
    name: 'C Beginner',
    icon: '\u{1F4DA}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit-intro-c');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
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
    id: 'heap-internist',
    name: 'Heap Internist',
    icon: '\u{1F9EC}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit11-heap-internals');
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
    id: 'x64-master',
    name: 'x64 Master',
    icon: '\u{1F4BB}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit7-x64');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
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
    id: 'arm-exploiter',
    name: 'ARM Exploiter',
    icon: '\u{1F4AA}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit13-arm');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'mips-exploiter',
    name: 'MIPS Exploiter',
    icon: '\u{1F680}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit14-mips');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'mitigation-master',
    name: 'Mitigation Master',
    icon: '\u{1F6E1}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit15-mitigations');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'advanced-attacker',
    name: 'Advanced Attacker',
    icon: '\u{1F525}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit16-advanced');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'modern-threat',
    name: 'Modern Threat',
    icon: '\u{1F47E}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit17-advanced-ii');
      return !!unit && unit.exerciseIds.length > 0 && unit.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'multi-arch',
    name: 'Multi-Arch',
    icon: '\u{1F30D}',
    condition: (completed) => {
      const x86 = UNITS.find(u => u.id === 'unit0-asm');
      const x64 = UNITS.find(u => u.id === 'unit7-x64');
      const arm = UNITS.find(u => u.id === 'unit13-arm');
      const mips = UNITS.find(u => u.id === 'unit14-mips');
      return !!(x86 && x64 && arm && mips) &&
        x86.exerciseIds.every(id => completed.has(id)) &&
        x64.exerciseIds.every(id => completed.has(id)) &&
        arm.exerciseIds.every(id => completed.has(id)) &&
        mips.exerciseIds.every(id => completed.has(id));
    },
  },
  {
    id: 'kernel-hacker',
    name: 'Kernel Hacker',
    icon: '\u{1F451}',
    condition: (completed) => {
      const unit = UNITS.find(u => u.id === 'unit18-kernel');
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
