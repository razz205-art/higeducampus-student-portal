export interface Quote {
  text: string;
  author: string;
}

const QUOTES: Quote[] = [
  {
    text: "The beautiful thing about learning is that no one can take it away from you.",
    author: "B.B. King",
  },
  {
    text: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    text: "Education is not preparation for life; education is life itself.",
    author: "John Dewey",
  },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  {
    text: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln",
  },
  {
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
  },
  {
    text: "The future belongs to those who learn more skills and combine them in creative ways.",
    author: "Robert Greene",
  },
  {
    text: "Small daily improvements are the key to staggering long-term results.",
    author: "James Clear",
  },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
];

/** Deterministic by day-of-year, so the quote is stable across a page's requests that day. */
export function getQuoteOfTheDay(date: Date = new Date()): Quote {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length]!;
}
