import { useDispatch, useSelector } from "react-redux";
import {
    resendCodeRequest,
    resetVerificationState,
    reverifyAccountRequest,
    selectCountdown,
    selectResendDisabled,
    selectShowEmailVerificationModal, 
    selectShowReverifyAccountModal, 
    selectShowTwoFactorAuthModal, 
    selectTempUserId, 
    selectVerification, 
    selectVerificationEmail,
    selectVerificationError,
    selectVerificationLoading,
    setShowEmailVerificationModal,
    setShowReverifyAccountModal,
    setShowTwoFactorAuthModal,
    verifyEmailRequest,
    verifyTwoFactorRequest
} from "../redux/slices/verification"
import {clearLoginError} from "../redux/slices/uiSlice"

export const useVerification = () => {
    const dispatch = useDispatch();
    const verification = useSelector(selectVerification);
    const verificationEmail = useSelector(selectVerificationEmail);
    const tempUserId = useSelector(selectTempUserId);
    const showEmailVerificationModal = useSelector(selectShowEmailVerificationModal);
    const showTwoFactorAuthModal = useSelector(selectShowTwoFactorAuthModal);
    const showReverifyAccountModal = useSelector(selectShowReverifyAccountModal);
    const resendDisabled = useSelector(selectResendDisabled);
    const countdown = useSelector(selectCountdown);
    const loading = useSelector(selectVerificationLoading);
    const error = useSelector(selectVerificationError);

    // Verify Email
    const verifyEmail = (code) => {
        dispatch(verifyEmailRequest({ code }));
    }

    // Verify two-factor authentication
     const verifyTwoFactor = (code) => {
        dispatch(verifyTwoFactorRequest({ code }));
    }
    
     // Request reverification 
     const requestReverification = (email) => {
        dispatch(reverifyAccountRequest({ email }));
    }

    // Resend verification code
     const resendVerificationCode = (type) => {
        dispatch(resendCodeRequest({ type }));
    }

    // Toggle Modals
    const toggleEmailVerification = (show) => {
        dispatch(setShowEmailVerificationModal(show));
    }

    const toggleTwoFactorAuth = (show) => {
        dispatch(setShowTwoFactorAuthModal(show));
    }

    const toggleReverifyAccount = (show) => {
        dispatch(setShowReverifyAccountModal(show));
        if(show === false)
        {
            dispatch(clearLoginError());
        }
    }

    //Reset Verification State
    const resetVerification = () => {
        dispatch(resetVerificationState())
    }
   
  return {
    verification,
    verificationEmail,
    tempUserId,
    showEmailVerificationModal,
    showTwoFactorAuthModal,
    showReverifyAccountModal,
    resendDisabled,
    countdown,
    loading,
    error,
    verifyEmail,
    verifyTwoFactor,
    requestReverification,
    resendVerificationCode,
    toggleEmailVerification,
    toggleTwoFactorAuth,
    toggleReverifyAccount,
    resetVerification
  }
}
