import React from "react";
import { NavLink } from "react-router-dom";
const Navbar = () => {

  const navItems = [
    { label: "HOME", path: "/" },
    { label: "GENERAL", path: "/general" },
    { label: "PURCHASE", path: "/purchase" },
    { label: "PRODUCTIONS", path: "/production" },
    { label: "SALES", path: "/sales" },
    { label: "SERVICE", path: "/services" },
    { label: "CONTACT", path: "/contact" },
    { label: "EXIT", path: "/report" },
  ];
  

  return (

    <div className="w-full flex items-center justify-between px-7 h-16 bg-white shadow-lg" style={{ paddingRight: 'calc(1.75rem + var(--scrollbar-compensation, 0px))' }}>
      <div>
        <h3 className="text-lg font-[Arial] text-[24px] text-[#155DFC]  leading-[36px] font-[700]">Admin Software</h3>
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
        </ul>
      </nav>

    </div>
  );
};

export default Navbar;
