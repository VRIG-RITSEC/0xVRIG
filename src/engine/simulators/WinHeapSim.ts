export type WinVersion = 'win7' | 'win8' | 'win10';

export interface ChunkInfo {
  /** Total size in bytes (including 8-byte header). */
  size: number;
  allocated: boolean;
  dataStart: number;
  flags: number;
  previousSize: number;
  /** True when served from LFH rather than the back-end. */
  lfh: boolean;
}

export interface ChunkDisplay {
  addr: number;
  size: number;
  allocated: boolean;
  dataStart: number;
  dataSize: number;
  highlighted: boolean;
  prevInUse?: boolean;
}

export interface WinFreeLists {
  listHints: Record<number, number[]>;
  lfhBuckets: Record<number, { active: boolean; slots: { addr: number; inUse: boolean }[] }>;
}

export interface MallocResult {
  addr: number;
  dataAddr: number;
  dataSize: number;
}

// ── _HEAP_ENTRY layout (8 bytes) ──────────────────────────────────
// Offset  Field          Bytes   Notes
//   0     Size             2     In 8-byte granularity units
//   2     Flags            1     BUSY=0x01, EXTRA=0x02, FILL=0x04, ...
//   3     SmallTagIndex    1     Checksum: (Size ^ Flags ^ PrevSize) & 0xFF
//   4     PreviousSize     2     Previous block size (8-byte units)
//   6     SegmentOffset    1     (unused in simulation)
//   7     UnusedBytes      1     Tail slack
// All fields are XOR-encoded with encodingKey.

const HEAP_ENTRY_SIZE = 8;
const GRANULARITY = 8;

const FLAG_BUSY = 0x01;
const FLAG_EXTRA = 0x02;

// LFH activation threshold: 17 allocations of the same size class
const LFH_ACTIVATION_THRESHOLD = 17;

// Number of back-end ListHints buckets (index 0..127)
const LIST_HINTS_COUNT = 128;

// Size of UserBlocks region per LFH bucket
const LFH_USERBLOCKS_SLOTS = 32;

export class WinHeapSim {
  memorySize: number;
  memory: Uint8Array;
  written: Uint8Array;
  highlight: { start: number; end: number };
  chunks: Map<number, ChunkInfo>;
  HEADER_SIZE: number;
  funcPtrs: Record<string, number>;
  baseAddr: number;
  winVersion: WinVersion;

  /** Random per-heap XOR key applied to every _HEAP_ENTRY header. */
  encodingKey: number;

  /**
   * Back-end free lists indexed by block size class (size in 8-byte units,
   * 0..127).  Each entry is a list of chunk addresses.
   */
  listHints: Record<number, number[]>;

  /** Per-bucket allocation counter used to decide when to activate LFH. */
  activationCounts: Record<number, number>;

  /** LFH bucket state, keyed by size class (8-byte units). */
  lfhBuckets: Record<number, { active: boolean; slots: { addr: number; inUse: boolean }[] }>;

  /** Address of the wilderness / top region. */
  topAddr: number;
  topSize: number;

  lastError: string | null;

  constructor(size: number = 1024, winVersion: WinVersion = 'win10') {
    this.memorySize = size;
    this.memory = new Uint8Array(size);
    this.written = new Uint8Array(size);
    this.highlight = { start: -1, end: -1 };
    this.chunks = new Map();
    this.HEADER_SIZE = HEAP_ENTRY_SIZE;
    this.funcPtrs = {};
    this.baseAddr = 0x00500000;
    this.winVersion = winVersion;

    // Random 32-bit encoding key (per-heap instance)
    this.encodingKey = (Math.random() * 0xFFFFFFFF) >>> 0;

    this.listHints = {};
    this.activationCounts = {};
    this.lfhBuckets = {};

    this.topAddr = 0;
    this.topSize = size;
    this.lastError = null;
  }

  // ── Low-level helpers ───────────────────────────────────────────

  _writeLE(offset: number, value: number, size: number): void {
    for (let i = 0; i < size; i++) {
      this.memory[offset + i] = (value >>> (i * 8)) & 0xFF;
    }
  }

