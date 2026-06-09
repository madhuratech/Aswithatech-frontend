import React, { useEffect } from "react";

/**
 * KeyboardNavProvider
 *
 * Global keyboard navigation layer — wrap the entire app once and all ERP forms
 * gain Enter / Shift+Enter field navigation without any per-form changes.
 *
 * Behaviour:
 *   Enter           → move focus to the next focusable input in the current form
 *   Shift+Enter     → move focus to the previous focusable input
 *   (neither fires) → when e.defaultPrevented is true, so dropdown hooks that
 *                     call e.preventDefault() on selection are fully respected
 *
 * Scope resolution (in order):
 *   1. Nearest <form> ancestor
 *   2. Nearest [data-keyboard-scope] ancestor (for non-form panels)
 *   3. document.body fallback
 *
 * Opt-out for individual elements:
 *   Add data-keyboard-ignore to any input that should be skipped.
 */

const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]):not([readonly]), ' +
  "select:not([disabled]), " +
  "textarea:not([disabled])";

export function KeyboardNavProvider({ children }) {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Enter") return;
      // Respect any handler that already claimed this event (e.g. dropdown selection).
      if (e.defaultPrevented) return;

      const target = e.target;

      // Leave native controls and buttons to do their default thing.
      if (target.tagName === "TEXTAREA") return;
      if (target.tagName === "SELECT") return;
      if (target.tagName === "BUTTON") return;
      if (target.type === "submit" || target.type === "reset") return;

      // Opt-out attribute
      if (target.dataset.keyboardIgnore) return;

      const scope =
        target.closest("form") ||
        target.closest("[data-keyboard-scope]") ||
        document.body;

      const fields = Array.from(scope.querySelectorAll(FOCUSABLE)).filter(
        (el) =>
          !el.dataset.keyboardIgnore &&
          el.offsetParent !== null // only visible elements
      );

      const idx = fields.indexOf(target);
      if (idx === -1) return;

      e.preventDefault();
      const next = e.shiftKey ? fields[idx - 1] : fields[idx + 1];
      if (next) {
        next.focus();
        // Select existing text so the user can immediately overtype.
        if (
          next.select &&
          ["text", "number", "email", "tel", "search"].includes(next.type)
        ) {
          next.select();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return <>{children}</>;
}
