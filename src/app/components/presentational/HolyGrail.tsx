import React, { PropsWithChildren } from 'react';
import { AppSidebar } from '../client/AppSidebar';

const HolyGrail = ({ children }: PropsWithChildren) => {
  return (
    <div className='flex flex-col md:flex-row min-h-full w-full'>
      {children}
    </div>
  );
};

const Left = ({ children }: PropsWithChildren) => {
  return <aside className='hidden md:flex md:flex-[0.5]'>
    <AppSidebar/>
    {children}
  </aside>;
};
const Middle = ({ children }: PropsWithChildren) => {
  return (
    <main className='flex flex-col w-full flex-1 border-l border-r h-full'>
      {children}
    </main>
  );
};
const Right = ({ children }: PropsWithChildren) => {
  return <aside className='hidden md:flex md:flex-[0.5]'>{children}</aside>;
};
export { HolyGrail, Left, Middle, Right };
