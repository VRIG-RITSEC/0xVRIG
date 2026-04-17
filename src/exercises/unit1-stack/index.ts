import ex01StackFrame from './ex01-stack-frame';
import ex02Overflow from './ex02-overflow';
import ex03Hijack from './ex03-hijack';
import ex04Aslr from './ex04-aslr';
import ex05Canary from './ex05-canary';
import { Exercise } from '../types';

export const unit1Exercises: Exercise[] = [
  ex01StackFrame,
  ex02Overflow,
  ex03Hijack,
  ex04Aslr,
  ex05Canary,
];
