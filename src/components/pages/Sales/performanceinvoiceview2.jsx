import React, { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import PerformanceInvoiceLayout2 from "./performanceinvoiceformat2";

const PerformanceInvoiceView2 = () => {
    const { invoiceNo }     = useParams();
    const [searchParams]    = useSearchParams();
    const navigate          = useNavigate();
    const autoPrint         = searchParams.get("print") === "true";
    const decoded           = decodeURIComponent(invoiceNo || "");

    useEffect(() => {
        if (!autoPrint || !decoded) return;
        const timer = setTimeout(() => window.print(), 900);
        return () => clearTimeout(timer);
    }, [autoPrint, decoded]);

    return (
        <div className="min-h-screen bg-gray-100 font-sans">

            {/* Action Bar — hidden when printing */}
            <div className="no-print flex items-center gap-3 px-6 py-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-[14px] font-semibold shadow-sm"
                >
                    ← Back
                </button>

                <div className="flex-1" />

                <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wide">
                    Performance Invoice 2: <span className="text-gray-900">{decoded}</span>
                </span>

                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-2 bg-gray-900 text-white rounded-xl text-[13px] font-bold hover:bg-black transition-colors shadow-sm"
                >
                    🖨️ Print
                </button>
            </div>

            {/* Invoice */}
            <div className="py-6 px-4">
                <PerformanceInvoiceLayout2 InvNumber={decoded} />
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0 !important; padding: 0 !important; }
                }
            `}</style>
        </div>
    );
};

export default PerformanceInvoiceView2;
