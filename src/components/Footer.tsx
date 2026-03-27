import { Link } from "react-router-dom";
import { Instagram, Facebook, Linkedin } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-border bg-secondary/50">
    <div className="container py-12">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <Link to="/" className="text-xl font-bold text-primary">
            TaeKwonTrack
          </Link>
          <p className="mt-2 text-sm text-muted-foreground">Built for the dojo, not the desk.</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-foreground">Links</span>
          {[
            { label: "Home", to: "/" },
            { label: "Pricing", to: "/pricing" },
            { label: "FAQ", to: "/faq" },
            { label: "Login", to: "/login" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground">Follow Us</span>
          <div className="flex gap-4">
            <a
              href="#"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Instagram size={20} />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Facebook size={20} />
            </a>
            <a
              href="#"
              aria-label="LinkedIn"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} TaeKwonTrack. All rights reserved.
      </div>
    </div>
  </footer>
);