  _readLE(offset: number, size: number): number {
    let v = 0;
    for (let i = size - 1; i >= 0; i--) {
      v = (v * 256) + this.memory[offset + i];
    }
    return v >>> 0;
  }

  // ── Encoding helpers ────────────────────────────────────────────

  /** XOR-encode a 16-bit value with the lower 16 bits of the encoding key. */
  _encode16(value: number): number {
    return (value ^ (this.encodingKey & 0xFFFF)) & 0xFFFF;
  }

  _decode16(encoded: number): number {
    return (encoded ^ (this.encodingKey & 0xFFFF)) & 0xFFFF;
  }

  /** XOR-encode an 8-bit value with the lowest byte of the encoding key. */
  _encode8(value: number): number {
    return (value ^ (this.encodingKey & 0xFF)) & 0xFF;
  }

  _decode8(encoded: number): number {
    return (encoded ^ (this.encodingKey & 0xFF)) & 0xFF;
  }

  /**
   * Compute the SmallTagIndex checksum for the *plaintext* header fields.
   *
   * SmallTagIndex = (SizeLo ^ SizeHi ^ Flags ^ PrevSizeLo ^ PrevSizeHi) & 0xFF
   */
  _computeSmallTagIndex(sizeUnits: number, flags: number, prevSizeUnits: number): number {
    const sizeLo = sizeUnits & 0xFF;
    const sizeHi = (sizeUnits >>> 8) & 0xFF;
    const prevLo = prevSizeUnits & 0xFF;
    const prevHi = (prevSizeUnits >>> 8) & 0xFF;
    return (sizeLo ^ sizeHi ^ flags ^ prevLo ^ prevHi) & 0xFF;
  }

  // ── Header read / write ─────────────────────────────────────────

  /**
   * Write a full _HEAP_ENTRY at the given address.  All fields are stored
   * XOR-encoded.
   */
  _writeHeapEntry(
    addr: number,
    sizeUnits: number,
    flags: number,
    prevSizeUnits: number,
    unusedBytes: number,
  ): void {
    const tag = this._computeSmallTagIndex(sizeUnits, flags, prevSizeUnits);

    const encSize = this._encode16(sizeUnits);
    const encFlags = this._encode8(flags);
    const encTag = this._encode8(tag);
    const encPrev = this._encode16(prevSizeUnits);
    const encSeg = this._encode8(0);
    const encUnused = this._encode8(unusedBytes);

    this._writeLE(addr, encSize, 2);
    this.memory[addr + 2] = encFlags;
    this.memory[addr + 3] = encTag;
    this._writeLE(addr + 4, encPrev, 2);
    this.memory[addr + 6] = encSeg;
    this.memory[addr + 7] = encUnused;

    for (let i = 0; i < HEAP_ENTRY_SIZE; i++) {
      this.written[addr + i] = 1;
    }
  }

  /**
   * Read and decode a _HEAP_ENTRY header, returning plaintext field values.
   */
  _readHeapEntry(addr: number): {
    sizeUnits: number;
    flags: number;
    smallTagIndex: number;
    prevSizeUnits: number;
    segmentOffset: number;
    unusedBytes: number;
  } {
    const encSize = this._readLE(addr, 2);
    const encFlags = this.memory[addr + 2];
    const encTag = this.memory[addr + 3];
    const encPrev = this._readLE(addr + 4, 2);
    const encSeg = this.memory[addr + 6];
    const encUnused = this.memory[addr + 7];

    return {
      sizeUnits: this._decode16(encSize),
      flags: this._decode8(encFlags),
      smallTagIndex: this._decode8(encTag),
      prevSizeUnits: this._decode16(encPrev),
      segmentOffset: this._decode8(encSeg),
      unusedBytes: this._decode8(encUnused),
    };
  }

  /**
   * Validate the SmallTagIndex checksum of the header at `addr`.
   * Returns true when the stored tag matches the recomputed value.
   */
  validateHeader(addr: number): boolean {
    const h = this._readHeapEntry(addr);
    const expected = this._computeSmallTagIndex(h.sizeUnits, h.flags, h.prevSizeUnits);
    return h.smallTagIndex === expected;
  }

