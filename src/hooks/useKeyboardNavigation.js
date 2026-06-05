import { useEffect } from "react";

export default function useKeyboardNavigation() {
  useEffect(() => {
    let activeDropdownIndex = -1;

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (!activeEl) return;

      const isInput = activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT";
      if (!isInput) return;

      // Skip native key handling for datepicker arrow keys
      if (activeEl.type === "date" && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        return;
      }

      // Locate if any custom absolute dropdown is open inside the active element's container
      const relativeContainer = activeEl.closest(".relative");
      const dropdown = relativeContainer ? relativeContainer.querySelector("div.absolute, div[class*='absolute']") : null;
      
      const dropdownItems = dropdown
        ? Array.from(dropdown.querySelectorAll("div.cursor-pointer, [class*='cursor-pointer'], [class*='hover:bg-gray']"))
        : [];

      const isDropdownOpen = dropdown && dropdownItems.length > 0;

      // 1. Handle ArrowDown and ArrowUp to navigate inside custom dropdown list
      if (isDropdownOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        e.preventDefault();

        // Clear highlight from previously selected item
        if (activeDropdownIndex >= 0 && activeDropdownIndex < dropdownItems.length) {
          dropdownItems[activeDropdownIndex].classList.remove("keyboard-active");
        }

        if (e.key === "ArrowDown") {
          activeDropdownIndex = (activeDropdownIndex + 1) % dropdownItems.length;
        } else if (e.key === "ArrowUp") {
          activeDropdownIndex = (activeDropdownIndex - 1 + dropdownItems.length) % dropdownItems.length;
        }

        // Apply focus style to newly highlighted item
        const highlightedItem = dropdownItems[activeDropdownIndex];
        highlightedItem.classList.add("keyboard-active");
        highlightedItem.scrollIntoView({ block: "nearest" });
        return;
      }

      // If dropdown is open but the key is not navigation, keep highlight unless input focus changed
      if (!isDropdownOpen) {
        activeDropdownIndex = -1;
      }

      // 2. Handle Enter key
      if (e.key === "Enter") {
        // If a dropdown option is highlighted, select it
        if (isDropdownOpen && activeDropdownIndex >= 0 && activeDropdownIndex < dropdownItems.length) {
          e.preventDefault();
          const highlightedItem = dropdownItems[activeDropdownIndex];
          highlightedItem.click();
          activeDropdownIndex = -1;

          // Focus the next input field after a small delay to let React update the state
          setTimeout(() => {
            focusNextInput(activeEl);
          }, 80);
          return;
        }

        // Special case: In the item entry row, pressing enter on the last field triggers item creation ("Add" button)
        const rowContainer = activeEl.closest(".grid") || activeEl.closest(".flex:not(body)");
        if (rowContainer) {
          const rowInputs = Array.from(
            rowContainer.querySelectorAll("input:not([disabled]):not([type='hidden']), select:not([disabled])")
          ).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== "none";
          });

          // Check if rowContainer has an ADD button
          const addButton = Array.from(rowContainer.querySelectorAll("button")).find((btn) => {
            const txt = btn.textContent.trim().toUpperCase();
            return txt === "ADD" || txt === "ADD ROW" || txt === "ADDROWS";
          });

          if (addButton && rowInputs.length > 0 && activeEl === rowInputs[rowInputs.length - 1]) {
            e.preventDefault();
            addButton.click();
            
            // Reset focus to the first item field in the item entry row (e.g. Item Name search field)
            setTimeout(() => {
              const firstInput = rowInputs[0];
              if (firstInput) firstInput.focus();
            }, 80);
            return;
          }
        }

        e.preventDefault();
        focusNextInput(activeEl);
        return;
      }

      // 3. Handle Escape to close dropdown
      if (e.key === "Escape" && isDropdownOpen) {
        e.preventDefault();
        document.body.click(); // Triggers click outside events to close dropdowns
        activeDropdownIndex = -1;
        return;
      }

      // 4. Handle ArrowDown / ArrowUp to move focus when dropdown is NOT open
      if (!isDropdownOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
        // Do not intercept arrow keys in number inputs
        if (activeEl.type === "number") {
          return;
        }
        e.preventDefault();
        if (e.key === "ArrowDown") {
          focusNextInput(activeEl);
        } else if (e.key === "ArrowUp") {
          focusPrevInput(activeEl);
        }
      }
    };

    const getFocusableElements = () => {
      const allElements = Array.from(
        document.querySelectorAll(
          "input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
        )
      );

      return allElements.filter((el) => {
        // Exclude inputs/buttons in navigation panels (sidebar/navbar/headers)
        const isNavOrSidebar = el.closest("nav") || el.closest("aside") || el.closest(".sidebar") || el.closest(".navbar");
        if (isNavOrSidebar) return false;

        // Skip buttons that are not for form data entry (e.g. Save, Close, Delete, Edit, New, Go Back)
        if (el.tagName === "BUTTON") {
          const txt = el.textContent.trim().toUpperCase();
          const isRowAction = txt === "ADD" || txt === "CLEAR" || txt === "ADD ROW" || txt === "ADDROWS";
          if (!isRowAction) return false;
        }

        // Verify element visibility
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      });
    };

    const focusNextInput = (currentEl) => {
      const elements = getFocusableElements();
      const index = elements.indexOf(currentEl);
      if (index !== -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    };

    const focusPrevInput = (currentEl) => {
      const elements = getFocusableElements();
      const index = elements.indexOf(currentEl);
      if (index > 0) {
        elements[index - 1].focus();
      }
    };

    const handleDocumentClick = (e) => {
      const activeEl = e.target;
      if (activeEl && activeEl.tagName === "INPUT" && activeEl.type === "date") {
        try {
          activeEl.showPicker();
        } catch (err) {
          // ignore
        }
      }

      const relativeContainers = Array.from(document.querySelectorAll(".relative"));
      relativeContainers.forEach((container) => {
        const dropdown = container.querySelector("div.absolute, div[class*='absolute']");
        if (!dropdown) return;

        const isClickInside = container.contains(activeEl);
        if (isClickInside) {
          dropdown.style.display = "";
        } else {
          dropdown.style.display = "none";
        }
      });
    };

    const handleFocusIn = (e) => {
      activeDropdownIndex = -1;
      
      const activeEl = e.target;
      if (activeEl && activeEl.tagName === "INPUT" && activeEl.type === "date") {
        try {
          activeEl.showPicker();
        } catch (err) {
          // ignore
        }
      } else if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        const val = activeEl.value;
        if (val !== "" && (val === "0" || Number(val) === 0)) {
          try {
            activeEl.select();
          } catch (err) {
            // Some input types might not support select(), ignore
          }
        }
      }
      
      const relativeContainers = Array.from(document.querySelectorAll(".relative"));
      relativeContainers.forEach((container) => {
        const dropdown = container.querySelector("div.absolute, div[class*='absolute']");
        if (!dropdown) return;

        const isFocusInside = container.contains(activeEl);
        if (isFocusInside) {
          dropdown.style.display = "";
        } else {
          dropdown.style.display = "none";
        }
      });
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);
}
