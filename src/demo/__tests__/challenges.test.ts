import { describe, expect, it } from 'vitest';
import { didSucceed, evaluateCounter, evaluateStack, initialDraft, payloadFor, symbolsFor, textBytes, limitPayloadText, withDestination, sameInput } from '../challenges';

describe('walk-in demo attacks', () => {
  it('writes each typed character and preserves bytes beyond the return address', () => {
    const text = 'Alexandria Catherine Example';
    const result = evaluateStack('overflow', { ...initialDraft('overflow'), text }, 0x1000);
    expect(Array.from(result.sim.memory)).toEqual(textBytes(text));
    expect(result.sim.memory[0]).toBe('A'.charCodeAt(0));
    expect(result.sim.memory[16]).toBe(text.charCodeAt(16));
    expect(result.sim.overflowAt[16]).toBe(1);
    expect(result.outcome).toBe('crash');
  });

  it('uses UTF-8 byte offsets for accented names and emoji', () => {
    expect(textBytes('Zoë')).toEqual([0x5a, 0x6f, 0xc3, 0xab]);
    const text = 'é'.repeat(10);
    const input = { ...initialDraft('overflow'), text, ending: symbolsFor('overflow', 0x1000).admin };
    expect(payloadFor(input)).toHaveLength(24);
    expect(didSucceed('overflow', input, 0x1000)).toBe(true);
    expect(limitPayloadText('A'.repeat(19) + '🙂', 20)).toBe('A'.repeat(19));
    const repaired = withDestination({ ...input, text: 'A'.repeat(19) + '🙂' }, input.ending);
    expect(textBytes(repaired.text)).toHaveLength(20);
    expect(didSucceed('overflow', repaired, 0x1000)).toBe(true);
    expect(limitPayloadText('🙂'.repeat(20))).toBe('🙂'.repeat(16));
  });

  it('notices changes between names of the same length', () => {
    const input = { ...initialDraft('overflow'), text: 'Alex' };
    expect(sameInput(input, { ...input, text: 'Jade' })).toBe(false);
  });

  it.each([0, 8, 16, 20])('%i letters leave the return address intact', letters => {
    const result = evaluateStack('overflow', { ...initialDraft('overflow'), text: 'A'.repeat(letters) }, 0x1000);
    expect(result.outcome).toBe('normal');
    expect(result.destination).toBe(result.symbols.normal);
  });

  it('crashes on garbage, then grants admin only when the address is positioned correctly', () => {
    const draft = initialDraft('overflow');
    const admin = symbolsFor('overflow', 0x1000).admin;
    const crashed = evaluateStack('overflow', { ...draft, text: 'A'.repeat(24) }, 0x1000);
    expect(crashed.outcome).toBe('crash');
    expect(crashed.destination).toBe(0x41414141);
    expect(crashed.sim.overflowAt[15]).toBe(0);
    expect(crashed.sim.overflowAt[16]).toBe(1);
    expect(evaluateStack('overflow', { ...draft, text: 'A'.repeat(16), ending: admin }, 0x1000).outcome).toBe('normal');
    expect(evaluateStack('overflow', { ...draft, text: 'A'.repeat(24), ending: admin }, 0x1000).outcome).toBe('crash');
    const repaired = evaluateStack('overflow', { ...draft, text: 'A'.repeat(20), ending: admin }, 0x1000);
    expect(repaired.outcome).toBe('success');
    expect(repaired.destination).toBe(admin);
    expect(repaired.payload.slice(20)).toEqual([0x50, 0x81, 0x04, 0x08]);
  });

  it('returning normally is distinct from gaining admin', () => {
    const ending = symbolsFor('overflow', 0x1000).normal;
    expect(didSucceed('overflow', { ...initialDraft('overflow'), text: 'A'.repeat(20), ending }, 0x1000)).toBe(false);
  });

  it('creates independent memory snapshots for repeated and shorter attempts', () => {
    const input = { ...initialDraft('overflow'), text: 'A'.repeat(24) };
    const first = evaluateStack('overflow', input, 0x1000);
    first.sim.memory.fill(0);
    expect(evaluateStack('overflow', input, 0x1000).destination).toBe(0x41414141);
    expect(evaluateStack('overflow', initialDraft('overflow'), 0x1000).outcome).toBe('normal');
  });

  it('requires the leaked address instead of the previous or a nearby destination', () => {
    const input = initialDraft('addresses');
    const offset = 0x37000;
    const admin = symbolsFor('addresses', offset).admin;
    expect(evaluateStack('addresses', { ...input, ending: 0x08048150 }, offset).outcome).toBe('crash');
    expect(evaluateStack('addresses', { ...input, ending: admin + 0x1000 }, offset).outcome).toBe('crash');
    expect(evaluateStack('addresses', { ...input, ending: admin }, offset).outcome).toBe('success');
    expect(evaluateStack('addresses', { ...input, ending: admin }, offset + 0x1000).outcome).toBe('crash');
  });

  it('preserves the address bytes when constructing the payload', () => {
    expect(payloadFor({ text: '', ending: 0x12345678, requested: 8 })).toEqual([0x78, 0x56, 0x34, 0x12]);
  });

  it.each([
    [8, 16, false], [128, 136, false], [247, 255, false], [248, 0, true], [250, 2, true], [255, 7, true],
  ])('copies %i bytes into an allocation of %i with success=%s', (requested, allocated, success) => {
    expect(evaluateCounter(requested)).toMatchObject({ allocated, success, wrapped: success });
    expect(didSucceed('counter', { ...initialDraft('counter'), requested }, 0x1000)).toBe(success);
  });
});
