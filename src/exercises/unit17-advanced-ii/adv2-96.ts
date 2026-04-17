import { Exercise } from '../types';

const adv296: Exercise = {
  id: 'adv2-96',
  unitId: 'unit17-advanced-ii',
  title: '96: Kernel Pool Overflow',
  desc: '<b>Goal:</b> Understand Windows kernel pool exploitation. The kernel pool is the kernel-mode equivalent of the userland heap, managed by <code>ExAllocatePoolWithTag</code>. Pool chunks have 8-byte headers containing size, type, tag, and process billed. Unlike userland heaps, kernel pool corruption can lead to privilege escalation. The attacker sprays pool objects of a known size to create a predictable layout, then overflows one object into the header of the next. By corrupting the <strong>TypeIndex</strong> in an adjacent <code>OBJECT_HEADER</code>, the attacker redirects a kernel object\'s type pointer to a fake type object in user-controlled memory, gaining code execution at ring 0.',
  source: {
    c: [
      { text: '// Simplified Windows kernel pool exploitation', cls: 'cmt' },
      { text: '// POOL_HEADER structure (8 bytes):', cls: 'cmt' },
      { text: '//   [PrevSize:2][PoolIndex:2][BlockSize:2][PoolType:2]', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'PVOID vuln_alloc(SIZE_T size) {', cls: '' },
      { text: '    PVOID buf = ExAllocatePoolWithTag(', cls: '' },
      { text: '        NonPagedPool, size, \'VULN\');', cls: 'highlight' },
      { text: '    return buf;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: '// Attacker sprays objects of same size', cls: 'cmt' },
      { text: 'for (int i = 0; i < 1000; i++)', cls: '' },
      { text: '    CreateEvent(NULL, FALSE, FALSE, NULL);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// Free every other one to create holes', cls: 'cmt' },
      { text: 'for (int i = 0; i < 1000; i += 2)', cls: '' },
      { text: '    CloseHandle(events[i]);', cls: 'highlight' },
      { text: '', cls: '' },
      { text: '// Trigger vulnerable allocation into hole', cls: 'cmt' },
      { text: 'DeviceIoControl(hDev, IOCTL_VULN,', cls: '' },
      { text: '    payload, payload_size, ...);', cls: 'highlight vuln' },
      { text: '// Overflow into adjacent OBJECT_HEADER!', cls: 'cmt' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  heapSize: 512,
  steps: [
    {
      action: 'init',
      log: ['info', 'The Windows kernel pool is the ring-0 equivalent of the userland heap. Memory is divided into pool pages, and each allocation gets an 8-byte POOL_HEADER. Unlike userland, there are no safe unlinking checks — corrupting headers is devastating.'],
    },
    {
      action: 'malloc', size: 64, name: 'Event_0', srcLine: 12,
      log: ['action', 'Spray phase: allocate hundreds of Event objects (0x40 bytes each) in NonPagedPool. This fills pool pages with same-sized, adjacent objects, creating a predictable memory layout.'],
    },
    {
      action: 'malloc', size: 64, name: 'Event_1', srcLine: 12,
      log: ['action', 'Another Event object lands right next to Event_0. The pool allocator places same-sized objects contiguously within a pool page. After spraying ~1000 objects, the layout becomes deterministic.'],
    },
    {
      action: 'malloc', size: 64, name: 'Event_2', srcLine: 12,
      log: ['action', 'Pool page is filling up: [POOL_HDR|Event_0][POOL_HDR|Event_1][POOL_HDR|Event_2]... Each POOL_HEADER is 8 bytes, followed by the OBJECT_HEADER and object body.'],
    },
    {
      action: 'free', name: 'Event_1', srcLine: 16,
      log: ['action', 'Poke holes: free every other Event. This creates gaps of exactly the right size. The next allocation of that size will land in one of these holes, adjacent to a surviving Event object.'],
    },
    {
      action: 'malloc', size: 64, name: 'vuln_buf', srcLine: 19,
      log: ['warn', 'The vulnerable driver allocation fills the hole left by Event_1. It now sits between Event_0 and Event_2. The driver writes user-controlled data into vuln_buf with insufficient bounds checking.'],
    },
    {
      action: 'init',
      log: ['warn', 'OVERFLOW: The attacker sends a payload larger than the allocation. Data spills past vuln_buf into Event_2\'s POOL_HEADER and OBJECT_HEADER, corrupting its TypeIndex. The kernel now treats Event_2 as a different object type — one the attacker controls.'],
    },
    {
      action: 'done',
      log: ['success', 'Pool overflow complete. By spraying same-sized objects, poking holes, and overflowing into an adjacent OBJECT_HEADER, the attacker corrupts the TypeIndex to point to a fake type in user memory. When the kernel dispatches a method on that object, it calls attacker-controlled code at ring 0. Modern mitigations include NonPagedPoolNx, pool header cookies, and SMEP/SMAP.'],
    },
  ],
  check() { return false; },
  winTitle: 'Kernel Pool Overflow!',
  winMsg: 'You traced a kernel pool spray-and-overflow attack: deterministic layout via spray, hole creation via selective frees, and OBJECT_HEADER corruption via overflow. This is the foundation of Windows local privilege escalation exploits.',
};

export default adv296;
