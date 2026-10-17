import { notFound } from 'next/navigation';
import DemoExperience from '@/components/demo/DemoExperience';
import { DEMO_IDS, isDemoId } from '@/demo/challenges';

export const dynamicParams = false;

export function generateStaticParams() {
  return DEMO_IDS.map(id => ({ id }));
}

export default async function DemoChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isDemoId(id)) notFound();
  return <DemoExperience id={id} />;
}
