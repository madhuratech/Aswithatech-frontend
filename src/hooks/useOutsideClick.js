import { useEffect, useRef } from "react";

export function useOutsideClick(targets, eventType = "mousedown") {
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
    document.addEventListener(eventType, handler);
    return () => document.removeEventListener(eventType, handler);
  }, [eventType]);
}
