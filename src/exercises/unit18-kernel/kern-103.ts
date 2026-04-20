import { Exercise } from '../types';

const kern103: Exercise = {
  id: 'kern-103',
  unitId: 'unit18-kernel',
  title: '103: Kernel Memory Layout',
  desc: 'The Linux kernel runs in the most privileged CPU mode (<strong>ring 0</strong>) with its own address space, stack, and memory protections. Understanding the layout is essential before attacking it. Answer the quiz questions about kernel fundamentals.',
  source: {
    c: [
      { text: '#include <linux/module.h>', cls: '' },
      { text: '#include <linux/kernel.h>', cls: '' },
      { text: '#include <linux/init.h>', cls: '' },
      { text: '', cls: '' },
      { text: 'MODULE_LICENSE("GPL");', cls: '' },
      { text: '', cls: '' },
      { text: 'static int __init hello_init(void) {', cls: '', fn: true },
      { text: '    printk(KERN_INFO "Hello from ring 0!\\n");', cls: 'highlight' },
      { text: '    // We are running in kernel space now', cls: 'cmt' },
      { text: '    // Addresses here start at 0xffff8000...', cls: 'cmt' },
      { text: '    // Kernel stack: 2 pages (8KB) per task', cls: 'cmt' },
      { text: '    // KASLR adds 9 bits of entropy', cls: 'cmt' },
      { text: '    return 0;', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'static void __exit hello_exit(void) {', cls: '', fn: true },
      { text: '    printk(KERN_INFO "Goodbye from ring 0\\n");', cls: '' },
      { text: '}', cls: '' },
      { text: '', cls: '' },
      { text: 'module_init(hello_init);', cls: '' },
      { text: 'module_exit(hello_exit);', cls: '' },
    ],
  },
  mode: 'asm-quiz',
  vizMode: 'asm',
  asmQuiz: [
    {
      question: 'What privilege ring does the kernel run in?',
      answer: 0,
      format: 'decimal',
      hint: 'The most privileged ring on x86. User programs run in ring 3.',
    },
    {
      question: 'On x86-64 Linux, kernel addresses start at what prefix? (simplified 32-bit representation)',
      answer: 0xffff8000,
      format: 'hex',
      hint: 'Kernel virtual addresses occupy the upper half of the 64-bit address space.',
    },
    {
      question: 'Default kernel stack size in pages? (1 page = 4KB)',
      answer: 2,
      format: 'decimal',
      hint: '8KB total. Each page is 4KB.',
    },
    {
      question: 'How many bits of entropy does KASLR add on x86-64?',
      answer: 9,
      format: 'decimal',
      hint: 'KASLR randomizes the kernel base among 512 possible positions.',
    },
  ],
  check: () => false,
  winTitle: 'Kernel Fundamentals Mastered!',
  winMsg: 'You understand the basics of kernel memory layout: ring 0 privilege, high-address kernel space, the per-task 8KB kernel stack, and the 9 bits of KASLR entropy. These fundamentals are required for all kernel exploitation techniques.',
};

export default kern103;
