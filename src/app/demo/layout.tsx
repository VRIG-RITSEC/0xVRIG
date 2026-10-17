import type { Metadata } from 'next';
import DemoShell from '@/components/demo/DemoShell';

export const metadata: Metadata = {
  title: 'One minute to admin · 0xVRIG',
  description: 'Crash a program. See what broke. Shape your input to take control. A hands-on security demo, no coding needed.',
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
