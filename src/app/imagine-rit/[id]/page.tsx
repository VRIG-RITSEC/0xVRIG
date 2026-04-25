import ExercisePageClient from '@/app/exercise/[id]/ExercisePageClient';

const IMAGINE_RIT_IDS = ['rit-01', 'rit-02', 'rit-03', 'rit-04', 'rit-rop'];

export function generateStaticParams() {
  return IMAGINE_RIT_IDS.map((id) => ({ id }));
}

export default function ImagineRitExercisePage({ params }: { params: Promise<{ id: string }> }) {
  return <ExercisePageClient params={params} />;
}
