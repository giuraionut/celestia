'use client';
import { usePathname } from 'next/navigation';
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { z } from 'zod';
interface TreeContextProps {
  selectedPath: number[];
  setSelectedPath: (path: number[]) => void;
  lastPathSegment: string;
  shouldExpand: boolean;
  replaceCuid: (cuid: string) => string;
}

const TreeContext = createContext<TreeContextProps | undefined>(undefined);

export const useTreeContext = (): TreeContextProps => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error('useTreeContext must be used within a TreeProvider');
  }
  return context;
};

export const CommentTreeProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPath, setSelectedPath] = useState<number[]>([]);
  const currentPath = usePathname();
  const pathSegments = currentPath.split('/').filter(Boolean);

  const cuidSchema = z.string().cuid();

  const lastPathSegment = pathSegments[pathSegments.length - 1];

  const shouldExpand = cuidSchema.safeParse(lastPathSegment).success;
  const replaceCuid = useMemo(() => (cuid: string) => {
    if (pathSegments.length > 0) {
      const newPathSegments = [...pathSegments];
      const lastSegment = newPathSegments[newPathSegments.length - 1];
      if (lastSegment === 'comments') {
        // Append the new CUID if the URL ends with "comments"
        newPathSegments.push(cuid);
      } else {
        // Replace the last segment (assumed to be a CUID) with the new CUID
        newPathSegments[newPathSegments.length - 1] = cuid;
      }
      return '/' + newPathSegments.join('/');
    }
    return '/' + cuid;
  }, [pathSegments]);
  return (
    <TreeContext.Provider
      value={{ selectedPath, setSelectedPath, lastPathSegment, shouldExpand, replaceCuid }}
    >
      {children}
    </TreeContext.Provider>
  );
};
