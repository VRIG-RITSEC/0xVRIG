import { Exercise } from '../types';

const kern107: Exercise = {
  id: 'kern-107',
  unitId: 'unit18-kernel',
  title: '107: modprobe_path Overwrite',
  desc: '<b>Goal:</b> Exploit an arbitrary write primitive (from a UAF) to overwrite the kernel global <code>modprobe_path</code>. When a file with an unknown magic number is executed, the kernel runs modprobe_path as root. By changing it to <code>/tmp/x</code>, you get arbitrary root command execution.',
  source: {
    c: [
      { text: '#include <linux/module.h>', cls: '' },
      { text: '#include <linux/slab.h>', cls: '' },
      { text: '', cls: '' },
      { text: '// Kernel global:', cls: 'cmt' },
      { text: '// char modprobe_path[256] = "/sbin/modprobe";', cls: 'cmt highlight' },
      { text: '// When unknown binary format is execve()d,', cls: 'cmt' },
      { text: '// kernel runs: call_usermodehelper(modprobe_path,', cls: 'cmt' },
      { text: '//     argv, envp, UMH_WAIT_EXEC);', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'struct note {', cls: '' },
      { text: '    size_t size;', cls: '' },
      { text: '    char *data;', cls: 'highlight' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: 'static struct note *notes[16];', cls: '' },
      { text: '', cls: '' },
      { text: '// UAF gives write-what-where:', cls: 'cmt' },
      { text: '// 1. Allocate note, free it, reallocate', cls: 'cmt' },
      { text: '//    over it to control data pointer', cls: 'cmt' },
      { text: '// 2. Point data at modprobe_path', cls: 'cmt highlight' },
      { text: '// 3. Write "/tmp/x" through the note', cls: 'cmt highlight' },
      { text: '', cls: '' },
      { text: '// Trigger:', cls: 'cmt' },
      { text: '// $ echo -e "\\xff\\xff\\xff\\xff" > /tmp/bad', cls: 'cmt' },
      { text: '// $ chmod +x /tmp/bad && /tmp/bad', cls: 'cmt' },
      { text: '// Kernel runs /tmp/x as root!', cls: 'cmt highlight' },
    ],
  },
  mode: 'step',
  vizMode: 'heap',
  glibcVersion: '2.27',
  heapSize: 512,
  showSymbols: true,
  steps: [
    {
      action: 'init',
      log: ['info', 'The kernel has a global string modprobe_path = "/sbin/modprobe". When a user runs a file with an unrecognized format (bad magic bytes), the kernel calls modprobe_path as root to try loading a handler module. If we can overwrite this string, we control what runs as root.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        // Allocate initial note struct
        const note = heap.malloc(16);
        if (note) {
          heap.write(note.dataAddr, [
            0x10, 0x00, 0x00, 0x00, // size = 16
            0x00, 0x90, 0x04, 0x08, // data pointer (normal)
          ]);
          heap.markRegion(note.addr, note.addr + note.dataSize + 8);
        }
      },
    },
    {
      action: 'init',
      log: ['action', 'Step 1: Allocate a note struct via kmalloc. The struct has a size field and a data pointer. The data pointer tells the kernel where to write when we edit the note content.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        heap.clearHighlight();
        // Show the note with its fields labeled
        const note2 = heap.malloc(16);
        if (note2) {
          heap.write(note2.dataAddr, [
            0x10, 0x00, 0x00, 0x00, // size = 16
            0x00, 0x91, 0x04, 0x08, // data pointer
          ]);
          heap.markRegion(note2.addr, note2.addr + note2.dataSize + 8);
        }
      },
    },
    {
      action: 'init',
      log: ['warn', 'Step 2: Free the note but keep the reference (UAF). Then spray the allocator so a new object overlaps the freed note. Overwrite the data pointer to point at modprobe_path (e.g., 0xc0a0b000). Now editing the "note" actually writes to modprobe_path in kernel memory.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        heap.clearHighlight();
        // Simulate the UAF: show the data pointer now pointing to modprobe_path
        const spray = heap.malloc(16);
        if (spray) {
          heap.write(spray.dataAddr, [
            0x10, 0x00, 0x00, 0x00, // size = 16
            0x00, 0xb0, 0xa0, 0xc0, // data pointer -> modprobe_path!
          ]);
          heap.markRegion(spray.addr, spray.addr + spray.dataSize + 8);
        }
      },
    },
    {
      action: 'init',
      log: ['action', 'Step 3: Write "/tmp/x" through the corrupted data pointer. The kernel thinks we are editing note data, but we are actually writing to modprobe_path. It now reads "/tmp/x" instead of "/sbin/modprobe".'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        heap.clearHighlight();
        // Show "/tmp/x" being written
        const target = heap.malloc(16);
        if (target) {
          // "/tmp/x\0" = [0x2f, 0x74, 0x6d, 0x70, 0x2f, 0x78, 0x00]
          heap.write(target.dataAddr, [
            0x2f, 0x74, 0x6d, 0x70, // "/tmp"
            0x2f, 0x78, 0x00, 0x00, // "/x\0\0"
          ]);
          heap.markRegion(target.addr, target.addr + target.dataSize + 8);
        }
      },
    },
    {
      action: 'init',
      log: ['action', 'Step 4: Trigger modprobe_path execution. Create /tmp/x with "#!/bin/sh\\nid > /tmp/pwned". Create /tmp/bad with invalid magic bytes (\\xff\\xff\\xff\\xff), chmod +x, then execute it. The kernel cannot find a handler, so it runs modprobe_path = "/tmp/x" as root.'],
      vizAction: (_sim: any, heap: any) => {
        if (!heap) return;
        heap.clearHighlight();
      },
    },
    {
      action: 'done',
      log: ['success', 'modprobe_path overwrite complete! Attack chain: (1) UAF gives write-what-where primitive. (2) Overwrite note data pointer to modprobe_path address. (3) Write "/tmp/x" to modprobe_path. (4) Execute file with unknown magic -> kernel runs /tmp/x as root. This technique works even with SMEP/SMAP/KASLR since we never redirect kernel code execution.'],
    },
  ],
  check() { return false; },
  winTitle: 'modprobe_path Pwned!',
  winMsg: 'You learned the modprobe_path overwrite technique. Unlike traditional ROP/ret2usr attacks, this only requires an arbitrary kernel write -- no code execution redirection needed. The kernel itself calls your script as root. This bypasses SMEP, SMAP, and even CFI since no function pointers are hijacked.',
  realWorld: 'CVE-2022-0185: A heap overflow in the Linux filesystem context API was exploited via modprobe_path overwrite to escape containers and gain host root access.',
};

export default kern107;
