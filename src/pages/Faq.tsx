import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Who is TaeKwonTrack for?",
    a: "TaeKwonTrack is built for Taekwondo and martial arts school owners and head instructors who want a dedicated tool to manage their students, payments, and operations — without using generic spreadsheets or cobbled-together tools.",
  },
  {
    q: "How does the renewal tracking work?",
    a: "You can view all upcoming and expired memberships filtered by day, week, or month. Each renewal card lets you mark a student as renewed or note that they've quit, keeping your active roster clean.",
  },
  {
    q: "Can I manage multiple instructors?",
    a: "Yes. TaeKwonTrack supports role-based access so admins and instructors each have a tailored view of the dashboard.",
  },
  {
    q: "What payment types are supported for sales tracking?",
    a: "You can log cash, check, and credit card payments across categories like tuition, test fees, demo fees, and more.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — the Starter plan is free and supports up to 30 students with core features like attendance and student profiles.",
  },
  {
    q: "Can I try the paid plan before committing?",
    a: "The Growth plan comes with a free trial. No credit card required to start.",
  },
  {
    q: "How secure is my data?",
    a: "TaeKwonTrack is built with row-level security, meaning your school's data is isolated and protected.",
  },
  {
    q: "How do I get support?",
    a: "You can reach us at info@taekwontrack.com. Pro plan users get priority support response times.",
  },
];

const FaqPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="container py-20 md:py-28 max-w-3xl mx-auto">
      <h1 className="text-3xl md:text-5xl font-bold text-center">Frequently Asked Questions</h1>
      <div className="mt-14 space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between p-5 text-left font-medium hover:bg-accent/50 transition-colors"
            >
              <span className="pr-4">{faq.q}</span>
              <ChevronDown
                size={18}
                className={`flex-shrink-0 text-muted-foreground transition-transform ${openIndex === i ? "rotate-180" : ""}`}
              />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-12 text-center text-muted-foreground">
        Still have questions?{" "}
        <a href="mailto:info@taekwontrack.com" className="text-primary font-medium hover:underline">
          Reach out →
        </a>
      </p>
    </section>
  );
};

export default FaqPage;
