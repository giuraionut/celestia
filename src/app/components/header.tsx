import React from 'react';
import { SearchBox } from './client/SearchBox';
import { Avatar } from '@radix-ui/react-avatar';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './client/ThemeToggle';
import { SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';

const Header = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  return (
    <div className='border-b flex items-center sticky top-0 bg-sidebar z-20 h-10'>
      <div className='flex-[.5] flex justify-start h-10 items-center gap-2'>
        <Link href='/' className='ml-2'>Logo</Link>
        <ThemeToggle className='h-8 w-8' />
        <SidebarTrigger className='h-8 w-8'/>
      </div>
      <div className='flex-1 flex justify-center items-center border-l border-r h-10'>
        <SearchBox className='h-8 px-4 max-w-[600px]' emptyMessage={''} />
      </div>
      <div className='flex-[.5] flex justify-end h-10 items-center'>
        <Avatar className='h-8 w-8 mr-2'>
          <AvatarImage
            className='rounded-full'
            src={user?.image}
            alt={user?.name}
          />
          <AvatarFallback>{user?.name[0]}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default Header;
