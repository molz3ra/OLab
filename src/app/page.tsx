'use client';

import dynamic from 'next/dynamic';

const OlabApp = dynamic(() => import('@/components/OlabApp'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--paper, #faf9f6)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '13px',
          color: 'var(--muted, #62685d)',
        }}
      >
        Carregando OLAB 2.0...
      </div>
    </div>
  ),
});

export default function Page() {
  return <OlabApp />;
}
