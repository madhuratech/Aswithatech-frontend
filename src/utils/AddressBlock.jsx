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

export function splitAddress(address, state, pincode) {
  if (!address) {
    const statePincode = [state, pincode].filter(Boolean).join(" - ");
    return statePincode ? [statePincode.toUpperCase()] : [];
  }

  const parts = address
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    const statePincode = [state, pincode].filter(Boolean).join(" - ");
    return statePincode ? [statePincode.toUpperCase()] : [];
  }

  const lines = [];
  let nextIdx = 0;

  // Line 1: First part (combine with second if first part is short like a door number)
  const isShortFirstPart =
    parts[0].length <= 10 &&
    !/street|nagar|road|flat|building|ward|block|layout|cross|avenue/i.test(parts[0]);

  if (isShortFirstPart && parts.length > 1) {
    lines.push(`${parts[0]}, ${parts[1]}`);
    nextIdx = 2;
  } else {
    lines.push(parts[0]);
    nextIdx = 1;
  }

  // Line 3: City + State/Pincode (City is the last part if there are more parts)
  let city = "";
  if (parts.length > nextIdx) {
    city = parts[parts.length - 1];
  }

  const statePincode = [state, pincode].filter(Boolean).join(" - ");
  const line3 = [city, statePincode].filter(Boolean).join(", ");

  // Line 2: Middle parts
  const middleParts = [];
  const endIdx = parts.length > nextIdx ? parts.length - 1 : nextIdx;
  for (let idx = nextIdx; idx < endIdx; idx++) {
    middleParts.push(parts[idx]);
  }
  const line2 = middleParts.join(", ");

  if (line2) {
    lines.push(line2);
  }

  if (line3) {
    lines.push(line3);
  }

  return lines.map((l) => l.toUpperCase());
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
  const lines = splitAddress(address, state, pincode);
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
  const lines = splitAddress(address, state, pincode);
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
  const lines = splitAddress(address, state, pincode);
  const stCode = getStateCode(stateCode, gst);

  return (
    <>
      <h2 className={labelClassName}>TO :</h2>

      <h2 className={`${nameClassName} break-words`}>{name}</h2>

      <div className={`${textSize} leading-5 font-medium max-w-[350px] break-words`}>
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}

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