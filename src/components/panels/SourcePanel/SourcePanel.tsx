'use client';

import { useExerciseContext } from '@/state/ExerciseContext';

function highlightSyntax(text: string): string {
  return text
    .replace(/\b(void|int|char|return|if|else|while|for|struct|const|unsigned|signed|long|short|size_t|ssize_t|printf|gets|read|write|memcpy|strcpy|strlen|malloc|free|sizeof|NULL)\b/g,
      '<span class="src-kw">$1</span>')
    .replace(/"([^"]*)"/g, '<span class="src-str">"$1"</span>')
    .replace(/\b(main|vuln|win|normal)\b(?=\s*\()/g, '<span class="src-fn">$1</span>')
    .replace(/(\/\/.*)$/g, '<span class="src-cmt">$1</span>');
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
