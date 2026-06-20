/**
 * GST type detection and calculation utilities.
 *
 * State Code 33 = Tamil Nadu (intrastate → CGST + SGST).
 * Any other state code or non-TN state → IGST only.
 *
 * Priority: GST number (first 2 digits = state code) > customer state name.
 */

export const isTamilNadu = (state, gstNumber) => {
  if (gstNumber && String(gstNumber).trim().startsWith("33")) return true;
  if (state) {
    const s = String(state).replace(/\s+/g, "").toLowerCase();
    if (s === "tamilnadu" || s === "tn") return true;
  }
  return false;
};

/**
 * Calculate CGST, SGST, IGST amounts from taxable value and total GST %.
 *
 * @param {number} taxableAmount - Amount on which tax is applied
 * @param {number} gstPct        - Total GST percentage (e.g. 18)
 * @param {boolean} intrastate   - true → CGST+SGST, false → IGST
 * @returns {{ cgst: number, sgst: number, igst: number, cgstPct: number, sgstPct: number, igstPct: number }}
 */
export const calcGstAmounts = (taxableAmount, gstPct, intrastate) => {
  const half = gstPct / 2;
  if (intrastate) {
    const each = (taxableAmount * half) / 100;
    return { cgst: each, sgst: each, igst: 0, cgstPct: half, sgstPct: half, igstPct: 0 };
  }
  return {
    cgst: 0,
    sgst: 0,
    igst: (taxableAmount * gstPct) / 100,
    cgstPct: 0,
    sgstPct: 0,
    igstPct: gstPct,
  };
};
