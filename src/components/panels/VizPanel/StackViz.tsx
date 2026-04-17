'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8, hex2, toAscii } from '@/engine/helpers';

export default function StackViz() {
  const { stackSim, state } = useExerciseContext();
  // Read vizRenderKey to subscribe to re-renders
  const _renderKey = state.vizRenderKey;

  const sim = stackSim.current;
  if (!sim) {
    return <div id="stack-viz"><span style={{ color: 'var(--text-dim)' }}>No stack data.</span></div>;
  }

  const rowSize = 4;
  const numRows = Math.ceil(sim.totalSize / rowSize);
  const rows: React.ReactNode[] = [];

  for (let r = numRows - 1; r >= 0; r--) {
    const offset = r * rowSize;
    const addr = sim.baseAddr + offset;
    const region = sim.regionOf(offset);

    const isRegionStart =
      offset === 0 ||
      offset === sim.bufSize ||
      (sim.useCanary && offset === sim.bufSize + sim.canarySize) ||
      offset === sim.bufSize + sim.canarySize + sim.ebpSize;

    const rowClasses = [
      'stack-row',
      `region-${region}`,
      isRegionStart ? 'region-start' : '',
    ].filter(Boolean).join(' ');

    const bytes: React.ReactNode[] = [];
    let asciiStr = '';

    for (let b = 0; b < rowSize; b++) {
      const idx = offset + b;
      if (idx < sim.totalSize) {
        const byteClasses = ['stack-byte'];
        if (sim.overflowAt[idx]) byteClasses.push('overflow');
        if (sim.written[idx]) byteClasses.push('just-written');
        if (idx >= sim.hlStart && idx < sim.hlEnd) byteClasses.push('current');

        bytes.push(
          <span key={b} className={byteClasses.join(' ')}>
            {hex2(sim.memory[idx])}
          </span>
        );
        asciiStr += toAscii(sim.memory[idx]);
      } else {
        bytes.push(
          <span key={b} className="stack-byte empty">--</span>
        );
        asciiStr += ' ';
      }
    }

    // Label logic
    let labelHtml = '';
    const retStart = sim.bufSize + sim.canarySize + sim.ebpSize;
    if (offset === retStart) {
      const retVal = sim.getRetAddr();
      labelHtml = `\u2190 <span style="color:var(--amber)">Go-Back Address</span> = ${hex8(retVal)}`;
    } else if (offset === sim.bufSize + sim.canarySize) {
      labelHtml = `\u2190 <span style="color:var(--blue)">Saved Bookmark (EBP)</span>`;
    } else if (sim.useCanary && offset === sim.bufSize) {
      const intact = sim.canaryIntact();
      labelHtml = `\u2190 <span style="color:var(--purple)">Tripwire (Canary)</span> ` +
        (intact
          ? '<span style="color:var(--green)">\u2713 intact</span>'
          : '<span style="color:var(--red)">\u2717 CORRUPTED</span>');
    } else if (offset === 0) {
      labelHtml = `\u2190 <span style="color:var(--green)">buf[0]</span> (write starts here)`;
    } else if (offset < sim.bufSize) {
      labelHtml = `<span style="color:var(--text-dim)">buf[${offset}..${Math.min(offset + 3, sim.bufSize - 1)}]</span>`;
    }

    rows.push(
      <div key={r} className={rowClasses}>
        <span className="stack-addr">{hex8(addr)}</span>
        <span className="stack-bytes">{bytes}</span>
        <span className="stack-ascii">{asciiStr}</span>
        <span className="stack-label" dangerouslySetInnerHTML={{ __html: labelHtml }} />
      </div>
    );
  }

  const canaryLabel = sim.useCanary ? ` + tripwire[${sim.canarySize}]` : '';

  return (
    <div id="stack-viz">
      {rows}
      <div id="stack-info" style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
        {`\u2014 ${sim.totalSize} bytes total: buffer[${sim.bufSize}]${canaryLabel} + bookmark[${sim.ebpSize}] + go-back addr[${sim.retSize}]`}
      </div>
    </div>
  );
}