  // ── Size helpers ────────────────────────────────────────────────

  /** Round a user-requested byte count up to total chunk bytes (8-aligned, includes header). */
  _alignSize(requested: number): number {
    let total = requested + HEAP_ENTRY_SIZE;
    total = (total + (GRANULARITY - 1)) & ~(GRANULARITY - 1);
    if (total < GRANULARITY * 2) total = GRANULARITY * 2; // min 16 bytes
    return total;
  }

  /** Convert byte size to 8-byte granularity units. */
  _toUnits(bytes: number): number {
    return (bytes / GRANULARITY) | 0;
  }

  /** Convert units back to bytes. */
  _toBytes(units: number): number {
    return units * GRANULARITY;
  }

  /** Size-class bucket index (same as sizeUnits, clamped to LIST_HINTS_COUNT-1). */
  _bucketIndex(sizeUnits: number): number {
    return Math.min(sizeUnits, LIST_HINTS_COUNT - 1);
  }

  // ── Flink / Blink in freed blocks ──────────────────────────────

  /**
   * Write LIST_ENTRY (Flink + Blink) into the data area of a free chunk.
   */
  _writeListEntry(dataAddr: number, flink: number, blink: number): void {
    this._writeLE(dataAddr, flink, 4);
    this._writeLE(dataAddr + 4, blink, 4);
    for (let i = 0; i < 8; i++) {
      this.written[dataAddr + i] = 1;
    }
  }

  /** Read LIST_ENTRY from a freed chunk's data area. */
  _readListEntry(dataAddr: number): { flink: number; blink: number } {
    return {
      flink: this._readLE(dataAddr, 4),
      blink: this._readLE(dataAddr + 4, 4),
    };
  }

  // ── Back-end: ListHints free lists ─────────────────────────────

  _addToListHints(chunkAddr: number, sizeUnits: number): void {
    const bucket = this._bucketIndex(sizeUnits);
    if (!this.listHints[bucket]) this.listHints[bucket] = [];

    const dataAddr = chunkAddr + HEAP_ENTRY_SIZE;
    const list = this.listHints[bucket];

    // Doubly-linked: new chunk goes to front.
    const hasOldHead = list.length > 0;
    const oldHead = hasOldHead ? list[0] : -1;

    // Sentinel value for "list head" back-link
    const sentinel = (this.baseAddr + 0xFFFF0000) >>> 0;

    // flink = old head's data (or sentinel for empty list)
    const flink = hasOldHead ? oldHead + HEAP_ENTRY_SIZE : sentinel;
    const blink = sentinel;

    this._writeListEntry(dataAddr, flink, blink);

    // Patch old head's blink to point back to new head
    if (hasOldHead) {
      const oldDataAddr = oldHead + HEAP_ENTRY_SIZE;
      this._writeLE(oldDataAddr + 4, dataAddr, 4);
      for (let i = 4; i < 8; i++) {
        this.written[oldDataAddr + i] = 1;
      }
    }

    list.unshift(chunkAddr);
  }

  _removeFromListHints(chunkAddr: number, sizeUnits: number): boolean {
    const bucket = this._bucketIndex(sizeUnits);
    const list = this.listHints[bucket];
    if (!list) return false;
    const idx = list.indexOf(chunkAddr);
    if (idx === -1) return false;
    list.splice(idx, 1);
    return true;
  }

  // ── LFH helpers ────────────────────────────────────────────────

  /**
   * Create LFH UserBlocks region for a given size class.  Carves slots
   * from the top of the heap.
   */
  _activateLfhBucket(sizeUnits: number): void {
    const slotBytes = this._toBytes(sizeUnits);
    const regionBytes = slotBytes * LFH_USERBLOCKS_SLOTS;

    if (this.topSize < regionBytes) return; // not enough space

    const regionStart = this.topAddr;
    this.topAddr += regionBytes;
    this.topSize -= regionBytes;

    const slots: { addr: number; inUse: boolean }[] = [];
    for (let i = 0; i < LFH_USERBLOCKS_SLOTS; i++) {
      const slotAddr = regionStart + i * slotBytes;
      slots.push({ addr: slotAddr, inUse: false });

      // Write initial header for each slot (free)
      this._writeHeapEntry(slotAddr, sizeUnits, 0, 0, 0);
    }

    this.lfhBuckets[sizeUnits] = { active: true, slots };
  }

