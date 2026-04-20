import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'whint-62',
  unitId: 'unit12-win-heap-internals',
  title: '62: Heap Metadata Encoding',
  desc: '<b>Goal:</b> Understand how Windows protects heap chunk headers using XOR encoding. Each <strong>_HEAP_ENTRY</strong> header is XORed with a per-heap cookie stored in <code>_HEAP.Encoding</code>. This means overwriting header bytes with attacker-controlled data produces garbage when decoded, causing the heap manager to detect corruption and terminate the process.',
  source: {
    c: [
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// _HEAP_ENTRY encoding (NT Heap)', cls: 'cmt' },
      { text: '// Header is XORed with heap cookie', cls: 'cmt' },
      { text: '', cls: '' },
      { text: '// Pseudocode: what the allocator does', cls: 'cmt' },
      { text: 'HEAP_ENTRY raw_header;', cls: '' },
      { text: 'raw_header.Size = 0x0003;', cls: 'highlight' },
      { text: 'raw_header.Flags = BUSY;', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// Encode before writing to memory:', cls: 'cmt' },
      { text: 'encoded = raw_header XOR heap->Encoding;', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// On free, decode and validate:', cls: 'cmt' },
      { text: 'decoded = encoded XOR heap->Encoding;', cls: 'highlight' },
      { text: 'if (decoded.CheckSum != valid)', cls: 'highlight' },
      { text: '    RtlReportHeapFailure();', cls: 'highlight' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 256,
  steps: [
    {
      action: 'init',
      log: ['info', 'Windows Vista+ introduced heap header encoding. The _HEAP_ENTRY (8 bytes on x86, 16 on x64) is XORed with _HEAP.Encoding -- a random value generated at heap creation. An attacker who overwrites the header without knowing the encoding key will produce invalid metadata.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.clear?.(); },
    },
    {
      action: 'malloc', size: 16, name: 'A', srcLine: 5,
      log: ['action', 'Allocating chunk A. The allocator builds a raw _HEAP_ENTRY: Size=3 (in 8-byte units, so 3*8=24 total), Flags=BUSY, PreviousSize, SmallTagIndex (a checksum of the other fields). Then it XORs the entire 8-byte header with _HEAP.Encoding before writing to memory.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'header'); heap.annotateField?.('A', 'size', 'raw XOR Encoding'); },
    },
    {
      action: 'init', srcLine: 9,
      log: ['info', 'In memory, the header looks random: encoded_header = raw_header XOR heap_cookie. The key insight: _HEAP.Encoding is stored once in the _HEAP structure, not alongside each chunk. An attacker needs an info leak of the heap base to find the encoding key.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'header'); heap.annotateField?.('A', 'size', 'encoded (looks random)'); },
    },
    {
      action: 'init', srcLine: 12,
      log: ['warn', 'When HeapFree is called, the allocator decodes: raw = encoded XOR _HEAP.Encoding. It then validates SmallTagIndex (a checksum of Size, Flags, and PreviousSize). If the checksum fails, RtlReportHeapFailure() is called, terminating the process. This catches naive header overwrites.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightField?.('A', 'size'); heap.annotateField?.('A', 'size', 'decode + checksum validate'); },
    },
    {
      action: 'free', name: 'A', srcLine: 12,
      log: ['action', 'HeapFree decodes chunk A\'s header and validates the checksum. Since we did not corrupt it, validation passes and the chunk is returned to the free list. If an overflow from an adjacent chunk had clobbered these 8 bytes, the XOR decode would produce a bad checksum and the process would crash.'],
      vizAction: (_sim: any, heap: any) => { if (!heap) return; heap.highlightChunk?.('A', 'freed'); heap.annotateField?.('A', 'fd', 'Flink (valid)'); },
    },
    {
      action: 'done',
      log: ['success', 'Heap metadata encoding: each _HEAP_ENTRY is XORed with a per-heap random cookie. SmallTagIndex acts as a checksum over Size + Flags + PreviousSize. Corruption is detected on HeapFree/HeapReAlloc. To bypass: leak the encoding key, or target user data (function pointers) instead of metadata.'],
    },
  ],
  check() { return false; },
  winTitle: 'Encoding Understood!',
  winMsg: 'You understand Windows heap header XOR encoding: per-heap cookie, SmallTagIndex checksum, and how it detects metadata corruption on free/realloc.',
};

export default exercise;
