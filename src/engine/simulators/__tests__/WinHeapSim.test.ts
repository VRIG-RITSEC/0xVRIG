import { describe, it, expect } from 'vitest';
import { WinHeapSim } from '../WinHeapSim';

describe('WinHeapSim', () => {
  // ── 1. Basic heapAlloc / heapFree ──────────────────────────────

  describe('basic heapAlloc / heapFree', () => {
    it('returns non-null for a small allocation', () => {
      const heap = new WinHeapSim(2048);
      const result = heap.malloc(16);
      expect(result).not.toBeNull();
      expect(result!.dataSize).toBeGreaterThanOrEqual(16);
    });

    it('returns sequential addresses from the back-end', () => {
      const heap = new WinHeapSim(2048);
      const a = heap.malloc(16)!;
      const b = heap.malloc(16)!;
      expect(b.addr).toBeGreaterThan(a.addr);
    });

    it('returns null when heap is exhausted', () => {
      const heap = new WinHeapSim(64);
      heap.malloc(24);
      heap.malloc(24);
      const result = heap.malloc(24);
      expect(result).toBeNull();
    });

    it('aligns allocations to 8 bytes', () => {
      const heap = new WinHeapSim(2048);
      const a = heap.malloc(3)!;
      const b = heap.malloc(5)!;
      expect(a.addr % 8).toBe(0);
      expect(b.addr % 8).toBe(0);
    });

    it('marks chunk as allocated after malloc', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(16)!;
      const chunk = heap.chunks.get(r.addr)!;
      expect(chunk.allocated).toBe(true);
    });

    it('marks chunk as free after free()', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(16)!;
      heap.free(r.addr);
      expect(heap.chunks.get(r.addr)!.allocated).toBe(false);
    });

    it('returns false when freeing an unknown address', () => {
      const heap = new WinHeapSim(2048);
      expect(heap.free(0xDEAD)).toBe(false);
    });

    it('returns false when double-freeing', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(16)!;
      heap.free(r.addr);
      expect(heap.free(r.addr)).toBe(false);
    });

    it('accepts data pointer (addr + HEADER_SIZE)', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(16)!;
      expect(heap.free(r.dataAddr)).toBe(true);
    });
  });

  // ── 2. Encoding key XOR on headers ─────────────────────────────

  describe('encoding key XOR on headers', () => {
    it('each heap instance gets a unique encoding key', () => {
      const a = new WinHeapSim(1024);
      const b = new WinHeapSim(1024);
      // With 2^32 space, collision is astronomically unlikely
      // but we cannot assert inequality with 100% certainty;
      // instead check that the key is a 32-bit number.
      expect(a.encodingKey >>> 0).toBe(a.encodingKey);
      expect(b.encodingKey >>> 0).toBe(b.encodingKey);
    });

    it('raw header bytes differ from plaintext values', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(24)!;
      const chunkSize = heap.chunks.get(r.addr)!.size;
      const sizeUnits = (chunkSize / 8) | 0;

      // Read the raw 2-byte Size field stored at the header address
      const rawSize = heap._readLE(r.addr, 2);
      // The plaintext sizeUnits should differ from the encoded value
      // (unless the lower 16 bits of encodingKey happen to be 0, extremely rare)
      if ((heap.encodingKey & 0xFFFF) !== 0) {
        expect(rawSize).not.toBe(sizeUnits);
      }
    });

    it('decode round-trips correctly', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(16)!;
      const decoded = heap._readHeapEntry(r.addr);
      const chunkSize = heap.chunks.get(r.addr)!.size;
      expect(decoded.sizeUnits).toBe((chunkSize / 8) | 0);
      expect(decoded.flags & 0x01).toBe(1); // BUSY flag
    });
  });

  // ── 3. SmallTagIndex checksum validation ───────────────────────

  describe('SmallTagIndex checksum', () => {
    it('header passes validation after malloc', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(32)!;
      expect(heap.validateHeader(r.addr)).toBe(true);
    });

    it('header passes validation after free', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(32)!;
      heap.free(r.addr);
      expect(heap.validateHeader(r.addr)).toBe(true);
    });

    it('corrupted header fails validation', () => {
      const heap = new WinHeapSim(2048);
      const r = heap.malloc(32)!;
      // Flip a bit in the encoded SmallTagIndex byte
      heap.memory[r.addr + 3] ^= 0x42;
      expect(heap.validateHeader(r.addr)).toBe(false);
    });

    it('checksum covers Size, Flags, and PreviousSize', () => {
      const heap = new WinHeapSim(2048);
      // Compute manually
      const tag = heap._computeSmallTagIndex(4, 0x01, 0);
      // (4 ^ 0 ^ 0x01 ^ 0 ^ 0) & 0xFF = 5
      expect(tag).toBe(5);
    });
  });

  // ── 4. ListHints free list management ──────────────────────────

  describe('ListHints free lists', () => {
    it('freed back-end chunk is added to ListHints', () => {
      const heap = new WinHeapSim(2048);
      const a = heap.malloc(16)!;
      const _guard = heap.malloc(16)!; // prevent top-merge
      const chunkSize = heap.chunks.get(a.addr)!.size;
      const units = (chunkSize / 8) | 0;
      const bucket = Math.min(units, 127);

      heap.free(a.addr);
      expect(heap.listHints[bucket]).toBeDefined();
      expect(heap.listHints[bucket].length).toBe(1);
      expect(heap.listHints[bucket][0]).toBe(a.addr);
    });

    it('reuses a ListHints chunk on malloc', () => {
      const heap = new WinHeapSim(2048);
      const a = heap.malloc(16)!;
      const _guard = heap.malloc(16)!;
      heap.free(a.addr);
      const b = heap.malloc(16)!;
      expect(b.addr).toBe(a.addr);
    });

    it('removes chunk from ListHints after reallocation', () => {
      const heap = new WinHeapSim(2048);
      const a = heap.malloc(16)!;
      const _guard = heap.malloc(16)!;
      const chunkSize = heap.chunks.get(a.addr)!.size;
      const units = (chunkSize / 8) | 0;
      const bucket = Math.min(units, 127);

      heap.free(a.addr);
      heap.malloc(16);
      expect(heap.listHints[bucket]?.length ?? 0).toBe(0);
    });

    it('getFreeLists returns listHints snapshot', () => {
      const heap = new WinHeapSim(2048);
      const a = heap.malloc(16)!;
      const _guard = heap.malloc(16)!;
      heap.free(a.addr);
      const fl = heap.getFreeLists();
      expect(fl).toHaveProperty('listHints');
      expect(fl).toHaveProperty('lfhBuckets');
      const totalEntries = Object.values(fl.listHints).flat().length;
      expect(totalEntries).toBeGreaterThan(0);
    });
  });

  // ── 5. LFH activation after 17 allocations ────────────────────

  describe('LFH activation', () => {
    it('does not activate LFH before 17 allocations', () => {
      const heap = new WinHeapSim(8192);
      for (let i = 0; i < 16; i++) {
        heap.malloc(16);
      }
      const chunkSize = 24; // 16 + 8 header -> aligned to 24
      const units = (chunkSize / 8) | 0;
      expect(heap.lfhBuckets[units]?.active).toBeFalsy();
    });

    it('activates LFH on the 17th allocation of same size', () => {
      const heap = new WinHeapSim(8192);
      for (let i = 0; i < 17; i++) {
        heap.malloc(16);
      }
      const chunkSize = 24; // aligned
      const units = (chunkSize / 8) | 0;
      expect(heap.lfhBuckets[units]?.active).toBe(true);
    });

    it('LFH bucket has pre-allocated slots', () => {
      const heap = new WinHeapSim(8192);
      for (let i = 0; i < 17; i++) {
        heap.malloc(16);
      }
      const chunkSize = 24;
      const units = (chunkSize / 8) | 0;
      const bucket = heap.lfhBuckets[units];
      expect(bucket).toBeDefined();
      expect(bucket.slots.length).toBeGreaterThan(0);
    });

    it('serves allocations from LFH after activation', () => {
      const heap = new WinHeapSim(8192);
      // First 17 go through back-end and trigger activation
      for (let i = 0; i < 17; i++) {
        heap.malloc(16);
      }
      // 18th should come from LFH
      const r = heap.malloc(16)!;
      const chunk = heap.chunks.get(r.addr)!;
      expect(chunk.lfh).toBe(true);
    });

    it('LFH free marks slot as not in use (no Flink/Blink)', () => {
      const heap = new WinHeapSim(8192);
      for (let i = 0; i < 17; i++) {
        heap.malloc(16);
      }
      const r = heap.malloc(16)!;
      expect(heap.chunks.get(r.addr)!.lfh).toBe(true);

      heap.free(r.addr);
      const chunkSize = 24;
      const units = (chunkSize / 8) | 0;
      const slot = heap.lfhBuckets[units].slots.find(s => s.addr === r.addr);
      expect(slot).toBeDefined();
      expect(slot!.inUse).toBe(false);

      // Verify no Flink/Blink written (data area should not have LIST_ENTRY)
      const flink = heap._readLE(r.dataAddr, 4);
      const blink = heap._readLE(r.dataAddr + 4, 4);
      // For LFH free, the data area is NOT touched for list entry;
      // the values should not be sentinel/list pointers
      expect(flink).not.toBe((heap.baseAddr + 0xFFFF0000) >>> 0);
      expect(blink).not.toBe((heap.baseAddr + 0xFFFF0000) >>> 0);
    });
  });

  // ── 6. LFH randomized slot selection (win8+) ──────────────────

  describe('LFH slot selection', () => {
    it('win7: deterministic slot order (first-fit)', () => {
      const heap = new WinHeapSim(16384, 'win7');
      for (let i = 0; i < 17; i++) {
        heap.malloc(16);
      }
      // After LFH activation, allocate several and collect addresses
      const addrs: number[] = [];
      for (let i = 0; i < 5; i++) {
        const r = heap.malloc(16);
        if (r) addrs.push(r.addr);
      }
      // On win7, first-fit means strictly ascending order within the
      // UserBlocks region
      for (let i = 1; i < addrs.length; i++) {
        expect(addrs[i]).toBeGreaterThan(addrs[i - 1]);
      }
    });

    it('win8+: slot selection is randomized', () => {
      // Allocate many times and check that addresses are NOT always
      // in monotonically increasing order.  We run multiple heaps to
      // reduce flakiness.
      let nonMonotonic = false;
      for (let trial = 0; trial < 10; trial++) {
        const heap = new WinHeapSim(16384, 'win10');
        for (let i = 0; i < 17; i++) {
          heap.malloc(16);
        }
        const addrs: number[] = [];
        for (let i = 0; i < 8; i++) {
          const r = heap.malloc(16);
          if (r) addrs.push(r.addr);
        }
        for (let i = 1; i < addrs.length; i++) {
          if (addrs[i] < addrs[i - 1]) {
            nonMonotonic = true;
            break;
          }
        }
        if (nonMonotonic) break;
      }
      expect(nonMonotonic).toBe(true);
    });

    it('win8: also uses randomized selection', () => {
      let nonMonotonic = false;
      for (let trial = 0; trial < 10; trial++) {
        const heap = new WinHeapSim(16384, 'win8');
        for (let i = 0; i < 17; i++) {
          heap.malloc(16);
        }
        const addrs: number[] = [];
        for (let i = 0; i < 8; i++) {
          const r = heap.malloc(16);
          if (r) addrs.push(r.addr);
        }
        for (let i = 1; i < addrs.length; i++) {
          if (addrs[i] < addrs[i - 1]) {
            nonMonotonic = true;
            break;
          }
        }
        if (nonMonotonic) break;
      }
      expect(nonMonotonic).toBe(true);
    });
  });

  // ── 7. Coalescing adjacent free chunks ─────────────────────────

  describe('coalescing', () => {
    it('forward-coalesces two adjacent free back-end chunks', () => {
      const heap = new WinHeapSim(4096);
      const a = heap.malloc(32)!;
      const b = heap.malloc(32)!;
      const _guard = heap.malloc(32)!; // prevent top-merge edge effects
      const aSize = heap.chunks.get(a.addr)!.size;
      const bSize = heap.chunks.get(b.addr)!.size;

      heap.free(b.addr);
      heap.free(a.addr);

      // After freeing a, it should coalesce forward with b
      const merged = heap.chunks.get(a.addr);
      expect(merged).toBeDefined();
      expect(merged!.size).toBe(aSize + bSize);
      // b's entry should no longer exist
      expect(heap.chunks.has(b.addr)).toBe(false);
    });

    it('backward-coalesces with preceding free chunk', () => {
      const heap = new WinHeapSim(4096);
      const a = heap.malloc(32)!;
      const b = heap.malloc(32)!;
      const _guard = heap.malloc(32)!;
      const aSize = heap.chunks.get(a.addr)!.size;
      const bSize = heap.chunks.get(b.addr)!.size;

      heap.free(a.addr);
      heap.free(b.addr);

      // b should merge backward into a
      const merged = heap.chunks.get(a.addr);
      expect(merged).toBeDefined();
      expect(merged!.size).toBe(aSize + bSize);
      expect(heap.chunks.has(b.addr)).toBe(false);
    });

    it('does not coalesce LFH chunks', () => {
      const heap = new WinHeapSim(16384, 'win10');
      // Activate LFH
      for (let i = 0; i < 17; i++) {
        heap.malloc(16);
      }
      const a = heap.malloc(16)!;
      const b = heap.malloc(16)!;
      expect(heap.chunks.get(a.addr)!.lfh).toBe(true);

      heap.free(a.addr);
      heap.free(b.addr);

      // Both chunks should still exist independently
      expect(heap.chunks.has(a.addr)).toBe(true);
      expect(heap.chunks.has(b.addr)).toBe(true);
    });
  });

  // ── 8. Flink / Blink in freed chunks ───────────────────────────

  describe('Flink / Blink (LIST_ENTRY) in freed chunks', () => {
    it('writes LIST_ENTRY in data area of freed back-end chunk', () => {
      const heap = new WinHeapSim(4096);
      const a = heap.malloc(32)!;
      const _guard = heap.malloc(32)!;
      heap.free(a.addr);

      // The data area should now contain Flink and Blink
      const flink = heap._readLE(a.dataAddr, 4);
      const blink = heap._readLE(a.dataAddr + 4, 4);

      // Both should be non-zero (sentinel or pointer)
      expect(flink).not.toBe(0);
      expect(blink).not.toBe(0);
    });

    it('second freed chunk has Flink pointing to first freed chunk data', () => {
      const heap = new WinHeapSim(4096);
      const a = heap.malloc(64)!;
      const b = heap.malloc(64)!;
      const c = heap.malloc(64)!;
      const _guard = heap.malloc(64)!;

      // Free a, then c (skip b so they do not coalesce)
      heap.free(a.addr);
      heap.free(c.addr);

      // The chunk freed second (c) should be the list head.
      // Because they have different sizes after alignment they may
      // land in different buckets, so only check when same bucket.
      const aUnits = (heap.chunks.get(a.addr)!.size / 8) | 0;
      const cUnits = (heap.chunks.get(c.addr)!.size / 8) | 0;

      if (aUnits === cUnits) {
        const cFlink = heap._readLE(c.dataAddr, 4);
        // c's Flink should reference a's data area
        expect(cFlink).toBe(a.dataAddr);
      }
    });

    it('Blink of list head points to sentinel', () => {
      const heap = new WinHeapSim(4096);
      const a = heap.malloc(32)!;
      const _guard = heap.malloc(32)!;
      heap.free(a.addr);

      const blink = heap._readLE(a.dataAddr + 4, 4);
      const sentinel = (heap.baseAddr + 0xFFFF0000) >>> 0;
      expect(blink).toBe(sentinel);
    });

    it('does NOT write LIST_ENTRY for LFH freed chunks', () => {
      const heap = new WinHeapSim(16384, 'win10');
      for (let i = 0; i < 17; i++) {
        heap.malloc(32);
      }
      const r = heap.malloc(32)!;
      expect(heap.chunks.get(r.addr)!.lfh).toBe(true);

      // Zero the data area first so we can detect writes
      heap.write(r.dataAddr, [0, 0, 0, 0, 0, 0, 0, 0]);
      heap.free(r.addr);

      const sentinel = (heap.baseAddr + 0xFFFF0000) >>> 0;
      const blink = heap._readLE(r.dataAddr + 4, 4);
      expect(blink).not.toBe(sentinel);
    });
  });

  // ── Compatibility surface ──────────────────────────────────────

  describe('compatible interface with HeapSim', () => {
    it('has memory, written, chunks, funcPtrs, highlight, memorySize, baseAddr, HEADER_SIZE', () => {
      const heap = new WinHeapSim(1024);
      expect(heap.memory).toBeInstanceOf(Uint8Array);
      expect(heap.written).toBeInstanceOf(Uint8Array);
      expect(heap.chunks).toBeInstanceOf(Map);
      expect(typeof heap.funcPtrs).toBe('object');
      expect(heap.highlight).toHaveProperty('start');
      expect(heap.highlight).toHaveProperty('end');
      expect(typeof heap.memorySize).toBe('number');
      expect(typeof heap.baseAddr).toBe('number');
      expect(heap.HEADER_SIZE).toBe(8);
    });

    it('write / read round-trip', () => {
      const heap = new WinHeapSim(1024);
      heap.write(10, [0x41, 0x42, 0x43]);
      expect(heap.read(10, 3)).toEqual([0x41, 0x42, 0x43]);
    });

    it('_writeLE / _readLE round-trip', () => {
      const heap = new WinHeapSim(1024);
      heap._writeLE(0, 0xDEADBEEF, 4);
      expect(heap._readLE(0, 4)).toBe(0xDEADBEEF >>> 0);
    });

    it('markRegion / clearHighlight', () => {
      const heap = new WinHeapSim(1024);
      heap.markRegion(10, 20);
      expect(heap.highlight).toEqual({ start: 10, end: 20 });
      heap.clearHighlight();
      expect(heap.highlight).toEqual({ start: -1, end: -1 });
    });

    it('getChunksForDisplay returns ChunkDisplay[]', () => {
      const heap = new WinHeapSim(2048);
      heap.malloc(16);
      heap.malloc(32);
      const display = heap.getChunksForDisplay();
      expect(display.length).toBe(2);
      for (const d of display) {
        expect(d).toHaveProperty('addr');
        expect(d).toHaveProperty('size');
        expect(d).toHaveProperty('allocated');
        expect(d).toHaveProperty('dataStart');
        expect(d).toHaveProperty('dataSize');
        expect(d).toHaveProperty('highlighted');
      }
    });
  });
});
