
import { useDispatch, useSelector } from 'react-redux';
import {clearLoginError, selectActiveTab, selectLoginError, setActiveTab, setLoginError} from "../redux/slices/uiSlice";

export const useUI = () => {
    const dispatch = useDispatch;
    const activeTab = useSelector(selectActiveTab);
    const loginError = useSelector(selectLoginError);

    // Set Active Tab
    const changeActiveTab = (tab) => {
        dispatch(setActiveTab(tab));
    }

    // Set Login Error
    const setError = (error) => {
        dispatch(setLoginError(error));
    }

    // Clear Login Error
    const clearError = () => {
        dispatch(clearLoginError)
    }
  return {
    activeTab,
    loginError,
    changeActiveTab,
    setError,
    clearError
  }
}