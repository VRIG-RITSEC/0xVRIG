import { hex8 } from '@/engine/helpers';

export interface HeapGuidedStep {
  srcLine?: number;
  log?: Array<[string, string]>;
  doFree?: string;
  doubleFree?: boolean;
  doMalloc?: boolean;
  doMallocSort?: boolean;
  doDrainTcache?: boolean;
  name?: string;
  done?: boolean;
}

export const UAF_STEPS: HeapGuidedStep[] = [
  { srcLine: 9, log: [['action', 'User *u = malloc(16) \u2014 allocated a 24-byte chunk for the User struct.']] },
  { srcLine: 10, log: [['action', 'u->action = greet \u2014 the function pointer is set to greet() (normal behavior).']] },
  { srcLine: 11, doFree: 'User', log: [['action', 'free(u) \u2014 the User chunk goes to the recycling list. But the program still has the pointer u!']] },
  { srcLine: 13, doMalloc: true, log: [['action', 'char *note = malloc(16) \u2014 same size as User! The allocator recycles the freed chunk. Note now occupies the SAME memory as the old User struct.']] },
  { done: true, log: [['info', 'Now enter the bytes to write into the note. The first 4 bytes will overwrite where the function pointer used to be. Write win()\'s address in little-endian!']] },
];

export const DF_STEPS: HeapGuidedStep[] = [
  { srcLine: 3, log: [['action', 'char *a = malloc(16) \u2014 chunk A is allocated.']] },
  { srcLine: 4, doFree: 'A', log: [['action', 'free(a) \u2014 chunk A goes to the recycling list (tcache).']] },
  { srcLine: 5, doFree: 'A', doubleFree: true, log: [['action', 'free(a) again \u2014 DOUBLE FREE! The chunk is added to the recycling list a second time. The list now has a cycle: A \u2192 A \u2192 ...']] },
  { srcLine: 6, doMalloc: true, name: 'B', log: [['action', 'char *b = malloc(16) \u2014 returns chunk A from the list. But A is STILL on the list (because of the double free)!']] },
  { done: true, log: [['info', 'Now write the target address as b\'s data. This overwrites the recycling list\'s forward pointer (fd). The next-next malloc will return whatever address you write! Use the function pointer table address in little-endian.']] },
];

export const TCP_STEPS: HeapGuidedStep[] = [
  { srcLine: 6, log: [['action', 'char *a = malloc(16) \u2014 chunk A is allocated (24 bytes with header).']] },
  { srcLine: 7, log: [['action', 'char *b = malloc(16) \u2014 chunk B is allocated right after A.']] },
  { srcLine: 8, doFree: 'B', log: [['action', 'free(b) \u2014 chunk B goes to tcache. Look at B\'s data: the first 4 bytes are now the forward pointer (fd).']] },
  { srcLine: 9, log: [['info', 'The program still has the pointer b (use-after-free). We can write to B\'s memory even though it\'s freed.']] },
  { done: true, log: [['info', 'Now overwrite B\'s fd pointer with the function pointer table address. Enter the address in little-endian.']] },
];

export const FBD_STEPS: HeapGuidedStep[] = [
  { srcLine: 6, log: [['info', 'Tcache is already full (7 entries for size 24). Chunks A and B are allocated.']] },
  { srcLine: 10, doFree: 'A', log: [['action', 'free(a) \u2014 tcache is full, so A goes to the fastbin instead.']] },
  { srcLine: 11, doFree: 'B', log: [['action', 'free(b) \u2014 B also goes to fastbin. Fastbin[24]: B \u2192 A \u2192 nil']] },
  { srcLine: 12, doFree: 'A', doubleFree: true, log: [['action', 'free(a) AGAIN! Fastbin only checks if A == head. Head is B, so the check passes. Fastbin[24]: A \u2192 B \u2192 A \u2192 B \u2192 ... (cycle!)']] },
  { srcLine: 14, doDrainTcache: true, log: [['action', 'Drain tcache with 7 mallocs so next mallocs come from fastbin.']] },
  { done: true, log: [['info', 'The fastbin has a cycle. Write the target address to poison the fd pointer!']] },
];

