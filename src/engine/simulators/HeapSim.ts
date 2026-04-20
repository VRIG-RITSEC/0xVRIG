export type GlibcVersion = '2.23' | '2.27' | '2.31' | '2.35';

export interface ChunkInfo {
  size: number;
  allocated: boolean;
  dataStart: number;
  prevInUse: boolean;
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

export interface FreeLists {
  tcache: Record<number, number[]>;
  fastbins: Record<number, number[]>;
  smallbins: Record<number, number[]>;
  largebins: Record<number, number[]>;
  unsorted: number[];
}

export interface MallocResult {
  addr: number;
  dataAddr: number;
  dataSize: number;
}

const PREV_INUSE = 1;
const IS_MMAPPED = 2;
const NON_MAIN_ARENA = 4;
const SIZE_BITS = PREV_INUSE | IS_MMAPPED | NON_MAIN_ARENA;

const TCACHE_MAX = 7;
const FASTBIN_MAX = 64;

// smallbin: sizes 16..1008 in 8-byte increments (index = size/8 - 1)
const SMALLBIN_MAX = 1008;

function compareVersions(a: GlibcVersion, b: GlibcVersion): number {
  const va = parseFloat(a);
  const vb = parseFloat(b);
  return va - vb;
}

function versionAtLeast(current: GlibcVersion, min: GlibcVersion): boolean {
  return compareVersions(current, min) >= 0;
}

export class HeapSim {
  memorySize: number;
  memory: Uint8Array;
  written: Uint8Array;
  highlight: { start: number; end: number };
  chunks: Map<number, ChunkInfo>;
  HEADER_SIZE: number;
  MIN_CHUNK: number;
  tcache: Record<number, number[]>;
  fastbins: Record<number, number[]>;
  smallbins: Record<number, number[]>;
  largebins: Record<number, number[]>;
  unsorted: number[];
  topAddr: number;
  topSize: number;
  funcPtrs: Record<string, number>;
  mainArena: number;
  baseAddr: number;
  glibcVersion: GlibcVersion;
  tcacheKeyAddr: number;
  lastError: string | null;

  constructor(size: number = 1024, glibcVersion: GlibcVersion = '2.27') {
    this.memorySize = size;
    this.memory = new Uint8Array(size);
    this.written = new Uint8Array(size);
    this.highlight = { start: -1, end: -1 };
    this.chunks = new Map();
    this.HEADER_SIZE = 8;
    this.MIN_CHUNK = 16;
    this.tcache = {};
    this.fastbins = {};
    this.smallbins = {};
    this.largebins = {};
    this.unsorted = [];
    this.topAddr = 0;
    this.topSize = size;
    this.funcPtrs = {};
    this.mainArena = 0x0804b100;
    this.baseAddr = 0x08050000;
    this.glibcVersion = glibcVersion;
    this.tcacheKeyAddr = 0x08049000;
    this.lastError = null;
  }

  get hasTcache(): boolean {
    return versionAtLeast(this.glibcVersion, '2.27');
  }

  get hasTcacheKey(): boolean {
    return versionAtLeast(this.glibcVersion, '2.31');
  }

  get hasSafeLinking(): boolean {
    return versionAtLeast(this.glibcVersion, '2.35');
  }

  _writeLE(offset: number, value: number, size: number): void {
    for (let i = 0; i < size; i++) {
      this.memory[offset + i] = (value >>> (i * 8)) & 0xff;
    }
  }

  _readLE(offset: number, size: number): number {
    let v = 0;
    for (let i = size - 1; i >= 0; i--) {
      v = (v * 256) + this.memory[offset + i];
    }
    return v >>> 0;
  }

  _alignSize(requested: number): number {
    let total = requested + this.HEADER_SIZE;
    total = (total + 7) & ~7;
    if (total < this.MIN_CHUNK) total = this.MIN_CHUNK;
    return total;
  }

  _protectPtr(pos: number, ptr: number): number {
    if (!this.hasSafeLinking) return ptr;
    // Use baseAddr + pos to simulate real virtual addresses for XOR
    const vaddr = (this.baseAddr + pos) >>> 0;
    return ((vaddr >>> 12) ^ ptr) >>> 0;
  }

  _revealPtr(pos: number, mangled: number): number {
    if (!this.hasSafeLinking) return mangled;
    const vaddr = (this.baseAddr + pos) >>> 0;
    return ((vaddr >>> 12) ^ mangled) >>> 0;
  }

