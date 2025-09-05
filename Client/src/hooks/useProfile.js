import { useSelector, useDispatch } from "react-redux"
import {
  selectProfile,
  selectProfileLoading,
  selectProfileError,
  selectProfileUpdateLoading,
  selectProfileUpdateError,
  selectPasswordChangeLoading,
  selectPasswordChangeError,
  selectEmailChangeLoading,
  selectEmailChangeError,
  selectShowEmailVerificationModal,
  selectPendingEmailChange,
  selectSecurityLoading,
  selectSecurityError,
  selectDeleteAccountLoading,
  selectDeleteAccountError,
  fetchProfileRequest,
  updateProfileRequest,
  changePasswordRequest,
  requestEmailChangeRequest,
  verifyEmailChangeRequest,
  toggle2FARequest,
  deleteAccountRequest,
  setShowEmailVerificationModal,
  clearProfileErrors,
  resetProfileState,
  selectShowReauthModal,
  selectReauthMessage,
  hideReauthenticationModal,
} from "../redux/slices/profileSlice"

export const useProfile = () => {
  const dispatch = useDispatch()

  // Selectors
  const profile = useSelector(selectProfile)
  const loading = useSelector(selectProfileLoading)
  const error = useSelector(selectProfileError)
  const profileUpdateLoading = useSelector(selectProfileUpdateLoading)
  const profileUpdateError = useSelector(selectProfileUpdateError)
  const passwordChangeLoading = useSelector(selectPasswordChangeLoading)
  const passwordChangeError = useSelector(selectPasswordChangeError)
  const emailChangeLoading = useSelector(selectEmailChangeLoading)
  const emailChangeError = useSelector(selectEmailChangeError)
  const showEmailVerificationModal = useSelector(selectShowEmailVerificationModal)
  const pendingEmailChange = useSelector(selectPendingEmailChange)
  const securityLoading = useSelector(selectSecurityLoading)
  const securityError = useSelector(selectSecurityError)
  const deleteAccountLoading = useSelector(selectDeleteAccountLoading)
  const deleteAccountError = useSelector(selectDeleteAccountError)
  const showReauthModal = useSelector(selectShowReauthModal)
  const reauthMessage = useSelector(selectReauthMessage)

  // Actions
  const fetchProfile = () => {
    dispatch(fetchProfileRequest())
  }

  const updateProfile = (profileData) => {
    dispatch(updateProfileRequest(profileData))
  }

  const changePassword = (passwordData) => {
    dispatch(changePasswordRequest(passwordData))
  }

  const requestEmailChange = (emailData) => {
    dispatch(requestEmailChangeRequest(emailData))
  }

  const verifyEmailChange = (verificationData) => {
    dispatch(verifyEmailChangeRequest(verificationData))
  }

  const toggle2FA = () => {
    dispatch(toggle2FARequest())
  }

  const deleteAccount = (password) => {
    dispatch(deleteAccountRequest({ password }))
  }

  const setEmailVerificationModal = (show) => {
    dispatch(setShowEmailVerificationModal(show))
  }

    const hideReauthModal = () => {
    dispatch(hideReauthenticationModal())
  }

  const clearErrors = () => {
    dispatch(clearProfileErrors())
  }

  const resetProfile = () => {
    dispatch(resetProfileState())
  }

  return {
    // State
    profile,
    loading,
    error,
    profileUpdateLoading,
    profileUpdateError,
    passwordChangeLoading,
    passwordChangeError,
    emailChangeLoading,
    emailChangeError,
    showEmailVerificationModal,
    pendingEmailChange,
    securityLoading,
    securityError,
    deleteAccountLoading,
    deleteAccountError,
    showReauthModal,
    reauthMessage,

    // Actions
    fetchProfile,
    updateProfile,
    changePassword,
    requestEmailChange,
    verifyEmailChange,
    toggle2FA,
    deleteAccount,
    setEmailVerificationModal,
    hideReauthModal,
    clearErrors,
    resetProfile,
  }
}
