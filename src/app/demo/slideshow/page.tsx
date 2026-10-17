import type { Metadata } from 'next';
import DemoSlideshow from '@/components/demo/DemoSlideshow';

export const metadata: Metadata = { title: 'Buffer Overflow Screensaver · 0xVRIG' };

export default function SlideshowPage() {
  return <DemoSlideshow />;
}
