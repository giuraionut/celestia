'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Define the available sort options
export type SortOption = {
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

export const SORT_OPTIONS: Record<string, SortOption> = {
  newest: { label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  mostVoted: { label: 'Most Upvoted', sortBy: 'voteCount', sortOrder: 'desc' },
  mostCommented: { label: 'Most Commented', sortBy: 'totalComments', sortOrder: 'desc' },
};

type SortContextType = {
  currentSort: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortOption: (option: string) => void;
  availableSortOptions: typeof SORT_OPTIONS;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

// Create the context
const SortContext = createContext<SortContextType | undefined>(undefined);

export const useSortContext = () => {
  const context = useContext(SortContext);
  if (!context) {
    throw new Error('useSortContext must be used within a SortProvider');
  }
  return context;
};

// Provider component
export const SortProvider = ({ children, initialSort = 'newest' }: { children: ReactNode; initialSort?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial sort from URL or use the default
  const urlSort = searchParams.get('sort');
  const [currentSort, setCurrentSort] = useState(urlSort || initialSort);
  const [isLoading, setIsLoading] = useState(false);

  // Determine the current sort option
  const sortOption = SORT_OPTIONS[currentSort] || SORT_OPTIONS.newest;

  // Change sort option and update URL
  const setSortOption = (option: string) => {
    if (option === currentSort) return; // No change needed

    setIsLoading(true);
    setCurrentSort(option);

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', option);

    // Navigate to update the server component
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <SortContext.Provider
      value={{
        currentSort,
        sortBy: sortOption.sortBy,
        sortOrder: sortOption.sortOrder,
        setSortOption,
        availableSortOptions: SORT_OPTIONS,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </SortContext.Provider>
  );
};
