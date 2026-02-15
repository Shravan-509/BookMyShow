import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom";
import { loginRequest, logout, selectAuth, selectAuthError, selectAuthLoading, selectisAuthenticated, selectUser, signupRequest } from "../redux/slices/authSlice";
import { persistor } from "../redux/store";
export const useAuth = () => {
    const dispatch = useDispatch();
    const Navigate = useNavigate();
    const auth = useSelector(selectAuth);
    const isAuthenticated = useSelector(selectisAuthenticated);
    const user = useSelector(selectUser);
    const loading = useSelector(selectAuthLoading);
    const error = useSelector(selectAuthError);

    //login function
    const login = (credenatials) => {
        dispatch(loginRequest(credenatials));
    }

    //signup function
    const signup = (userData) => {
        dispatch(signupRequest(userData));
    }

    //logout function
    const handlelogout = async () => {
        await persistor.purge(); 
        dispatch(logout());
        Navigate("/", { replace : true });
    }

    return {
        auth,
        isAuthenticated,
        user, 
        loading,
        error,
        login,
        signup,
        logout: handlelogout
    }
    

}
