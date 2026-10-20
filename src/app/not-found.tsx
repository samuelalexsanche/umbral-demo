import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="grid gap-4">
        <p className="font-display text-7xl font-semibold tracking-tight">404</p>
        <h1 className="font-display text-2xl font-semibold">Esta página no existe</h1>
        <p className="text-ink-2">Puede que el inmueble ya se haya vendido o que el enlace esté incompleto.</p>
        <div className="flex justify-center gap-2">
          <Link href="/inmuebles/" className="press inline-flex h-11 items-center rounded-full bg-brick px-5 font-semibold text-white">Ver inmuebles</Link>
          <Link href="/" className="press inline-flex h-11 items-center rounded-full border border-line px-5 font-semibold">Inicio</Link>
        </div>
      </div>
    </div>
  );
}
