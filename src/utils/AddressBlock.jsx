import React from "react";

export function getStateCode(stateCode, gstNumber) {
  if (stateCode && String(stateCode).trim()) {
    return String(stateCode).trim();
  }

  if (gstNumber && String(gstNumber).trim().length >= 2) {
    return String(gstNumber).trim().slice(0, 2);
  }

  return "";
}

function splitAddress(address) {
  if (!address) return [];

  const parts = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const lines = [];

  // Line 1
  if (parts.length >= 2) {
    lines.push(`${parts[0]}, ${parts[1]}`);
  } else if (parts.length === 1) {
    lines.push(parts[0]);
  }

  // Line 2
  if (parts.length >= 4) {
    lines.push(`${parts[2]}, ${parts[3]}`);
  } else if (parts.length === 3) {
    lines.push(parts[2]);
  }

  return lines;
}

/* ==========================
   SALES & SERVICE INVOICE
========================== */

export function InvoiceAddressBlock({
  name,
  address,
  state,
  pincode,
  phone,
  gst,
  stateCode,
}) {
  const lines = splitAddress(address);
  const stCode = getStateCode(stateCode, gst);

  return (
    <div className="flex gap-2">
      <h2 className="text-[14px] font-bold uppercase whitespace-nowrap">
        TO :
      </h2>

      <div className="flex-1">
        <h2 className="text-[14px] font-extrabold uppercase mb-1">
          {name}
        </h2>

        <div className="text-[11px] leading-4 font-bold uppercase">
          {lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}

          {(state || pincode) && (
            <p>
              {state}
              {state && pincode ? " - " : ""}
              {pincode}
            </p>
          )}

          {phone && <p className="mt-1">PH : {phone}</p>}

          {(gst || stCode) && (
            <div className="flex flex-wrap gap-6 mt-1">
              {gst && <span>GSTIN : {gst}</span>}
              {stCode && <span>ST CODE : {stCode}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================
   DELIVERY CHALLAN
========================== */

export function DcAddressBlock({
  namePrefix = "M/S.",
  name,
  address,
  state,
  pincode,
  phone,
  gst,
  stateCode,
  email,
  textSize = "text-[11px]",
}) {
  const lines = splitAddress(address);
  const stCode = getStateCode(stateCode, gst);

  return (
    <>
      <h2 className={`${textSize} font-bold mb-1 uppercase break-words`}>
        TO: {namePrefix}
        {name}
      </h2>

      <div className={`${textSize} leading-[1.4] font-medium uppercase break-words`}>
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}

        {(state || pincode) && (
          <p>
            {state}
            {state && pincode ? " - " : ""}
            {pincode}
          </p>
        )}

        {phone && <p className="mt-0.5">PH : {phone}</p>}

        {email && <p>Email : {email}</p>}
      </div>

      <div className="flex gap-8 mt-1 flex-wrap">
        <h3 className={`${textSize} font-bold`}>
          GSTIN : {gst || ""}
        </h3>

        <h3 className={`${textSize} font-bold uppercase`}>
          ST CODE : {stCode}
        </h3>
      </div>
    </>
  );
}

/* ==========================
   QUOTATION & PURCHASE ORDER
========================== */

export function QuotationAddressBlock({
  name,
  address,
  state,
  pincode,
  phone,
  gst,
  stateCode,
  labelClassName = "text-[15px] font-bold mb-1 text-blue-800 uppercase",
  nameClassName = "text-[14px] font-bold uppercase mb-1 text-blue-900",
  textSize = "text-[12px]",
}) {
  const lines = splitAddress(address);
  const stCode = getStateCode(stateCode, gst);

  return (
    <>
      <h2 className={labelClassName}>TO :</h2>

      <h2 className={`${nameClassName} break-words`}>{name}</h2>

      <div className={`${textSize} leading-5 font-medium max-w-[350px] break-words`}>
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}

        {(state || pincode) && (
          <p>
            {state}
            {state && pincode ? " - " : ""}
            {pincode}
          </p>
        )}

        {phone && (
          <p className="mt-2 font-bold uppercase">
            PH : {phone}
          </p>
        )}

        {(gst || stCode) && (
          <div className="flex flex-wrap gap-8 mt-1 font-bold uppercase">
            {gst && <span>GSTIN : {gst}</span>}
            {stCode && <span>ST CODE : {stCode}</span>}
          </div>
        )}
      </div>
    </>
  );
}