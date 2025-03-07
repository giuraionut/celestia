'use client'
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TreeContextProps {
  selectedPath: number[];
  setSelectedPath: (path: number[]) => void;
}

const TreeContext = createContext<TreeContextProps | undefined>(undefined);

export const useTreeContext = (): TreeContextProps => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }
  return context;
};

export const TreeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPath, setSelectedPath] = useState<number[]>([]);

  return (
    <TreeContext.Provider value={{ selectedPath, setSelectedPath }}>
      {children}
    </TreeContext.Provider>
  );
};
