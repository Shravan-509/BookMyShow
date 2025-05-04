import {combineReducers} from "redux";
import loaderReducer from '../slices/loaderSlice';
import authReducer from '../slices/authSlice';

const rootReducer = combineReducers({
   loader: loaderReducer,
    auth : authReducer
});

export default rootReducer;