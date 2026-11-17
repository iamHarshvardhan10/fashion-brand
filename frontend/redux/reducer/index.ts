import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/redux/slices/authSlice";

// Add new slices here
const rootReducer = combineReducers({
    auth: authReducer,
});

export default rootReducer;
