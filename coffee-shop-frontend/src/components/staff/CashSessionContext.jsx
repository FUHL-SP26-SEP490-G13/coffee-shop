import React, { createContext, useContext, useState, useEffect } from "react";
import cashSessionService from "@/services/cashSessionService";
import socket from "@/lib/socket";
import { OpenShiftModal } from "./OpenShiftModal";
import { CloseShiftModal } from "./CloseShiftModal";
import { ShiftHandoverModal } from "./ShiftHandoverModal";

const CashSessionContext = createContext();

export const useCashSession = () => useContext(CashSessionContext);

export const CashSessionProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);

  const fetchCurrentSession = async () => {
    try {
      setLoading(true);
      const res = await cashSessionService.getCurrent();
      if (res?.success && res.data) {
        setSession(res.data);
      } else {
        setSession(null);
      }
    } catch (error) {
      setSession(null);
      // console.error("Fetch session failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSession();

    const handleUpdate = () => {
      fetchCurrentSession();
    };

    socket.on("cash-session:updated", handleUpdate);
    
    return () => {
      socket.off("cash-session:updated", handleUpdate);
    };
  }, []);

  return (
    <CashSessionContext.Provider
      value={{
        session,
        loading,
        refreshSession: fetchCurrentSession,
        openShift: () => setIsOpenShiftModalOpen(true),
        closeShift: () => setIsCloseShiftModalOpen(true),
        showHandover: () => setIsHandoverModalOpen(true),
      }}
    >
      {children}
      
      {/* Modals */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onSuccess={fetchCurrentSession}
      />
      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        session={session}
        onSuccess={fetchCurrentSession}
      />
      <ShiftHandoverModal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
      />
    </CashSessionContext.Provider>
  );
};
