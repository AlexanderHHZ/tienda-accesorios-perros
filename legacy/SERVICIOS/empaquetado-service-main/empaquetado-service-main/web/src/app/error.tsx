'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">No pudimos mostrar esta página.</h1>
      <p className="my-4 text-sm leading-6 text-muted">
        Vuelve a intentarlo para recuperar el registro de empaquetados.
      </p>
      <Button onClick={reset}>Volver a intentar</Button>
    </main>
  );
}
