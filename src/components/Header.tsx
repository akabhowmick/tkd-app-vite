import { useState } from "react";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Header = () => {
  const [nav, setNav] = useState(false);

  // Toggle function to handle the navbar's display
  const handleNav = () => {
    setNav(!nav);
  };

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle user logout
  const handleLogout = () => {
    logout();
    navigate("/login"); // Redirect to login after logout
  };

  // Navigation items based on user's authentication status
  const navItems = user
    ? [
        { id: 1, text: "Home", to: "/" },
        { id: 2, text: "Dashboard", to: "/dashboard" },
      ]
    : [
        { id: 1, text: "Home", to: "/" },
        { id: 2, text: "Login", to: "/login" },
      ];

  return (
    <div className="bg-red-900 flex justify-between items-center h-24 w-full px-6 text-white shadow-md">
      {/* Logo */}
      <h1 className="text-3xl font-bold">Taekwondo Chat App</h1>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex space-x-6">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `p-2 rounded-lg transition duration-300 ${
                isActive ? "text-gray-300 font-bold" : "hover:text-gray-300"
              }`
            }
          >
            {item.text}
          </NavLink>
        ))}
        {user && (
          <button
            onClick={handleLogout}
            className="p-2 text-white rounded-lg transition duration-300 hover:text-gray-300"
          >
            Logout
          </button>
        )}
      </ul>

      {/* Mobile Navigation Icon */}
      <div onClick={handleNav} className="block md:hidden">
        {nav ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
      </div>

      {/* Mobile Navigation Menu */}
      <ul
        className={`fixed md:hidden left-0 top-0 w-[60%] h-full bg-red-900 shadow-lg transition-transform duration-500 ${
          nav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Logo */}
        <h1 className="text-3xl font-bold text-white m-4">Taekwondo Chat App</h1>

        {/* Mobile Navigation Items */}
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            onClick={handleNav} // Close menu on navigation
            className={({ isActive }) =>
              `block p-4 rounded-lg transition duration-300 ${
                isActive ? "text-gray-300 font-bold" : "hover:text-gray-300"
              }`
            }
          >
            {item.text}
          </NavLink>
        ))}
        {user && (
          <button
            onClick={() => {
              handleLogout();
              handleNav(); // Close menu after logout
            }}
            className="block w-full p-4 bg-gray-700 text-white rounded-lg transition duration-300 hover:bg-gray-600"
          >
            Logout
          </button>
        )}
      </ul>
    </div>
  );
};
