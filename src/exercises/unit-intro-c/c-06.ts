import { Exercise } from '../types';

const c06: Exercise = {
  id: 'c-06',
  unitId: 'unit-intro-c',
  title: '06: Dynamic Memory',
  desc: '<b>Goal:</b> Learn the difference between stack and heap memory, and how malloc() and free() work.',
  source: {
    c: [
      { text: '#include <stdlib.h>', cls: '' },
      { text: '#include <string.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'int main() {', cls: '' },
      { text: '    char *buf = malloc(16);', cls: 'highlight' },
      { text: '    strcpy(buf, "hello");', cls: 'highlight' },
      { text: '    free(buf);', cls: 'highlight' },
      { text: '    // buf still holds the old address!', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 256,
  steps: [
    {
      action: 'init',
      log: ['info', 'So far we have seen local variables on the stack. But sometimes you need memory that outlives the current function, or whose size you do not know at compile time. That is what the heap is for.'],
    },
    {
      action: 'malloc',
      size: 16,
      name: 'buf',
      srcLine: 4,
      log: ['action', 'malloc(16) asks the operating system for 16 bytes of heap memory. It returns a pointer to the start of that block. The allocator also adds a small header (metadata) before your data to track the block\'s size.'],
    },
    {
      action: 'init',
      srcLine: 5,
      log: ['info', 'strcpy(buf, "hello") copies the string into the heap block. The bytes h-e-l-l-o-\\0 are written starting at the address malloc returned. The remaining 10 bytes are unused but still allocated.'],
    },
    {
      action: 'free',
      name: 'buf',
      srcLine: 6,
      log: ['action', 'free(buf) releases the memory back to the allocator. The block goes onto a "free list" so it can be recycled by a future malloc of the same size.'],
    },
    {
      action: 'init',
      srcLine: 7,
      log: ['warn', 'After free(), the pointer buf still holds the old address, but that memory is no longer yours. Using buf after free is called a "use-after-free" bug. The data might still be there, or it might have been given to someone else.'],
    },
    {
      action: 'done',
      log: ['success', 'Stack memory is automatic (created and destroyed with function calls). Heap memory is manual (you control its lifetime with malloc and free). Mistakes with heap memory -- forgetting to free, using after free, writing past the allocated size -- are the basis of many real-world exploits.'],
    },
  ],
  check() { return false; },
  winTitle: 'Dynamic Memory!',
  winMsg: 'You learned how malloc and free manage heap memory.',
};

export default c06;
