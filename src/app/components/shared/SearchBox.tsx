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
import {  SearchIcon, X, Loader2 } from 'lucide-react';
import { useState, useRef, useCallback, useEffect, KeyboardEvent, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { searchSuggestionPosts } from '@/actions/postActions';
import { findCommunityByName } from '@/actions/communityActions';
import { PostSuggestion } from '@/types/types';
import { ExtendedCommunity } from '@prisma/client';

export type Option = Record<'value' | 'label', string> & Record<string, string>;

type SearchBoxProps = {
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

export const SearchBox = ({
  placeholder = 'Search...',
  disabled,
  className,
  isLoading: isLoadingProp = false,
}: SearchBoxProps) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  // Add useTransition hook
  const [isPending, startTransition] = useTransition();

  // State for dropdown open/closed, selected option, and input text
  const [isOpen, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [deferredInputValue, setDeferredInputValue] = useState<string>('');

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
      // Immediate update for input field
      setInputValue(value);

      if (value.trim() === '') {
        resetSearchState();
        setDeferredInputValue('');
      } else {
        setOpen(true);
        // Defer the search processing
        startTransition(() => {
          setDeferredInputValue(value);
        });
      }
    },
    [resetSearchState]
  );

  // Clear search input and suggestions
  const handleClearSearch = useCallback(() => {
    setInputValue('');
    setDeferredInputValue('');
    resetSearchState();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [resetSearchState]);

  useEffect(() => {
    // Now using deferredInputValue instead of inputValue for search
    if (deferredInputValue.trim() === '') {
      return () => {};
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      if (!isMounted) return;
      setIsLoading(true);

      try {
        const posts = await searchSuggestionPosts(deferredInputValue, 100, [
          '<span class="text-red-400">',
          '</span>',
        ]);
        const communities = await findCommunityByName(deferredInputValue);

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
  }, [deferredInputValue]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' && inputValue.trim() !== '') {
        // Trigger search on Enter regardless of isOpen
        router.push(`/search?q=${encodeURIComponent(inputValue)}`);
        setOpen(false);
      }
      if (event.key === 'Escape') {
        inputRef.current?.blur();
        setOpen(false);
      }
    },
    [inputValue, router]
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
  // Consider both isPending from useTransition and your existing isLoading state
  const showLoading = isLoading || isPending;
  const shouldShowDropdown = isOpen && inputValue.trim() !== '' && hasSearched;
  
  return (
    <div className={cn('flex space-x-2 w-full justify-center', className)}>
      <CommandPrimitive
        onKeyDown={handleKeyDown}
        className='rounded-lg h-full w-full'
        shouldFilter={false}
      >
        {/* Input area */}
        <div
          data-slot='command-input-wrapper'
          className='relative flex h-full w-full items-center rounded-lg'
        >
          <div className={cn(
                  "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-l-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  "focus-within:border-l-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
                  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                  className
                )}>
            <div className='w-8 shrink-0 h-full flex items-center rounded-l-lg'>
              <SearchIcon className='w-4 text-primary mx-auto' />
            </div>
            <CommandPrimitiveInput
              ref={inputRef}
              value={inputValue}
              onValueChange={disabled ? undefined : handleValueChange}
              onBlur={() => setTimeout(() => setOpen(false), 100)}
              onFocus={() => setOpen(inputValue.trim() !== '')}
              placeholder={placeholder}
              disabled={disabled}
              onKeyDown={handleKeyDown}
              data-slot='command-input'
              className='h-full placeholder:text-muted-foreground flex w-full bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50'
            />
            {/* Clear button or Pending indicator */}
            {inputValue.trim() !== '' && (
              <>
                {isPending ? (
                  <div className="h-full w-8 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin text-primary/50" /> 
                  </div>
                ) : (
                  <button
                    type='button'
                    onClick={handleClearSearch}
                    className='text-primary/50 hover:text-primary h-full cursor-pointer w-8'
                    aria-label='Clear search'
                  >
                    <X className='w-4 h-4 mx-auto' />
                  </button>
                )}
              </>
            )}
          </div>

          <button
            type='button'
            disabled={inputValue.trim() === ''}
            onClick={handleSearch}
            className='w-8 shrink-0 hover:bg-foreground bg-foreground/50 h-full rounded-r-lg cursor-pointer transition-colors'
          >
            <SearchIcon className='w-4 mx-auto text-background' />
          </button>
        </div>

        {/* Dropdown container - only render if should be shown */}
        <div className={cn('relative', { hidden: !shouldShowDropdown })}>
          <div
            className={cn(
              'animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-10 w-full mt-2 rounded-md border bg-background ',
              { hidden: !shouldShowDropdown }
            )}
          >
            <CommandList>
              {showLoading ? (
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
                          className={cn('flex w-full items-center gap-2')}
                        >
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
                          className={cn('flex w-full items-center gap-2')}
                        >
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
    </div>
  );
};