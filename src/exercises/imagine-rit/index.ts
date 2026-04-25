import { Exercise } from '../types';
import rit01Stack from './rit-01-stack';
import rit02Overflow from './rit-02-overflow';
import rit03Hijack from './rit-03-hijack';
import rit04Aslr from './rit-04-aslr';
import babyRop from './baby-rop';

export const imagineRitExercises: Exercise[] = [
  rit01Stack,
  rit02Overflow,
  rit03Hijack,
  rit04Aslr,
  babyRop,
];
