import { describe, it, expect } from 'vitest';
import { simulateFmtRead, simulateFmtWrite } from '../FmtEngine';
import { StackSim } from '@/engine/simulators/StackSim';
import { Exercise } from '@/exercises/types';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'test-fmt',
    unitId: 'test',
    title: 'Test Format String',
    desc: '',
    source: { c: [] },
    mode: 'input-fmt-read',
    vizMode: 'stack',
    bufSize: 16,
    secretValue: 0xCAFEBABE,
    secretOffset: 3,
    check: () => false,
    winTitle: 'Win',
    winMsg: 'Won',
    ...overrides,
  } as Exercise;
}

describe('simulateFmtRead', () => {
  it('reads stack slots with %x', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise();
    const result = simulateFmtRead('%x%x%x%x', ex, sim, {});
    const actionLogs = result.logs.filter(l => l.cls === 'action');
    expect(actionLogs.length).toBeGreaterThanOrEqual(4);
  });

  it('detects secret value at correct slot', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise({ secretValue: 0xCAFEBABE });
    const result = simulateFmtRead('%x%x%x%x', ex, sim, {});
    expect(result.fmtLeakedSecret).toBe(true);
  });

  it('does not detect secret with too few %x', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise({ secretValue: 0xCAFEBABE });
    const result = simulateFmtRead('%x%x', ex, sim, {});
    expect(result.fmtLeakedSecret).toBe(false);
  });

  it('supports %p format specifier', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise();
    const result = simulateFmtRead('%p', ex, sim, {});
    const actionLogs = result.logs.filter(l => l.cls === 'action');
    expect(actionLogs.some(l => l.msg.includes('0x'))).toBe(true);
  });

  it('handles %n in read mode as info message', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise();
    const result = simulateFmtRead('%n', ex, sim, {});
    const errorLogs = result.logs.filter(l => l.cls === 'error');
    expect(errorLogs.some(l => l.msg.includes('WRITES'))).toBe(true);
  });

  it('passes through literal text', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise();
    const result = simulateFmtRead('hello', ex, sim, {});
    const outputLog = result.logs.find(l => l.msg.includes('printf output'));
    expect(outputLog?.msg).toContain('hello');
  });

  it('sets win on secret leak', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise({ secretValue: 0xCAFEBABE });
    const result = simulateFmtRead('%x%x%x%x', ex, sim, {});
    expect(result.win).toBeDefined();
    expect(result.win!.title).toBe('Win');
  });
});

describe('simulateFmtWrite', () => {
  it('writes to target address via %n', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const targetAddr = 0x0804a000;
    const ex = makeExercise({
      mode: 'input-fmt-write',
      targetAddr,
      fmtWrite: true,
    });
    const addrBytes = [
      targetAddr & 0xff,
      (targetAddr >> 8) & 0xff,
      (targetAddr >> 16) & 0xff,
      (targetAddr >> 24) & 0xff,
    ];
    const addrStr = addrBytes.map(b => String.fromCharCode(b)).join('');
    const input = addrStr + '%4$n';
    const result = simulateFmtWrite(input, ex, sim);
    expect(result.fmtWriteSuccess).toBe(true);
  });

  it('fails write to wrong address', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const ex = makeExercise({
      mode: 'input-fmt-write',
      targetAddr: 0x0804a000,
      fmtWrite: true,
    });
    const wrongAddr = [0x01, 0x02, 0x03, 0x04];
    const input = wrongAddr.map(b => String.fromCharCode(b)).join('') + '%4$n';
    const result = simulateFmtWrite(input, ex, sim);
    expect(result.fmtWriteSuccess).toBe(false);
  });

  it('supports direct parameter access %N$n', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const targetAddr = 0x0804a000;
    const ex = makeExercise({
      mode: 'input-fmt-write',
      targetAddr,
      fmtWrite: true,
    });
    const addrBytes = [
      targetAddr & 0xff,
      (targetAddr >> 8) & 0xff,
      (targetAddr >> 16) & 0xff,
      (targetAddr >> 24) & 0xff,
    ];
    const addrStr = addrBytes.map(b => String.fromCharCode(b)).join('');
    const input = addrStr + '%4$n';
    const result = simulateFmtWrite(input, ex, sim);
    expect(result.fmtWriteSuccess).toBe(true);
    expect(result.win).toBeDefined();
  });

  it('parses hex escape sequences in input', () => {
    const sim = new StackSim(16, 0x08048000, 0xbfff0200);
    const targetAddr = 0x0804a000;
    const ex = makeExercise({
      mode: 'input-fmt-write',
      targetAddr,
      fmtWrite: true,
    });
    const input = '\\x00\\xa0\\x04\\x08%4$n';
    const result = simulateFmtWrite(input, ex, sim);
    expect(result.fmtWriteSuccess).toBe(true);
  });
});
