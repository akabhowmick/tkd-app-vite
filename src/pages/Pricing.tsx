import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Gift } from "lucide-react";
import { Button } from "../components/ui/button";

const tiers = [
  {
    name: "Starter",
    monthlyPrice: 39,
    annualPrice: 35,
    studentCap: "Up to 75 students",
    desc: "Perfect for smaller schools getting organized",
    features: [
      "Up to 75 students",
      "Attendance tracking",
      "Student profiles & belt tracking",
      "Renewal management",
      "Sales tracking",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Growth",
    monthlyPrice: 59,
    annualPrice: 53,
    studentCap: "Up to 200 students",
    desc: "For growing schools that want to save time",
    features: [
      "Up to 200 students",
      "Everything in Starter",
      "Automated renewal reminders",
      "Parent contacts",
      "Role-based instructor access",
      "Data exports",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    monthlyPrice: 79,
    annualPrice: 71,
    studentCap: "Unlimited students",
    desc: "For established schools that want it all",
    features: [
      "Unlimited students",
      "Everything in Growth",
      "Priority support",
      "Multi-location (coming soon)",
      "Early access to new features",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
];

const PricingPage = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="container py-20 md:py-28">
      <h1 className="text-3xl md:text-5xl font-bold text-center">Simple, transparent pricing</h1>
      <p className="mt-4 text-center text-muted-foreground text-lg">
        No surprise fees. Cancel anytime. 14-day free trial on all plans.
      </p>

      {/* Toggle */}
      <div className="mt-10 flex items-center justify-center gap-3">
        <span
          className={`text-sm font-medium ${!annual ? "text-foreground" : "text-muted-foreground"}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative h-7 w-12 rounded-full transition-colors ${annual ? "bg-primary" : "bg-border"}`}
          aria-label="Toggle annual billing"
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-background shadow transition-transform ${annual ? "translate-x-5" : ""}`}
          />
        </button>
        <span
          className={`text-sm font-medium ${annual ? "text-foreground" : "text-muted-foreground"}`}
        >
          Annual <span className="text-primary text-xs font-semibold">Save 10%</span>
        </span>
      </div>

      {/* Cards */}
      <div className="mt-14 grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-xl border p-8 flex flex-col ${
              tier.popular
                ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                : "border-border bg-card"
            }`}
          >
            {tier.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground whitespace-nowrap">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold">{tier.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>

            <div className="mt-6 flex items-end gap-1">
              <span className="text-4xl font-bold">
                ${annual ? tier.annualPrice : tier.monthlyPrice}
              </span>
              <span className="text-muted-foreground text-sm mb-1">/mo</span>
            </div>
            {annual && (
              <p className="text-xs text-primary mt-1">
                Billed annually (${tier.annualPrice * 12}/yr)
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-1">{tier.studentCap}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button asChild className="mt-8 w-full">
              <Link to="/signup">{tier.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Referral callout */}
      <div className="mt-16 max-w-2xl mx-auto rounded-xl border border-border bg-card p-6 flex gap-4 items-start">
        <div className="mt-0.5 text-primary">
          <Gift size={20} />
        </div>
        <div>
          <p className="font-semibold text-foreground">Refer a school, get a free month</p>
          <p className="text-sm text-muted-foreground mt-1">
            For every school you refer that becomes a paying customer, we'll credit one free month
            to your account. Up to 3 referrals per year — and the school you refer gets their first
            month free too.
          </p>
        </div>
      </div>

      <p className="mt-10 text-center text-muted-foreground text-sm">
        Have questions?{" "}
        <Link to="/faq" className="text-primary font-medium hover:underline">
          Check out our FAQ <ArrowRight size={14} className="inline" />
        </Link>
      </p>
    </section>
  );
};

export default PricingPage;