export const USB_STEPS: HeapGuidedStep[] = [
  { srcLine: 5, log: [['action', 'char *a = malloc(128) \u2014 chunk A is allocated (136 bytes with header).']] },
  { srcLine: 6, log: [['action', 'char *guard = malloc(16) \u2014 guard chunk prevents top consolidation.']] },
  { srcLine: 8, doFree: 'A', log: [['action', 'free(a) \u2014 chunk A goes to the unsorted bin. A now has fd and bk pointers.']] },
  { srcLine: 10, log: [['info', 'The program still has pointer a (UAF). When malloc removes a chunk from the unsorted bin, it writes main_arena to bk->fd.']] },
  { done: true, log: [['info', 'Overwrite A\'s bk pointer so bk->fd points to the function pointer table. Set bk = funcPtrAddr - 8.']] },
];

export const HOF_STEPS: HeapGuidedStep[] = [
  { srcLine: 5, log: [['action', 'char *a = malloc(16) \u2014 chunk A is allocated. The top chunk sits right after A.']] },
  { srcLine: 6, log: [['info', 'We have an overflow from chunk A into the top chunk header.']] },
  { done: true, log: [['info', 'Overflow into the top chunk header: 16 bytes padding + 4 bytes prev_size (00) + 4 bytes size (FF FF FF FF).']] },
];

export const HOS_STEPS: HeapGuidedStep[] = [
  { srcLine: 5, log: [['action', 'char stack_buf[64] \u2014 a 64-byte buffer. We will build a fake chunk here.']] },
  { srcLine: 6, log: [['info', 'A real chunk has an 8-byte header: 4 bytes prev_size + 4 bytes size.']] },
  { srcLine: 7, log: [['info', 'For a 16-byte data chunk, total size is 24 (0x18). With PREV_INUSE set: 0x19.']] },
  { srcLine: 10, log: [['info', 'glibc checks the NEXT chunk\'s header too. We need a valid header at offset +24.']] },
  { done: true, log: [['info', 'Write the fake headers: [prev_size: 00 00 00 00] [size: 19 00 00 00] [16 bytes data] [next prev_size: 00 00 00 00] [next size: 19 00 00 00]']] },
];

export const HOO_STEPS: HeapGuidedStep[] = [
  { srcLine: 5, log: [['action', 'char *a = malloc(16) \u2014 chunk A is allocated right before the top chunk.']] },
  { srcLine: 6, log: [['info', 'There is NO free() call anywhere. But we have an overflow into the top chunk header.']] },
  { srcLine: 7, log: [['info', 'If we shrink the top chunk size, a large malloc triggers sysmalloc, which frees the old top into the unsorted bin!']] },
  { srcLine: 8, log: [['info', 'The new top size must have PREV_INUSE set (bit 0 = 1). We\'ll use 0x81.']] },
  { done: true, log: [['info', 'Overflow into the top chunk header: 16 bytes padding + 4 bytes prev_size (00) + 4 bytes new size (81 00 00 00).']] },
];

export const HOE_STEPS: HeapGuidedStep[] = [
  { srcLine: 5, log: [['action', 'char *a = malloc(16) \u2014 chunk A (24 bytes total) is allocated.']] },
  { srcLine: 6, log: [['action', 'char *b = malloc(16) \u2014 chunk B (24 bytes total) is right after A.']] },
  { srcLine: 7, log: [['action', 'char *c = malloc(16) \u2014 chunk C (24 bytes total) is right after B.']] },
  { srcLine: 8, log: [['action', 'char *guard = malloc(16) \u2014 guard chunk prevents consolidation with top.']] },
  { srcLine: 9, log: [['info', 'Off-by-one from A: one null byte (0x00) past A\'s data overwrites B\'s size field low byte.']] },
  { srcLine: 10, log: [['info', 'B\'s size 0x19 becomes 0x18 \u2014 PREV_INUSE cleared!']] },
  { srcLine: 12, log: [['info', 'Setting B\'s prev_size = 0x18 (distance from A to B) for backward consolidation.']] },
  { done: true, log: [['info', 'Execute the off-by-one null byte overflow. free(C) will trigger backward consolidation!']] },
];