  /**
   * Select a free LFH slot.  On win7 the scan is deterministic (first-fit);
   * on win8+ the starting position is randomised (bitmap randomisation).
   */
  _selectLfhSlot(sizeUnits: number): { addr: number; inUse: boolean } | null {
    const bucket = this.lfhBuckets[sizeUnits];
    if (!bucket || !bucket.active) return null;

    const n = bucket.slots.length;
    if (n === 0) return null;

    let start: number;
    if (this.winVersion === 'win7') {
      start = 0; // deterministic first-fit
    } else {
      start = Math.floor(Math.random() * n); // win8+ randomized
    }

    for (let i = 0; i < n; i++) {
      const idx = (start + i) % n;
      if (!bucket.slots[idx].inUse) return bucket.slots[idx];
    }
    return null; // all slots occupied
  }

  // ── Coalescing ─────────────────────────────────────────────────

  /**
   * Try to merge `addr` with the chunk immediately *after* it.
   * Returns the (possibly unchanged) chunk address.
   */
  _coalesceForward(addr: number): number {
    const chunk = this.chunks.get(addr);
    if (!chunk) return addr;
    if (chunk.lfh) return addr; // no coalesce for LFH

    const nextAddr = addr + chunk.size;
    const nextChunk = this.chunks.get(nextAddr);
    if (!nextChunk || nextChunk.allocated || nextChunk.lfh) return addr;

    const nextUnits = this._toUnits(nextChunk.size);
    this._removeFromListHints(nextAddr, nextUnits);

    chunk.size += nextChunk.size;
    this.chunks.delete(nextAddr);
    return addr;
  }

  /**
   * Try to merge `addr` with the chunk immediately *before* it.
   * Returns the address of the (possibly new) merged chunk.
   */
  _coalesceBackward(addr: number): number {
    const chunk = this.chunks.get(addr);
    if (!chunk) return addr;
    if (chunk.lfh) return addr;

    // Read PreviousSize from our header
    const header = this._readHeapEntry(addr);
    if (header.prevSizeUnits === 0) return addr;

    const prevSize = this._toBytes(header.prevSizeUnits);
    const prevAddr = addr - prevSize;
    const prevChunk = this.chunks.get(prevAddr);
    if (!prevChunk || prevChunk.allocated || prevChunk.lfh) return addr;

    const prevUnits = this._toUnits(prevChunk.size);
    this._removeFromListHints(prevAddr, prevUnits);

    prevChunk.size += chunk.size;
    this.chunks.delete(addr);
    return prevAddr;
  }

  // ── Public API ─────────────────────────────────────────────────

