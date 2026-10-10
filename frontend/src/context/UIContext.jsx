import React, { createContext, useContext, useState, useCallback } from "react";
import { Alert, Snackbar } from "@mui/material";

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const showAlert = useCallback((message, severity = "info") => {
    setAlert({ open: true, message, severity });
  }, []);

  const handleClose = useCallback(() => {
    setAlert((prev) => ({ ...prev, open: false }));
  }, []);

  const contextValue = React.useMemo(() => ({ showAlert }), [showAlert]);

  return (
    <UIContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={handleClose} severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    return {
      showAlert: (msg, severity) => console.log(`[Alert - ${severity}]: ${msg}`),
    };
  }
  return context;
};
