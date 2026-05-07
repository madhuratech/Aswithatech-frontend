import toast from "react-hot-toast";

export const successToast = (msg) =>
  toast.success(msg, {
    style: {
      background: "#16a34a",
      color: "#fff",
      fontSize: "14px",
    },
    icon: "✅",
  });

export const errorToast = (msg) =>
  toast.error(msg, {
    style: {
      background: "#dc2626",
      color: "#fff",
      fontSize: "14px",
    },
    icon: "❌",
  });

export const loadingToast = (msg) =>
  toast.loading(msg, {
    style: {
      background: "#0f172a",
      color: "#fff",
      fontSize: "14px",
    },
  });
