import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
      if (!action.payload) return;

      if (action.payload.user) {
        state.user = { ...state.user, ...action.payload.user };
      } else if (!action.payload.accessToken && !action.payload.token) {
        // Direct user payload, e.g. from updateProfile
        state.user = { ...state.user, ...action.payload };
      }

      if (action.payload.accessToken) {
        state.accessToken = action.payload.accessToken;
      } else if (action.payload.token) {
        state.accessToken = action.payload.token;
      }

      state.isAuthenticated = true;
      state.isInitialized = true;
    },
    setToken: (state, action) => {
      state.accessToken = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload !== undefined ? action.payload : true;
    },
  },
});

export const { setAuth, setToken, clearAuth, setInitialized } = authSlice.actions;
export default authSlice.reducer;
