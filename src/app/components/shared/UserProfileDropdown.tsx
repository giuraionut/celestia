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
import SignOutButton from './SignOutButton';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';

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
      <Button variant={'default'} asChild className='h-6'>
        <Link href={'/api/auth/signin'} className='mr-2'>
          Login
        </Link>
      </Button>
    );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className={cn('flex items-center justify-between', className)}>
          <Avatar className={cn('cursor-pointer')}>
            <AvatarImage
              className='rounded-full '
              src={user.image}
              alt={user.name}
            />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          {position === 'sidebar' && user.name}
          {position === 'sidebar' && <ChevronsUpDown className='w-4 h-4' />}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' side={side}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Link href={`/user/${user.name}`}>Profile</Link>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>

          <DropdownMenuItem>
            Settings
            <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            Theme <ThemeToggle />
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Email</DropdownMenuItem>
                <DropdownMenuItem>Message</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>More...</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>API</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SignOutButton variant='ghost' className='font-normal p-0 m-0' />
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserProfileDropdown;
