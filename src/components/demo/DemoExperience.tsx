"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { hex2, hex8 } from '@/engine/helpers';
import { DEMO_CHALLENGES, DEMO_IDS, DemoId, didSucceed, evaluateCounter, evaluateStack, inputOf, limitPayloadText, MAX_PAYLOAD_TEXT_BYTES, sameInput, symbolsFor, textBytes, withDestination } from '@/demo/challenges';
import { useDemo } from './DemoShell';
import styles from './Demo.module.css';
import MemoryDiagram from './MemoryDiagram';
import Confetti from './Confetti';

function CounterDiagram({ requested }: { requested: number }) {
  const result = evaluateCounter(requested);
  return <div className={styles.counterDiagram}>
    <div className={styles.equation} aria-label={`${requested} input bytes plus 8 extra bytes equals ${result.mathematicalSize}, stored as ${result.allocated}`}>
      <div><strong>{requested}</strong><span>input</span></div><b aria-hidden="true">+</b>
      <div><strong>8</strong><span>extra</span></div><b aria-hidden="true">=</b>
      <div className={result.wrapped ? styles.wrappedNumber : ''}><strong>{result.allocated}</strong><span>reserved</span></div>
    </div>
    <p>{result.wrapped ? `${requested} + 8 should be ${result.mathematicalSize}. But after 255, this counter starts again at 0.` : 'This counter can only count to 255. After that, it starts again at 0.'}</p>
  </div>;
}

