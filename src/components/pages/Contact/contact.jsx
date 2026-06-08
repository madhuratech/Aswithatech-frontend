import React from "react";
import logo from "../../../asset/Madhura-logo.png";
import { Phone, Mail,} from "lucide-react";

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="rounded-2xl p-10 max-w-lg w-full">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src={logo}
            alt="Madhura Technologies Pvt. Ltd."
            className="h-24 object-contain"
          />
        </div>

        {/* Company Name */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#155DFC]">
            Madhura Technologies Pvt. Ltd.
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your Trusted Technology Partner
          </p>
        </div>

        <hr className="border-slate-100 mb-8" />

        {/* Contact Details */}
        <div className="flex flex-col gap-5">

          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Phone size={20} className="text-[#155DFC]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Phone / Mobile</p>
              <p className="text-slate-700 font-semibold">+91 90036 63660</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <Mail size={20} className="text-[#155DFC]" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Email</p>
              <a
                href="mailto:biz@madhuratech.com"
                className="text-slate-700 font-semibold hover:text-[#155DFC] transition-colors"
              >
               biz@madhuratech.com
              </a>
            </div>
          </div>

        </div>

        <div className="mt-10 text-center text-xs text-slate-300">
          © {new Date().getFullYear()} Madhura Technologies Pvt. Ltd.
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
