'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Define the available sort options
export type SortOption = {
  label: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
};

// Base sort options available for all content types
const BASE_SORT_OPTIONS: Record<string, SortOption> = {
  newest: { label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  oldest: { label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  mostVoted: { label: 'Most Upvoted', sortBy: 'voteCount', sortOrder: 'desc' },
};

// Extended sort options for posts only
const POST_SORT_OPTIONS: Record<string, SortOption> = {
  ...BASE_SORT_OPTIONS,
  mostCommented: {
    label: 'Most Commented',
    sortBy: 'totalComments',
    sortOrder: 'desc',
  },
};

// Content type options
export type ContentType = 'posts' | 'comments' | 'overview';

// Get appropriate sort options based on content type
export const getSortOptionsForContentType = (
  contentType: ContentType
): Record<string, SortOption> => {
  switch (contentType) {
    case 'posts':
      return POST_SORT_OPTIONS;
    case 'comments':
    case 'overview':
      return BASE_SORT_OPTIONS;
    default:
      return BASE_SORT_OPTIONS;
  }
};

type SortContextType = {
  currentSort: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  setSortOption: (option: string) => void;
  availableSortOptions: Record<string, SortOption>;
  showSortOptions?: boolean; // Optional prop to show/hide sort options
  isSortChanging: boolean;
  contentType: ContentType;
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
export const SortProvider = ({
  children,
  initialSort = 'newest',
  paramName = 'sort',
  contentType = 'posts',
  showSortOptions = true, // Default to true
}: {
  children: ReactNode;
  initialSort?: string;
  paramName?: string;
  contentType?: ContentType;
  showSortOptions?: boolean; // Optional prop to show/hide sort options
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get available sort options based on content type
  const availableSortOptions = getSortOptionsForContentType(contentType);

  // Get initial sort from URL or use the default
  const urlSort = searchParams.get(paramName);

  // Ensure the initial sort is valid for this content type
  const validInitialSort =
    urlSort && availableSortOptions[urlSort]
      ? urlSort
      : initialSort in availableSortOptions
      ? initialSort
      : 'newest';

  const [currentSort, setCurrentSort] = useState(validInitialSort);
  const [isSortChanging, setIsSortChanging] = useState(false);

  // Determine the current sort option
  const sortOption =
    availableSortOptions[currentSort] || availableSortOptions.newest;

  // Change sort option and update URL
  const setSortOption = (option: string) => {
    if (option === currentSort || !availableSortOptions[option]) return; // No change needed or invalid option

    setIsSortChanging(true);
    setCurrentSort(option);

    // Update URL query parameter while preserving other parameters
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, option);

    // Navigate to update the server component
    router.push(`${pathname}?${params.toString()}`);
  };

  // When the URL's sort parameter matches the current sort, stop the loading indicator
  useEffect(() => {
    const currentParamValue = searchParams.get(paramName);
    if (currentParamValue === currentSort) {
      setIsSortChanging(false);
    }
  }, [searchParams, paramName, currentSort]);

  return (
    <SortContext.Provider
      value={{
        currentSort,
        sortBy: sortOption.sortBy,
        sortOrder: sortOption.sortOrder,
        setSortOption,
        availableSortOptions,
        showSortOptions,
        isSortChanging,
        contentType,
      }}
    >
      {children}
    </SortContext.Provider>
  );
};
