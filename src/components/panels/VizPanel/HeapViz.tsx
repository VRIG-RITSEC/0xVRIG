'use client';

import { useExerciseContext } from '@/state/ExerciseContext';
import { hex8, hex2 } from '@/engine/helpers';

function FreeListChain({ label, color, bins, baseAddr }: {
  label: string;
  color: string;
  bins: Record<number, number[]>;
  baseAddr: number;
}) {
  if (Object.keys(bins).length === 0) return null;
  return (
    <div style={{ marginBottom: '0.35rem' }}>
      <span style={{ color, fontWeight: 600 }}>{label}</span>
      {Object.entries(bins).map(([size, addrs]) => (
        <div key={size} style={{ marginLeft: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
          <span style={{ color: 'var(--text-dim)', marginRight: '0.25rem' }}>[{size}B]</span>
          <span style={{ color, fontSize: '10px', padding: '1px 4px', border: `1px solid ${color}`, borderRadius: '2px' }}>HEAD</span>
          {[...addrs].reverse().map((addr, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color, margin: '0 2px' }}>{'\u2192'}</span>
              <span style={{ fontSize: '10px', padding: '1px 4px', border: `1px dashed ${color}`, borderRadius: '2px', color }}>
                {hex8(baseAddr + addr)}
              </span>
            </span>
          ))}
          <span style={{ color: 'var(--text-dim)', margin: '0 2px' }}>{'\u2192'} NULL</span>
        </div>
      ))}
    </div>
  );
}

function UnsortedChain({ addrs, baseAddr, label }: { addrs: number[]; baseAddr: number; label: string }) {
  if (addrs.length === 0) return null;
  const color = 'var(--amber)';
  return (
    <div style={{ marginBottom: '0.35rem' }}>
      <span style={{ color, fontWeight: 600 }}>{label}</span>
      <div style={{ marginLeft: '0.75rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
        <span style={{ fontSize: '10px', padding: '1px 4px', border: `1px solid ${color}`, borderRadius: '2px', color }}>HEAD</span>
        {[...addrs].reverse().map((addr, i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color, margin: '0 2px' }}>{'\u21C4'}</span>
            <span style={{ fontSize: '10px', padding: '1px 4px', border: `1px dashed ${color}`, borderRadius: '2px', color }}>
              {hex8(baseAddr + addr)}
            </span>
          </span>
        ))}
        <span style={{ color: 'var(--text-dim)', margin: '0 2px' }}>{'\u21C4'} HEAD</span>
      </div>
    </div>
  );
}

