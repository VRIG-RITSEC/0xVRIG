export interface ChunkInfo {
  size: number;
  allocated: boolean;
  dataStart: number;
}

export interface ChunkDisplay {
  addr: number;
  size: number;
  allocated: boolean;
  dataStart: number;
  dataSize: number;
  highlighted: boolean;
}

export interface FreeLists {
  tcache: Record<number, number[]>;
  fastbins: Record<number, number[]>;
  unsorted: number[];
}

export interface MallocResult {
  addr: number;
  dataAddr: number;
  dataSize: number;
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
  unsorted: number[];
  topAddr: number;
  topSize: number;
  funcPtrs: Record<string, number>;
  mainArena: number;
  baseAddr: number;

  constructor(size: number = 1024) {
    this.memorySize = size;
    this.memory = new Uint8Array(size);
    this.written = new Uint8Array(size);
    this.highlight = { start: -1, end: -1 };
    this.chunks = new Map();
    this.HEADER_SIZE = 8;
    this.MIN_CHUNK = 16;
    this.tcache = {};
    this.fastbins = {};
    this.unsorted = [];
    this.topAddr = 0;
    this.topSize = size;
    this.funcPtrs = {};
    this.mainArena = 0x0804b100;
    this.baseAddr = 0x08050000;
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

  malloc(requested: number): MallocResult | null {
    const chunkSize = this._alignSize(requested);
    const dataSize = chunkSize - this.HEADER_SIZE;

    if (this.tcache[chunkSize] && this.tcache[chunkSize].length > 0) {
      const addr = this.tcache[chunkSize].pop()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunkSize, true);
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
      }
    }

    if (chunkSize <= 64 && this.fastbins[chunkSize] && this.fastbins[chunkSize].length > 0) {
      const addr = this.fastbins[chunkSize].pop()!;
      const chunk = this.chunks.get(addr);
      if (chunk) {
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunkSize, true);
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize };
      }
    }

    for (let i = 0; i < this.unsorted.length; i++) {
      const addr = this.unsorted[i];
      const chunk = this.chunks.get(addr);
      if (chunk && chunk.size >= chunkSize) {
        this.unsorted.splice(i, 1);
        chunk.allocated = true;
        this._writeChunkHeader(addr, chunk.size, true);
        return { addr, dataAddr: addr + this.HEADER_SIZE, dataSize: chunk.size - this.HEADER_SIZE };
      }
    }

    if (this.topSize >= chunkSize) {
      const addr = this.topAddr;
      this.topAddr += chunkSize;
      this.topSize -= chunkSize;
      this.chunks.set(addr, { size: chunkSize, allocated: true, dataStart: addr + this.HEADER_SIZE });
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
    if (!chunk || !chunk.allocated) return false;

    chunk.allocated = false;
    const chunkSize = chunk.size;
    const dataStart = chunkAddr + this.HEADER_SIZE;

    this._writeChunkHeader(chunkAddr, chunkSize, false);

    const nextAddr = chunkAddr + chunkSize;
    if (nextAddr < this.memorySize) {
      this._writePrevSize(nextAddr, chunkSize);
    }

    if (!this.tcache[chunkSize]) this.tcache[chunkSize] = [];
    if (this.tcache[chunkSize].length < 7) {
      const prevFd = this.tcache[chunkSize].length > 0
        ? this.tcache[chunkSize][this.tcache[chunkSize].length - 1] + this.HEADER_SIZE
        : 0;
      this._writeLE(dataStart, prevFd, 4);
      this.written[dataStart] = 1;
      this.written[dataStart + 1] = 1;
      this.written[dataStart + 2] = 1;
      this.written[dataStart + 3] = 1;
      this.tcache[chunkSize].push(chunkAddr);
      return true;
    }

    if (chunkSize <= 64) {
      if (!this.fastbins[chunkSize]) this.fastbins[chunkSize] = [];
      const prevFd = this.fastbins[chunkSize].length > 0
        ? this.fastbins[chunkSize][this.fastbins[chunkSize].length - 1] + this.HEADER_SIZE
        : 0;
      this._writeLE(dataStart, prevFd, 4);
      this.written[dataStart] = 1;
      this.written[dataStart + 1] = 1;
      this.written[dataStart + 2] = 1;
      this.written[dataStart + 3] = 1;
      this.fastbins[chunkSize].push(chunkAddr);
      return true;
    }

    const prevFd = this.unsorted.length > 0
      ? this.unsorted[this.unsorted.length - 1] + this.HEADER_SIZE
      : 0;
    this._writeLE(dataStart, prevFd, 4);
    this.written[dataStart] = 1;
    this.written[dataStart + 1] = 1;
    this.written[dataStart + 2] = 1;
    this.written[dataStart + 3] = 1;
    this.unsorted.push(chunkAddr);
    return true;
  }

  _writeChunkHeader(addr: number, size: number, inUse: boolean): void {
    const sizeField = inUse ? (size | 1) : (size & ~1);
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
      }));
  }

  getFreeLists(): FreeLists {
    return {
      tcache: { ...this.tcache },
      fastbins: { ...this.fastbins },
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
