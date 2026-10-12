import { createSlice } from "@reduxjs/toolkit";

const fileUploadSlice = createSlice({
  name: "fileUpload",
  initialState: {
    isUploading: false,
    uploadProgress: 0,
  },
  reducers: {
    toggleState: (state) => {
      state.isUploading = !state.isUploading;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetUploadState: (state) => {
      state.isUploading = false;
      state.uploadProgress = 0;
    },
  },
});

export const { toggleState, setUploadProgress, resetUploadState } = fileUploadSlice.actions;
export default fileUploadSlice.reducer;
