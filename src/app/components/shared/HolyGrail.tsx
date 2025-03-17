import React, { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';
import { AppSidebar } from './AppSidebar';

const HolyGrail = ({
  className,
  children,
}: { className?: string } & PropsWithChildren) => {
  return (
    <div
      className={cn('flex flex-col md:flex-row min-h-full w-full', className)}
    >
      {children}
    </div>
  );
};

const Left = ({ children }: PropsWithChildren) => {
  return (
    <aside className='hidden lg:flex lg:flex-[0.5] md:border-r'>
      <AppSidebar />
      {children}
    </aside>
  );
};
const Middle = ({ children }: PropsWithChildren) => {
  return (
    <main className='md:px-0 p-4 flex flex-col w-full h-full flex-1 items-center'>
      {children}
    </main>
  );
};
const Right = ({ children }: PropsWithChildren) => {
  return (
    <aside className='hidden lg:flex lg:flex-[0.5] md:border-l'>
      {children}
    </aside>
  );
};
export { HolyGrail, Left, Middle, Right };
