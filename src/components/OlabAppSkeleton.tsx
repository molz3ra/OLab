import React from 'react';

/**
 * Skeleton de alta fidelidade para o OLAB 2.0.
 * Cumpre a Regra 01 das Diretrizes de Performance Web:
 * - Replica as dimensões exatas da casca da aplicação (app-shell, sidebar, topbar e workspace).
 * - Elimina o Cumulative Layout Shift (CLS = 0) na transição de carregamento do chunk dinâmico.
 */
export function OlabAppSkeleton() {
  return (
    <div
      className="app-shell"
      aria-busy="true"
      aria-label="Carregando laboratório..."
      style={{
        background: 'var(--paper, #faf9f6)',
        color: 'var(--ink, #1f221e)',
        minHeight: '100vh',
      }}
    >
      <style>{`
        @keyframes olab-shimmer {
          0% { opacity: 0.45; }
          50% { opacity: 0.8; }
          100% { opacity: 0.45; }
        }
        .sk-pulse {
          animation: olab-shimmer 1.6s ease-in-out infinite;
          background: var(--line, rgba(0, 0, 0, 0.08));
          border-radius: 4px;
        }
      `}</style>

      {/* 1. Sidebar Skeleton */}
      <aside className="sidebar" aria-hidden="true">
        <div className="brand-area" style={{ padding: '14px 16px 12px' }}>
          <div className="brand">
            <span className="brand-word">
              olab
              <span className="brand-point" />
            </span>
            <span className="brand-caption">THE OBJECTION LAB</span>
          </div>
        </div>

        <div className="workspace-label" style={{ opacity: 0.7 }}>
          <div className="workspace-icon" style={{ background: 'var(--surface-sunken)' }}>
            <div className="sk-pulse" style={{ width: '14px', height: '14px', borderRadius: '2px' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="sk-pulse" style={{ width: '80px', height: '12px', marginBottom: '4px' }} />
            <div className="sk-pulse" style={{ width: '50px', height: '9px' }} />
          </div>
        </div>

        <div style={{ padding: '0 14px', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="sk-pulse" style={{ width: '55px', height: '9px', marginBottom: '6px' }} />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="sk-pulse"
              style={{
                width: '100%',
                height: '32px',
                borderRadius: '6px',
                opacity: i === 1 ? 0.9 : 0.4,
              }}
            />
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: '16px 14px', borderTop: '1px solid var(--line)' }}>
          <div className="sk-pulse" style={{ width: '100%', height: '36px', borderRadius: '6px' }} />
        </div>
      </aside>

      {/* 2. Workspace Main */}
      <div className="workspace-main">
        {/* Topbar Skeleton */}
        <header className="topbar">
          <div className="breadcrumbs" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="sk-pulse" style={{ width: '70px', height: '13px' }} />
            <div className="sk-pulse" style={{ width: '8px', height: '10px' }} />
            <div className="sk-pulse" style={{ width: '90px', height: '13px', fontWeight: 600 }} />
          </div>
          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sk-pulse" style={{ width: '130px', height: '28px', borderRadius: '14px' }} />
            <div className="sk-pulse" style={{ width: '110px', height: '28px', borderRadius: '6px' }} />
          </div>
        </header>

        {/* Content Skeleton */}
        <main className="workspace-content" style={{ padding: '24px 28px', maxWidth: '1180px' }}>
          {/* Header Title */}
          <div style={{ marginBottom: '28px' }}>
            <div className="sk-pulse" style={{ width: '280px', height: '26px', marginBottom: '8px' }} />
            <div className="sk-pulse" style={{ width: '460px', height: '14px', maxWidth: '90%' }} />
          </div>

          <div className="studio-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px' }}>
            {/* Form Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Section 01: Input Card */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface, #ffffff)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div className="sk-pulse" style={{ width: '22px', height: '14px' }} />
                  <div className="sk-pulse" style={{ width: '180px', height: '15px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <div className="sk-pulse" style={{ width: '130px', height: '34px', borderRadius: '6px' }} />
                  <div className="sk-pulse" style={{ width: '130px', height: '34px', borderRadius: '6px' }} />
                </div>
                <div className="sk-pulse" style={{ width: '100%', height: '48px', borderRadius: '8px' }} />
              </div>

              {/* Section 02: Personas */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '10px',
                  border: '1px solid var(--line)',
                  background: 'var(--surface, #ffffff)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div className="sk-pulse" style={{ width: '22px', height: '14px' }} />
                  <div className="sk-pulse" style={{ width: '210px', height: '15px' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '12px' }}>
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="sk-pulse"
                      style={{
                        height: '110px',
                        borderRadius: '8px',
                        opacity: idx <= 3 ? 0.75 : 0.35,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="sk-pulse" style={{ width: '100%', height: '50px', borderRadius: '8px' }} />
            </div>

            {/* Aside Column (Presets) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="sk-pulse" style={{ width: '140px', height: '16px', marginBottom: '4px' }} />
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    background: 'var(--surface, #ffffff)',
                  }}
                >
                  <div className="sk-pulse" style={{ width: '80%', height: '14px', marginBottom: '8px' }} />
                  <div className="sk-pulse" style={{ width: '100%', height: '11px', marginBottom: '4px' }} />
                  <div className="sk-pulse" style={{ width: '60%', height: '11px' }} />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
export default OlabAppSkeleton;

