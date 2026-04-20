import { describe, it, expect } from 'vitest';
import { StackSim } from '../StackSim';

describe('StackSim', () => {
  describe('layout', () => {
    it('computes correct total size without canary', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      expect(sim.totalSize).toBe(16 + 4 + 4); // buf + ebp + ret
    });

    it('computes correct total size with canary', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      expect(sim.totalSize).toBe(16 + 4 + 4 + 4); // buf + canary + ebp + ret
    });

    it('uses 8-byte word size for x64', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, false, 8);
      expect(sim.totalSize).toBe(16 + 8 + 8); // buf + rbp + ret
    });

    it('uses config object constructor', () => {
      const sim = new StackSim({
        bufSize: 32,
        retAddr: 0x08048000,
        savedEbp: 0xbfff0200,
        useCanary: true,
        wordSize: 8,
      });
      expect(sim.bufSize).toBe(32);
      expect(sim.wordSize).toBe(8);
      expect(sim.useCanary).toBe(true);
      expect(sim.totalSize).toBe(32 + 8 + 8 + 8);
    });
  });

  describe('initial memory', () => {
    it('stores return address at correct offset', () => {
      const sim = new StackSim(16, 0x08048456, 0xbfff0200);
      expect(sim.getRetAddr()).toBe(0x08048456);
    });

    it('stores saved EBP at correct offset', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      expect(sim.getSavedEbp()).toBe(0xbfff0200);
    });

    it('stores canary when enabled', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      const canary = sim.getCanary();
      expect(canary).not.toBeNull();
      expect(canary).toBe(sim.canaryValue);
    });

    it('returns null canary when disabled', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      expect(sim.getCanary()).toBeNull();
    });
  });

  describe('writeInput', () => {
    it('writes bytes into buffer region', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      sim.writeInput([0x41, 0x42, 0x43, 0x44]);
      expect(sim.memory[0]).toBe(0x41);
      expect(sim.memory[3]).toBe(0x44);
      expect(sim.inputLen).toBe(4);
    });

    it('overflow changes return address', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      const payload = new Array(16).fill(0x41); // fill buffer
      payload.push(...[0xBB, 0xBB, 0xBB, 0xBB]); // overwrite EBP
      payload.push(...[0x56, 0x84, 0x04, 0x08]); // new ret addr (little-endian 0x08048456)
      sim.writeInput(payload);
      expect(sim.getRetAddr()).toBe(0x08048456);
    });

    it('marks overflow bytes', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      const payload = new Array(20).fill(0x41);
      sim.writeInput(payload);
      expect(sim.overflowAt[15]).toBe(0); // last buffer byte
      expect(sim.overflowAt[16]).toBe(1); // first overflow byte
    });

    it('resets previous state before new input', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      const overflow = new Array(24).fill(0x41);
      sim.writeInput(overflow);
      expect(sim.getRetAddr()).not.toBe(0x08048000);

      sim.writeInput([0x42]); // short input
      expect(sim.getRetAddr()).toBe(0x08048000); // restored
    });
  });

  describe('canary', () => {
    it('canaryIntact returns true when canary untouched', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      sim.writeInput(new Array(10).fill(0x41)); // short write, within buffer
      expect(sim.canaryIntact()).toBe(true);
    });

    it('canaryIntact returns false when canary overwritten', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      const payload = new Array(20).fill(0x41); // overflow past canary
      sim.writeInput(payload);
      expect(sim.canaryIntact()).toBe(false);
    });

    it('canaryIntact returns true when no canary', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      sim.writeInput(new Array(20).fill(0x41));
      expect(sim.canaryIntact()).toBe(true);
    });
  });

  describe('regionOf', () => {
    it('identifies buffer region', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      expect(sim.regionOf(0)).toBe('buffer');
      expect(sim.regionOf(15)).toBe('buffer');
    });

    it('identifies canary region', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      expect(sim.regionOf(16)).toBe('canary');
      expect(sim.regionOf(19)).toBe('canary');
    });

    it('identifies ebp region', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      expect(sim.regionOf(20)).toBe('ebp');
    });

    it('identifies ret region', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200, undefined, true);
      expect(sim.regionOf(24)).toBe('ret');
    });

    it('skips canary when disabled', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      expect(sim.regionOf(16)).toBe('ebp');
      expect(sim.regionOf(20)).toBe('ret');
    });
  });

  describe('little-endian helpers', () => {
    it('readLE/writeLE roundtrip', () => {
      const sim = new StackSim(32, 0, 0);
      sim._writeLE(0, 0xDEADBEEF, 4);
      expect(sim._readLE(0, 4)).toBe(0xDEADBEEF >>> 0);
    });

    it('stores in little-endian byte order', () => {
      const sim = new StackSim(32, 0, 0);
      sim._writeLE(0, 0x04030201, 4);
      expect(sim.memory[0]).toBe(0x01);
      expect(sim.memory[1]).toBe(0x02);
      expect(sim.memory[2]).toBe(0x03);
      expect(sim.memory[3]).toBe(0x04);
    });
  });

  describe('resetForInput', () => {
    it('restores original return address', () => {
      const sim = new StackSim(16, 0x08048000, 0xbfff0200);
      sim.writeInput(new Array(24).fill(0x41));
      sim.resetForInput();
      expect(sim.getRetAddr()).toBe(0x08048000);
      expect(sim.inputLen).toBe(0);
    });
  });
});
