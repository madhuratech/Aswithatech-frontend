import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Layers } from "lucide-react";

export default function DesktopWindowModal({ children, title }) {
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1);
  };

  // Prevent background scrolling when open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[0.5px] p-2 animate-fade-in">
      <div className="bg-[#f3f4f6] flex flex-col w-[98vw] h-[97vh] max-w-[1920px] rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)] border border-[#a3a3a3] overflow-hidden animate-scale-in">

        {/* ── Windows Desktop style Title Bar ── */}
        <div className="h-[30px] bg-gradient-to-r from-[#eaeaea] to-[#f4f4f4] border-b border-[#c2c2c2] flex justify-between items-center select-none flex-none pl-2">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Layers size={13} className="text-gray-500" />
            <span className="text-[12px] font-semibold font-sans tracking-wide uppercase">
              {title}
            </span>
          </div>
          <div className="h-full flex shrink-0">
            <button
              onClick={handleClose}
              className="h-full w-[45px] hover:bg-[#e81123] hover:text-white text-[#333333] transition-colors flex items-center justify-center cursor-pointer border-none bg-transparent outline-none"
              title="Close"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Modal body (Form container) ── */}
        <div className="flex-1 overflow-y-auto bg-white relative desktop-window-modal-content">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.97); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.12s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.14s cubic-bezier(0.1, 0.9, 0.2, 1) forwards;
        }

        /* ── Desktop Window Form Styles & Adjustments ── */
        
        /* Hide isolated "Go Back" buttons inside forms */
        .desktop-window-modal-content .w-fit.mb-6 {
          display: none !important;
        }

        /* Adjust the outer page wrapper */
        .desktop-window-modal-content .min-h-screen {
          min-height: 0 !important;
          height: 100% !important;
          padding: 0.5rem !important;
          background-color: transparent !important;
        }

        /* Pinned Form Card Wrapper */
        .desktop-window-modal-content .max-w-\\[1400px\\] {
          max-width: 100% !important;
          padding: 1rem !important;
          margin: 0 !important;
          border-radius: 4px !important;
          height: 100% !important;
          overflow-y: auto !important;
          position: relative !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* Sticky Form Headers containing Action Buttons (SAVE, DELETE, etc.) */
        .desktop-window-modal-content .max-w-\\[1400px\\] > .flex.justify-between.items-start {
          position: sticky !important;
          top: -1rem !important;
          background-color: white !important;
          z-index: 40 !important;
          padding-top: 0.5rem !important;
          padding-bottom: 0.75rem !important;
          border-b: 1px solid #f3f4f6 !important;
          margin-bottom: 1rem !important;
        }

        /* Responsive spacing reduction to maximize visibility without scrolling */
        
        /* Card Paddings */
        .desktop-window-modal-content .p-8 {
          padding: 1rem !important;
        }
        .desktop-window-modal-content .p-6 {
          padding: 0.75rem !important;
        }
        .desktop-window-modal-content .p-5 {
          padding: 0.6rem !important;
        }
        .desktop-window-modal-content .p-4 {
          padding: 0.5rem !important;
        }

        /* Card Section Margins */
        .desktop-window-modal-content .mb-8 {
          margin-bottom: 0.75rem !important;
        }
        .desktop-window-modal-content .mb-6 {
          margin-bottom: 0.5rem !important;
        }
        .desktop-window-modal-content .mb-5 {
          margin-bottom: 0.4rem !important;
        }
        .desktop-window-modal-content .mb-4 {
          margin-bottom: 0.35rem !important;
        }
        .desktop-window-modal-content .mb-3 {
          margin-bottom: 0.25rem !important;
        }
        .desktop-window-modal-content .mt-8 {
          margin-top: 0.75rem !important;
        }
        .desktop-window-modal-content .pt-6 {
          padding-top: 0.5rem !important;
        }

        /* Spacing between label and input */
        .desktop-window-modal-content label,
        .desktop-window-modal-content .text-\\[11px\\].font-bold {
          margin-bottom: 0.25rem !important;
          font-size: 10px !important;
          line-height: 1 !important;
        }

        /* Input field height adjustment */
        .desktop-window-modal-content input,
        .desktop-window-modal-content select,
        .desktop-window-modal-content textarea {
          padding-top: 0.45rem !important;
          padding-bottom: 0.45rem !important;
          padding-left: 0.6rem !important;
          padding-right: 0.6rem !important;
          font-size: 13px !important;
          height: auto !important;
          min-height: 0 !important;
        }

        /* Override min-h-[43px] to allow custom input heights to take effect */
        .desktop-window-modal-content .min-h-\\[43px\\] {
          min-height: 0 !important;
        }

        /* Row gap reduction within the grids (keeping the original column count) */
        .desktop-window-modal-content .grid {
          row-gap: 0.5rem !important;
          column-gap: 1rem !important;
        }
        .desktop-window-modal-content .gap-7 {
          gap: 0.5rem 1rem !important;
        }
        .desktop-window-modal-content .gap-6 {
          gap: 0.5rem 0.75rem !important;
        }
        .desktop-window-modal-content .gap-5 {
          gap: 0.4rem 0.75rem !important;
        }

        /* Table header and row padding reduction */
        .desktop-window-modal-content table th,
        .desktop-window-modal-content table td {
          padding-top: 0.35rem !important;
          padding-bottom: 0.35rem !important;
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
          font-size: 13px !important;
        }

        /* Section headers and step labels */
        .desktop-window-modal-content p.tracking-widest {
          margin-bottom: 0.35rem !important;
        }
      `}</style>
    </div>
  );
}
