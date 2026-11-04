import { useRef, useState, type KeyboardEvent } from 'react';
import { PackageCheck, RefreshCcw, ShieldCheck } from 'lucide-react';

import type { RequestKind } from './api/contracts';
import { RequestsView } from './views/RequestsView';

const tabs = [
  { kind: 'returns', label: 'Devoluciones', Icon: RefreshCcw },
  { kind: 'warranties', label: 'Garantías', Icon: ShieldCheck },
] as const;

export function App() {
  const [kind, setKind] = useState<RequestKind>('returns');
  const tabButtons = useRef<(HTMLButtonElement | null)[]>([]);

  function navigateTabs(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();

    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;

    const tab = tabs[next];

    if (tab) {
      setKind(tab.kind);
      tabButtons.current[next]?.focus();
    }
  }

  return (
    <>
      <a href="#contenido" className="skip-link">
        Ir al contenido
      </a>

      <header className="border-b border-line bg-white">
        <div className="page-width">
          <div className="flex items-center gap-3 py-7 sm:py-8">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
              <PackageCheck size={22} strokeWidth={2} aria-hidden="true" />
            </span>

            <h1 className="text-base font-semibold tracking-tight sm:text-lg">
              Garantías y Devoluciones
            </h1>
          </div>

          <nav
            role="tablist"
            aria-label="Áreas de solicitudes"
            className="-mb-px flex gap-7 sm:gap-9"
          >
            {tabs.map(({ kind: value, label, Icon }, index) => (
              <button
                key={value}
                type="button"
                role="tab"
                id={`tab-${value}`}
                aria-controls={`panel-${value}`}
                aria-selected={kind === value}
                tabIndex={kind === value ? 0 : -1}
                ref={(element) => {
                  tabButtons.current[index] = element;
                }}
                onKeyDown={(event) => navigateTabs(event, index)}
                onClick={() => setKind(value)}
                className="area-tab"
              >
                <Icon
                  size={19}
                  strokeWidth={2}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main
        id="contenido"
        tabIndex={-1}
        className="page-width py-9 outline-none sm:py-12"
      >
        {tabs.map(({ kind: value }) => (
          <div
            key={value}
            role="tabpanel"
            id={`panel-${value}`}
            aria-labelledby={`tab-${value}`}
            hidden={kind !== value}
            tabIndex={0}
            className="rounded focus-visible:outline-offset-8"
          >
            {kind === value ? <RequestsView kind={value} /> : null}
          </div>
        ))}
      </main>
    </>
  );
}

