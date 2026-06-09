import { useEffect, useRef } from "react";

/**
 * useOutsideClick
 * Closes one or more controlled panels when the user clicks outside all their containers.
 *
 * @param {Array<{ ref: React.RefObject, onClose: Function }>} targets
 *   Each entry maps a container ref to the function that closes it.
 *
 * Usage:
 *   useOutsideClick([
 *     { ref: menuRef,   onClose: () => setMenuOpen(false) },
 *     { ref: searchRef, onClose: () => setSearchOpen(false) },
 *   ]);
 */
export function useOutsideClick(targets) {
  // Keep a mutable ref so the effect never needs to re-register on re-renders.
  const targetsRef = useRef(targets);
  useEffect(() => {
    targetsRef.current = targets;
  });

  useEffect(() => {
    const handler = (e) => {
      targetsRef.current.forEach(({ ref, onClose }) => {
        if (ref.current && !ref.current.contains(e.target)) {
          onClose();
        }
      });
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []); // single listener for the lifetime of the component
}
