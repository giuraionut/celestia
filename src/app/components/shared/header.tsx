import React from 'react';
import { Avatar } from '@radix-ui/react-avatar';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
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
import { SearchBox } from './SearchBox';
import SignOutButton from './SignOutButton';
import { ThemeToggle } from './ThemeToggle';

const Header = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  return (
    <div className='border-b flex items-center sticky top-0 bg-sidebar z-20 h-10'>
      <div className='flex-[.5] flex justify-start h-10 items-center gap-2'>
        <Link href='/' className='ml-2'>
          Logo
        </Link>
        <ThemeToggle className='h-8 w-8' />
        <SidebarTrigger className='h-8 w-8' />
      </div>
      <div className='flex-1 flex justify-center items-center border-l border-r h-10'>
        <SearchBox className='h-8 px-4 max-w-[600px]' emptyMessage={''} />
      </div>
      <div className='flex-[.5] flex justify-end h-10 items-center'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className='h-8 w-8 mr-2 cursor-pointer'>
              <AvatarImage
                className='rounded-full'
                src={user?.image}
                alt={user?.name}
              />
              <AvatarFallback>{user?.name[0]}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='w-56'>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link href={`/user/${user?.name}`}>Profile</Link>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
             
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
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
      </div>
    </div>
  );
};

export default Header;
