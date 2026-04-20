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

const TOKEN_RE = /\/\/.*$|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#\w+|<[\w.\/]+>|\b\w+\b/gm;

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

export default function SourcePanel() {
  const { currentExercise, state } = useExerciseContext();

  if (!currentExercise) {
    return (
      <div className="panel" id="source-panel">
        <div className="panel-hdr">source.c</div>
        <div id="exercise-desc">Select an exercise to begin.</div>
        <div className="panel-body">
          <div id="source-code"></div>
        </div>
      </div>
    );
  }

  const lines = currentExercise.source.c;

  return (
    <div className="panel" id="source-panel">
      <div className="panel-hdr">source.c</div>
      <div
        id="exercise-desc"
        dangerouslySetInnerHTML={{ __html: currentExercise.desc }}
      />
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
            const html = line.text ? highlightSyntax(line.text) : '\u00A0';
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