  /**
   * Allocate `requested` bytes.  Returns header address, data address and
   * usable data size, or null when the heap is exhausted.
   *
   * This is the equivalent of HeapAlloc.
   */
  malloc(requested: number): MallocResult | null {
    const chunkSize = this._alignSize(requested);
    const sizeUnits = this._toUnits(chunkSize);
    const dataSize = chunkSize - HEAP_ENTRY_SIZE;
    this.lastError = null;

    // Track activation count for LFH
    const bucket = this._bucketIndex(sizeUnits);
    if (!this.activationCounts[bucket]) this.activationCounts[bucket] = 0;
    this.activationCounts[bucket]++;

    // ── 1. Try LFH if activated for this size class ──────────
    if (this.lfhBuckets[sizeUnits]?.active) {
      const slot = this._selectLfhSlot(sizeUnits);
      if (slot) {
        slot.inUse = true;
        const addr = slot.addr;

        // Write busy header
        this._writeHeapEntry(addr, sizeUnits, FLAG_BUSY, 0, chunkSize - requested - HEAP_ENTRY_SIZE);

        this.chunks.set(addr, {
          size: chunkSize,
          allocated: true,
          dataStart: addr + HEAP_ENTRY_SIZE,
          flags: FLAG_BUSY,
          previousSize: 0,
          lfh: true,
        });

        return { addr, dataAddr: addr + HEAP_ENTRY_SIZE, dataSize };
      }
    }

    // ── 2. Check if LFH should be activated ──────────────────
    if (
      this.activationCounts[bucket] >= LFH_ACTIVATION_THRESHOLD &&
      !this.lfhBuckets[sizeUnits]?.active
    ) {
      this._activateLfhBucket(sizeUnits);
      // Now try LFH immediately
      const slot = this._selectLfhSlot(sizeUnits);
      if (slot) {
        slot.inUse = true;
        const addr = slot.addr;
        this._writeHeapEntry(addr, sizeUnits, FLAG_BUSY, 0, chunkSize - requested - HEAP_ENTRY_SIZE);
        this.chunks.set(addr, {
          size: chunkSize,
          allocated: true,
          dataStart: addr + HEAP_ENTRY_SIZE,
          flags: FLAG_BUSY,
          previousSize: 0,
          lfh: true,
        });
        return { addr, dataAddr: addr + HEAP_ENTRY_SIZE, dataSize };
      }
    }

    // ── 3. Back-end: exact-fit from ListHints ────────────────
    if (this.listHints[bucket] && this.listHints[bucket].length > 0) {
      const addr = this.listHints[bucket].shift()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        chunk.flags = FLAG_BUSY;
        const prevUnits = this._toUnits(chunk.previousSize);
        this._writeHeapEntry(addr, sizeUnits, FLAG_BUSY, prevUnits, chunkSize - requested - HEAP_ENTRY_SIZE);
        return { addr, dataAddr: addr + HEAP_ENTRY_SIZE, dataSize };
      }
    }

    // ── 4. Best-fit scan across ListHints ────────────────────
    for (let b = bucket + 1; b < LIST_HINTS_COUNT; b++) {
      if (this.listHints[b] && this.listHints[b].length > 0) {
        const addr = this.listHints[b].shift()!;
        const chunk = this.chunks.get(addr);
        if (chunk && chunk.size >= chunkSize) {
          chunk.allocated = true;
          chunk.flags = FLAG_BUSY;
          const prevUnits = this._toUnits(chunk.previousSize);
          this._writeHeapEntry(addr, this._toUnits(chunk.size), FLAG_BUSY, prevUnits, chunk.size - requested - HEAP_ENTRY_SIZE);
          return { addr, dataAddr: addr + HEAP_ENTRY_SIZE, dataSize: chunk.size - HEAP_ENTRY_SIZE };
        }
      }
    }

    // ── 5. Wilderness (top chunk) ────────────────────────────
    if (this.topSize >= chunkSize) {
      const addr = this.topAddr;
      this.topAddr += chunkSize;
      this.topSize -= chunkSize;

      // Determine previous chunk's size in units for the PreviousSize field
      let prevSizeUnits = 0;
      // Walk chunks to find the one ending right at addr
      for (const [cAddr, cInfo] of this.chunks) {
        if (cAddr + cInfo.size === addr) {
          prevSizeUnits = this._toUnits(cInfo.size);
          break;
        }
      }

      this._writeHeapEntry(addr, sizeUnits, FLAG_BUSY, prevSizeUnits, chunkSize - requested - HEAP_ENTRY_SIZE);

      this.chunks.set(addr, {
        size: chunkSize,
        allocated: true,
        dataStart: addr + HEAP_ENTRY_SIZE,
        flags: FLAG_BUSY,
        previousSize: this._toBytes(prevSizeUnits),
        lfh: false,
      });

      return { addr, dataAddr: addr + HEAP_ENTRY_SIZE, dataSize };
    }

