'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSortContext } from './PostSortingContext';

export function SortingControls() {
  const { currentSort, setSortOption, availableSortOptions } = useSortContext();

  return (
    <div className='flex justify-between items-center mb-4 gap-4'>
      <h1 className='text-xl font-bold'>Posts</h1>
      <Select value={currentSort} onValueChange={setSortOption}>
        <SelectTrigger className='w-[180px]'>
          <SelectValue placeholder='Sort by' />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(availableSortOptions).map(([key, option]) => (
            <SelectItem key={key} value={key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
