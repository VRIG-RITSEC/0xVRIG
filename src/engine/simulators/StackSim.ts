export interface StackSimConfig {
  bufSize: number;
  retAddr: number;
  savedEbp: number;
  baseAddr?: number;
  useCanary?: boolean;
  wordSize?: 4 | 8;
}

export class StackSim {
  bufSize: number;
  canarySize: number;
  ebpSize: number;
  retSize: number;
  totalSize: number;
  baseAddr: number;
  memory: Uint8Array;
  written: Uint8Array;
  overflowAt: Uint8Array;
  inputLen: number;
  useCanary: boolean;
  origRetAddr: number;
  origSavedEbp: number;
  canaryValue: number;
  hlStart: number;
  hlEnd: number;
  wordSize: 4 | 8;

  constructor(config: StackSimConfig);
  constructor(bufSize: number, retAddr: number, savedEbp: number, baseAddr?: number, useCanary?: boolean, wordSize?: 4 | 8);
  constructor(
    bufSizeOrConfig: number | StackSimConfig,
    retAddr?: number,
    savedEbp?: number,
    baseAddr?: number,
    useCanary?: boolean,
    wordSize?: 4 | 8,
  ) {
    let bufSize: number;
    if (typeof bufSizeOrConfig === 'object') {
      bufSize = bufSizeOrConfig.bufSize;
      retAddr = bufSizeOrConfig.retAddr;
      savedEbp = bufSizeOrConfig.savedEbp;
      baseAddr = bufSizeOrConfig.baseAddr;
      useCanary = bufSizeOrConfig.useCanary;
      wordSize = bufSizeOrConfig.wordSize;
    } else {
      bufSize = bufSizeOrConfig;
    }

    this.wordSize = wordSize ?? 4;
    this.bufSize = bufSize;
    this.canarySize = useCanary ? this.wordSize : 0;
    this.ebpSize = this.wordSize;
    this.retSize = this.wordSize;
    this.totalSize = bufSize + this.canarySize + this.ebpSize + this.retSize;
    this.baseAddr = baseAddr ?? 0xbfff0100;
    this.memory = new Uint8Array(this.totalSize);
    this.written = new Uint8Array(this.totalSize);
    this.overflowAt = new Uint8Array(this.totalSize);
    this.inputLen = 0;
    this.useCanary = !!useCanary;
    this.hlStart = -1;
    this.hlEnd = -1;

    this.origRetAddr = retAddr!;
    this.origSavedEbp = savedEbp!;
    this.canaryValue = 0;
    if (this.useCanary) {
      this.canaryValue = (Math.random() * 0xffffffff) >>> 0;
      this._writeLE(this.bufSize, this.canaryValue, this.canarySize);
    }
    this._writeLE(this.bufSize + this.canarySize, savedEbp!, this.ebpSize);
    this._writeLE(this.bufSize + this.canarySize + this.ebpSize, retAddr!, this.retSize);
    this.written.fill(0);
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

  writeInput(bytes: number[]): void {
    this.inputLen = bytes.length;
    if (this.useCanary) this._writeLE(this.bufSize, this.canaryValue, this.canarySize);
    this._writeLE(this.bufSize + this.canarySize, this.origSavedEbp, this.ebpSize);
    this._writeLE(this.bufSize + this.canarySize + this.ebpSize, this.origRetAddr, this.retSize);
    this.written.fill(0);
    this.overflowAt.fill(0);

    for (let i = 0; i < bytes.length && i < this.totalSize; i++) {
      this.memory[i] = bytes[i];
      this.written[i] = 1;
      if (i >= this.bufSize) {
        this.overflowAt[i] = 1;
      }
    }
  }

  resetForInput(): void {
    if (this.useCanary) this._writeLE(this.bufSize, this.canaryValue, this.canarySize);
    this._writeLE(this.bufSize + this.canarySize, this.origSavedEbp, this.ebpSize);
    this._writeLE(this.bufSize + this.canarySize + this.ebpSize, this.origRetAddr, this.retSize);
    this.written.fill(0);
    this.overflowAt.fill(0);
    this.inputLen = 0;
    this.hlStart = -1;
    this.hlEnd = -1;
  }

  clearBlank(): void {
    this.memory.fill(0);
    this.written.fill(0);
    this.overflowAt.fill(0);
    this.hlStart = -1;
    this.hlEnd = -1;
  }

  writeWord(offset: number, bytes: number[]): void {
    for (let i = 0; i < bytes.length && (offset + i) < this.totalSize; i++) {
      this.memory[offset + i] = bytes[i];
      this.written[offset + i] = 1;
      if ((offset + i) >= this.bufSize) this.overflowAt[offset + i] = 1;
    }
    this.inputLen = Math.max(this.inputLen, offset + bytes.length);
    this.hlStart = offset;
    this.hlEnd = offset + bytes.length;
  }

  markRegion(start: number, end: number): void {
    for (let i = start; i < end && i < this.totalSize; i++) this.written[i] = 1;
    this.hlStart = start;
    this.hlEnd = end;
  }

  clearHighlight(): void {
    this.hlStart = -1;
    this.hlEnd = -1;
  }

  getRetAddr(): number {
    return this._readLE(this.bufSize + this.canarySize + this.ebpSize, this.retSize);
  }

  getSavedEbp(): number {
    return this._readLE(this.bufSize + this.canarySize, this.ebpSize);
  }

  getCanary(): number | null {
    return this.useCanary ? this._readLE(this.bufSize, this.canarySize) : null;
  }

  canaryIntact(): boolean {
    return !this.useCanary || this.getCanary() === this.canaryValue;
  }

  regionOf(byteIndex: number): 'buffer' | 'canary' | 'ebp' | 'ret' {
    if (byteIndex < this.bufSize) return 'buffer';
    if (this.useCanary && byteIndex < this.bufSize + this.canarySize) return 'canary';
    if (byteIndex < this.bufSize + this.canarySize + this.ebpSize) return 'ebp';
    return 'ret';
  }
}
