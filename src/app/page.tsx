'use client';

import dynamic from 'next/dynamic';
import { OlabAppSkeleton } from '@/components/OlabAppSkeleton';

const OlabApp = dynamic(() => import('@/components/OlabApp'), {
  ssr: false,
  loading: () => <OlabAppSkeleton />,
});

export default function Page() {
  return <OlabApp />;
}
