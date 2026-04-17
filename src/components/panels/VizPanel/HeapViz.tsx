'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8, hex2 } from '@/engine/helpers';

export default function HeapViz() {
  const { heapSim, state, currentExercise } = useExerciseContext();
  const _renderKey = state.vizRenderKey;

  const heap = heapSim.current;
  const ex = currentExercise;
  if (!heap) {
    return <div id="heap-viz"><span style={{ color: 'var(--text-dim)' }}>No heap data.</span></div>;
  }

  const showLabels = ex?.showLabels !== false;
  const chunks = heap.getChunksForDisplay();
  const freeLists = heap.getFreeLists();

  return (
    <div id="heap-viz" style={{ fontSize: '11px' }}>
      {/* Free lists summary */}
      <div style={{ marginBottom: '0.5rem', color: 'var(--text-dim)' }}>
        {Object.keys(freeLists.tcache).length > 0 && (
          <div>
            <span style={{ color: 'var(--purple)' }}>tcache: </span>
            {Object.entries(freeLists.tcache).map(([size, addrs]) =>
              `[${size}]: ${addrs.length} entries`
            ).join(', ')}
          </div>
        )}
        {Object.keys(freeLists.fastbins).length > 0 && (
          <div>
            <span style={{ color: 'var(--blue)' }}>fastbin: </span>
            {Object.entries(freeLists.fastbins).map(([size, addrs]) =>
              `[${size}]: ${addrs.length} entries`
            ).join(', ')}
          </div>
        )}
        {freeLists.unsorted.length > 0 && (
          <div>
            <span style={{ color: 'var(--amber)' }}>unsorted: </span>
            {freeLists.unsorted.length} entries
          </div>
        )}
      </div>

      {/* Chunks */}
      {chunks.map((chunk) => {
        const isAllocated = chunk.allocated;
        const borderColor = isAllocated ? 'var(--green)' : 'var(--red)';
        const label = showLabels
          ? (isAllocated ? 'ALLOCATED' : 'FREED')
          : '???';

        // Find name for this chunk
        const name = Object.entries(state.heapNames).find(([, addr]) => addr === chunk.addr)?.[0];

        // Read data bytes for display (up to 16)
        const dataBytes: number[] = [];
        const maxShow = Math.min(chunk.dataSize, 16);
        for (let i = 0; i < maxShow; i++) {
          const idx = chunk.dataStart + i;
          if (idx < heap.memorySize) {
            dataBytes.push(heap.memory[idx]);
          }
        }

        return (
          <div
            key={chunk.addr}
            style={{
              border: '1px solid ' + borderColor,
              marginBottom: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: chunk.highlighted ? 'rgba(78, 201, 176, 0.05)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.15rem' }}>
              <span>
                <span style={{ color: 'var(--amber)' }}>{hex8(heap.baseAddr + chunk.addr)}</span>
                {name && showLabels && <span style={{ color: 'var(--yellow)', marginLeft: '0.5rem' }}>{name}</span>}
              </span>
              <span style={{ color: borderColor }}>{label} ({chunk.size}B)</span>
            </div>

            {/* Header */}
            <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>
              hdr: <span data-tooltip="Size of previous chunk (only valid when previous chunk is free). Used for backward coalescing." className="has-tooltip">prev_size={hex8(heap._readLE(chunk.addr, 4))}</span>{' '}
              <span data-tooltip="Size of this chunk including header. Low bits: P (prev in use), M (mmap'd), A (non-main arena)." className="has-tooltip">size={hex8(heap._readLE(chunk.addr + 4, 4))}</span>
            </div>

            {/* Data bytes */}
            <div style={{ fontFamily: 'var(--font)', letterSpacing: '0.1em', marginTop: '0.15rem' }}>
              {dataBytes.map((b, i) => (
                <span key={i} style={{
                  color: heap.written[chunk.dataStart + i] ? 'var(--text)' : 'var(--text-dim)',
                }}>
                  {hex2(b)}{' '}
                </span>
              ))}
              {chunk.dataSize > maxShow && <span style={{ color: 'var(--text-dim)' }}>...</span>}
            </div>

            {/* fd pointer for freed chunks */}
            {!isAllocated && chunk.dataSize >= 4 && (
              <div style={{ color: 'var(--purple)', fontSize: '10px', marginTop: '0.1rem' }}>
                <span data-tooltip="Forward pointer -- points to the next free chunk in this bin's linked list." className="has-tooltip">fd = {hex8(heap._readLE(chunk.dataStart, 4))}</span>
                {chunk.dataSize >= 8 && (
                  <span data-tooltip="Backward pointer -- points to the previous free chunk (used in unsorted/small/large bins, not fastbins)." className="has-tooltip"> bk = {hex8(heap._readLE(chunk.dataStart + 4, 4))}</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Top chunk */}
      {heap.topSize > 0 && (
        <div style={{
          border: '1px dashed var(--text-dim)',
          padding: '0.25rem 0.5rem',
          marginBottom: '0.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--amber)' }}>{hex8(heap.baseAddr + heap.topAddr)}</span>
            <span style={{ color: 'var(--text-dim)' }}>TOP ({heap.topSize}B remaining)</span>
          </div>
        </div>
      )}

      {/* Function pointers */}
      {Object.keys(heap.funcPtrs).length > 0 && (
        <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.25rem' }}>
          <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
            Function Pointers
          </div>
          {Object.entries(heap.funcPtrs).map(([name, ptr]: [string, any]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{name}()</span>
              <span style={{ color: ptr.current === ptr.original ? 'var(--text)' : 'var(--red)' }}>
                {hex8(ptr.current)}
                {ptr.current !== ptr.original && ' (changed!)'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