export default function HeapViz() {
  const { heapSim, state, currentExercise } = useExerciseContext();
  const _renderKey = state.vizRenderKey;

  const heap = heapSim.current;
  const ex = currentExercise;
  if (!heap) {
    return <div id="heap-viz"><span style={{ color: 'var(--text-dim)' }}>No heap data.</span></div>;
  }

  const isWindows = ex?.unitId?.includes('win-heap') || ex?.windowsHeapType != null;
  const showLabels = ex?.showLabels !== false;
  const chunks = heap.getChunksForDisplay();
  const freeLists = heap.getFreeLists() as any;
  const hasFreeLists = (freeLists.tcache && Object.keys(freeLists.tcache).length > 0)
    || (freeLists.fastbins && Object.keys(freeLists.fastbins).length > 0)
    || (freeLists.unsorted && freeLists.unsorted.length > 0)
    || (freeLists.listHints && Object.keys(freeLists.listHints).length > 0)
    || (freeLists.lfhBuckets && Object.keys(freeLists.lfhBuckets).length > 0);

  const tcacheLabel = isWindows ? 'LFH Bucket' : 'tcache';
  const fastbinLabel = isWindows ? 'Lookaside' : 'fastbin';
  const unsortedLabel = isWindows ? 'FreeLists' : 'unsorted bin';
  const fdLabel = isWindows ? 'Flink' : 'fd';
  const bkLabel = isWindows ? 'Blink' : 'bk';
  const headerLabel = isWindows ? '_HEAP_ENTRY' : 'chunk header';
  const prevSizeLabel = isWindows ? 'PreviousSize' : 'prev_size';
  const sizeLabel = isWindows ? 'Size' : 'size';

  return (
    <div id="heap-viz" style={{ fontSize: '11px' }}>
      {/* Free lists with visual chains */}
      {hasFreeLists && (
        <div style={{
          marginBottom: '0.5rem',
          padding: '0.35rem 0.5rem',
          border: '1px solid var(--panel-border)',
          borderRadius: '3px',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', fontSize: '10px' }}>
            {isWindows ? 'NT Heap Free Lists' : 'Free Lists'}
          </div>
          <FreeListChain label={tcacheLabel} color="var(--purple)" bins={freeLists.tcache} baseAddr={heap.baseAddr} />
          <FreeListChain label={fastbinLabel} color="var(--blue)" bins={freeLists.fastbins} baseAddr={heap.baseAddr} />
          <UnsortedChain addrs={freeLists.unsorted} baseAddr={heap.baseAddr} label={unsortedLabel} />
        </div>
      )}

      {/* Chunks */}
      {chunks.map((chunk) => {
        const isAllocated = chunk.allocated;
        const borderColor = isAllocated ? 'var(--green)' : 'var(--red)';
        const label = showLabels
          ? (isAllocated ? 'ALLOCATED' : 'FREED')
          : '???';

        const name = Object.entries(state.heapNames).find(([, addr]) => addr === chunk.addr)?.[0];

        const dataBytes: number[] = [];
        const maxShow = Math.min(chunk.dataSize, 16);
        for (let i = 0; i < maxShow; i++) {
          const idx = chunk.dataStart + i;
          if (idx < heap.memorySize) {
            dataBytes.push(heap.memory[idx]);
          }
        }

        const prevSizeVal = heap._readLE(chunk.addr, 4);
        const sizeVal = heap._readLE(chunk.addr + 4, 4);
        const chunkSizeRaw = sizeVal & ~0x7;
        const flagP = sizeVal & 1 ? 'P' : '-';
        const flagM = sizeVal & 2 ? 'M' : '-';
        const flagA = sizeVal & 4 ? 'A' : '-';

        const flagsDisplay = isWindows
          ? `[${chunkSizeRaw}|B:${flagP}]`
          : `[${chunkSizeRaw}|${flagP}${flagM}${flagA}]`;

        const prevSizeTooltip = isWindows
          ? 'PreviousSize: size of the previous _HEAP_ENTRY (in allocation granularity units).'
          : 'Size of previous chunk (only valid when previous chunk is free). Used for backward coalescing.';
        const sizeTooltip = isWindows
          ? 'Size of this _HEAP_ENTRY. Encoded with heap encoding key. Flags: B (busy).'
          : 'Size of this chunk including header. Low bits: P (prev in use), M (mmap\'d), A (non-main arena).';

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

            {/* Header with structured metadata */}
            <div style={{ fontSize: '10px', marginBottom: '0.15rem', padding: '0.15rem 0.25rem', background: 'rgba(255,255,255,0.03)', borderRadius: '2px' }}>
              <div style={{ color: 'var(--text-dim)', marginBottom: '0.1rem', fontSize: '9px', letterSpacing: '0.03em' }}>{headerLabel}</div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <span data-tooltip={prevSizeTooltip} className="has-tooltip">
                  <span style={{ color: 'var(--text-dim)' }}>{prevSizeLabel} </span>
                  <span style={{ color: prevSizeVal ? 'var(--text)' : 'var(--text-dim)' }}>{hex8(prevSizeVal)}</span>
                </span>
                <span data-tooltip={sizeTooltip} className="has-tooltip">
                  <span style={{ color: 'var(--text-dim)' }}>{sizeLabel} </span>
                  <span style={{ color: 'var(--text)' }}>{hex8(sizeVal)}</span>
                  <span style={{ color: 'var(--purple)', marginLeft: '0.25rem' }}>{flagsDisplay}</span>
                </span>
              </div>
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

            {/* fd/bk pointers for freed chunks */}
            {!isAllocated && chunk.dataSize >= 4 && (
              <div style={{ color: 'var(--purple)', fontSize: '10px', marginTop: '0.1rem' }}>
                <span data-tooltip={isWindows
                  ? 'Flink -- forward link in the doubly-linked LIST_ENTRY free list.'
                  : 'Forward pointer -- points to the next free chunk in this bin\'s linked list.'}
                  className="has-tooltip">{fdLabel} = {hex8(heap._readLE(chunk.dataStart, 4))}</span>
                {chunk.dataSize >= 8 && (
                  <span data-tooltip={isWindows
                    ? 'Blink -- backward link in the doubly-linked LIST_ENTRY free list.'
                    : 'Backward pointer -- points to the previous free chunk (used in unsorted/small/large bins, not fastbins).'}
                    className="has-tooltip"> {bkLabel} = {hex8(heap._readLE(chunk.dataStart + 4, 4))}</span>
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
            <span style={{ color: 'var(--text-dim)' }}>
              {isWindows ? 'UNCOMMITTED' : 'TOP'} ({heap.topSize}B remaining)
            </span>
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
