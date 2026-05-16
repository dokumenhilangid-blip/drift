'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      <h2 className="text-lg font-medium text-foreground/80">
        Sesuatu gagal.
      </h2>
      <p className="mt-2 text-sm text-foreground/50">
        Bukan lo. Bukan AI-nya. Mungkin jaringan.
      </p>
      <button
        onClick={reset}
        className="mt-6 px-5 py-2.5 rounded-lg border border-border/50 text-sm text-foreground/60 active:scale-[0.97] transition-transform"
      >
        Coba lagi
      </button>
    </div>
  );
}
