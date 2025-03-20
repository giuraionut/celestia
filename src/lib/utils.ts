import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}




export const shortenText = (text: string, amount:number) => {
  if (text.length > amount) {
    return text.slice(0, text.lastIndexOf(' ', amount)) + '...';
  }
  return text;
};


export function getSortParams(sortOption: string): {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
} {
  const sortMapping: {
    [key: string]: { sortBy: string; sortOrder: 'asc' | 'desc' };
  } = {
    newest: { sortBy: 'createdAt', sortOrder: 'desc' },
    oldest: { sortBy: 'createdAt', sortOrder: 'asc' },
    mostVoted: { sortBy: 'voteCount', sortOrder: 'desc' },
    mostCommented: { sortBy: 'totalComments', sortOrder: 'desc' },
  };

  return (
    sortMapping[sortOption as keyof typeof sortMapping] || sortMapping.newest
  );
}