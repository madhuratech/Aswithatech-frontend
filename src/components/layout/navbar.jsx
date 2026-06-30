import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const navItems = [
    { label: "HOME", path: "/" },
    { label: "GENERAL", path: "/general" },
    { label: "PURCHASE", path: "/purchase" },
    { label: "PRODUCTIONS", path: "/production" },
    { label: "SALES", path: "/sales" },
    { label: "SERVICE", path: "/services" },
    { label: "CONTACT", path: "/contact" },
  ];

  return (
    <div className="w-full flex items-center justify-between px-7 h-16 bg-white shadow-lg" style={{ paddingRight: 'calc(1.75rem + var(--scrollbar-compensation, 0px))' }}>
      <div>
        <h3 className="text-lg font-[Arial] text-[24px] text-[#155DFC] leading-[36px] font-[700]">Aswitha Tech ERP</h3>
      </div>

      <nav>
        <ul className="flex gap-7 text-sm text-[14px] items-center font-[Arial] text-[#4A5565] font-mormal">
          {navItems.map((item, i) => (
            <li key={i}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `font-[Arial] ${isActive ? "bg-[#155DFC] p-[8px] px-[14px] rounded-lg text-white shadow-md"
                    : "text-[#4A5565] hover:text-[#155DFC]"}`}>
                {item.label}
              </NavLink>
            </li>
          ))}

          <li className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 text-[#4A5565] hover:text-[#155DFC] font-[Arial] text-sm font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
              <span className="hidden sm:inline">{user?.name || "User"}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