export const HOL_STEPS: HeapGuidedStep[] = [
  { srcLine: 6, log: [['action', 'char *a = malloc(80) \u2014 chunk A is allocated (88 bytes with header).']] },
  { srcLine: 7, log: [['action', 'char *guard = malloc(16) \u2014 guard chunk prevents top consolidation.']] },
  { srcLine: 8, log: [['action', 'free(a) \u2014 chunk A goes to the unsorted bin.']], doFree: 'A' },
  { srcLine: 9, log: [['action', 'malloc(120) \u2014 triggers sorting. A gets moved to the smallbin.']], doMallocSort: true },
  { srcLine: 10, log: [['info', 'A is now in the smallbin \u2014 a doubly-linked list with fd and bk pointers.']] },
  { srcLine: 11, log: [['info', 'When malloc removes from smallbin, it checks: victim->bk->fd == victim.']] },
  { srcLine: 12, log: [['info', 'To bypass: fake chunk\'s fd must point back to the real chunk (A).']] },
  { done: true, log: [['info', 'Corrupt A\'s bk pointer to point to a fake chunk at (funcPtrAddr - 8).']] },
];

export interface HeapStepResult {
  logs: Array<{ cls: string; msg: string }>;
  phase?: string;
  heapNames?: Record<string, number>;
  completed?: boolean;
}

export function executeHeapGuidedStep(
  step: HeapGuidedStep,
  heap: any,
  heapNames: Record<string, number>,
): HeapStepResult {
  const result: HeapStepResult = { logs: [], heapNames: { ...heapNames } };

  if (step.doFree) {
    const addr = heapNames[step.doFree];
    if (addr !== undefined) {
      if (step.doubleFree) {
        const chunk = heap.chunks.get(addr);
        if (chunk) chunk.allocated = true;
      }
      heap.free(addr);
    }
  }

  if (step.doMalloc) {
    const mallocResult = heap.malloc(16);
    if (mallocResult && step.name) {
      result.heapNames![step.name] = mallocResult.addr;
    } else if (mallocResult && !step.name) {
      result.heapNames!['Note'] = mallocResult.addr;
    }
  }

  if (step.doMallocSort) {
    heap.malloc(120);
  }

  if (step.doDrainTcache) {
    for (let i = 0; i < 7; i++) heap.malloc(16);
    result.logs.push({ cls: 'action', msg: 'Drained tcache with 7 mallocs. Next mallocs come from fastbin.' });
  }

  if (step.log) {
    for (const [cls, msg] of step.log) {
      result.logs.push({ cls, msg });
    }
  }

  if (step.done) {
    result.phase = 'input';
    result.completed = false;
  }

  return result;
}

export function heapUafSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
): HeapStepResult {
  const result: HeapStepResult = { logs: [] };
  const noteAddr = heapNames['Note'];
  if (noteAddr === undefined) {
    result.logs.push({ cls: 'error', msg: 'Note not allocated yet. Step through first.' });
    return result;
  }

  const dataAddr = noteAddr + heap.HEADER_SIZE;
  heap.write(dataAddr, bytes);

  const writtenPtr = heap._readLE(dataAddr, 4);
  heap.funcPtrs['action'] = { original: symbols.normal, current: writtenPtr } as any;

  result.logs.push({ cls: 'action', msg: 'read(0, note, 16) \u2014 wrote ' + bytes.length + ' bytes into the note.' });
  result.logs.push({ cls: 'action', msg: 'u->action() is called \u2014 the function pointer is now <span class="log-addr">' + hex8(writtenPtr) + '</span>' });

  if (writtenPtr === symbols.win) {
    result.logs.push({ cls: 'success', msg: 'The function pointer now points to win()! Executing...' });
    result.completed = true;
  } else {
    const sym = Object.entries(symbols).find(([, a]) => a === writtenPtr);
    if (sym) {
      result.logs.push({ cls: 'error', msg: 'Called ' + sym[0] + '() \u2014 not win(). Try ' + hex8(symbols.win) + ' in little-endian.' });
    } else {
      result.logs.push({ cls: 'error', msg: 'Jumped to ' + hex8(writtenPtr) + ' \u2014 SEGFAULT! Write win()\'s address (' + hex8(symbols.win) + ') in little-endian.' });
    }
  }

  return result;
}