    return null; // OOM
  }

  /**
   * Free the block at `addr`.  Accepts either the header address or the
   * data pointer (addr + 8).  Returns true on success.
   *
   * This is the equivalent of HeapFree.
   */
  free(addr: number): boolean {
    let chunkAddr = addr;
    if (!this.chunks.has(addr) && this.chunks.has(addr - HEAP_ENTRY_SIZE)) {
      chunkAddr = addr - HEAP_ENTRY_SIZE;
    }
    const chunk = this.chunks.get(chunkAddr);
    if (!chunk) return false;
    if (!chunk.allocated) return false;

    this.lastError = null;

    // ── LFH free: just mark slot as available ────────────────
    if (chunk.lfh) {
      chunk.allocated = false;
      chunk.flags = 0;

      const sizeUnits = this._toUnits(chunk.size);
      this._writeHeapEntry(chunkAddr, sizeUnits, 0, 0, 0);

      const bucket = this.lfhBuckets[sizeUnits];
      if (bucket) {
        const slot = bucket.slots.find(s => s.addr === chunkAddr);
        if (slot) slot.inUse = false;
      }
      return true;
    }

    // ── Back-end free ────────────────────────────────────────
    chunk.allocated = false;
    chunk.flags = 0;
    const sizeUnits = this._toUnits(chunk.size);

    // Write free header (clears BUSY flag)
    const prevSizeUnits = this._toUnits(chunk.previousSize);
    this._writeHeapEntry(chunkAddr, sizeUnits, 0, prevSizeUnits, 0);

    // Update next chunk's PreviousSize to point to us
    const nextAddr = chunkAddr + chunk.size;
    const nextChunk = this.chunks.get(nextAddr);
    if (nextChunk) {
      nextChunk.previousSize = chunk.size;
      const nextUnits = this._toUnits(nextChunk.size);
      const nextPrevUnits = this._toUnits(nextChunk.previousSize);
      this._writeHeapEntry(nextAddr, nextUnits, nextChunk.allocated ? FLAG_BUSY : 0, nextPrevUnits, 0);
    }

    // Coalesce with neighbours
    let mergedAddr = this._coalesceForward(chunkAddr);
    mergedAddr = this._coalesceBackward(mergedAddr);

    // If chunk was absorbed (address changed via backward merge) update ref
    const mergedChunk = this.chunks.get(mergedAddr);
    if (!mergedChunk) return true; // absorbed into top somehow

    const mergedUnits = this._toUnits(mergedChunk.size);

    // Rewrite header after merge
    const mergedPrevUnits = this._toUnits(mergedChunk.previousSize);
    this._writeHeapEntry(mergedAddr, mergedUnits, 0, mergedPrevUnits, 0);

    // Add to ListHints with Flink/Blink
    this._addToListHints(mergedAddr, mergedUnits);

    return true;
  }

  // ── Memory read/write ──────────────────────────────────────────

  write(offset: number, bytes: number[]): void {
    for (let i = 0; i < bytes.length && (offset + i) < this.memorySize; i++) {
      this.memory[offset + i] = bytes[i];
      this.written[offset + i] = 1;
    }
  }

  read(offset: number, size: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < size && (offset + i) < this.memorySize; i++) {
      result.push(this.memory[offset + i]);
    }
    return result;
  }

  // ── Display helpers ────────────────────────────────────────────

  getChunksForDisplay(): ChunkDisplay[] {
    return Array.from(this.chunks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([addr, info]) => ({
        addr,
        size: info.size,
        allocated: info.allocated,
        dataStart: addr + HEAP_ENTRY_SIZE,
        dataSize: info.size - HEAP_ENTRY_SIZE,
        highlighted: addr >= this.highlight.start && addr < this.highlight.end,
        prevInUse: info.allocated,
      }));
  }

  getFreeLists(): WinFreeLists {
    const hints: Record<number, number[]> = {};
    for (const [k, v] of Object.entries(this.listHints)) {
      hints[Number(k)] = [...v];
    }

    const buckets: Record<number, { active: boolean; slots: { addr: number; inUse: boolean }[] }> = {};
    for (const [k, v] of Object.entries(this.lfhBuckets)) {
      buckets[Number(k)] = {
        active: v.active,
        slots: v.slots.map(s => ({ ...s })),
      };
    }

    return { listHints: hints, lfhBuckets: buckets };
  }

  markRegion(start: number, end: number): void {
    this.highlight = { start, end };
  }

  clearHighlight(): void {
    this.highlight = { start: -1, end: -1 };
  }
}
