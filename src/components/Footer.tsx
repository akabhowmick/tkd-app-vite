import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";

const footerLinks = [
  { label: "Home", to: "/" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQ", to: "/faq" },
  { label: "Login", to: "/login" },
];

const socialLinks = [
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "Facebook", icon: Facebook, href: "#" },
  { label: "LinkedIn", icon: Linkedin, href: "#" },
];

export const Footer = () => (
  <footer className="border-t border-border bg-secondary/50">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-3">
        {/* Brand */}
        <div>
          <Link to="/" className="text-xl font-bold font-heading text-primary">
            TaeKwonTrack
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Built for the dojo, not the desk.</p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-foreground">Links</span>
          {footerLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Social */}
        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">Follow Us</span>
          <div className="flex gap-4">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <s.icon size={20} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TaeKwonTrack. All rights reserved.
      </div>
    </div>
  </footer>
);
