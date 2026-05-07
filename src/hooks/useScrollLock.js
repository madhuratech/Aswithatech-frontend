import { useLayoutEffect } from 'react';

// Global state to track lock count across multiple components
let lockCount = 0;
let originalStyle = '';
let originalPaddingRight = '';


export const useScrollLock = (isOpen) => {
    useLayoutEffect(() => {
        if (!isOpen) return;

        lockCount++;

        if (lockCount === 1) {
            
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

            originalStyle = window.getComputedStyle(document.body).overflow;
            originalPaddingRight = document.body.style.paddingRight;

            document.body.style.overflow = 'hidden';

           
            if (scrollBarWidth > 0) {
                document.body.style.paddingRight = `${scrollBarWidth}px`;

                // 5. Set CSS variable for fixed elements (Header/Navbar)
                document.body.style.setProperty('--scrollbar-compensation', `${scrollBarWidth}px`);
            }
        }

        // Cleanup function
        return () => {
            lockCount--;
            if (lockCount === 0) {
                document.body.style.overflow = originalStyle;
                document.body.style.paddingRight = originalPaddingRight;
                document.body.style.removeProperty('--scrollbar-compensation');
            }
        };
    }, [isOpen]);
};
