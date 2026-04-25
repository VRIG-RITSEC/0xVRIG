'use client';

import { hex8 } from '@/engine/helpers';
import { Exercise } from '@/exercises/types';
import { useExerciseContext } from '@/state/ExerciseContext';

interface SolutionGuide {
  answer: string;
  why: string;
  steps: string[];
}

function getSolutionGuide(exercise: Exercise, symbols: Record<string, number>): SolutionGuide {
  switch (exercise.id) {
    case 'rit-00':
      return {
        answer: 'Use Step to move through the guided interface tour, and inspect each workspace tab once as you go.',
        why: 'This lesson exists to teach the interface itself, so the correct answer is understanding where the simulator views, tools, console, and navigation live.',
        steps: [
          'Keep the directions open and read them first.',
          'Use Code and Assembly together so you can connect the source to the stack view.',
          'Open Misc to see where the symbols table, calculator, payload builder, and gadgets appear.',
          'Use the bottom pager and Contents button so the workshop navigation feels familiar before you start exploiting anything.',
        ],
      };
    case 'rit-01':
      return {
        answer: 'Press Step until all guided stack-frame steps are complete.',
        why: 'This lesson is only about observing how a function call lays out the stack: return address first, saved base pointer next, and buffer below them.',
        steps: [
          'Step once to save the return address.',
          'Step again to place the saved base pointer.',
          'Step again to allocate the 16-byte buffer.',
          'Finish the sequence and compare the buffer location to the return address above it.',
        ],
      };
    case 'rit-02':
      return {
        answer: 'Send more than 20 bytes so your input reaches the return address. A simple junk payload with at least 24 bytes is enough to crash it.',
        why: 'The 16-byte buffer is followed by a 4-byte saved base pointer and then the 4-byte return address. Once you pass byte 20, you begin corrupting control flow.',
        steps: [
          'Fill the first 16 bytes to cover the buffer.',
          'Add 4 more bytes to write through the saved base pointer.',
          'Add at least 4 extra bytes of junk so the saved return address becomes garbage.',
          'Run the payload and watch the return address become invalid in the visualization.',
        ],
      };
    case 'rit-03':
      return {
        answer: `Use 20 bytes of padding followed by win() in little-endian form. In this run, win() is ${hex8(symbols.win)}.`,
        why: 'The first 20 bytes walk up to the saved return address. Replacing that final address with win() makes the function return into the secret function instead of back to main().',
        steps: [
          'Open Misc and find win() in the symbols table.',
          'Add 20 bytes of padding: 16 for the buffer and 4 for the saved base pointer.',
          `Append win() as ${hex8(symbols.win)} in little-endian byte order.`,
          'Submit the payload and confirm that the return address now points to win().',
        ],
      };
    case 'rit-04':
      return {
        answer: `Take the leaked main() address, add 0x150, then send 20 bytes of padding plus ${hex8(symbols.win)} in little-endian form.`,
        why: 'ASLR changes the absolute addresses, but the offset between main() and win() does not change in this lesson. A single leak is enough to reconstruct the winning target.',
        steps: [
          `Read the leaked main() address from the console. In this run, main() is ${hex8(symbols.main)}.`,
          `Compute win() as main() + 0x150, which is ${hex8(symbols.win)} here.`,
          'Build the same overwrite as before: 20 bytes of padding to reach the saved return address.',
          `Append ${hex8(symbols.win)} in little-endian form and submit the payload.`,
        ],
      };
    case 'rit-rop': {
      const gadget = exercise.gadgets ? Number(Object.keys(exercise.gadgets)[0]) : 0;
      return {
        answer: `Use 20 bytes of padding, then ${hex8(gadget)}, then 0xdeadbeef, then ${hex8(exercise.flagAddr ?? 0)}, then ${hex8(symbols.win)}.`,
        why: 'That gadget pops a value and a destination address from the stack, writes the value into memory, and returns. You use it to set flag_check to 0xdeadbeef before jumping into win().',
        steps: [
          'Add 20 bytes of padding to reach the saved return address.',
          `Set the first return target to the gadget at ${hex8(gadget)}.`,
          'Put 0xdeadbeef next so the gadget loads it as the value to write.',
          `Put ${hex8(exercise.flagAddr ?? 0)} after that as the write target, then finish with ${hex8(symbols.win)} so execution lands in win().`,
        ],
      };
    }
    default:
      if (exercise.mode === 'step') {
        return {
          answer: 'Use the Step control until the guided sequence completes.',
          why: 'Step-based lessons are teaching state changes in order, so the correct approach is to advance one guided action at a time and read the console alongside the visualization.',
          steps: [
            'Press Step to advance one guided action.',
            'Compare the resulting console message to the visual change.',
            'Keep stepping until the sequence completes.',
          ],
        };
      }

      if (exercise.mode === 'input-hex' || exercise.mode === 'input-text') {
        return {
          answer: 'Use enough padding to reach the control point, then overwrite that target with the value this lesson is asking for.',
          why: 'These lessons are about turning user-controlled bytes into a meaningful memory or control-flow change once your input reaches the vulnerable target.',
          steps: [
            'Use the source and assembly views to find the vulnerable buffer and the target beyond it.',
            'Count through the buffer and any saved metadata that sits between the buffer and the target.',
            'Build the overwrite with the payload builder if available, then submit it and confirm the target changed as intended.',
          ],
        };
      }

      if (exercise.mode.startsWith('heap-') || exercise.mode === 'final-chain' || exercise.mode === 'final-blind') {
        return {
          answer: 'Advance through the setup until you control an allocator write, then use the final input to overwrite the target pointer or value.',
          why: 'Heap lessons teach how corrupted allocator metadata can redirect a later allocation or write into a sensitive target.',
          steps: [
            'Use Step when the lesson is still preparing allocator state.',
            'Switch to the input phase when it appears and submit the bytes that poison metadata or overwrite the target.',
            'Use the heap view to confirm where the final write lands before triggering the win condition.',
          ],
        };
      }

      if (exercise.mode.startsWith('asm-')) {
        return {
          answer: 'Step through the instructions, read the resulting register and memory state, and use those observed values as your answer.',
          why: 'Assembly lessons are about understanding what the machine actually did, not guessing from the source or mnemonic names.',
          steps: [
            'Use Step to trace the state changes instruction by instruction.',
            'Use the console and register display together so you can verify each effect.',
            'Answer based on the final state the emulator shows, then reset and replay if needed.',
          ],
        };
      }

      return {
        answer: 'Use the directions and helper tools to identify the winning memory or control-flow target, then submit the input that changes the program into that state.',
        why: 'Every exercise in 0xVRIG is modeling the path from user-controlled input to a security-relevant state change.',
        steps: [
          'Identify the target the lesson wants you to reach.',
          'Use the available tabs and tools to find the right offset, address, or value.',
          'Submit the input and compare the observed state to the expected target.',
        ],
      };
  }
}

export default function SolutionGuideModal() {
  const { state, dispatch, currentExercise } = useExerciseContext();

  if (!state.showSolutionGuide || !currentExercise) return null;

  const guide = getSolutionGuide(currentExercise, state.symbols);

  return (
    <div className="modal-backdrop" onClick={() => dispatch({ type: 'DISMISS_SOLUTION_GUIDE' })}>
      <div
        className="solution-guide-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="solution-guide-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="solution-guide-header">
          <div>
            <div className="solution-guide-kicker">Walkthrough</div>
            <h2 id="solution-guide-title">Show &amp; Explain Correct Answer</h2>
          </div>
          <button
            type="button"
            className="link-button secondary"
            onClick={() => dispatch({ type: 'DISMISS_SOLUTION_GUIDE' })}
          >
            Close
          </button>
        </div>

        <div className="solution-guide-section">
          <div className="solution-guide-label">Correct Answer</div>
          <p>{guide.answer}</p>
        </div>

        <div className="solution-guide-section">
          <div className="solution-guide-label">Why It Works</div>
          <p>{guide.why}</p>
        </div>

        <div className="solution-guide-section">
          <div className="solution-guide-label">Step By Step</div>
          <ol className="solution-guide-steps">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
