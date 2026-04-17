'use client';

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

export default function InputPanel() {
  const { currentExercise, asmEmulator } = useExerciseContext();
  const ex = currentExercise;

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
    <div className="panel" id="input-panel">
      <div className="panel-hdr">input</div>
      <div className="panel-body">
        <div id="input-area">
          {content}
          {ex && <Toolkit exercise={ex} />}
        </div>
      </div>
    </div>
  );
}
