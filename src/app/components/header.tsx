import React from 'react';
import { ModeToggle } from './client/ThemeToggle';
import { SearchBox } from './client/SearchBox';
import { Avatar } from '@radix-ui/react-avatar';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Header = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  return (
    <div className='border-b flex items-center sticky top-0 bg-background z-10 h-10 px-2'>
      <div className='flex-[.5] flex justify-start h-10 items-center'>
        <ModeToggle  className='h-8 w-8'/>
      </div>
      <div className='flex-1 flex justify-center items-center border-l border-r h-10'>
        <SearchBox className='h-8' emptyMessage={''} />
      </div>
      <div className='flex-[.5] flex justify-end h-10 items-center'>
        <Avatar className='h-8 w-8'>
          <AvatarImage src={user?.image} alt={user?.name} />
          <AvatarFallback>{user?.name[0]}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

export default Header;
