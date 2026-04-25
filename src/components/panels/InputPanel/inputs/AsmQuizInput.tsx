'use client';

import { useState, useCallback } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import { Emulator } from '@/engine/emulator-interface';
import { AsmQuizQuestion } from '@/exercises/types';
import WalkthroughButton from './WalkthroughButton';

interface AsmQuizInputProps {
  emulator: Emulator | null;
  questions: AsmQuizQuestion[];
}

export default function AsmQuizInput({ emulator, questions }: AsmQuizInputProps) {
  const { dispatch, currentExercise } = useExerciseContext();
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''));
  const [results, setResults] = useState<(boolean | null)[]>(questions.map(() => null));
  const [showHints, setShowHints] = useState<boolean[]>(questions.map(() => false));
  const [stepped, setStepped] = useState(false);

  const doStep = useCallback(() => {
    if (!emulator || emulator.state.halted) return;
    const result = emulator.step();
    if (!result) return;
    dispatch({ type: 'LOG', cls: 'info', msg: result.log });
    dispatch({ type: 'BUMP_VIZ' });
    if (result.halted) {
      dispatch({ type: 'LOG', cls: 'success', msg: 'Program halted.' });
    }
  }, [emulator, dispatch]);

  const doRunAll = useCallback(() => {
    if (!emulator || emulator.state.halted) return;
    let steps = 0;
    while (!emulator.state.halted && steps < 500) {
      const result = emulator.step();
      if (!result) break;
      steps++;
    }
    dispatch({ type: 'LOG', cls: 'info', msg: `Ran ${steps} instructions.` });
    dispatch({ type: 'BUMP_VIZ' });
    if (emulator.state.halted) {
      dispatch({ type: 'LOG', cls: 'success', msg: 'Program halted.' });
    }
  }, [emulator, dispatch]);

  const doReset = useCallback(() => {
    if (!emulator) return;
    emulator.reset();
    setStepped(false);
    dispatch({ type: 'CLEAR_LOG' });
    dispatch({ type: 'BUMP_VIZ' });
  }, [emulator, dispatch]);

  const parseAnswer = (text: string): number | null => {
    const t = text.trim().toLowerCase();
    if (!t) return null;
    if (t.startsWith('0x')) return parseInt(t, 16);
    if (/^[0-9a-f]+h$/.test(t)) return parseInt(t.slice(0, -1), 16);
    if (/^[0-9]+$/.test(t)) return parseInt(t, 10);
    if (/^[0-9a-f]+$/.test(t) && t.length > 2) return parseInt(t, 16);
    return parseInt(t, 10);
  };

  const doSubmit = useCallback(() => {
    if (!currentExercise) return;
    const newResults: (boolean | null)[] = [];
    let allCorrect = true;

    for (let i = 0; i < questions.length; i++) {
      const parsed = parseAnswer(answers[i]);
      if (parsed === null) {
        newResults.push(null);
        allCorrect = false;
        continue;
      }
      const correct = (parsed & 0xFFFFFFFF) === (questions[i].answer & 0xFFFFFFFF);
      newResults.push(correct);
      if (!correct) allCorrect = false;

      const expected = questions[i].format === 'decimal'
        ? questions[i].answer.toString()
        : '0x' + (questions[i].answer >>> 0).toString(16);

      if (correct) {
        dispatch({ type: 'LOG', cls: 'success', msg: `Q${i + 1}: Correct! ${expected}` });
      } else {
        dispatch({ type: 'LOG', cls: 'danger', msg: `Q${i + 1}: Wrong. Try again! (Hint: step through the code)` });
      }
    }

    setResults(newResults);
    if (!stepped) setStepped(true);

    if (allCorrect) {
      dispatch({ type: 'EXERCISE_COMPLETED', exerciseId: currentExercise.id });
      dispatch({ type: 'SHOW_SUCCESS', title: currentExercise.winTitle, msg: currentExercise.winMsg });
    }
  }, [answers, questions, currentExercise, dispatch, stepped]);

  const updateAnswer = (idx: number, val: string) => {
    const copy = [...answers];
    copy[idx] = val;
    setAnswers(copy);
  };

  const toggleHint = (idx: number) => {
    const copy = [...showHints];
    copy[idx] = !copy[idx];
    setShowHints(copy);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="controls">
        <button onClick={doStep} disabled={emulator?.state.halted ?? true}>Step</button>
        <button onClick={doRunAll} disabled={emulator?.state.halted ?? true}>Run All</button>
        <button onClick={doReset}>Reset</button>
        <WalkthroughButton />
      </div>

      <div style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 'bold', marginTop: '4px' }}>
        Answer the questions below:
      </div>

      {questions.map((q, i) => (
        <div key={i} style={{
          padding: '6px 8px',
          border: '1px solid ' + (results[i] === true ? 'var(--green)' : results[i] === false ? 'var(--danger)' : 'var(--panel-border)'),
          background: results[i] === true ? 'rgba(0,255,0,0.05)' : 'transparent',
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '4px' }}>
            <b>Q{i + 1}:</b> {q.question}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <input
              type="text"
              value={answers[i]}
              onChange={(e) => updateAnswer(i, e.target.value)}
              placeholder={q.format === 'decimal' ? 'Enter decimal...' : 'Enter hex (0x...)'}
              disabled={results[i] === true}
              style={{
                flex: 1,
                background: 'var(--bg)',
                color: 'var(--text)',
                border: '1px solid var(--panel-border)',
                padding: '4px 6px',
                fontFamily: 'var(--font)',
                fontSize: '12px',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') doSubmit(); }}
            />
            {results[i] === true && <span style={{ color: 'var(--green)', fontSize: '12px' }}>&#x2713;</span>}
            {results[i] === false && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>&#x2717;</span>}
          </div>
          {q.hint && (
            <div style={{ marginTop: '3px' }}>
              <button
                onClick={() => toggleHint(i)}
                style={{
                  background: 'none', border: 'none', color: 'var(--dim)',
                  fontSize: '10px', cursor: 'pointer', padding: 0,
                  textDecoration: 'underline',
                }}
              >
                {showHints[i] ? 'hide hint' : 'show hint'}
              </button>
              {showHints[i] && (
                <div style={{ fontSize: '10px', color: 'var(--warning)', marginTop: '2px' }}>{q.hint}</div>
              )}
            </div>
          )}
        </div>
      ))}

      <div className="controls">
        <button className="primary" onClick={doSubmit}>Submit Answers</button>
      </div>
    </div>
  );
}
