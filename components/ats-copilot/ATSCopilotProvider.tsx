"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface ATSCopilotContextType {
  isOpen: boolean;
  toggleSidebar: () => void;
  currentContext: {
    page?: string;
    candidateId?: string;
    jobId?: string;
  };
  setCurrentContext: (context: any) => void;
}

const ATSCopilotContext = createContext<ATSCopilotContextType | undefined>(undefined);

export function ATSCopilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const [currentContext, setCurrentContext] = useState({});

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <ATSCopilotContext.Provider
      value={{
        isOpen,
        toggleSidebar,
        currentContext,
        setCurrentContext,
      }}
    >
      {children}
    </ATSCopilotContext.Provider>
  );
}

export function useATSCopilot() {
  const context = useContext(ATSCopilotContext);
  if (context === undefined) {
    throw new Error('useATSCopilot must be used within ATSCopilotProvider');
  }
  return context;
}
