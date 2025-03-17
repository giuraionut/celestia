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
