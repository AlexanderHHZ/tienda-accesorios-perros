import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-3 text-2xl font-bold">Esta página no existe.</h1>
      <p className="my-4 text-sm text-muted">Puedes volver al registro para continuar.</p>
      <Link
        href="/"
        className="rounded-xl bg-accent px-4 py-3 text-center text-sm font-semibold text-white"
      >
        Volver a empaquetados
      </Link>
    </main>
  );
}
