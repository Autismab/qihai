import Link from "next/link";
import { ReactNode } from "react";

export function PageShell({
  title,
  description,
  children,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 lg:px-10 lg:py-16">
      <div className="mb-8">
        {backHref ? (
          <div className="mb-5">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm text-[#7c6760] transition hover:text-[#2b211f]"
            >
              <span>←</span>
              <span>{backLabel ?? "返回"}</span>
            </Link>
          </div>
        ) : null}

        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[#201a17] sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-7 text-[#6a5a54] sm:text-base">{description}</p>
        </div>
      </div>

      <div className="rounded-[32px] border border-black/5 bg-white/85 p-6 shadow-[0_24px_70px_rgba(62,44,36,0.08)] backdrop-blur sm:p-8">
        {children}
      </div>
    </main>
  );
}

export function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-black/5 bg-[#faf7f3] p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-[#201a17]">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-[#5f514c]">{children}</div>
    </section>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-2 block text-sm font-medium text-[#4a3b35]">{children}</span>;
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-[#fcfaf8] px-4 py-3 text-[#201a17] outline-none transition placeholder:text-[#9d8e88] focus:border-[#8b5e63] focus:ring-2 focus:ring-[#8b5e63]/15 ${props.className ?? ""}`.trim()}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-[#fcfaf8] px-4 py-3 text-[#201a17] outline-none transition placeholder:text-[#9d8e88] focus:border-[#8b5e63] focus:ring-2 focus:ring-[#8b5e63]/15 ${props.className ?? ""}`.trim()}
    />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-2xl border border-black/10 bg-[#fcfaf8] px-4 py-3 text-[#201a17] outline-none transition focus:border-[#8b5e63] focus:ring-2 focus:ring-[#8b5e63]/15 ${props.className ?? ""}`.trim()}
    />
  );
}

export function PrimaryButton({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-full bg-[#2b211f] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1f1715] disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
    >
      {children}
    </button>
  );
}

export function SecondaryLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`rounded-full border border-black/10 bg-white/70 px-5 py-3 text-sm font-medium text-[#322824] transition hover:bg-white ${className}`.trim()}
    >
      {children}
    </Link>
  );
}
