import React from 'react';
import { Link, NavLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <Link to="/" className="text-2xl font-bold">
          Taekwondo App
        </Link>

        {/* Navigation Links */}
        <nav className="flex gap-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `text-lg ${isActive ? 'font-bold underline' : 'hover:underline'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `text-lg ${isActive ? 'font-bold underline' : 'hover:underline'}`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/signup"
            className={({ isActive }) =>
              `text-lg ${isActive ? 'font-bold underline' : 'hover:underline'}`
            }
          >
            Sign Up
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;
