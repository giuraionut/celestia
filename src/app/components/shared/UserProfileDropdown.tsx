import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { ChevronsUpDown } from 'lucide-react';
import React from 'react';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import SignOutButton from './SignOutButton';

const UserProfileDropdown = async ({
  side = 'bottom',
  className,
  position = 'header',
}: {
  side?: 'left' | 'right' | 'bottom' | 'top';
  className?: string;
  position?: 'header' | 'sidebar';
}) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  if (!user)
    return (
      <Button variant={'default'} asChild className='h-8'>
        <Link href={'/api/auth/signin'} className='mr-2'>
          Login
        </Link>
      </Button>
    );

  return (
    <DropdownMenu>
      {/* Keep your DropdownMenuTrigger as before or use the improved Button version */}
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className={cn(
            'flex items-center justify-between p-1 h-auto rounded-full',
            className
          )}
        >
          <Avatar className={cn('cursor-pointer h-8 w-8')}>
            <AvatarImage
              className='rounded-full'
              src={user.image ?? undefined}
              alt={user.name ?? 'User avatar'}
            />
            <AvatarFallback>{user.name ? user.name[0] : '?'}</AvatarFallback>
          </Avatar>
          {position === 'sidebar' && user.name && (
            <span className='ml-2'>{user.name}</span>
          )}
          {position === 'sidebar' && (
            <ChevronsUpDown className='ml-1 w-4 h-4 text-muted-foreground' />
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-56' side={side} align='end'>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href={`/user/${user.name}`}>
              Profile
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className='cursor-pointer'>
            <Link href='/settings'>
              Settings
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='cursor-pointer'>
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <ThemeToggle dropdown={false} />
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className='text-destructive focus:text-destructive cursor-pointer'
        >
          <SignOutButton className='hover:bg-accent flex justify-between'>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </SignOutButton>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