export function heapDoubleFreeSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
  funcPtrAddr: number,
): HeapStepResult {
  const result: HeapStepResult = { logs: [] };
  const bAddr = heapNames['B'];
  if (bAddr === undefined) {
    result.logs.push({ cls: 'error', msg: 'Step through the guided part first.' });
    return result;
  }

  const dataAddr = bAddr + heap.HEADER_SIZE;
  heap.write(dataAddr, bytes);
  const targetAddr = heap._readLE(dataAddr, 4);

  result.logs.push({ cls: 'action', msg: '*(void**)b = <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 overwrote the forward pointer.' });

  heap.malloc(16);
  result.logs.push({ cls: 'action', msg: 'malloc(16) \u2014 returns chunk from the list.' });

  result.logs.push({ cls: 'action', msg: 'malloc(16) \u2014 follows the forward pointer to <span class="log-addr">' + hex8(targetAddr) + '</span>...' });

  if (targetAddr === funcPtrAddr) {
    heap.funcPtrs['handler'] = { original: symbols.normal, current: symbols.win } as any;
    result.logs.push({ cls: 'success', msg: 'The allocator returned the function pointer table! Writing win() there...' });
    result.logs.push({ cls: 'success', msg: 'handler() now points to win()! Executing...' });
    result.completed = true;
  } else {
    result.logs.push({ cls: 'error', msg: 'Returned <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 not the function pointer table (' + hex8(funcPtrAddr) + ').' });
  }

  return result;
}

export function heapOverflowSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
): HeapStepResult {
  const result: HeapStepResult = { logs: [] };
  const aAddr = heapNames['A'];
  const bAddr = heapNames['B'];
  if (aAddr === undefined || bAddr === undefined) {
    result.logs.push({ cls: 'error', msg: 'Chunks not set up.' });
    return result;
  }

  const aDataAddr = aAddr + heap.HEADER_SIZE;
  const bDataAddr = bAddr + heap.HEADER_SIZE;
  const aDataSize = 16;
  const headerSize = heap.HEADER_SIZE;

  heap.write(aDataAddr, bytes);

  const overflowIntoB = bytes.length > aDataSize + headerSize;

  if (bytes.length <= aDataSize) {
    result.logs.push({ cls: 'action', msg: 'Wrote ' + bytes.length + ' bytes into chunk A \u2014 no overflow.' });
    result.logs.push({ cls: 'info', msg: 'Need at least ' + (aDataSize + headerSize + 4) + ' bytes total.' });
  } else if (!overflowIntoB) {
    result.logs.push({ cls: 'action', msg: 'Wrote ' + bytes.length + ' bytes \u2014 overflowed into B\'s header but not its data. Keep going!' });
  } else {
    result.logs.push({ cls: 'action', msg: 'Wrote ' + bytes.length + ' bytes \u2014 OVERFLOW! Bytes spilled into B\'s data.' });

    const newPtr = heap._readLE(bDataAddr, 4);
    heap.funcPtrs['handler'] = { original: symbols.normal, current: newPtr } as any;

    result.logs.push({ cls: 'action', msg: '(*b)() is called \u2014 function pointer is now <span class="log-addr">' + hex8(newPtr) + '</span>' });

    if (newPtr === symbols.win) {
      result.logs.push({ cls: 'success', msg: 'The function pointer points to win()! Executing...' });
      result.completed = true;
    } else {
      result.logs.push({ cls: 'error', msg: 'Not win(). Write win()\'s address (' + hex8(symbols.win) + ') at the right offset.' });
    }
  }

  heap.markRegion(aAddr, bAddr + (heap.chunks.get(bAddr)?.size ?? 0));
  return result;
}

export function heapTcachePoisonSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
  funcPtrAddr: number,
): HeapStepResult {
  const result: HeapStepResult = { logs: [] };
  const bAddr = heapNames['B'];
  if (bAddr === undefined) {
    result.logs.push({ cls: 'error', msg: 'Step through the guided part first.' });
    return result;
  }

  const dataAddr = bAddr + heap.HEADER_SIZE;
  heap.write(dataAddr, bytes);
  const targetAddr = heap._readLE(dataAddr, 4);

  result.logs.push({ cls: 'action', msg: '*(void**)b = <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 overwrote B\'s fd pointer via UAF.' });

  heap.malloc(16);
  result.logs.push({ cls: 'action', msg: 'char *c = malloc(16) \u2014 returns chunk B from tcache.' });
  result.logs.push({ cls: 'action', msg: 'char *d = malloc(16) \u2014 follows the poisoned fd to <span class="log-addr">' + hex8(targetAddr) + '</span>...' });

  if (targetAddr === funcPtrAddr) {
    heap.funcPtrs['handler'] = { original: symbols.normal, current: symbols.win } as any;
    result.logs.push({ cls: 'success', msg: 'The allocator returned the function pointer table! Writing win() there...' });
    result.completed = true;
  } else {
    result.logs.push({ cls: 'error', msg: 'Returned <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 not the function pointer table (' + hex8(funcPtrAddr) + ').' });
  }

  return result;
}

