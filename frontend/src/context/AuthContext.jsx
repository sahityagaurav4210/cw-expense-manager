import React, { createContext, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setAuth, clearAuth } from "../store/authSlice";
import { getMeApi } from "../services/user.service";
import { logoutUserApi } from "../services/auth.service";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext({
  user: null,
  token: null,
  refreshToken: async () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, accessToken: token } = useSelector((state) => state.auth);

  const refreshToken = useCallback(async () => {
    try {
      const res = await getMeApi();
      if (res.status === "success" && res.data) {
        dispatch(
          setAuth({
            user: res.data.user,
            accessToken: res.data.accessToken,
          })
        );
        return res.data;
      }
      throw new Error(res.message || "Failed to refresh token");
    } catch (err) {
      dispatch(clearAuth());
      throw err;
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try {
      await logoutUserApi().catch(() => {});
    } finally {
      dispatch(clearAuth());
      navigate("/login");
    }
  }, [dispatch, navigate]);

  const value = {
    user,
    token,
    refreshToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
