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
import SymbolTable from './tools/SymbolTable';
import HexCalculator from './tools/HexCalculator';
import PayloadBuilder from './tools/PayloadBuilder';
import GadgetTable from './tools/GadgetTable';
import SigframeBuilder from './tools/SigframeBuilder';

export default function InputPanel() {
  const { currentExercise } = useExerciseContext();
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
          {ex && (
            <div
              style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '0.5rem' }}
              dangerouslySetInnerHTML={{ __html: ex.desc }}
            />
          )}
          {content}
          {ex && <SymbolTable />}
          {ex?.showCalc && <HexCalculator />}
          {ex && <PayloadBuilder />}
          {ex && <GadgetTable />}
          {ex && <SigframeBuilder />}
        </div>
      </div>
    </div>
  );
}
