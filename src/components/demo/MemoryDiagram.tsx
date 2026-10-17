import { hex2 } from '@/engine/helpers';
import { DemoId, DemoInput, evaluateStack, textBytes } from '@/demo/challenges';
import styles from './Demo.module.css';

export default function MemoryDiagram({ id = 'overflow', input, offset = 0x1000 }: { id?: DemoId; input: DemoInput; offset?: number }) {
  const { sim, payload, outcome } = evaluateStack(id, input, offset);
  const inputLength = textBytes(input.text).length;
  const regions = [
    { label: 'Name buffer', start: 0, end: 16, note: '16 bytes for your name' },
    { label: 'Saved frame', start: 16, end: 20, note: '4 bytes of saved data' },
    { label: 'Return address', start: 20, end: 24, note: '4 bytes: where to go next' },
    ...(payload.length > 24 ? [{ label: 'More input', start: 24, end: payload.length, note: 'Past the return address' }] : []),
  ];
  return <div className={styles.memory}>
    {regions.map(region => {
      const overwritten = region.start >= 16 ? Array.from(sim.written.slice(region.start, region.end)).filter(Boolean).length : 0;
      return <div key={region.label} className={`${styles.memoryRegion} ${region.start === 16 ? styles.bufferBoundary : ''}`}>
        <div className={styles.regionLabel}><strong>{region.label}</strong><span className={overwritten ? styles.overwriteLabel : ''}>{overwritten ? `${overwritten} overwritten` : region.note}</span></div>
        <div className={styles.slots} role="list" aria-label={`${region.label} bytes`}>
          {Array.from({ length: region.end - region.start }, (_, i) => {
            const position = region.start + i;
            const byte = sim.memory[position];
            const written = !!sim.written[position];
            const overflow = !!sim.overflowAt[position];
            const address = written && input.ending !== null && position >= inputLength;
            const display = !written && position < 16 ? '·' : written && !address && byte >= 32 && byte <= 126 ? byte === 32 ? '␠' : String.fromCharCode(byte) : hex2(byte);
            const description = `Byte ${position + 1}: ${written ? `input ${hex2(byte)}` : position < 16 ? 'empty' : `saved ${hex2(byte)}`}${overflow ? ', overwritten past the buffer' : ''}`;
            return <span key={position} role="listitem" data-offset={position} data-overflow={overflow} className={`${styles.slot} ${written ? styles.filledSlot : ''} ${overflow ? styles.overflowSlot : ''}`} title={description} aria-label={description}>{display}</span>;
          })}
        </div>
      </div>;
    })}
    <p className={styles.memoryLegend}>1 slot = 1 byte. Red means input has spilled past the name buffer.</p>
    <div className={styles.destinationRow}><span>What runs next</span><strong className={outcome === 'success' ? styles.goodDestination : outcome === 'crash' ? styles.invalidDestination : ''}>{outcome === 'success' ? 'Admin function' : outcome === 'crash' ? 'Broken address' : 'Normal return'}</strong></div>
  </div>;
}
