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
    <div className="bg-black flex justify-between items-center h-24 max-w-[1240px] mx-auto px-4 text-white">
      {/* Logo */}
      <h1 className="w-full text-3xl font-bold text-red-500">Taekwondo Chat App</h1>

      {/* Desktop Navigation */}
      <ul className="hidden md:flex">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={({ isActive }) =>
              `p-4 rounded-xl m-2 cursor-pointer duration-300 ${
                isActive ? "text-red-500 font-bold" : "text-red hover:text-red-500"
              }`
            }
          >
            {item.text}
          </NavLink>
        ))}
        {user && (
          <button
            onClick={handleLogout}
            className="p-4 bg-red-500 text-white rounded-xl m-2 cursor-pointer duration-300 hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </ul>

      {/* Mobile Navigation Icon */}
      <div onClick={handleNav} className="block md:hidden">
        {nav ? <AiOutlineClose size={20} /> : <AiOutlineMenu size={20} />}
      </div>

      {/* Mobile Navigation Menu */}
      <ul
        className={
          nav
            ? "fixed md:hidden left-0 top-0 w-[60%] h-full border-r border-r-gray-900 bg-[#000300] ease-in-out duration-500"
            : "ease-in-out w-[60%] duration-500 fixed top-0 bottom-0 left-[-100%]"
        }
      >
        {/* Mobile Logo */}
        <h1 className="w-full text-5xl font-bold text-red-500 m-4">Taekwondo Chat App</h1>

        {/* Mobile Navigation Items */}
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            onClick={handleNav} // Close menu on navigation
            className={({ isActive }) =>
              `block p-4 rounded-xl m-2 cursor-pointer duration-300 ${
                isActive ? "text-red-500 font-bold" : "text-red hover:text-red-500"
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
            className="block w-full p-4 bg-red-500 text-white rounded-xl m-2 cursor-pointer duration-300 hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </ul>
    </div>
  );
};
