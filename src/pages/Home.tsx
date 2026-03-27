import { Link } from "react-router-dom";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  DollarSign,
  School,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Student Management",
    desc: "Add, edit, and search students. Attach parent contacts and track belt levels in one place.",
  },
  {
    icon: CalendarCheck,
    title: "Renewal Tracking",
    desc: "Never miss an expiring membership. See renewals by day, week, or month and resolve them with a single click.",
  },
  {
    icon: ClipboardList,
    title: "Attendance",
    desc: "Take class attendance quickly, track who showed up, and view records over time.",
  },
  {
    icon: DollarSign,
    title: "Sales & Payments",
    desc: "Log tuition, test fees, and other transactions. Categorize by payment type and keep your books clean.",
  },
  {
    icon: School,
    title: "School Profile",
    desc: "Manage your school's details, classes, and announcements from one admin panel.",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    desc: "Separate views for admins and instructors. Everyone sees exactly what they need.",
  },
];

const steps = [
  { num: "1", title: "Set up your school profile", icon: School },
  { num: "2", title: "Add your students", icon: Users },
  { num: "3", title: "Manage everything from your dashboard", icon: CheckCircle2 },
];

const Home = () => (
  <div>
    {/* Hero */}
    <section
      className="relative overflow-hidden min-h-[600px] flex items-center"
      style={{
        background:
          "linear-gradient(135deg, hsl(0 20% 8%) 0%, hsl(0 40% 12%) 50%, hsl(0 20% 8%) 100%)",
      }}
    >
      <div className="container relative py-24 md:py-36 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Run Your Martial Arts School — Without the Chaos
        </h1>
        <p className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl mx-auto">
          TaeKwonTrack is the all-in-one CRM for Taekwondo schools. Manage students, track renewals,
          take attendance, and stay on top of payments — all in one place.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="inline-flex h-11 items-center justify-center rounded-md border-2 border-white/30 px-8 text-sm font-semibold text-white bg-transparent hover:bg-white/10 transition-colors"
          >
            See How It Works
          </a>
        </div>
      </div>
    </section>

    {/* Features */}
    <section id="features" className="container py-20 md:py-28">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">
        Everything your school needs
      </h2>
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon size={22} />
            </div>
            <h3 className="text-lg font-semibold text-card-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* Trust bar */}
    <section className="border-y border-border bg-secondary/40">
      <div className="container py-10 text-center">
        <p className="text-sm font-medium text-muted-foreground mb-6">
          Trusted by martial arts schools across the country
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {["Tiger Academy", "Iron Fist Dojang", "Summit Martial Arts", "Pacific TKD"].map(
            (name) => (
              <span key={name} className="text-lg font-semibold text-foreground/40">
                {name}
              </span>
            ),
          )}
        </div>
      </div>
    </section>

    {/* How it works */}
    <section id="how-it-works" className="container py-20 md:py-28">
      <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground">How it works</h2>
      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.num} className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {s.num}
            </div>
            <div className="mb-3 flex justify-center text-primary">
              <s.icon size={28} />
            </div>
            <p className="text-base font-medium text-foreground">{s.title}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="bg-primary">
      <div className="container py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
          Ready to get organized?
        </h2>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-secondary px-8 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          Start for Free <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  </div>
);

export default Home;
