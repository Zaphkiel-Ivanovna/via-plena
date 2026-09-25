import { notFound, permanentRedirect } from 'next/navigation';
import { communePath, findCommuneByInsee } from '@/lib/commune-data';

export default async function LegacyCommunePage({ params }: { params: Promise<{ insee: string }> }) {
  const { insee } = await params;
  const commune = await findCommuneByInsee(insee);
  if (!commune?.slug) notFound();
  permanentRedirect(communePath(commune.slug));
}
