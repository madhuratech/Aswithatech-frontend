/**
 * # Antigravity Layout Stabilization System
 * 
 * This system prevents layout shifts (UI Jumps) when modals are opened or closed.
 * It works by dynamically compensating for the disappearing scrollbar width.
 * 
 * ## Components
 * 
 * 1. **useScrollLock Hook** (`src/hooks/useScrollLock.js`)
 *    - Automatically handles body scroll locking.
 *    - Adds padding-right to `<body>` to maintain layout width.
 *    - Sets `--scrollbar-compensation` CSS variable.
 *    - Supports multiple/nested modals.
 * 
 * 2. **Fixed Elements Integration**
 *    - Fixed elements (like Navbar) must consume the CSS variable to offset themselves.
 *    - Example (Navbar):
 *      ```jsx
 *      <div style={{ paddingRight: 'calc(1.75rem + var(--scrollbar-compensation, 0px))' }}>
 *      ```
 * 
 * ## Usage
 * 
 * In any new Modal component:
 * 
 * 1. Import the hook:
 *    ```javascript
 *    import { useScrollLock } from "../../hooks/useScrollLock";
 *    ```
 * 
 * 2. Call the hook at the top level of the component:
 *    ```javascript
 *    const MyModal = ({ isOpen, onClose }) => {
 *      // Pass 'true' if the component is conditionally rendered
 *      // Pass 'isOpen' if the component is always rendered but hidden
 *      useScrollLock(true); 
 *      
 *      return ( ... );
 *    };
 *    ```
 * 
 * ## Troubleshooting
 * 
 * - **Header Jumping?** Check if the Header/Navbar has the `paddingRight` style using the CSS variable.
 * - **Sidebar Jumping?** Ensure the Sidebar is either in the flow (Grid/Flex) or, if fixed, uses the same CSS variable compensation.
 */
