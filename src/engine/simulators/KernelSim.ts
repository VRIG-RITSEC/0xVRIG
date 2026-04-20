export interface SlabCache {
  objectSize: number;
  objects: Array<{ addr: number; allocated: boolean; data: Uint8Array }>;
  freelist: number[]; // indices into objects array
}

export interface KernelSimConfig {
  kernelSize?: number;
  userSize?: number;
  stackSize?: number;
  smep?: boolean;
  smap?: boolean;
  kaslr?: boolean;
}

// Kernel address space starts at this base (simplified 32-bit representation)
const KERNEL_BASE = 0xc0000000;
const USER_MAX = 0xbfffffff;

// Default slab size classes (simplified SLUB)
const SLAB_CLASSES = [64, 128, 256, 512, 1024];

// CR4 bit positions
const CR4_SMEP = 1 << 20;
const CR4_SMAP = 1 << 21;

export class KernelSim {
  // Memory
  kernelMemory: Uint8Array;
  userMemory: Uint8Array;

  // Privilege
  privilegeLevel: 0 | 3;

  // CR4 register
  cr4: number;

  // Credentials
  cred: { uid: number; gid: number };

  // Kernel globals
  modprobePath: string;
  commitCredsAddr: number;
  prepareKernelCredAddr: number;

  // Slab allocator (simplified SLUB)
  slabs: Record<number, SlabCache>;

  // Kernel stack
  kernelStack: Uint8Array;
  kspOffset: number;

  // KASLR slide
  kaslrSlide: number;

  // Next slab allocation address (simplified linear allocator per class)
  private _nextSlabAddr: Record<number, number>;

  constructor(config: KernelSimConfig = {}) {
    const kernelSize = config.kernelSize ?? 4096;
    const userSize = config.userSize ?? 4096;
    const stackSize = config.stackSize ?? 512;

    this.kernelMemory = new Uint8Array(kernelSize);
    this.userMemory = new Uint8Array(userSize);
    this.kernelStack = new Uint8Array(stackSize);
    this.kspOffset = stackSize; // stack grows down, start at top

    // Start in ring 3 (userspace)
    this.privilegeLevel = 3;

    // CR4: set SMEP/SMAP bits based on config
    this.cr4 = 0;
    if (config.smep) this.cr4 |= CR4_SMEP;
    if (config.smap) this.cr4 |= CR4_SMAP;

    // Default credentials: unprivileged user (uid=1000, gid=1000)
    this.cred = { uid: 1000, gid: 1000 };

    // Kernel globals
    this.modprobePath = '/sbin/modprobe';

    // KASLR
    this.kaslrSlide = config.kaslr ? (Math.floor(Math.random() * 512) * 0x1000) : 0;

    // Well-known kernel symbol addresses (simplified)
    this.commitCredsAddr = (KERNEL_BASE + 0x000a0000 + this.kaslrSlide) >>> 0;
    this.prepareKernelCredAddr = (KERNEL_BASE + 0x000a0100 + this.kaslrSlide) >>> 0;

    // Initialize slab caches for each size class
    this.slabs = {};
    this._nextSlabAddr = {};
    for (const size of SLAB_CLASSES) {
      this.slabs[size] = {
        objectSize: size,
        objects: [],
        freelist: [],
      };
      // Each slab class gets its own address range in kernel memory
      this._nextSlabAddr[size] = (KERNEL_BASE + 0x00200000 + size * 0x1000 + this.kaslrSlide) >>> 0;
    }
  }

  // ---------- Slab operations ----------

