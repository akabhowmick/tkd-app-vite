import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const publicNavLinks = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQ", to: "/faq" },
  { label: "About", to: "/about" },
];

const authedNavLinks = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
];

export const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navLinks = user ? authedNavLinks : publicNavLinks;

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to.split("#")[0]);

  return (
    <nav className="sticky top-0 z-50 border-b border-red-800 bg-red-700">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold font-heading text-white">
          TaeKwonTrack
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-base font-medium transition-colors hover:text-white ${
                isActive(link.to) ? "text-white" : "text-red-100"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-200 hover:text-white transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-red-700 shadow hover:bg-red-50 transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-red-800 bg-red-700 px-4 pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block py-3 text-sm font-medium text-red-200 hover:text-white"
            >
              {link.label}
            </Link>
          ))}

          {user ? (
            <button
              onClick={handleLogout}
              className="mt-2 w-full rounded-md bg-red-800 px-4 py-2 text-sm font-medium text-white"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 block w-full rounded-md bg-white px-4 py-2 text-center text-sm font-medium text-red-700"
            >
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Header;
