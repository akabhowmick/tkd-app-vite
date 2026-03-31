import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export const Section: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="mb-8">
    <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
    <div className="text-sm text-gray-600 leading-relaxed flex flex-col gap-2">{children}</div>
  </div>
);

interface FooterLink {
  to: string;
  label: string;
  primary?: boolean;
}

interface LegalPageLayoutProps {
  title: string;
  footerLinks: [FooterLink, FooterLink];
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  footerLinks,
  children,
}) => {
  const [left, right] = footerLinks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-start min-h-screen bg-gray-50 px-4 py-12"
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="mb-8 pb-6 border-b border-gray-100">
          <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
            TaekwonTrack
          </p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          <p className="text-xs text-gray-400">
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>

        {children}

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
          <Link
            to={left.to}
            className={`text-sm font-medium hover:underline ${left.primary ? "text-blue-500" : "text-gray-400"}`}
          >
            {left.label}
          </Link>
          <Link
            to={right.to}
            className={`text-sm hover:underline ${right.primary ? "text-blue-500" : "text-gray-400"}`}
          >
            {right.label}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
