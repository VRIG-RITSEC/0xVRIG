import { CSSProperties } from 'react';
import styles from './Demo.module.css';

export default function Confetti() {
  return <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 32 }, (_, i) => <i key={i} style={{ '--x': `${(i * 37) % 100}%`, '--drift': `${((i * 29) % 180) - 90}px`, '--delay': `${(i % 7) * 0.045}s`, '--spin': `${i * 67}deg`, backgroundColor: ['#000080', '#c80000', '#008040', '#c08000'][i % 4] } as CSSProperties} />)}</div>;
}
