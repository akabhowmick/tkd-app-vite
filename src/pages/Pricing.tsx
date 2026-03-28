import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

const tiers = [
  {
    name: "Starter",
    price: { monthly: "Free", annual: "Free" },
    desc: "For small schools getting started",
    features: ["Up to 30 students", "Attendance tracking", "Basic student profiles"],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: { monthly: "$29", annual: "$23" },
    desc: "For growing schools that need more",
    features: [
      "Up to 150 students",
      "Full renewal management",
      "Sales tracking",
      "Parent contacts",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Pro",
    price: { monthly: "$59", annual: "$47" },
    desc: "For established schools that want it all",
    features: ["Unlimited students", "All features", "Priority support", "Data exports"],
    cta: "Contact Us",
    popular: false,
  },
];

const PricingPage = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="container py-20 md:py-28">
      <h1 className="text-3xl md:text-5xl font-bold text-center">Simple, transparent pricing</h1>
      <p className="mt-4 text-center text-muted-foreground text-lg">
        No surprise fees. Cancel anytime.
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
          Annual <span className="text-primary text-xs font-semibold">Save 20%</span>
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
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold">{tier.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tier.desc}</p>
            <div className="mt-6">
              <span className="text-4xl font-bold">
                {annual ? tier.price.annual : tier.price.monthly}
              </span>
              {tier.price.monthly !== "Free" && (
                <span className="text-muted-foreground text-sm">/mo</span>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              className="mt-8 w-full"
              // variant={tier.popular ? "default" : "outline"}
            >
              <Link to="/login">{tier.cta}</Link>
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-12 text-center text-muted-foreground">
        Have questions?{" "}
        <Link to="/faq" className="text-primary font-medium hover:underline">
          Check out our FAQ <ArrowRight size={14} className="inline" />
        </Link>
      </p>
    </section>
  );
};

export default PricingPage;
