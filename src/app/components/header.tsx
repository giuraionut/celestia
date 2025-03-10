import React from 'react';
import { ModeToggle } from './client/ThemeToggle';
import { SearchBox } from './client/SearchBox';

const Header = () => {
  return (
    <div className='border-b flex items-center sticky top-0 bg-background z-10 h-10 '>
      <div className='flex-[.5] flex justify-start h-10'>
        <ModeToggle />
        Left
      </div>
      <div className='flex-1 flex justify-center items-center border-l border-r h-10'>
        <SearchBox className='h-8' emptyMessage={''} />
      </div>
      <div className='flex-[.5] flex justify-end h-10'>Right</div>
    </div>
  );
};

export default Header;
