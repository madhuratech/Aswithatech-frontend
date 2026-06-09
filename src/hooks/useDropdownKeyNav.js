import { useState, useCallback, useEffect, useRef } from "react";

/**
 * useDropdownKeyNav
 * Manages keyboard navigation for any custom dropdown/autocomplete list.
 *
 * Keyboard contract:
 *   ArrowDown  – highlight next item (opens dropdown when closed)
 *   ArrowUp    – highlight previous item
 *   Enter      – select highlighted item; calls e.preventDefault() + e.stopPropagation()
 *                so the global Enter field-navigation is suppressed on selection.
 *                When no item is highlighted, Enter falls through to the global handler
 *                and moves focus to the next form field as expected.
 *   Escape     – close dropdown
 *
 * @param {{ items, isOpen, onSelect, onClose, onOpen }} options
 *   items    – current visible list (filtered or static)
 *   isOpen   – controlled visibility state
 *   onSelect – called with items[highlightedIndex] when Enter is pressed on a highlighted row
 *   onClose  – called on Escape
 *   onOpen   – (optional) called when ArrowDown is pressed while the dropdown is closed
 *
 * @returns {{ highlightedIndex: number, handleKeyDown: Function }}
 *   Spread handleKeyDown onto the input or trigger element.
 *   Use highlightedIndex to apply an active class to list items.
 *
 * Example:
 *   const nav = useDropdownKeyNav({ items: filtered, isOpen, onSelect, onClose, onOpen });
 *   <input onKeyDown={nav.handleKeyDown} />
 *   {items.map((item, i) => (
 *     <div className={i === nav.highlightedIndex ? "bg-blue-100" : "hover:bg-blue-50"}>
 *       {item.label}
 *     </div>
 *   ))}
 */
export function useDropdownKeyNav({ items = [], isOpen, onSelect, onClose, onOpen }) {
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Mutable ref bundle so handleKeyDown stays stable (empty dep array).
  const r = useRef({ items, isOpen, onSelect, onClose, onOpen, highlightedIndex });
  useEffect(() => {
    r.current = { items, isOpen, onSelect, onClose, onOpen, highlightedIndex };
  });

  // Reset highlight whenever the dropdown closes.
  useEffect(() => {
    if (!isOpen) setHighlightedIndex(-1);
  }, [isOpen]);

  const handleKeyDown = useCallback((e) => {
    const { isOpen, items, onSelect, onClose, onOpen, highlightedIndex } = r.current;

    if (!isOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        onOpen?.();
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, items.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;

      case "Enter":
        if (highlightedIndex >= 0 && items[highlightedIndex] !== undefined) {
          e.preventDefault();
          // Stop propagation so the global KeyboardNavProvider doesn't also
          // move focus to the next form field on this same keypress.
          e.stopPropagation();
          onSelect(items[highlightedIndex]);
        }
        // When no item is highlighted, Enter falls through to the global handler.
        break;

      case "Escape":
        e.preventDefault();
        onClose();
        break;

      default:
        break;
    }
  }, []); // stable — reads live state from r.current

  return { highlightedIndex, handleKeyDown };
}