  kmalloc(size: number): { addr: number; slabClass: number } | null {
    // Find the smallest slab class that fits
    const slabClass = SLAB_CLASSES.find((c) => c >= size);
    if (slabClass === undefined) return null;

    const cache = this.slabs[slabClass];

    // Try freelist first (reuse freed objects)
    if (cache.freelist.length > 0) {
      const idx = cache.freelist.pop()!;
      cache.objects[idx].allocated = true;
      cache.objects[idx].data.fill(0);
      return { addr: cache.objects[idx].addr, slabClass };
    }

    // Allocate a new object
    const addr = this._nextSlabAddr[slabClass];
    this._nextSlabAddr[slabClass] = (addr + slabClass) >>> 0;

    const obj = {
      addr,
      allocated: true,
      data: new Uint8Array(slabClass),
    };
    cache.objects.push(obj);

    return { addr, slabClass };
  }

  kfree(addr: number): boolean {
    for (const slabClass of SLAB_CLASSES) {
      const cache = this.slabs[slabClass];
      const idx = cache.objects.findIndex((o) => o.addr === addr);
      if (idx !== -1) {
        if (!cache.objects[idx].allocated) return false; // double free
        cache.objects[idx].allocated = false;
        cache.freelist.push(idx);
        return true;
      }
    }
    return false;
  }

  // ---------- Syscall transition ----------

  enterKernel(): void {
    this.privilegeLevel = 0;
  }

  exitKernel(): void {
    this.privilegeLevel = 3;
  }

  // ---------- Kernel stack operations ----------

  kStackWrite(offset: number, bytes: number[]): void {
    for (let i = 0; i < bytes.length; i++) {
      const pos = offset + i;
      if (pos >= 0 && pos < this.kernelStack.length) {
        this.kernelStack[pos] = bytes[i];
      }
    }
  }

  kStackRead(offset: number, size: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < size; i++) {
      const pos = offset + i;
      if (pos >= 0 && pos < this.kernelStack.length) {
        result.push(this.kernelStack[pos]);
      } else {
        result.push(0);
      }
    }
    return result;
  }

  // ---------- SMEP/SMAP checks ----------

  checkSMEP(addr: number): boolean {
    // SMEP: Supervisor Mode Execution Prevention
    // When enabled (CR4 bit 20), kernel cannot execute code at user-space addresses
    if (!(this.cr4 & CR4_SMEP)) return true; // SMEP disabled, allow all
    // If address is in user space (below KERNEL_BASE), block execution
    return addr >= KERNEL_BASE;
  }

  checkSMAP(addr: number): boolean {
    // SMAP: Supervisor Mode Access Prevention
    // When enabled (CR4 bit 21), kernel cannot read/write user-space addresses
    if (!(this.cr4 & CR4_SMAP)) return true; // SMAP disabled, allow all
    // If address is in user space (below KERNEL_BASE), block access
    return addr >= KERNEL_BASE;
  }

  // ---------- Credential operations ----------

  commitCreds(credAddr: number): void {
    // In the real kernel, commit_creds() replaces the current task's credentials.
    // For the simulator, if credAddr matches a prepared root cred, we set uid/gid=0.
    // We use a simplified model: credAddr encodes uid in the low 16 bits.
    const uid = credAddr & 0xffff;
    const gid = (credAddr >>> 16) & 0xffff;
    this.cred = { uid, gid };
  }

  prepareKernelCred(uid: number): number {
    // Returns an address representing a credential structure.
    // uid=0 means root credentials.
    // Encode uid in low 16 bits, gid=uid in high 16 bits (simplified).
    return ((uid << 16) | uid) >>> 0;
  }

  // ---------- Helpers ----------

  _writeLE(mem: Uint8Array, offset: number, value: number, size: number): void {
    for (let i = 0; i < size; i++) {
      if (offset + i < mem.length) {
        mem[offset + i] = (value >>> (i * 8)) & 0xff;
      }
    }
  }

  _readLE(mem: Uint8Array, offset: number, size: number): number {
    let v = 0;
    for (let i = size - 1; i >= 0; i--) {
      if (offset + i < mem.length) {
        v = v * 256 + mem[offset + i];
      }
    }
    return v >>> 0;
  }
}
