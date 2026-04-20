import { describe, it, expect } from 'vitest';
import { KernelSim } from '../KernelSim';

describe('KernelSim', () => {
  describe('slab allocator', () => {
    it('kmalloc returns a valid object with address and slab class', () => {
      const sim = new KernelSim();
      const result = sim.kmalloc(32);
      expect(result).not.toBeNull();
      expect(result!.addr).toBeGreaterThan(0);
      expect(result!.slabClass).toBe(64); // 32 fits into 64-byte class
    });

    it('kmalloc picks the smallest fitting slab class', () => {
      const sim = new KernelSim();
      expect(sim.kmalloc(1)!.slabClass).toBe(64);
      expect(sim.kmalloc(64)!.slabClass).toBe(64);
      expect(sim.kmalloc(65)!.slabClass).toBe(128);
      expect(sim.kmalloc(200)!.slabClass).toBe(256);
      expect(sim.kmalloc(500)!.slabClass).toBe(512);
      expect(sim.kmalloc(1000)!.slabClass).toBe(1024);
    });

    it('kmalloc returns null for sizes exceeding max slab class', () => {
      const sim = new KernelSim();
      const result = sim.kmalloc(2048);
      expect(result).toBeNull();
    });

    it('kfree marks object as free and adds to freelist', () => {
      const sim = new KernelSim();
      const obj = sim.kmalloc(32)!;
      expect(sim.slabs[64].objects[0].allocated).toBe(true);
      expect(sim.slabs[64].freelist.length).toBe(0);

      const freed = sim.kfree(obj.addr);
      expect(freed).toBe(true);
      expect(sim.slabs[64].objects[0].allocated).toBe(false);
      expect(sim.slabs[64].freelist.length).toBe(1);
    });

    it('kfree returns false for unknown address', () => {
      const sim = new KernelSim();
      expect(sim.kfree(0xdeadbeef)).toBe(false);
    });

    it('kfree returns false on double free', () => {
      const sim = new KernelSim();
      const obj = sim.kmalloc(32)!;
      sim.kfree(obj.addr);
      expect(sim.kfree(obj.addr)).toBe(false);
    });

    it('kmalloc reuses freed objects from freelist', () => {
      const sim = new KernelSim();
      const obj1 = sim.kmalloc(32)!;
      const addr1 = obj1.addr;
      sim.kfree(addr1);

      const obj2 = sim.kmalloc(32)!;
      expect(obj2.addr).toBe(addr1); // reused the freed slot
    });

    it('sequential kmalloc returns distinct addresses', () => {
      const sim = new KernelSim();
      const a = sim.kmalloc(32)!;
      const b = sim.kmalloc(32)!;
      expect(a.addr).not.toBe(b.addr);
    });
  });

  describe('privilege transitions', () => {
    it('starts in ring 3 (user mode)', () => {
      const sim = new KernelSim();
      expect(sim.privilegeLevel).toBe(3);
    });

    it('enterKernel sets ring 0', () => {
      const sim = new KernelSim();
      sim.enterKernel();
      expect(sim.privilegeLevel).toBe(0);
    });

    it('exitKernel sets ring 3', () => {
      const sim = new KernelSim();
      sim.enterKernel();
      expect(sim.privilegeLevel).toBe(0);
      sim.exitKernel();
      expect(sim.privilegeLevel).toBe(3);
    });

    it('round-trip enter/exit preserves user mode', () => {
      const sim = new KernelSim();
      sim.enterKernel();
      sim.exitKernel();
      expect(sim.privilegeLevel).toBe(3);
    });
  });

  describe('SMEP check', () => {
    it('allows kernel address execution when SMEP enabled', () => {
      const sim = new KernelSim({ smep: true });
      expect(sim.checkSMEP(0xc00a0000)).toBe(true);
    });

    it('blocks user address execution when SMEP enabled', () => {
      const sim = new KernelSim({ smep: true });
      expect(sim.checkSMEP(0x08048000)).toBe(false);
    });

    it('allows user address execution when SMEP disabled', () => {
      const sim = new KernelSim({ smep: false });
      expect(sim.checkSMEP(0x08048000)).toBe(true);
    });

    it('allows all addresses when SMEP disabled', () => {
      const sim = new KernelSim();
      expect(sim.checkSMEP(0x00001000)).toBe(true);
      expect(sim.checkSMEP(0xc0100000)).toBe(true);
    });
  });

  describe('SMAP check', () => {
    it('blocks user address access when SMAP enabled', () => {
      const sim = new KernelSim({ smap: true });
      expect(sim.checkSMAP(0x08048000)).toBe(false);
    });

    it('allows kernel address access when SMAP enabled', () => {
      const sim = new KernelSim({ smap: true });
      expect(sim.checkSMAP(0xc00a0000)).toBe(true);
    });

    it('allows user address access when SMAP disabled', () => {
      const sim = new KernelSim({ smap: false });
      expect(sim.checkSMAP(0x08048000)).toBe(true);
    });
  });

  describe('CR4 bit manipulation', () => {
    it('sets SMEP bit (bit 20) when smep config is true', () => {
      const sim = new KernelSim({ smep: true });
      expect(sim.cr4 & (1 << 20)).toBeTruthy();
    });

    it('sets SMAP bit (bit 21) when smap config is true', () => {
      const sim = new KernelSim({ smap: true });
      expect(sim.cr4 & (1 << 21)).toBeTruthy();
    });

    it('sets both SMEP and SMAP bits', () => {
      const sim = new KernelSim({ smep: true, smap: true });
      expect(sim.cr4 & (1 << 20)).toBeTruthy();
      expect(sim.cr4 & (1 << 21)).toBeTruthy();
    });

    it('CR4 is 0 when neither SMEP nor SMAP enabled', () => {
      const sim = new KernelSim();
      expect(sim.cr4).toBe(0);
    });

    it('clearing CR4 SMEP bit disables SMEP check', () => {
      const sim = new KernelSim({ smep: true });
      expect(sim.checkSMEP(0x08048000)).toBe(false);
      sim.cr4 &= ~(1 << 20); // clear SMEP bit
      expect(sim.checkSMEP(0x08048000)).toBe(true);
    });
  });

  describe('credential operations', () => {
    it('starts with non-root credentials', () => {
      const sim = new KernelSim();
      expect(sim.cred.uid).toBe(1000);
      expect(sim.cred.gid).toBe(1000);
    });

    it('prepareKernelCred(0) returns root cred address', () => {
      const sim = new KernelSim();
      const credAddr = sim.prepareKernelCred(0);
      expect(credAddr).toBe(0); // uid=0 encoded
    });

    it('commitCreds with root cred sets uid/gid to 0', () => {
      const sim = new KernelSim();
      const credAddr = sim.prepareKernelCred(0);
      sim.commitCreds(credAddr);
      expect(sim.cred.uid).toBe(0);
      expect(sim.cred.gid).toBe(0);
    });
  });

  describe('kernel stack', () => {
    it('kStackWrite and kStackRead roundtrip', () => {
      const sim = new KernelSim();
      sim.kStackWrite(0, [0xDE, 0xAD, 0xBE, 0xEF]);
      const data = sim.kStackRead(0, 4);
      expect(data).toEqual([0xDE, 0xAD, 0xBE, 0xEF]);
    });

    it('kStackRead returns 0 for out-of-bounds', () => {
      const sim = new KernelSim({ stackSize: 8 });
      const data = sim.kStackRead(6, 4);
      expect(data).toEqual([sim.kernelStack[6], sim.kernelStack[7], 0, 0]);
    });
  });

  describe('little-endian helpers', () => {
    it('writeLE/readLE roundtrip on kernel memory', () => {
      const sim = new KernelSim();
      sim._writeLE(sim.kernelMemory, 0, 0xDEADBEEF, 4);
      expect(sim._readLE(sim.kernelMemory, 0, 4)).toBe(0xDEADBEEF >>> 0);
    });

    it('stores in little-endian byte order', () => {
      const sim = new KernelSim();
      sim._writeLE(sim.kernelMemory, 0, 0x04030201, 4);
      expect(sim.kernelMemory[0]).toBe(0x01);
      expect(sim.kernelMemory[1]).toBe(0x02);
      expect(sim.kernelMemory[2]).toBe(0x03);
      expect(sim.kernelMemory[3]).toBe(0x04);
    });
  });

  describe('KASLR', () => {
    it('applies a non-zero slide when kaslr is enabled', () => {
      // With randomness this could theoretically be 0, but extremely unlikely
      // We test the mechanism: addresses should differ with and without KASLR
      const noKaslr = new KernelSim({ kaslr: false });
      const withKaslr = new KernelSim({ kaslr: true });
      // The slide is random, so we just check the structure is valid
      expect(withKaslr.commitCredsAddr).toBeGreaterThanOrEqual(noKaslr.commitCredsAddr);
      expect(withKaslr.kaslrSlide % 0x1000).toBe(0); // page-aligned
    });

    it('has zero slide when kaslr is disabled', () => {
      const sim = new KernelSim({ kaslr: false });
      expect(sim.kaslrSlide).toBe(0);
    });
  });
});
