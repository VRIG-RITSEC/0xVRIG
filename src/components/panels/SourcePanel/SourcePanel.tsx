'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

const KW = new Set([
  'void','int','char','return','if','else','while','for','do','switch','case',
  'break','continue','default','struct','union','enum','typedef','const',
  'unsigned','signed','long','short','static','extern','volatile','register',
  'size_t','ssize_t','uint8_t','uint16_t','uint32_t','uint64_t',
  'int8_t','int16_t','int32_t','int64_t','uintptr_t','ptrdiff_t',
  'bool','true','false','NULL','nullptr',
  'printf','fprintf','sprintf','snprintf','puts','gets','fgets',
  'read','write','open','close','mmap','mprotect',
  'memcpy','memmove','memset','strcpy','strncpy','strcat','strlen','strcmp',
  'malloc','calloc','realloc','free','sizeof','offsetof',
  'signal','sigaction','sigreturn',
  'include','define','pragma','ifdef','ifndef','endif',
  'DWORD','HANDLE','LPVOID','BOOL','HMODULE','PVOID','ULONG','SIZE_T',
  'HeapAlloc','HeapFree','HeapCreate','VirtualAlloc','VirtualProtect',
  'LoadLibrary','GetProcAddress','CreateThread',
]);
const FN = new Set(['main','vuln','win','normal','exploit','shellcode','gadget','pivot','target','handler','callback']);

const ASM_MNEMONICS = new Set([
  'mov','add','sub','push','pop','ret','call','jmp','je','jne','jz','jnz',
  'jg','jge','jl','jle','ja','jae','jb','jbe','xor','and','or','not',
  'shl','shr','sar','sal','cmp','test','lea','nop','hlt','int','syscall',
  'sysenter','leave','enter','inc','dec','neg','mul','imul','div','idiv',
  'cdq','cbw','cwde','rep','movs','stos','cmps','lods','bswap',
  'ldr','str','bl','bx','blx','svc','swi','stmfd','ldmfd','b',
  'lw','sw','li','la','addiu','addi','lui','ori','beq','bne','jr','jal',
  'section','global','extern','db','dw','dd','dq','resb','resw','resd',
]);
const ASM_REGS = new Set([
  'eax','ebx','ecx','edx','esi','edi','esp','ebp','eip',
  'rax','rbx','rcx','rdx','rsi','rdi','rsp','rbp','rip',
  'r8','r9','r10','r11','r12','r13','r14','r15',
  'al','ah','bl','bh','cl','ch','dl','dh',
  'ax','bx','cx','dx','si','di','sp','bp',
  'r0','r1','r2','r3','r4','r5','r6','r7','r8','r9','r10','r11','r12','r13','r14','r15',
  'lr','pc','fp','ip','sl',
  'sp','ra','gp','at','v0','v1','a0','a1','a2','a3',
  't0','t1','t2','t3','t4','t5','t6','t7','t8','t9',
  's0','s1','s2','s3','s4','s5','s6','s7','s8',
  'cs','ds','es','fs','gs','ss',
]);

const TOKEN_RE = /\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#\w+|<[\w./]+>|\b\w+\b/gm;
const ASM_TOKEN_RE = /;.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|0x[\da-fA-F]+|\b\w+\b/gm;

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlightSyntax(text: string): string {
  return text.replace(TOKEN_RE, (tok) => {
    if (tok.startsWith('//')) return `<span class="src-cmt">${escHtml(tok)}</span>`;
    if (tok.startsWith('"') || tok.startsWith("'")) return `<span class="src-str">${escHtml(tok)}</span>`;
    if (tok.startsWith('#')) return `<span class="src-kw">${escHtml(tok)}</span>`;
    if (tok.startsWith('<') && tok.endsWith('>')) return `<span class="src-str">${escHtml(tok)}</span>`;
    if (KW.has(tok)) return `<span class="src-kw">${tok}</span>`;
    if (FN.has(tok)) return `<span class="src-fn">${tok}</span>`;
    return tok;
  });
}

function highlightAsm(text: string): string {
  return text.replace(ASM_TOKEN_RE, (tok) => {
    if (tok.startsWith(';')) return `<span class="src-cmt">${escHtml(tok)}</span>`;
    if (tok.startsWith('"') || tok.startsWith("'")) return `<span class="src-str">${escHtml(tok)}</span>`;
    if (tok.startsWith('0x')) return `<span class="src-num">${tok}</span>`;
    const lower = tok.toLowerCase();
    if (ASM_MNEMONICS.has(lower)) return `<span class="src-kw">${tok}</span>`;
    if (ASM_REGS.has(lower)) return `<span class="src-fn">${tok}</span>`;
    if (FN.has(tok)) return `<span class="src-fn">${tok}</span>`;
    return tok;
  });
}

export default function SourcePanel({ showDescription = true }: { showDescription?: boolean }) {
  const { currentExercise, state } = useExerciseContext();

  if (!currentExercise) {
    return (
      <div className="panel" id="source-panel">
        <div className="panel-hdr">source.c</div>
        {showDescription && <div id="exercise-desc">Select an exercise to begin.</div>}
        <div className="panel-body">
          <div id="source-code"></div>
        </div>
      </div>
    );
  }

  const isAsmExercise = currentExercise.mode.startsWith('asm-') || currentExercise.vizMode === 'asm';
  const hasAsmSource = currentExercise.source.asm && currentExercise.source.asm.length > 0;
  const lines = hasAsmSource && isAsmExercise ? currentExercise.source.asm! : currentExercise.source.c;
  const fileName = isAsmExercise ? 'source.asm' : 'source.c';

  return (
    <div className="panel" id="source-panel">
      <div className="panel-hdr">{fileName}</div>
      {showDescription && (
        <div
          id="exercise-desc"
          dangerouslySetInnerHTML={{ __html: currentExercise.desc }}
        />
      )}
      <div className="panel-body">
        <div id="source-code">
          {lines.map((line, i) => {
            const classes = ['src-line'];
            if (line.cls) {
              for (const c of line.cls.split(/\s+/)) {
                if (c) classes.push(c);
              }
            }
            if (i === state.execLine) classes.push('executing');
            const highlight = isAsmExercise ? highlightAsm : highlightSyntax;
            const html = line.text ? highlight(line.text) : '\u00A0';
            return (
              <span key={i} className={classes.join(' ')}>
                <span className="ln">{i + 1}</span>
                <span dangerouslySetInnerHTML={{ __html: html }} />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
