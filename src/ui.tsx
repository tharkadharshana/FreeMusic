import { useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-card p-5 sm:p-6 ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value, tone = 'text-fg' }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-lg border border-line bg-bg p-4">
      <div className={`text-2xl font-semibold tabular-nums ${tone}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  );
}

export function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-start rounded-lg border border-line bg-bg">
      <pre className="min-w-0 flex-1 overflow-x-auto p-4 font-mono text-sm leading-relaxed">{children}</pre>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy command'}
        className="m-2 grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-md text-muted transition-colors hover:bg-primary-soft hover:text-fg"
      >
        {copied ? <Check className="h-4 w-4 text-ok" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      </button>
    </div>
  );
}

export const buttonClass =
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
export const primaryButton = `${buttonClass} bg-primary text-primary-fg hover:opacity-90`;
export const secondaryButton = `${buttonClass} border border-line bg-card hover:bg-primary-soft`;
export const inputClass =
  'block w-full min-h-11 rounded-lg border border-line bg-bg px-3 py-2 text-base text-fg placeholder:text-muted/70 focus:border-primary';
