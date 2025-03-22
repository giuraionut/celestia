import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';

import { SearchBox } from './SearchBox';
import { PlusCircleIcon } from 'lucide-react';
import UserProfileDropdown from './UserProfileDropdown';
import CreatePostButton from '../post/CreatePostButton';
import CreateCommunityButton from '../post/CreateCommunityButton';

const Header = async () => {
  return (
    <div className='border-b flex items-center sticky top-0 bg-sidebar z-20 h-10'>
      <div className='flex-[.5] justify-start h-10 items-center gap-2 hidden sm:flex'>
        <Link href='/' className='ml-2'>
          Logo
        </Link>
        <SidebarTrigger className='h-8 w-8' />
      </div>
      <div className='flex-1 flex justify-center items-center border-l border-r h-10'>
        <Link href='/' className='ml-2 sm:hidden'>
          Logo
        </Link>
        <SidebarTrigger className='h-8 w-8 sm:hidden' />
        <SearchBox className='h-8 px-4 max-w-[600px]' />
      </div>
      <div className='flex-[.5] justify-end h-10 items-center gap-2 hidden sm:flex'>
        <CreatePostButton />
        <CreateCommunityButton />
        <UserProfileDropdown />
      </div>
    </div>
  );
};

export default Header;
