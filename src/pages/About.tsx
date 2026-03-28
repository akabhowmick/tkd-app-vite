import { Link } from "react-router-dom";
import { Target, Sparkles, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

const values = [
  {
    icon: Target,
    title: "Purpose-Built",
    desc: "Designed from the ground up for martial arts schools — not a generic CRM with bolt-ons.",
  },
  {
    icon: Sparkles,
    title: "Simple by Design",
    desc: "Clean, intuitive interfaces that don't require a manual. Get started in minutes.",
  },
  {
    icon: RefreshCw,
    title: "Always Improving",
    desc: "We listen to school owners and ship improvements constantly.",
  },
];

const AboutPage = () => (
  <>
    {/* Hero */}
    <section className="relative overflow-hidden" style={{ background: "var(--hero-gradient)" }}>
      <div className="container py-20 md:py-28 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-surface-dark-foreground">
          Built by someone who gets it.
        </h1>
        <p className="mt-6 text-surface-dark-foreground/70 max-w-2xl mx-auto text-lg leading-relaxed">
          TaeKwonTrack was built out of frustration with generic tools that don't understand how
          martial arts schools actually work. Belt levels, renewal cycles, test fees, parent
          relationships — these aren't standard CRM fields. TaeKwonTrack is purpose-built for the
          way your school operates.
        </p>
      </div>
    </section>

    {/* Mission */}
    <section className="container py-20 md:py-28">
      <div className="grid gap-12 md:grid-cols-2 items-center">
        <div>
          <h2 className="text-3xl font-bold">Our Mission</h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Our mission is to give martial arts school owners back their time. Less admin work, more
            time on the mat.
          </p>
        </div>
        <div className="rounded-xl bg-secondary flex items-center justify-center aspect-[4/3] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=600&h=450&fit=crop"
            alt="Martial arts training"
            className="w-full h-full object-cover rounded-xl"
            loading="lazy"
          />
        </div>
      </div>
    </section>

    {/* Values */}
    <section className="bg-secondary/40">
      <div className="container py-20 md:py-28">
        <h2 className="text-3xl font-bold text-center">Our Values</h2>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-xl border border-border bg-card p-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <v.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold">{v.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-primary">
      <div className="container py-16 text-center">
        <h2 className="text-3xl font-bold text-primary-foreground">
          Join the schools already using TaeKwonTrack
        </h2>
        <Button asChild size="lg" variant="secondary" className="mt-8 font-semibold">
          <Link to="/login">
            Get Started <ArrowRight size={18} className="ml-1" />
          </Link>
        </Button>
      </div>
    </section>
  </>
);

export default AboutPage;