export default function DemoExperience({ id }: { id?: DemoId }) {
  const { progress, ready, storageAvailable, updateDraft, visit, replay } = useDemo();
  const currentId = id ?? progress.current;
  const challenge = DEMO_CHALLENGES[currentId];
  const draft = progress.drafts[currentId];
  const index = DEMO_IDS.indexOf(currentId);
  const nextId = DEMO_IDS[index + 1];
  const symbols = symbolsFor(currentId, progress.offset);
  const snapshot = evaluateStack(currentId, draft, progress.offset);
  const nameBytes = textBytes(draft.text).length;
  const multibyteName = nameBytes !== Array.from(draft.text).length;
  const dirty = draft.lastRun !== null && !sameInput(draft, draft.lastRun);
  const lastOutcome = draft.lastRun ? currentId === 'counter'
    ? evaluateCounter(draft.lastRun.requested).success ? 'success' : 'normal'
    : evaluateStack(currentId, draft.lastRun, progress.offset).outcome : null;
  const outcome = dirty ? null : lastOutcome;
  const [celebrating, setCelebrating] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [copyUrl, setCopyUrl] = useState('');
  const resultRef = useRef<HTMLDivElement>(null);
  const copyInputRef = useRef<HTMLInputElement>(null);
  const [runCount, setRunCount] = useState(0);

  useEffect(() => { if (ready && id) visit(id); }, [id, ready, visit]);
  useEffect(() => { setCopyMessage(''); setCopyUrl(''); setCelebrating(false); }, [currentId]);
  useEffect(() => {
    if (!celebrating) return;
    const timer = window.setTimeout(() => setCelebrating(false), 2200);
    return () => window.clearTimeout(timer);
  }, [celebrating]);
  useEffect(() => {
    if (runCount > 0) {
      resultRef.current?.focus({ preventScroll: true });
      resultRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [runCount]);
  useEffect(() => { if (copyUrl) copyInputRef.current?.select(); }, [copyUrl]);

  function run() {
    const success = didSucceed(currentId, draft, progress.offset);
    updateDraft(currentId, { lastRun: inputOf(draft), crashed: draft.crashed || (currentId !== 'counter' && snapshot.outcome === 'crash') }, success);
    if (success && !progress.completed.includes(currentId)) setCelebrating(true);
    setRunCount(value => value + 1);
  }

  async function copyLink() {
    const url = new URL(window.location.href);
    url.pathname = `${url.pathname.split('/demo')[0]}/demo/${currentId}`;
    url.search = '';
    url.hash = '';
    try {
      await navigator.clipboard.writeText(url.href);
      setCopyMessage(storageAvailable ? 'Link copied. Your place is saved in this browser.' : 'Link copied. Keep this tab open to keep your place.');
      setCopyUrl('');
    } catch {
      setCopyUrl(url.href);
      setCopyMessage('Copy this link to open the challenge again.');
    }
  }

  let resultTitle = '';
  let resultText = '';
  if (outcome === 'success') {
    resultTitle = currentId === 'counter' ? 'Big input. Tiny buffer. You found the bug.' : 'You’re admin.';
    resultText = challenge.takeaway;
  } else if (outcome === 'crash') {
    resultTitle = 'That name crashed the program.';
    resultText = currentId === 'addresses'
      ? 'That address doesn’t work. Choose the address from the debug message and run again.'
      : 'Your name overwrote the return address, so the program tried to go somewhere invalid. Keep the first 20 bytes, then replace the next 4 with the admin address.';
  } else if (outcome === 'normal') {
    resultTitle = currentId === 'counter' ? 'The input still fits.' : 'Still a guest.';
    resultText = currentId === 'counter' ? 'The calculation hasn’t wrapped around. Try a larger input.'
      : draft.ending !== null && nameBytes !== 20 ? 'The destination is in the wrong position. Put 20 bytes of name before the 4-byte destination block.'
      : draft.ending === symbols.normal ? 'That destination returns normally. Try the admin function instead.'
      : 'Your letters haven’t reached the next step yet. Keep adding letters, then run again.';
  }

  return (
    <main id="demo-content" className={styles.main}>
      {celebrating && <Confetti />}
      <div className={styles.windowTitle}><span>0xVRIG — Buffer Overflow Lab</span><span className={styles.windowControls} aria-hidden="true">— □ ×</span></div>
      <div className={styles.windowBody}>
      <div className={styles.chapterBar}><span>Challenge {index + 1} of 3</span><span>{currentId === 'overflow' ? 'About a minute' : challenge.label}</span></div>
      <h1 className={styles.title}>{challenge.title}</h1>
      <p className={styles.description}>{challenge.description}</p>
      {currentId === 'overflow' ? <ol className={styles.instructions} aria-label="How to complete this challenge">
        <li><strong>Type a long name below.</strong> Reach at least 21 bytes to overwrite where the program goes next. <button type="button" disabled={!ready} onClick={() => updateDraft(currentId, { text: 'Alexandria Catherine Smith', ending: null })}>Use example name</button></li>
        <li><strong>Click “Run the program”.</strong> Watch your extra letters crash it.</li>
        <li><strong>Click “Use admin address”, then run again.</strong> That button replaces the broken return address with <code>admin() at {hex8(symbols.admin)}</code>.</li>
      </ol> : currentId === 'addresses' ? <ol className={styles.instructions} aria-label="How to complete this challenge">
        <li><strong>Read the leaked admin address below.</strong> The name is already padded to 20 bytes.</li>
        <li><strong>Choose that same address</strong> under “Choose a destination”.</li>
        <li><strong>Click “Run the program”</strong> to jump to the admin function.</li>
      </ol> : <p className={styles.mission}><strong>Your challenge: </strong>{challenge.mission}</p>}
      {currentId === 'addresses' && <div className={styles.leak}><span>The program accidentally reveals:</span><code>admin() is at {hex8(symbols.admin)}</code></div>}
      <section className={styles.activity} aria-label="Interactive challenge">
        <div className={styles.programHeader}><span>{currentId === 'counter' ? 'Size calculation' : 'Your program'}</span><span className={`${styles.role} ${outcome === 'success' ? styles.adminRole : outcome === 'crash' ? styles.crashedRole : ''}`}>{currentId === 'counter' ? '0–255' : outcome === 'success' ? 'Admin' : outcome === 'crash' ? 'Crashed' : 'Guest'}</span></div>
        {currentId !== 'counter' && <div className={styles.payloadEditor}>
          <div className={styles.payloadHeading}><label htmlFor="demo-payload">Your name / payload</label><span id="payload-count">{snapshot.payload.length} bytes{draft.ending !== null ? ' total' : ''}</span></div>
          <textarea id="demo-payload" rows={2} value={draft.text} maxLength={MAX_PAYLOAD_TEXT_BYTES} disabled={!ready} spellCheck={false} autoComplete="off" autoCapitalize="off" autoCorrect="off" placeholder="Type your name, then keep going…" aria-describedby="payload-help payload-count" onChange={event => updateDraft(currentId, { text: limitPayloadText(event.target.value) })} />
          <p id="payload-help" className={styles.payloadHelp}>{draft.ending !== null ? `${nameBytes} name bytes + 4 destination bytes.` : nameBytes > 20 ? 'You’ve reached the return address. Run the program to test it.' : nameBytes > 16 ? 'Your name is spilling into saved data. Keep typing to reach the return address.' : 'Each English letter fills one slot. The name buffer only fits 16.'}{multibyteName && ' Accents and emoji can use more than one byte.'}{nameBytes === MAX_PAYLOAD_TEXT_BYTES && ' Demo limit: 64 name bytes.'}</p>
          {draft.ending !== null && <div className={styles.appendedAddress}><span>Appended: <code>{snapshot.payload.slice(nameBytes).map(hex2).join(' ')}</code></span><button type="button" onClick={() => updateDraft(currentId, { ending: null })}>Remove address</button></div>}
        </div>}
        {currentId === 'counter' ? <CounterDiagram requested={draft.requested} /> : <MemoryDiagram id={currentId} input={draft} offset={progress.offset} />}
        <div ref={resultRef} tabIndex={-1} className={`${styles.result} ${outcome === 'success' ? styles.success : outcome === 'crash' ? styles.crash : ''}`} role="status" aria-live="polite" aria-atomic="true">{outcome && <><h2>{resultTitle}</h2><p>{resultText}</p></>}</div>
        {outcome !== 'success' ? (
          <div className={styles.inputArea}>
            {currentId === 'counter' && <div className={styles.inputHeading}><span id="input-label">Input size</span><strong>{draft.requested} bytes</strong></div>}
            {currentId === 'counter' ? <div className={styles.numberChoices} role="group" aria-labelledby="input-label">{[8, 32, 128, 250].map(value => <button key={value} type="button" disabled={!ready} aria-pressed={draft.requested === value} onClick={() => updateDraft(currentId, { requested: value })}>{value}<small>bytes</small></button>)}</div> : <>
              <div className={styles.endingTools}>
                <h2 className={styles.repairHeading}>{currentId === 'addresses' ? 'Choose a destination' : 'Repair the return address'}</h2>
                <p>{currentId === 'addresses' ? 'Match the leaked address above.' : <>Admin function: <code>{hex8(symbols.admin)}</code>. {nameBytes < 20 ? 'Type at least 20 bytes to reach the return address and enable this button.' : 'Use this address after the first 20 bytes of your name.'}</>}</p>
                <div className={`${styles.targetChoices} ${currentId === 'addresses' ? styles.addressChoices : ''}`} role="group" aria-label="Destination block">
                  {(currentId === 'addresses' ? [0x08048150, symbols.admin + 0x1000, symbols.admin] : [symbols.admin]).map(address => <button type="button" key={address} disabled={!ready || nameBytes < 20} aria-pressed={draft.ending === address} onClick={() => updateDraft(currentId, withDestination(draft, address))}>{currentId === 'addresses' ? hex8(address) : 'Use admin address'}</button>)}
                </div>
              </div>
            </>}
            <button type="button" className={styles.runButton} disabled={!ready || (currentId !== 'counter' && snapshot.payload.length === 0)} onClick={run}>Run the program</button>
          </div>
        ) : <div className={styles.nextSteps}>
          <Link href={nextId ? `/demo/${nextId}` : '/imagine-rit'} className={styles.primaryLink}>{nextId ? 'Try another attack' : 'Explore the full workshop'} →</Link>
          <button type="button" className={styles.textButton} onClick={copyLink}>Copy link to continue later</button>
          {copyMessage && <p className={styles.copyMessage} role="status">{copyMessage}</p>}
          {copyUrl && <label className={styles.copyFallback}>Demo link<input ref={copyInputRef} readOnly value={copyUrl} onFocus={event => event.currentTarget.select()} /></label>}
        </div>}
      </section>
      <details className={styles.explanation}>
        <summary>How does this work?</summary>
        {currentId === 'counter' ? <p>This unsigned 8-bit counter stores 0 to 255. The program adds 8 extra bytes to your requested size. If the sum passes 255, the stored value wraps around. The program allocates that smaller amount, then copies all your input. Real programs need to check this arithmetic.</p> : <>
          <p>This simulated program has 16 bytes for your name, 4 bytes of saved frame data, then a 4-byte return address. That address tells the program what to run next. Too much input overwrites it.</p>
          <p>To reach admin, place 20 bytes before the admin address. The destination button keeps that prefix and encodes the address into four bytes in little-endian order. An incomplete multi-byte character at that boundary is replaced with A padding. This technique is called return-address hijacking.</p>
          <pre><code>{'char name[16];'}<br />{'read_without_size_check(name);'}<br />{'// return to the saved address'}</code></pre>
          <p>Current return address: <code>{hex8(snapshot.destination)}</code>. Admin address: <code>{hex8(symbols.admin)}</code>.</p>
        </>}
        <Link href={challenge.workshop}>Try the full guided lesson →</Link>
      </details>
      <details className={styles.moreChallenges}>
        <summary>More challenges & replay</summary>
        <nav className={styles.challengeNav} aria-label="Mini challenges">{DEMO_IDS.map((challengeId, i) => <Link key={challengeId} href={`/demo/${challengeId}`} aria-current={challengeId === currentId ? 'page' : undefined}>{progress.completed.includes(challengeId) ? '✓' : i + 1}. {DEMO_CHALLENGES[challengeId].label}</Link>)}</nav>
        <button type="button" className={styles.textButton} disabled={!ready} onClick={() => { replay(currentId); setCelebrating(false); }}>Replay this challenge</button>
      </details>
      <p className={styles.bottomLine} role="status">{ready ? storageAvailable ? `${progress.completed.length}/3 complete · Saved on this device` : 'Progress stays in this tab · Browser storage unavailable' : 'Getting your experiment ready…'}</p>
      </div>
    </main>
  );
}
