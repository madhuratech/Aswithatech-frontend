import React, { useEffect } from "react";

/**
 * KeyboardNavProvider
 *
 * Global keyboard navigation layer — wrap the entire app once and all ERP forms
 * gain Enter / Up / Down arrow navigation, cell grid traversal, and global shortcuts.
 */

const FOCUSABLE =
  'input:not([disabled]):not([type="hidden"]):not([readonly]), ' +
  'select:not([disabled]), ' +
  'textarea:not([disabled]), ' +
  '[tabindex="0"]:not([disabled])';

export function KeyboardNavProvider({ children }) {
  useEffect(() => {
    // Helper to check element visibility
    const isVisible = (el) => {
      return el && (el.offsetWidth > 0 || el.offsetHeight > 0);
    };

    // Inject visual style for keyboard highlighted dropdown items
    const STYLE_ID = "keyboard-nav-styles";
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.innerHTML = `
        .kb-highlighted {
          background-color: rgb(219, 234, 254) !important; /* blue-100 */
          color: rgb(30, 58, 138) !important; /* blue-900 */
        }
      `;
      document.head.appendChild(style);
    }

    // Helper to find the first product/item search input in Step 2 item row
    const findProductInput = (scope) => {
      const selectors = [
        'input[placeholder*="search items" i]',
        'input[placeholder*="search item" i]',
        'input[placeholder*="search product" i]',
        'input[placeholder*="search pcb" i]',
        'input[placeholder*="search spare" i]',
        'input[placeholder*="search service" i]',
        'input[placeholder*="item" i]',
        'input[placeholder*="product" i]',
        'input[placeholder*="pcb" i]',
        'input[placeholder*="spare" i]',
        'input[placeholder*="service" i]'
      ];
      for (const selector of selectors) {
        const el = scope.querySelector(selector);
        if (isVisible(el)) {
          return el;
        }
      }
      return null;
    };

    // Helper to find global search/registry inputs (Ctrl+F)
    const findSearchInput = () => {
      const selectors = [
        'input[placeholder*="search" i]',
        'input[placeholder*="filter" i]',
        'input[placeholder*="find" i]',
        'input[name*="search" i]',
        'input[id*="search" i]'
      ];
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (isVisible(el)) {
          return el;
        }
      }
      return document.querySelector('input[type="text"]');
    };

    // Helper to set highlighting classes on suggestion list options
    const highlightOption = (options, newIdx) => {
      options.forEach((opt, idx) => {
        if (idx === newIdx) {
          opt.classList.add("kb-highlighted");
          opt.scrollIntoView({ block: "nearest" });
        } else {
          opt.classList.remove("kb-highlighted");
        }
      });
    };

    // Helper to focus cell or its interactive content
    const focusElement = (el) => {
      if (!el) return;
      const interactive = el.querySelector('input, select, textarea, button, a');
      if (interactive) {
        interactive.focus();
      } else {
        el.focus();
      }
    };

    // MutationObserver to dynamically assign tabindex="0" to static table cells and custom dropdowns
    const setupTabindices = () => {
      // 1. Static table body cells that don't have interactive elements
      const cells = document.querySelectorAll("tbody td");
      cells.forEach((cell) => {
        const hasInteractive = cell.querySelector("input, select, textarea, button, a");
        if (!hasInteractive) {
          if (cell.getAttribute("tabindex") !== "0") {
            cell.setAttribute("tabindex", "0");
          }
        }
      });

      // 2. Custom dropdown triggers (divs with cursor-pointer that act like selects)
      const customTriggers = document.querySelectorAll(".cursor-pointer, [class*=\"cursor-pointer\"]");
      customTriggers.forEach((el) => {
        const tagName = el.tagName;
        if (tagName === "DIV" || tagName === "SPAN") {
          // If not inside a table cell and does not contain interactive elements
          if (!el.closest("tbody td") && !el.querySelector("input, select, textarea, button, a")) {
            if (el.getAttribute("tabindex") !== "0") {
              el.setAttribute("tabindex", "0");
            }
          }
        }
      });
    };

    setupTabindices();
    const observer = new MutationObserver(() => setupTabindices());
    observer.observe(document.body, { childList: true, subtree: true });

    // Global KeyDown handler
    const onKeyDown = (e) => {
      const target = e.target;

      // 1. Global Shortcuts (Ctrl + Key)
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl) {
        const key = e.key.toLowerCase();
        if (key === "s") {
          e.preventDefault();
          const saveBtn = Array.from(document.querySelectorAll("button")).find((btn) => {
            const txt = btn.textContent.trim().toLowerCase();
            return (
              txt === "save" ||
              txt === "update" ||
              txt === "saving…" ||
              txt === "saving..."
            );
          });
          if (saveBtn) saveBtn.click();
          return;
        }
        if (key === "n") {
          e.preventDefault();
          const newBtn = Array.from(document.querySelectorAll("button")).find((btn) => {
            const txt = btn.textContent.trim().toLowerCase();
            return txt === "new" || txt === "reset" || txt === "clear";
          });
          if (newBtn) newBtn.click();
          return;
        }
        if (key === "f") {
          e.preventDefault();
          const searchInput = findSearchInput();
          if (searchInput) {
            searchInput.focus();
            searchInput.select?.();
          }
          return;
        }
      }

      // 2. Table Cell Grid Navigation
      if (target.tagName === "TD" || target.closest("tbody td")) {
        const cell = target.tagName === "TD" ? target : target.closest("tbody td");
        const row = cell.parentElement;
        const tbody = row.parentElement;

        if (tbody && tbody.tagName === "TBODY") {
          const colIdx = Array.from(row.children).indexOf(cell);

          if (e.key === "ArrowRight" || (e.key === "Enter" && target.tagName === "TD")) {
            e.preventDefault();
            const nextCell = cell.nextElementSibling;
            if (nextCell) focusElement(nextCell);
            return;
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prevCell = cell.previousElementSibling;
            if (prevCell) focusElement(prevCell);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            const nextRow = row.nextElementSibling;
            if (nextRow) {
              const nextCell = nextRow.children[colIdx];
              if (nextCell) focusElement(nextCell);
            }
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            const prevRow = row.previousElementSibling;
            if (prevRow) {
              const prevCell = prevRow.children[colIdx];
              if (prevCell) focusElement(prevCell);
            }
            return;
          }
        }
      }

      // 3. Dropdowns (native <select> element Arrow navigation bypass)
      if (target.tagName === "SELECT" && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
        return;
      }

      // 4. Form Field Enter/ArrowUp/ArrowDown Navigation
      const isEnter = e.key === "Enter";
      const isUp = e.key === "ArrowUp";
      const isDown = e.key === "ArrowDown";

      if (isEnter || isUp || isDown) {
        // Skip textareas for Enter key to allow standard multi-line editing
        if (isEnter && target.tagName === "TEXTAREA") return;

        // Skip Arrow keys on textareas to preserve text cursor movement
        if ((isUp || isDown) && target.tagName === "TEXTAREA") return;

        // Prevent browser incrementing behavior on number inputs when using arrow keys
        if ((isUp || isDown) && target.tagName === "INPUT" && target.type === "number") {
          e.preventDefault();
        }

        // Locate suggestion dropdowns if present
        const dropdown = (target.closest(".relative") || target.parentElement)?.querySelector(".absolute, [class*=\"absolute\"], [class*=\"dropdown\"]");
        const hasDropdown = dropdown && isVisible(dropdown);

        if (hasDropdown) {
          const options = Array.from(dropdown.children).filter((el) => {
            return (
              isVisible(el) &&
              !el.classList.contains("text-gray-400") &&
              !el.textContent.includes("No ")
            );
          });

          if (options.length > 0) {
            if (isUp || isDown) {
              e.preventDefault();
              let currentIdx = parseInt(dropdown.dataset.highlightedIndex, 10);
              if (isNaN(currentIdx)) currentIdx = -1;

              let newIdx;
              if (isUp) {
                newIdx = currentIdx <= 0 ? options.length - 1 : currentIdx - 1;
              } else {
                newIdx = currentIdx >= options.length - 1 ? 0 : currentIdx + 1;
              }

              dropdown.dataset.highlightedIndex = newIdx;
              highlightOption(options, newIdx);
              return;
            }

            if (isEnter) {
              const activeIdx = parseInt(dropdown.dataset.highlightedIndex, 10);
              if (!isNaN(activeIdx) && options[activeIdx]) {
                e.preventDefault();
                options[activeIdx].click();
                dropdown.removeAttribute("data-highlighted-index");

                // Get fields again and focus next field after state update
                setTimeout(() => {
                  const scope =
                    target.closest("form") ||
                    target.closest("[data-keyboard-scope]") ||
                    document.body;
                  const fields = Array.from(scope.querySelectorAll(FOCUSABLE)).filter(
                    (el) => !el.dataset.keyboardIgnore && isVisible(el)
                  );
                  const idx = fields.indexOf(target);
                  if (idx !== -1) {
                    const next = e.shiftKey ? fields[idx - 1] : fields[idx + 1];
                    if (next) {
                      next.focus();
                      if (next.select && ["text", "number", "email", "tel", "search"].includes(next.type)) {
                        next.select();
                      }
                    }
                  }
                }, 80);
                return;
              }
            }
          }
        }

        // Toggle custom dropdown triggers if pressing Enter
        if (isEnter && target.tagName === "DIV" && target.getAttribute("tabindex") === "0") {
          e.preventDefault();
          target.click();
          return;
        }

        // Standard Form focus navigation
        const scope =
          target.closest("form") ||
          target.closest("[data-keyboard-scope]") ||
          document.body;

        const fields = Array.from(scope.querySelectorAll(FOCUSABLE)).filter(
          (el) => !el.dataset.keyboardIgnore && isVisible(el)
        );

        const idx = fields.indexOf(target);
        if (idx === -1) return;

        // Enter or Down Arrow moves forward, Up Arrow moves backward (if no active dropdown)
        const moveForward = isEnter || isDown;
        const moveBackward = isUp;

        if (moveForward || moveBackward) {
          e.preventDefault();
          const next = moveBackward ? fields[idx - 1] : fields[idx + 1];

          if (next) {
            // Trigger Add / Update button and return focus to product search
            if (
              !moveBackward &&
              next.tagName === "BUTTON" &&
              (/add/i.test(next.textContent) ||
                /update/i.test(next.textContent) ||
                /add row/i.test(next.textContent))
            ) {
              next.click();
              const isUpdate = /update/i.test(next.textContent) || /upd/i.test(next.textContent);
              if (!isUpdate) {
                const prodInput = findProductInput(scope);
                if (prodInput) {
                  setTimeout(() => {
                    prodInput.focus();
                    prodInput.select?.();
                  }, 50);
                }
              }
              return;
            }

            next.focus();
            if (next.tagName === "DIV" && next.getAttribute("tabindex") === "0") {
              next.click();
            }
            if (next.select && ["text", "number", "email", "tel", "search"].includes(next.type)) {
              next.select();
            }
          }
        }
      }
    };

    // Global Click handler for edit mode tracking and restoration
    const onClick = (e) => {
      const button = e.target.closest("button");
      if (!button) return;

      // 1. Detect clicking Edit
      const isEdit =
        button.title?.toLowerCase() === "edit" ||
        /edit/i.test(button.textContent) ||
        button.querySelector("svg");
      if (isEdit) {
        const tr = button.closest("tr");
        const tbody = tr?.parentElement;
        if (tbody && tbody.tagName === "TBODY") {
          const rowIdx = Array.from(tbody.children).indexOf(tr);
          document.body.dataset.lastEditIndex = rowIdx;
        }
      }

      // 2. Detect clicking Update / Upd
      const isUpdate =
        /update/i.test(button.textContent) ||
        /upd/i.test(button.textContent);
      if (isUpdate) {
        const lastEditIndex = document.body.dataset.lastEditIndex;
        if (lastEditIndex !== undefined && lastEditIndex !== null) {
          const rowIdx = parseInt(lastEditIndex, 10);
          document.body.removeAttribute("data-last-edit-index");
          setTimeout(() => {
            const tbodies = document.querySelectorAll("tbody");
            for (const tbody of tbodies) {
              const row = tbody.children[rowIdx];
              if (row) {
                const cell = row.querySelector("td[tabindex=\"0\"]");
                if (cell) {
                  cell.focus();
                  return;
                }
              }
            }
          }, 150);
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}



