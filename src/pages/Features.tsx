import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Users,
  CalendarCheck,
  DollarSign,
  School,
  ShieldCheck,
  ArrowRight,
  BarChart2,
  Bell,
  Globe,
  Lock,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Smart Attendance Tracking",
    desc: "Take attendance in seconds with our calendar-based interface. Mark students as present, absent, or tardy with a single click. View historical records and patterns at a glance.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Users,
    title: "Student Management",
    desc: "Maintain complete student profiles with parent contacts, belt levels, enrollment dates, and custom notes. Search, filter, and manage your entire roster effortlessly.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: DollarSign,
    title: "Renewal & Payment Tracking",
    desc: "Never let a membership lapse unnoticed. Track renewal dates, send reminders, log payments by type and category, and keep your revenue organized.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: BarChart2,
    title: "Reporting & Insights",
    desc: "See what's happening in your school at a glance. Daily attendance counts, revenue summaries, and student progress — all in one dashboard.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: Bell,
    title: "Renewal Reminders",
    desc: "Automatic alerts when memberships are expiring soon, in grace period, or overdue. Resolve renewals or mark students as quit with one action.",
    color: "bg-yellow-100 text-yellow-600",
  },
  {
    icon: ShieldCheck,
    title: "Role-Based Access",
    desc: "Admins see everything. Instructors see what they need. Granular access controls keep your school data organized and secure.",
    color: "bg-red-100 text-red-600",
  },
  {
    icon: School,
    title: "School Profile Management",
    desc: "Set up your school's profile, manage class schedules, publish announcements, and keep your school's information up to date — all in one place.",
    color: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Globe,
    title: "Works Everywhere",
    desc: "TaeKwonTrack is fully responsive. Take attendance from your phone on the mat, manage renewals from your laptop, or review reports on your tablet.",
    color: "bg-cyan-100 text-cyan-600",
  },
  {
    icon: Lock,
    title: "Secure by Default",
    desc: "Built on Supabase with row-level security. Your school's data is isolated, encrypted, and never shared. GDPR-friendly architecture from day one.",
    color: "bg-gray-100 text-gray-600",
  },
];

const COMPARISON = [
  { feature: "Unlimited students", starter: false, growth: true, pro: true },
  { feature: "Attendance tracking", starter: true, growth: true, pro: true },
  { feature: "Renewal management", starter: false, growth: true, pro: true },
  { feature: "Sales & payment logging", starter: false, growth: true, pro: true },
  { feature: "Parent contacts", starter: false, growth: true, pro: true },
  { feature: "Role-based access", starter: false, growth: false, pro: true },
  { feature: "Data exports", starter: false, growth: false, pro: true },
  { feature: "Priority support", starter: false, growth: false, pro: true },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const Check = ({ yes }: { yes: boolean }) =>
  yes ? (
    <span className="text-green-600 font-bold text-lg">✓</span>
  ) : (
    <span className="text-gray-300 font-bold text-lg">—</span>
  );

const Features = () => (
  <div>
    {/* Hero */}
    <section className="bg-hero-gradient py-20 md:py-28 text-center">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest mb-6">
            <Zap size={12} /> Everything you need
          </span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 max-w-3xl mx-auto">
            Every feature your dojo needs, nothing it doesn't
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-8">
            TaeKwonTrack is purpose-built for martial arts schools. Every feature was designed
            around how dojos actually operate — not adapted from generic business software.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Get Started Free <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>

    {/* Feature grid */}
    <section className="container py-20 md:py-28">
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FEATURES.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-border bg-card p-6 hover:shadow-md hover:shadow-primary/5 transition-shadow"
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-lg mb-4 ${f.color}`}
            >
              <f.icon size={22} />
            </div>
            <h3 className="text-base font-semibold text-card-foreground mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>

    {/* Feature comparison table */}
    <section className="bg-secondary/40 py-20">
      <div className="container max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Compare plans</h2>
          <p className="text-muted-foreground">
            All plans include core attendance tracking. Upgrade for the full feature set.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-4 bg-secondary/60 px-6 py-4 border-b border-border">
            <div className="text-sm font-semibold text-foreground">Feature</div>
            {["Starter", "Growth", "Pro"].map((plan) => (
              <div key={plan} className="text-center text-sm font-semibold text-foreground">
                {plan}
              </div>
            ))}
          </div>

          {/* Rows */}
          {COMPARISON.map((row, i) => (
            <div
              key={row.feature}
              className={`grid grid-cols-4 px-6 py-3.5 border-b border-border last:border-0 ${
                i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              }`}
            >
              <div className="text-sm text-foreground">{row.feature}</div>
              <div className="text-center">
                <Check yes={row.starter} />
              </div>
              <div className="text-center">
                <Check yes={row.growth} />
              </div>
              <div className="text-center">
                <Check yes={row.pro} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            See full pricing details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="bg-primary py-16 text-center">
      <div className="container">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to modernize your school management?
        </h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto">
          Join schools already using TaeKwonTrack to save hours every week on admin work.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
          >
            Start for Free <ArrowRight size={16} />
          </Link>
          <Link
            to="/pricing"
            className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  </div>
);

export default Features;
