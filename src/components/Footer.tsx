import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center py-4 px-6">
        {/* Copyright */}
        <p className="text-sm">
          © {new Date().getFullYear()} Taekwondo App. All rights reserved.
        </p>

        {/* Links */}
        <div className="flex gap-4 mt-2 md:mt-0">
          <a
            href="/privacy"
            className="text-sm hover:underline"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-sm hover:underline"
          >
            Terms of Service
          </a>
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
