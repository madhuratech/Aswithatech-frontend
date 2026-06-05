import React, { useState } from "react";
import { Lock, Building2, Save, Eye, EyeOff } from "lucide-react";
import { successToast, errorToast } from "../../ui/nottifications";

const Settings = () => {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [company, setCompany] = useState(() => {
    const saved = localStorage.getItem("companyInfo");
    return saved ? JSON.parse(saved) : {
      name: "",
      address: "",
      phone: "",
      email: "",
      gst: "",
    };
  });

  const handlePasswordChange = (e) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem("adminPassword");

    if (password !== storedPassword) {
      errorToast("Current password is incorrect");
      return;
    }
    if (newPassword.length < 6) {
      errorToast("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      errorToast("Passwords do not match");
      return;
    }

    localStorage.setItem("adminPassword", newPassword);
    successToast("Password changed successfully");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleCompanySave = () => {
    localStorage.setItem("companyInfo", JSON.stringify(company));
    successToast("Company information saved");
  };

  return (
    <div className="bg-white rounded-xl border p-6 overflow-y-auto h-[70vh]">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">System Settings</h2>
        <p className="text-sm text-gray-500">
          Manage application settings and preferences
        </p>
      </div>

      <div className="space-y-8">
        {/* Admin Password */}
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Lock size={20} className="text-gray-600" />
            <h3 className="text-base font-semibold">Admin Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
              <div className="relative">
                <input
                  type={showOld ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
                  required
                />
                <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
                  required
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
                  required
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-lg text-sm">
              <Save size={16} />
              Update Password
            </button>
          </form>
        </div>

        {/* Company Info */}
        <div className="border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Building2 size={20} className="text-gray-600" />
            <h3 className="text-base font-semibold">Company Information</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={company.name}
                onChange={(e) => setCompany({ ...company, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                value={company.gst}
                onChange={(e) => setCompany({ ...company, gst: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 bg-[#F2F4F7]"
              />
            </div>
          </div>

          <button onClick={handleCompanySave} className="flex items-center gap-2 bg-black text-white px-5 py-2 rounded-lg text-sm mt-5">
            <Save size={16} />
            Save Company Info
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