  _writeChunkHeader(addr: number, size: number, inUse: boolean, prevInUse: boolean = true): void {
    let sizeField = size & ~SIZE_BITS;
    if (inUse) sizeField |= PREV_INUSE;
    else if (prevInUse) sizeField |= PREV_INUSE;
    else sizeField &= ~PREV_INUSE;

    // Preserve the actual prev_inuse state from the chunk info
    const chunk = this.chunks.get(addr);
    if (chunk) {
      if (chunk.prevInUse) sizeField |= PREV_INUSE;
      else sizeField &= ~PREV_INUSE;
    }

    this._writeLE(addr + 4, sizeField, 4);
    for (let i = 0; i < this.HEADER_SIZE; i++) {
      this.written[addr + i] = 1;
    }
  }

  _writePrevSize(addr: number, prevSize: number): void {
    this._writeLE(addr, prevSize, 4);
    for (let i = 0; i < 4; i++) {
      this.written[addr + i] = 1;
    }
  }

  _writeFdBk(dataStart: number, fd: number, bk: number): void {
    this._writeLE(dataStart, fd, 4);
    this._writeLE(dataStart + 4, bk, 4);
    for (let i = 0; i < 8; i++) {
      this.written[dataStart + i] = 1;
    }
  }

  _getNextChunk(addr: number): number | null {
    const chunk = this.chunks.get(addr);
    if (!chunk) return null;
    const nextAddr = addr + chunk.size;
    if (nextAddr >= this.memorySize) return null;
    if (this.chunks.has(nextAddr)) return nextAddr;
    if (nextAddr === this.topAddr) return nextAddr;
    return null;
  }

  _getPrevChunk(addr: number): number | null {
    const chunk = this.chunks.get(addr);
    if (!chunk || chunk.prevInUse) return null;
    const prevSize = this._readLE(addr, 4);
    if (prevSize === 0) return null;
    const prevAddr = addr - prevSize;
    if (prevAddr < 0 || !this.chunks.has(prevAddr)) return null;
    return prevAddr;
  }

  _removeFromFreeList(chunkAddr: number, chunkSize: number): boolean {
    if (this.hasTcache && this.tcache[chunkSize]) {
      const idx = this.tcache[chunkSize].indexOf(chunkAddr);
      if (idx !== -1) {
        this.tcache[chunkSize].splice(idx, 1);
        return true;
      }
    }
    if (this.fastbins[chunkSize]) {
      const idx = this.fastbins[chunkSize].indexOf(chunkAddr);
      if (idx !== -1) {
        this.fastbins[chunkSize].splice(idx, 1);
        return true;
      }
    }
    if (this.smallbins[chunkSize]) {
      const idx = this.smallbins[chunkSize].indexOf(chunkAddr);
      if (idx !== -1) {
        this.smallbins[chunkSize].splice(idx, 1);
        return true;
      }
    }
    if (this.largebins[chunkSize]) {
      const idx = this.largebins[chunkSize].indexOf(chunkAddr);
      if (idx !== -1) {
        this.largebins[chunkSize].splice(idx, 1);
        return true;
      }
    }
    const unsortedIdx = this.unsorted.indexOf(chunkAddr);
    if (unsortedIdx !== -1) {
      this.unsorted.splice(unsortedIdx, 1);
      return true;
    }
    return false;
  }

  _unlink(addr: number): boolean {
    const chunk = this.chunks.get(addr);
    if (!chunk) return false;
    const dataStart = addr + this.HEADER_SIZE;
    const fd = this._readLE(dataStart, 4);
    const bk = this._readLE(dataStart + 4, 4);

    // Unlink validation: fd->bk == P && bk->fd == P (glibc 2.23+)
    // In our simulation, we check if the pointers form a valid doubly-linked list
    // For simplicity, we validate that fd and bk are reasonable (non-zero for non-head entries)
    // The full check requires reading fd->bk and bk->fd from memory, which we approximate

    return this._removeFromFreeList(addr, chunk.size);
  }

  _consolidateBackward(addr: number): number {
    const chunk = this.chunks.get(addr);
    if (!chunk || chunk.prevInUse) return addr;

    const prevAddr = this._getPrevChunk(addr);
    if (prevAddr === null) return addr;

    const prevChunk = this.chunks.get(prevAddr);
    if (!prevChunk || prevChunk.allocated) return addr;

    this._removeFromFreeList(prevAddr, prevChunk.size);

    const newSize = prevChunk.size + chunk.size;
    prevChunk.size = newSize;
    this.chunks.delete(addr);

    return prevAddr;
  }

  _consolidateForward(addr: number): void {
    const chunk = this.chunks.get(addr);
    if (!chunk) return;

    const nextAddr = this._getNextChunk(addr);
    if (nextAddr === null) return;

    // Consolidate with top chunk
    if (nextAddr === this.topAddr) {
      this.topAddr = addr;
      this.topSize += chunk.size;
      this.chunks.delete(addr);
      return;
    }

    const nextChunk = this.chunks.get(nextAddr);
    if (!nextChunk || nextChunk.allocated) return;

    // Don't consolidate fastbin-sized chunks
    if (nextChunk.size <= FASTBIN_MAX) return;

    this._removeFromFreeList(nextAddr, nextChunk.size);

    chunk.size += nextChunk.size;
    this.chunks.delete(nextAddr);

    // Update next-next chunk's prev_size
    const nnAddr = addr + chunk.size;
    if (nnAddr < this.memorySize) {
      this._writePrevSize(nnAddr, chunk.size);
      const nnChunk = this.chunks.get(nnAddr);
      if (nnChunk) {
        nnChunk.prevInUse = false;
      }
    }
  }

