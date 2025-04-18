import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';

import { SearchBox } from './SearchBox';
import UserProfileDropdown from './UserProfileDropdown';
import CreatePostButton from '../post/CreatePostButton';
import CreateCommunityButton from '../post/CreateCommunityButton';
import Logo from '../svgs/Logo';
import Celestia from '../svgs/Celestia';
import AppVersion from './AppVersion';
const Header = async () => {
  return (
    <div className='border-b flex items-center sticky top-0 bg-sidebar z-20 h-15'>
      <div className='flex-[.5] justify-start h-10 items-center gap-2 hidden sm:flex'>
        <Link href='/' className='ml-2 flex items-center gap-2'>
          <Logo className='h-8 w-8' />
          <Celestia className='h-9 w-24' />
        </Link>
        <SidebarTrigger className='h-8 w-8' />
        <AppVersion />

      </div>
      <div className='flex-1 flex justify-center items-center border-l border-r h-15'>
        <Link href='/' className='ml-2 sm:hidden'>
          Logo
        </Link>
        <SidebarTrigger className='h-8 w-8 sm:hidden' />
        <SearchBox className='h-8 px-4 max-w-[600px]' />
      </div>
      <div className='flex-[.5] justify-end h-10 items-center gap-2 hidden sm:flex'>
        <CreatePostButton />
        <CreateCommunityButton />
        <UserProfileDropdown className='mr-2' />
      </div>
    </div>
  );
};

export default Header;
