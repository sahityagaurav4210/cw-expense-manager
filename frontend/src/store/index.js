import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import fileUploadReducer from "../redux/slices/FileUploadSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    fileUpload: fileUploadReducer,
  },
});
