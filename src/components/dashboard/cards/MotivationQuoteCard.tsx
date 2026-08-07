import { Quote } from "lucide-react";
import type { Quote as QuoteType } from "@/lib/data/quotes";

export default function MotivationQuoteCard({ quote }: { quote: QuoteType }) {
  return (
    <section className="rounded-sm border border-ink-900/10 bg-ink-950 p-6 text-parchment-50 shadow-sm">
      <Quote size={20} className="text-gold-400" aria-hidden="true" />
      <p className="mt-3 font-serif text-lg leading-snug">&ldquo;{quote.text}&rdquo;</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-parchment-50/50">
        — {quote.author}
      </p>
    </section>
  );
}
