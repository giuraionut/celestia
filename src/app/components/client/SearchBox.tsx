'use client';
import {
  Command as CommandPrimitive,
  CommandInput as CommandPrimitiveInput,
} from 'cmdk';
import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { Check, SearchIcon } from 'lucide-react';
import {
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export type Option = Record<'value' | 'label', string> & Record<string, string>;

type SearchBoxProps = {
  options: Option[];
  emptyMessage: string;
  value?: Option;
  onValueChange?: (value: Option) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

const FRAMEWORKS = [
  { value: 'next.js', label: 'Next.js' },
  { value: 'sveltekit', label: 'SvelteKit' },
  { value: 'nuxt.js', label: 'Nuxt.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'wordpress', label: 'WordPress' },
  { value: 'express.js', label: 'Express.js' },
  { value: 'nest.js', label: 'Nest.js' },
];

export const SearchBox = ({
  options = FRAMEWORKS,
  placeholder,
  emptyMessage,
  value,
  onValueChange,
  disabled,
  className,
  isLoading = false,
}: SearchBoxProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [selected, setSelected] = useState<Option>(value as Option);
  const [inputValue, setInputValue] = useState<string>(value?.label || '');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (!input) return;

      // Keep the options displayed when the user is typing
      if (!isOpen) setOpen(true);

      if (event.key === 'Enter' && input.value !== '') {
        const optionToSelect = options.find(
          (option) => option.label === input.value
        );
        if (optionToSelect) {
          setSelected(optionToSelect);
          onValueChange?.(optionToSelect);
        }
      }

      if (event.key === 'Escape') {
        input.blur();
      }
    },
    [isOpen, options, onValueChange]
  );

  const handleBlur = useCallback(() => {
    setOpen(false);
    setInputValue(selected?.label);
  }, [selected]);

  const handleSelectOption = useCallback(
    (selectedOption: Option) => {
      setInputValue(selectedOption.label);
      setSelected(selectedOption);
      onValueChange?.(selectedOption);
      // "Next tick" to remove focus from the input
      setTimeout(() => {
        inputRef?.current?.blur();
      }, 0);
    },
    [onValueChange]
  );

  return (
    <CommandPrimitive
      onKeyDown={handleKeyDown}
      className={cn('rounded-md border md:min-w-[450px]', className)}
    >
      {/* Input area */}
      <div
        data-slot='command-input-wrapper'
        className='flex h-full items-center gap-2 px-3'
      >
        <SearchIcon className='w-4 shrink-0 opacity-50' />
        <CommandPrimitiveInput
          ref={inputRef}
          value={inputValue}
          onValueChange={isLoading ? undefined : setInputValue}
          onBlur={handleBlur}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          data-slot='command-input'
          className={cn(
            'placeholder:text-muted-foreground flex w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50'
          )}
        />
      </div>

      {/* Dropdown container */}
      <div className='relative'>
        <div
          className={cn(
            'animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-10 w-full mt-2 rounded-md bg-white outline-none',
            isOpen ? 'block' : 'hidden'
          )}
        >
          <CommandList className='rounded-md ring-1 ring-slate-200'>
            {isLoading ? (
              <CommandPrimitive.Loading>
                <div className='p-2'>Loading...</div>
              </CommandPrimitive.Loading>
            ) : null}
            {options.length > 0 && !isLoading ? (
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected?.value === option.value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                      }}
                      onSelect={() => handleSelectOption(option)}
                      className={cn(
                        'flex w-full items-center gap-2',
                        !isSelected ? 'pl-8' : ''
                      )}
                    >
                      {isSelected ? <Check className='w-4' /> : null}
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}
            {!isLoading ? (
              <CommandPrimitive.Empty className='select-none rounded-sm px-2 py-3 text-center text-sm'>
                {emptyMessage}
              </CommandPrimitive.Empty>
            ) : null}
          </CommandList>
        </div>
      </div>
    </CommandPrimitive>
  );
};
