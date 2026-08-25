export type Era = 'win95' | 'winxp' | 'win7' | 'win11';

const UNIT_ERA: Record<string, Era> = {
  'unit-intro-c': 'win95',
  'unit0-asm': 'win95',
  'unit7-x64': 'win95',
  'unit1-stack': 'win95',
  'unit3-stack-ii': 'win95',
  'unit2-logic': 'win95',
  'unit11-heap-internals': 'winxp',
  'unit4-heap': 'winxp',
  'unit5-heap-ii': 'winxp',
  'unit8-win-stack': 'winxp',
  'unit12-win-heap-internals': 'winxp',
  'unit9-win-heap': 'winxp',
  'unit13-arm': 'win7',
  'unit14-mips': 'win7',
  'unit15-mitigations': 'win7',
  'unit6-final': 'win7',
  'unit16-advanced': 'win7',
  'unit17-advanced-ii': 'win7',
  'unit18-kernel': 'win11',
  'unit19-glibc-bypass': 'win11',
  'unit20-teaching-gaps': 'win11',
  'unit10-challenges': 'win11',
};

const TRACK_ERA: Record<string, Era> = {
  'foundations': 'win95',
  'logic-input': 'win95',
  'linux-heap': 'winxp',
  'windows': 'winxp',
  'architectures': 'win7',
  'defense': 'win7',
  'advanced': 'win7',
  'kernel': 'win11',
  'glibc-bypass': 'win11',
  'techniques': 'win11',
  'challenges': 'win11',
};

export function getUnitEra(unitId: string): Era {
  return UNIT_ERA[unitId] ?? 'win11';
}

export function getTrackEra(trackId: string): Era {
  return TRACK_ERA[trackId] ?? 'win11';
}

export const ERA_LABELS: Record<Era, string> = {
  win95: 'Windows 95',
  winxp: 'Windows XP',
  win7: 'Windows 7',
  win11: 'Modern',
};