export function heapFastbinDupSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
  funcPtrAddr: number,
): HeapStepResult {
  const result: HeapStepResult = { logs: [] };
  const aAddr = heapNames['A'];
  if (aAddr === undefined) {
    result.logs.push({ cls: 'error', msg: 'Step through the guided part first.' });
    return result;
  }

  const cResult = heap.malloc(16);
  if (cResult) {
    result.logs.push({ cls: 'action', msg: 'char *c = malloc(16) \u2014 returns chunk A from fastbin.' });
    heap.write(cResult.dataAddr, bytes);
    const targetAddr = heap._readLE(cResult.dataAddr, 4);
    result.logs.push({ cls: 'action', msg: '*(void**)c = <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 overwrote A\'s fd pointer.' });

    heap.malloc(16);
    result.logs.push({ cls: 'action', msg: 'malloc(16) \u2014 returns chunk B.' });
    heap.malloc(16);
    result.logs.push({ cls: 'action', msg: 'malloc(16) \u2014 returns chunk A again (cycle).' });
    result.logs.push({ cls: 'action', msg: 'char *d = malloc(16) \u2014 follows poisoned fd to <span class="log-addr">' + hex8(targetAddr) + '</span>...' });

    if (targetAddr === funcPtrAddr) {
      heap.funcPtrs['handler'] = { original: symbols.normal, current: symbols.win } as any;
      result.logs.push({ cls: 'success', msg: 'The allocator returned the function pointer table! Writing win() there...' });
      result.completed = true;
    } else {
      result.logs.push({ cls: 'error', msg: 'Returned <span class="log-addr">' + hex8(targetAddr) + '</span> \u2014 not the function pointer table (' + hex8(funcPtrAddr) + ').' });
    }
  }

  return result;
}

export function heapUnsortedBinSubmit(
  bytes: number[],
  heap: any,
  heapNames: Record<string, number>,
  symbols: Record<string, number>,
  funcPtrAddr: number,
): HeapStepResult {
  const result: HeapStepResult = { logs: [] };
  const aAddr = heapNames['A'];
  if (aAddr === undefined) {
    result.logs.push({ cls: 'error', msg: 'Step through the guided part first.' });
    return result;
  }

  const dataAddr = aAddr + heap.HEADER_SIZE;
  heap.write(dataAddr + 4, bytes);
  const bkVal = heap._readLE(dataAddr + 4, 4);

  result.logs.push({ cls: 'action', msg: 'Overwrote A\'s bk pointer to <span class="log-addr">' + hex8(bkVal) + '</span> via UAF.' });

  const writeTarget = (bkVal + 8) >>> 0;
  result.logs.push({ cls: 'action', msg: 'malloc(128) \u2014 removing A from the unsorted bin...' });
  result.logs.push({ cls: 'action', msg: 'Unlink writes main_arena (<span class="log-addr">' + hex8(heap.mainArena) + '</span>) to bk->fd = <span class="log-addr">' + hex8(writeTarget) + '</span>' });

  heap.malloc(128);

  if (writeTarget === funcPtrAddr) {
    heap.funcPtrs['handler'] = { original: symbols.normal, current: heap.mainArena } as any;
    result.logs.push({ cls: 'success', msg: 'main_arena address was written to the function pointer table!' });
    result.completed = true;
  } else {
    result.logs.push({ cls: 'error', msg: 'Write went to <span class="log-addr">' + hex8(writeTarget) + '</span> \u2014 not the function pointer table (' + hex8(funcPtrAddr) + '). Set bk = funcPtrAddr - 8 = <span class="log-addr">' + hex8((funcPtrAddr - 8) >>> 0) + '</span>.' });
  }

  return result;
}
