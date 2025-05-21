import {combineReducers} from "redux";
import loaderReducer from '../slices/loaderSlice';
import authReducer from '../slices/authSlice';
import userReducer from "../slices/userSlice";
import theatreReducer from "../slices/theatreSlice";
import movieReducer from "../slices/movieSlice";
import showReducer from "../slices/showSlice";
import uiReducer from "../slices/uiSlice";
import verificationReducer from "../slices/verificationSlice"

const rootReducer = combineReducers({
   loader: loaderReducer,
    auth : authReducer,
    user: userReducer,
    theatre: theatreReducer,
    movie: movieReducer,
    show: showReducer,
    ui: uiReducer,
    verification: verificationReducer
});

export default rootReducer;