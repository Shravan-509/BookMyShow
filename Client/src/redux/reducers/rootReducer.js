import {combineReducers} from "redux";
import loaderReducer from '../slices/loaderSlice';
import authReducer, { logout } from '../slices/authSlice';
import userReducer from "../slices/userSlice";
import theatreReducer from "../slices/theatreSlice";
import movieReducer from "../slices/movieSlice";
import showReducer from "../slices/showSlice";
import uiReducer from "../slices/uiSlice";
import verificationReducer from "../slices/verificationSlice"
import forgotPasswordReducer from "../slices/forgotPasswordSlice"
import profileReducer from "../slices/profileSlice"

const appReducer = combineReducers({
   loader: loaderReducer,
    auth : authReducer,
    user: userReducer,
    theatre: theatreReducer,
    movie: movieReducer,
    show: showReducer,
    ui: uiReducer,
    verification: verificationReducer,
    forgotPassword : forgotPasswordReducer,
    profile: profileReducer
});

const rootReducer = (state, action) => {
    if (action.type === logout.type) {
        state = undefined; // Reset all state slices
    }
    return appReducer(state, action);
};


export default rootReducer;