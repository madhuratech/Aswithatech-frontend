import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import API_BASE_URL from "../../../config/api";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";

export default function Setting() {
  const { logout, token } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPwd1, setShowPwd1] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [showPwd3, setShowPwd3] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password cannot be the same as the current password");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password update failed");
      }

      setSuccess("Password changed successfully.");

      setTimeout(() => {
        logout();
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const PasswordField = ({ label, value, onChange, show, toggleShow, placeholder, id }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition pr-10"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-2 bg-blue-50 rounded-lg">
            <ShieldCheck className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Change Password</h2>
            <p className="text-sm text-gray-500">Update your account password securely</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            id="currentPassword"
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showPwd1}
            toggleShow={() => setShowPwd1((v) => !v)}
            placeholder="Enter current password"
          />

          <PasswordField
            id="newPassword"
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            show={showPwd2}
            toggleShow={() => setShowPwd2((v) => !v)}
            placeholder="Enter new password"
          />

          <PasswordField
            id="confirmNewPassword"
            label="Confirm New Password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
            show={showPwd3}
            toggleShow={() => setShowPwd3((v) => !v)}
            placeholder="Re-enter new password"
          />

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-2.5 rounded-lg border border-red-200 flex items-center gap-2">
              <Lock size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-2.5 rounded-lg border border-green-200">
              {success}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-8 rounded-lg transition flex items-center justify-center gap-2"
            >
              {busy && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {busy ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
