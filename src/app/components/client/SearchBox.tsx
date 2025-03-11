'use client';
import {
  Command as CommandPrimitive,
  CommandInput as CommandPrimitiveInput,
} from 'cmdk';
import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandEmpty,
} from '@/components/ui/command';
import { Check, SearchIcon, X, Loader2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { searchSuggestionPosts } from '@/actions/postActions';
import { findCommunityByName } from '@/actions/communityActions';
import { PostSuggestion } from '@/types/types';
import { ExtendedCommunity } from '@prisma/client';

export type Option = Record<'value' | 'label', string> & Record<string, string>;

type SearchBoxProps = {
  emptyMessage: string;
  onValueChange?: (value: Option) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export const SearchBox = ({
  placeholder = 'Search...',
  emptyMessage = 'No results found',
  onValueChange,
  disabled,
  className,
  isLoading: isLoadingProp = false,
}: SearchBoxProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // State for dropdown open/closed, selected option, and input text
  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option | null>(null);
  const [inputValue, setInputValue] = useState<string>('');

  // Search results state - always use empty arrays, never null
  const [postSuggestions, setPostSuggestions] = useState<PostSuggestion[]>([]);
  const [communitySuggestions, setCommunitySuggestions] = useState<
    ExtendedCommunity[]
  >([]);
  const [isLoading, setIsLoading] = useState(isLoadingProp);
  const [hasSearched, setHasSearched] = useState(false);
  // Safely reset all search-related states
  const resetSearchState = useCallback(() => {
    setPostSuggestions([]);
    setCommunitySuggestions([]);
    setHasSearched(false);
    setOpen(false);
  }, []);

  // Handle value change safely
  const handleValueChange = useCallback(
    (value: string) => {
      setInputValue(value);

      if (value.trim() === '') {
        resetSearchState();
      } else {
        setOpen(true);
      }
    },
    [resetSearchState]
  );

  // Clear search input and suggestions
  const handleClearSearch = useCallback(() => {
    setInputValue('');
    resetSearchState();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [resetSearchState]);

  useEffect(() => {
    console.log('inputvalue:', inputValue);

    // Cancel previous request and reset if input is empty
    if (inputValue.trim() === '') {
      resetSearchState();
      return () => {}; // Return empty cleanup function
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const posts = await searchSuggestionPosts(inputValue, 100, [
          '<span class="text-red-400">',
          '</span>',
        ]);
        console.log('posts', posts);
        const communities = await findCommunityByName(inputValue);
        console.log('communities', communities);

        if (isMounted) {
          setPostSuggestions(Array.isArray(posts) ? posts : []);
          setCommunitySuggestions(
            Array.isArray(communities) ? communities : []
          );
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        if (isMounted) {
          setPostSuggestions([]);
          setCommunitySuggestions([]);
          setHasSearched(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
  }, [inputValue, resetSearchState]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && inputValue.trim() !== '' && !isOpen) {
        router.push(`/search?q=${encodeURIComponent(inputValue)}`);
      }
      if (event.key === 'Escape') {
        inputRef.current?.blur();
        setOpen(false);
      }
    },
    [inputValue, isOpen, router]
  );

  const handleSelectPost = useCallback(
    (postId: string) => {
      if (!postSuggestions?.length) return;

      const selectedSuggestion = postSuggestions.find((s) => s.id === postId);
      if (selectedSuggestion) {
        router.push(
          `/community/${selectedSuggestion.communityName}/post/${selectedSuggestion.id}/comments`
        );
      }
      setOpen(false);
    },
    [postSuggestions, router]
  );

  const handleSelectCommunity = useCallback(
    (communityId: string) => {
      if (!communitySuggestions?.length) return;

      const selectedCommunity = communitySuggestions.find(
        (c) => c.id === communityId
      );
      if (selectedCommunity) {
        router.push(`/community/${selectedCommunity.name}`);
      }
      setOpen(false);
    },
    [communitySuggestions, router]
  );

  const handleSearch = useCallback(() => {
    if (inputValue.trim() === '') return;
    router.push(`/search?q=${encodeURIComponent(inputValue)}`);
    setOpen(false);
  }, [inputValue, router]);

  const hasPosts = Array.isArray(postSuggestions) && postSuggestions.length > 0;
  const hasCommunities =
    Array.isArray(communitySuggestions) && communitySuggestions.length > 0;

  const noResults = hasSearched && !isLoading && !hasPosts && !hasCommunities;

  const shouldShowDropdown = isOpen && inputValue.trim() !== '' && hasSearched;

  console.log('hasPosts', hasPosts);
  console.log('hasCommunities', hasCommunities);
  console.log('noResults', noResults);
  console.log('shouldShowDropdown', shouldShowDropdown);
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <CommandPrimitive
        onKeyDown={handleKeyDown}
        className={cn('rounded-md border md:min-w-[450px] h-full')}
        shouldFilter={false}
      >
        {/* Input area */}
        <div
          data-slot='command-input-wrapper'
          className='relative flex h-full items-center gap-2 px-3'
        >
          <SearchIcon className='w-4 shrink-0 opacity-50' />
          <CommandPrimitiveInput
            ref={inputRef}
            value={inputValue}
            onValueChange={disabled ? undefined : handleValueChange}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
            onFocus={() => setOpen(inputValue.trim() !== '')}
            placeholder={placeholder}
            disabled={disabled}
            data-slot='command-input'
            className='placeholder:text-muted-foreground flex w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50'
          />
          {/* Clear button, positioned inside the input wrapper */}
          {inputValue.trim() !== '' && (
            <button
              type='button'
              onClick={handleClearSearch}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
              aria-label='Clear search'
            >
              <X className='w-4 h-4' />
            </button>
          )}
        </div>

        {/* Dropdown container - only render if should be shown */}
        <div className={cn('relative', { hidden: !shouldShowDropdown })}>
          <div
            className={cn(
              'animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-10 w-full mt-2 rounded-md border bg-background ',
              { hidden: !shouldShowDropdown }
            )}
          >
            <CommandList
              className='
              '
            >
              {isLoading ? (
                <div className='flex justify-center items-center p-4'>
                  <Loader2 className='w-5 h-5 animate-spin text-gray-400' />
                  <span className='ml-2 text-sm text-gray-500'>
                    Searching...
                  </span>
                </div>
              ) : (
                <>
                  {hasCommunities && (
                    <CommandGroup heading='Communities'>
                      {communitySuggestions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.name}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onSelect={() => handleSelectCommunity(option.id)}
                          className={cn(
                            'flex w-full items-center gap-2',
                            selected?.value !== option.id ? 'pl-8' : ''
                          )}
                        >
                          {selected?.value === option.id ? (
                            <Check className='w-4' />
                          ) : null}
                          {option.image && (
                            <img
                              src={option.image}
                              alt={option.name}
                              className='w-6 h-6 rounded-full object-cover'
                            />
                          )}
                          <span>{option.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {hasPosts && (
                    <CommandGroup heading='Posts'>
                      {postSuggestions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.title}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onSelect={() => handleSelectPost(option.id)}
                          className={cn(
                            'flex w-full items-center gap-2',
                            selected?.value !== option.id ? 'pl-8' : ''
                          )}
                        >
                          {selected?.value === option.id ? (
                            <Check className='w-4' />
                          ) : null}
                          <div className='flex flex-col'>
                            <span>{option.title}</span>
                            <span
                              className='text-xs text-muted-foreground'
                              dangerouslySetInnerHTML={{
                                __html: option.snippet || '',
                              }}
                            />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {noResults && (
                    <CommandEmpty className='select-none rounded-sm px-2 py-3 text-center text-sm'>
                      No results found
                    </CommandEmpty>
                  )}
                </>
              )}
            </CommandList>
          </div>
        </div>
      </CommandPrimitive>

      {/* Search button */}
      <button
        type='button'
        disabled={inputValue.trim() === ''}
        onClick={handleSearch}
        className='h-8 px-4 bg-foreground/70 text-background rounded-md hover:bg-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center whitespace-nowrap'
      >
        Search
      </button>
    </div>
  );
};
