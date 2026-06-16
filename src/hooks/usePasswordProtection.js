import { useState, useCallback } from "react";

export const usePasswordProtection = () => {
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);

    const requirePassword = useCallback((actionFn) => {
        setPendingAction(() => actionFn);
        setShowPasswordModal(true);
    }, []);

    const handlePasswordSuccess = useCallback(() => {
        if (pendingAction) {
            pendingAction();
        }
        setPendingAction(null);
        setShowPasswordModal(false);
    }, [pendingAction]);

    const handlePasswordCancel = useCallback(() => {
        setPendingAction(null);
        setShowPasswordModal(false);
    }, []);

    return {
        showPasswordModal,
        requirePassword,
        handlePasswordSuccess,
        handlePasswordCancel,
    };
};
