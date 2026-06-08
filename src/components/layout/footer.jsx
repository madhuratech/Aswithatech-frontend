import React from "react";
import { Link } from "react-router-dom";
import madhuraLogo from "../../asset/Madhura-logo.png";

const Footer = () => {
  return (
    <footer className="w-full h-[56px] border-t border-[#e5e7eb] bg-white px-8 flex items-center justify-between text-slate-500 font-sans text-xs print:hidden">
      <div>
        <span className="font-medium text-slate-500">© 2026 PCB ERP System | Version 1.0.0</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Powered By</span>
        <Link to="https://madhuratech.com/" target="_blank" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <span className="font-semibold text-slate-700">Madhura Technologies Pvt Ltd</span>
          <img
            src={madhuraLogo}
            alt="Madhura Technologies Logo"
            className="h-5 w-auto object-contain"
          />
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
