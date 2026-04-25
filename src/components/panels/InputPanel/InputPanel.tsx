'use client';

import { useState } from 'react';
import { useExerciseContext } from '@/state/ExerciseContext';
import StepControls from './inputs/StepControls';
import TextHexInput from './inputs/TextHexInput';
import FmtReadInput from './inputs/FmtReadInput';
import FmtWriteInput from './inputs/FmtWriteInput';
import IntOverflowInput from './inputs/IntOverflowInput';
import SignednessInput from './inputs/SignednessInput';
import HeapStepInput from './inputs/HeapStepInput';
import FinalChainInput from './inputs/FinalChainInput';
import FinalBlindInput from './inputs/FinalBlindInput';
import AsmStepInput from './inputs/AsmStepInput';
import AsmQuizInput from './inputs/AsmQuizInput';
import Toolkit from './Toolkit';

export default function InputPanel({ showToolkit = true }: { showToolkit?: boolean }) {
  const { currentExercise, asmEmulator, state, dispatch } = useExerciseContext();
  const ex = currentExercise;
  const [collapsed, setCollapsed] = useState(false);

  let content: React.ReactNode;
  if (!ex) {
    content = <div style={{ color: 'var(--text-dim)' }}>No exercise loaded.</div>;
  } else {
    switch (ex.mode) {
      case 'step':
        content = <StepControls />;
        break;
      case 'input-text':
      case 'input-hex':
        content = <TextHexInput />;
        break;
      case 'input-fmt-read':
        content = <FmtReadInput />;
        break;
      case 'input-fmt-write':
        content = <FmtWriteInput />;
        break;
      case 'input-int-overflow':
        content = <IntOverflowInput />;
        break;
      case 'input-signedness':
        content = <SignednessInput />;
        break;
      case 'heap-uaf':
      case 'heap-double-free':
      case 'heap-overflow':
      case 'heap-tcache-poison':
      case 'heap-fastbin-dup':
      case 'heap-unsorted-bin':
      case 'heap-house-force':
      case 'heap-house-spirit':
      case 'heap-house-orange':
      case 'heap-house-einherjar':
      case 'heap-house-lore':
        content = <HeapStepInput />;
        break;
      case 'final-chain':
        content = <FinalChainInput />;
        break;
      case 'final-blind':
        content = <FinalBlindInput />;
        break;
      case 'asm-step':
      case 'asm-registers':
        content = <AsmStepInput emulator={asmEmulator.current} />;
        break;
      case 'asm-quiz':
        content = ex.asmQuiz
          ? <AsmQuizInput emulator={asmEmulator.current} questions={ex.asmQuiz} />
          : <AsmStepInput emulator={asmEmulator.current} />;
        break;
      default:
        content = <div style={{ color: 'var(--text-dim)' }}>Input mode &ldquo;{ex.mode}&rdquo; coming soon.</div>;
        break;
    }
  }

  return (
    <div className={`panel input-panel-shell${collapsed ? ' is-collapsed' : ''}`} id="input-panel">
      <div className="panel-hdr input-panel-header">
        <span>input</span>
        <div className="input-panel-header-actions">
          {state.inputProgress && (
            <span className="input-panel-progress">{state.inputProgress}</span>
          )}
          <button
            type="button"
            className="input-panel-action"
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? 'Expand' : 'Minimize'}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="panel-body">
        <div id="input-area">
          {content}
          {showToolkit && ex && <Toolkit exercise={ex} />}
        </div>
        </div>
      )}
    </div>
  );
}
