import { Exercise } from '../types';

const adv93: Exercise = {
  id: 'adv-93',
  unitId: 'unit16-advanced',
  title: '93: FILE Structure Attack',
  desc: '<b>Goal:</b> Exploit the FILE structure vtable to hijack control flow. In glibc, <code>stdin</code>, <code>stdout</code>, and <code>stderr</code> are <code>_IO_FILE</code> structures containing an internal vtable pointer (<code>__vtable</code>) at a fixed offset. This vtable has entries for <code>__overflow</code>, <code>__underflow</code>, <code>__finish</code>, and other I/O operations. When you call <code>fclose(fp)</code> or <code>fflush(fp)</code>, glibc invokes <code>fp->__vtable->__finish(fp)</code> or <code>fp->__vtable->__overflow(fp)</code>.<br><br><b>Attack:</b> If you can corrupt the <code>_IO_FILE</code> structure (via heap overflow, UAF, or arbitrary write), overwrite the vtable pointer to point at a fake vtable. When <code>fclose()</code> or any I/O operation triggers a vtable call, execution jumps to your controlled address. Note: glibc 2.24+ added <code>IO_validate_vtable</code> to restrict vtable pointers to the <code>__libc_IO_vtables</code> section, but this can be bypassed using <code>_IO_str_jumps</code> or <code>_IO_wstr_jumps</code>.<br><br>Overflow the buffer and overwrite the return address with <code>win()</code> to model the FILE vtable hijack.',
  source: {
    c: [
      { text: '// Simplified _IO_FILE structure', cls: 'cmt' },
      { text: 'struct _IO_FILE {', cls: '' },
      { text: '    int _flags;          // +0x00', cls: '' },
      { text: '    char *_IO_read_ptr;  // +0x04', cls: '' },
      { text: '    char *_IO_read_end;  // +0x08', cls: '' },
      { text: '    char *_IO_write_base;// +0x14', cls: '' },
      { text: '    char *_IO_write_ptr; // +0x18', cls: '' },
      { text: '    char *_IO_write_end; // +0x1c', cls: '' },
      { text: '    char *_IO_buf_base;  // +0x24', cls: '' },
      { text: '    // ... more fields ...', cls: 'cmt' },
      { text: '    void *__vtable;      // +0x94 (32-bit)', cls: 'highlight' },
      { text: '};', cls: '' },
      { text: '', cls: '' },
      { text: '// vtable layout:', cls: 'cmt' },
      { text: '// __finish, __overflow, __underflow, ...', cls: 'cmt' },
      { text: '', cls: '' },
      { text: 'void win() { printf("FLAG\\n"); }', cls: '' },
      { text: '', cls: '' },
      { text: 'void vuln() {', cls: '', fn: true },
      { text: '    char buf[16];', cls: 'highlight' },
      { text: '    FILE *fp = fopen("/tmp/x", "w");', cls: '' },
      { text: '    gets(buf);', cls: 'highlight vuln' },
      { text: '    // Corrupt fp->__vtable via overflow', cls: 'cmt' },
      { text: '    fclose(fp);  // triggers __finish!', cls: 'highlight vuln' },
      { text: '}', cls: '' },
    ],
  },
  mode: 'input-hex',
  vizMode: 'stack',
  bufSize: 16,
  showSymbols: true,
  showBuilder: true,
  check(sim, _heap, symbols) {
    return sim.getRetAddr() === symbols.win;
  },
  winTitle: 'FLAG{file_vtable_hijack}',
  winMsg: 'You hijacked control flow through the _IO_FILE vtable. In real exploits, attackers corrupt the __vtable pointer in a FILE structure to redirect fclose/fflush to arbitrary code. This technique was widely used before glibc 2.24 added IO_validate_vtable. Modern variants use _IO_str_jumps to bypass the validation.',
  realWorld: 'CVE-2018-16323 (ImageMagick): A heap buffer over-read allowed corruption of FILE structures, demonstrating the real-world applicability of FILE structure attacks in complex applications.',
};

export default adv93;
