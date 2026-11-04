import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Boxes,
  CircleHelp,
  LayoutGrid,
  Package,
  Ruler,
} from 'lucide-react';
import { getDocumentationUrl } from '@/services/http-client';

type Props = { children: ReactNode; onGuide: () => void; connected: boolean; loading: boolean };

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-white">
        <Package className="size-6" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <div>
        <span className="text-base font-bold tracking-tight">
          empaquetado<span className="text-orange-400">.</span>
        </span>
        <p className="mt-0.5 text-[10px] font-semibold tracking-[0.2em] text-stone-400">
          REGISTRO Y CONTROL
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children, onGuide, connected, loading }: Props) {
  const documentationUrl = getDocumentationUrl();
  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only fixed left-4 top-3 z-50 rounded-lg bg-white p-3 text-ink focus:not-sr-only"
      >
        Ir al contenido
      </a>
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col bg-ink px-5 py-8 text-white lg:flex">
        <div className="px-1">
          <Brand />
        </div>
        <p className="mb-4 mt-14 px-3 text-[10px] font-bold tracking-[0.17em] text-stone-400">
          ESPACIO DE TRABAJO
        </p>
        <nav aria-label="Navegación principal">
          <a
            href="#registros"
            aria-current="page"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3.5 py-3.5 text-sm font-semibold"
          >
            <LayoutGrid className="size-4 text-orange-300" aria-hidden="true" />
            Empaquetados
            <span className="ml-auto size-1.5 rounded-full bg-orange-300" />
          </a>
        </nav>
        <p className="mb-3 mt-10 px-3 text-[10px] font-bold tracking-[0.17em] text-stone-400">
          RECURSOS
        </p>
        <button
          onClick={onGuide}
          className="flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-left text-sm text-stone-300 hover:bg-white/5 hover:text-white"
        >
          <Ruler className="size-4" aria-hidden="true" />
          Guía de medidas
        </button>
        {documentationUrl ? (
          <a
            href={documentationUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm text-stone-300 hover:bg-white/5 hover:text-white"
          >
            <BookOpen className="size-4" aria-hidden="true" />
            Documentación
            <ArrowUpRight className="ml-auto size-3.5" aria-hidden="true" />
          </a>
        ) : null}
        <div className="mt-auto pt-14">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Boxes className="mb-4 size-9 text-orange-200" strokeWidth={1.1} aria-hidden="true" />
            <p className="text-lg font-semibold leading-6 tracking-tight">
              Todo en su
              <br />
              justa medida.
            </p>
            <p className="mt-3 text-xs leading-5 text-stone-400">
              Un registro claro empieza con el peso y las dimensiones correctas.
            </p>
            <button
              onClick={onGuide}
              className="mt-4 flex min-h-10 items-center gap-2 text-xs font-semibold text-orange-200 hover:text-white"
            >
              Cómo medir
              <Ruler className="size-3.5" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-6 px-1 text-[10px] tracking-wide text-stone-400">
            EMPAQUETADO SERVICE <span className="float-right">v1.0</span>
          </p>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-line bg-white px-4 sm:px-8 xl:px-10">
          <div className="text-ink lg:hidden">
            <Brand />
          </div>
          <div className="hidden items-center gap-2.5 text-xs lg:flex">
            <span className="text-muted">Operaciones</span>
            <span className="text-stone-300">/</span>
            <span className="font-semibold">Empaquetados</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden items-center gap-2 text-xs text-muted sm:flex" role="status">
              <span
                className={`size-1.5 rounded-full ${loading ? 'bg-amber-500' : connected ? 'bg-emerald-600' : 'bg-red-500'}`}
              />
              {loading ? 'Conectando' : connected ? 'API conectada' : 'Sin conexión'}
            </span>
            <button
              onClick={onGuide}
              aria-label="Abrir guía de medidas"
              className="flex size-10 items-center justify-center rounded-full border border-line bg-white text-muted hover:bg-canvas"
            >
              <CircleHelp className="size-4.5" />
            </button>
          </div>
        </header>
        <main
          id="contenido"
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 sm:py-10 xl:px-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