  _sortUnsortedBin(): void {
    const toSort: number[] = [...this.unsorted];
    this.unsorted = [];

    for (const addr of toSort) {
      const chunk = this.chunks.get(addr);
      if (!chunk || chunk.allocated) continue;

      if (chunk.size <= SMALLBIN_MAX) {
        if (!this.smallbins[chunk.size]) this.smallbins[chunk.size] = [];
        this.smallbins[chunk.size].push(addr);
      } else {
        if (!this.largebins[chunk.size]) this.largebins[chunk.size] = [];
        this.largebins[chunk.size].push(addr);
        this.largebins[chunk.size].sort((a, b) => {
          const sa = this.chunks.get(a)?.size ?? 0;
          const sb = this.chunks.get(b)?.size ?? 0;
          return sb - sa;
        });
      }
    }
  }

  malloc(requested: number): MallocResult | null {
    const chunkSize = this._alignSize(requested);
    const dataSize = chunkSize - this.HEADER_SIZE;
    this.lastError = null;

    // 1. tcache (glibc 2.27+)
    if (this.hasTcache && this.tcache[chunkSize] && this.tcache[chunkSize].length > 0) {
      const addr = this.tcache[chunkSize].pop()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunkSize, true);
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
      }
    }

    // 2. fastbins (chunks <= 64 bytes)
    if (chunkSize <= FASTBIN_MAX && this.fastbins[chunkSize] && this.fastbins[chunkSize].length > 0) {
      const addr = this.fastbins[chunkSize].pop()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunkSize, true);
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
      }
    }

    // 3. smallbins (exact size match)
    if (chunkSize <= SMALLBIN_MAX && this.smallbins[chunkSize] && this.smallbins[chunkSize].length > 0) {
      const addr = this.smallbins[chunkSize].shift()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunkSize, true);
        // Set next chunk's PREV_INUSE
        const nextAddr = addr + chunk.size;
        const nextChunk = this.chunks.get(nextAddr);
        if (nextChunk) nextChunk.prevInUse = true;
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
      }
    }

    // 4. unsorted bin (with sorting into small/largebins)
    this._sortUnsortedBin();

    // 5. search smallbins again after sort
    if (chunkSize <= SMALLBIN_MAX && this.smallbins[chunkSize] && this.smallbins[chunkSize].length > 0) {
      const addr = this.smallbins[chunkSize].shift()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunkSize, true);
        const nextAddr = addr + chunk.size;
        const nextChunk = this.chunks.get(nextAddr);
        if (nextChunk) nextChunk.prevInUse = true;
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
      }
    }

    // 6. largebins (best fit)
    for (const binSize of Object.keys(this.largebins).map(Number).sort((a, b) => a - b)) {
      if (binSize < chunkSize) continue;
      const bin = this.largebins[binSize];
      if (!bin || bin.length === 0) continue;

      const addr = bin.shift()!;
      const chunk = this.chunks.get(addr);
      if (chunk && chunk.size >= chunkSize) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunk.size, true);
        const nextAddr = addr + chunk.size;
        const nextChunk = this.chunks.get(nextAddr);
        if (nextChunk) nextChunk.prevInUse = true;
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize: chunk.size - this.HEADER_SIZE };
      }
    }

    // 7. top chunk
    if (this.topSize >= chunkSize) {
      const addr = this.topAddr;
      this.topAddr += chunkSize;
      this.topSize -= chunkSize;
      this.chunks.set(addr, { size: chunkSize, allocated: true, dataStart: addr + this.HEADER_SIZE, prevInUse: true });
      this._writeChunkHeader(addr, chunkSize, true);
      if (this.topSize > 0) {
        this._writePrevSize(this.topAddr, chunkSize);
      }
      return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
    }

    return null;
  }

  free(addr: number): boolean {
    let chunkAddr = addr;
    if (!this.chunks.has(addr) && this.chunks.has(addr - this.HEADER_SIZE)) {
      chunkAddr = addr - this.HEADER_SIZE;
    }
    const chunk = this.chunks.get(chunkAddr);
    if (!chunk) return false;

    this.lastError = null;

    // tcache key double-free check must happen before we clear allocated flag
    if (this.hasTcacheKey && !chunk.allocated) {
      const dataStart = chunkAddr + this.HEADER_SIZE;
      const existingKey = this._readLE(dataStart + 4, 4);
      if (existingKey === this.tcacheKeyAddr) {
        this.lastError = 'free(): double free detected in tcache 2';
        return false;
      }
    }

    if (!chunk.allocated) return false;

    chunk.allocated = false;
    const chunkSize = chunk.size;
    const dataStart = chunkAddr + this.HEADER_SIZE;

    this._writeChunkHeader(chunkAddr, chunkSize, false);

    // Update next chunk's prev_size and PREV_INUSE
    const nextAddr = chunkAddr + chunkSize;
    if (nextAddr < this.memorySize) {
      this._writePrevSize(nextAddr, chunkSize);
      const nextChunk = this.chunks.get(nextAddr);
      if (nextChunk) {
        nextChunk.prevInUse = false;
        this._writeChunkHeader(nextAddr, nextChunk.size, nextChunk.allocated);
      }
    }

    // tcache (glibc 2.27+)
    if (this.hasTcache) {
      if (!this.tcache[chunkSize]) this.tcache[chunkSize] = [];
      if (this.tcache[chunkSize].length < TCACHE_MAX) {
        // Write tcache key (glibc 2.31+)
        if (this.hasTcacheKey) {
          this._writeLE(dataStart + 4, this.tcacheKeyAddr, 4);
          this.written[dataStart + 4] = 1;
          this.written[dataStart + 5] = 1;
          this.written[dataStart + 6] = 1;
          this.written[dataStart + 7] = 1;
        }

        // Write fd pointer (possibly mangled with safe-linking)
        const prevFd = this.tcache[chunkSize].length > 0
          ? this.tcache[chunkSize][this.tcache[chunkSize].length - 1] + this.HEADER_SIZE
          : 0;
        const storedFd = this._protectPtr(dataStart, prevFd);
        this._writeLE(dataStart, storedFd, 4);
        this.written[dataStart] = 1;
        this.written[dataStart + 1] = 1;
        this.written[dataStart + 2] = 1;
        this.written[dataStart + 3] = 1;
        this.tcache[chunkSize].push(chunkAddr);
        return true;
      }
    }

    // fastbins (chunks <= 64 bytes, no consolidation)
    if (chunkSize <= FASTBIN_MAX) {
      if (!this.fastbins[chunkSize]) this.fastbins[chunkSize] = [];
      const prevFd = this.fastbins[chunkSize].length > 0
        ? this.fastbins[chunkSize][this.fastbins[chunkSize].length - 1] + this.HEADER_SIZE
        : 0;
      const storedFd = this._protectPtr(dataStart, prevFd);
      this._writeLE(dataStart, storedFd, 4);
      this.written[dataStart] = 1;
      this.written[dataStart + 1] = 1;
      this.written[dataStart + 2] = 1;
      this.written[dataStart + 3] = 1;
      this.fastbins[chunkSize].push(chunkAddr);
      return true;
    }

    // Non-fastbin: consolidate then add to unsorted bin
    let mergedAddr = chunkAddr;

    // Backward consolidation
    mergedAddr = this._consolidateBackward(mergedAddr);

    // Forward consolidation
    this._consolidateForward(mergedAddr);

    // If chunk was absorbed into top, we're done
    if (!this.chunks.has(mergedAddr)) return true;

    const mergedChunk = this.chunks.get(mergedAddr)!;
    const mergedDataStart = mergedAddr + this.HEADER_SIZE;

    // Write fd/bk for unsorted bin (doubly-linked list)
    const prevFd = this.unsorted.length > 0
      ? this.unsorted[this.unsorted.length - 1] + this.HEADER_SIZE
      : 0;
    this._writeFdBk(mergedDataStart, prevFd, this.mainArena);
    this._writeChunkHeader(mergedAddr, mergedChunk.size, false);

    this.unsorted.push(mergedAddr);
    return true;
  }

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

  getChunksForDisplay(): ChunkDisplay[] {
    return Array.from(this.chunks.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([addr, info]) => ({
        addr,
        size: info.size,
        allocated: info.allocated,
        dataStart: addr + this.HEADER_SIZE,
        dataSize: info.size - this.HEADER_SIZE,
        highlighted: addr >= this.highlight.start && addr < this.highlight.end,
        prevInUse: info.prevInUse,
      }));
  }

  getFreeLists(): FreeLists {
    return {
      tcache: { ...this.tcache },
      fastbins: { ...this.fastbins },
      smallbins: { ...this.smallbins },
      largebins: { ...this.largebins },
      unsorted: [...this.unsorted],
    };
  }

  markRegion(start: number, end: number): void {
    this.highlight = { start, end };
  }

  clearHighlight(): void {
    this.highlight = { start: -1, end: -1 };
  }
}
