// src/app/settings/loading.tsx

import React from 'react';
import { HolyGrail, Left, Middle, Right } from '../components/shared/HolyGrail'; // Assuming path is correct
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // Assuming path is correct
import { Separator } from '@/components/ui/separator'; // Assuming path is correct
import { Skeleton } from '@/components/ui/skeleton'; // Assuming path is correct

const SettingsLoading = () => {
  return (
    <HolyGrail>
      <Left />
      <Middle>
        {/* Mimic the container and spacing of the actual page */}
        <div className="container mx-auto max-w-3xl py-8 px-4 md:px-2 space-y-8">

          {/* Header Skeleton */}
          <header className="space-y-1">
            <Skeleton className="h-8 w-1/2" /> {/* Title */}
            <Skeleton className="h-4 w-3/4" /> {/* Description */}
          </header>

          {/* Profile Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 mb-1" /> {/* Card Title */}
              <Skeleton className="h-4 w-1/2" /> {/* Card Description */}
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Avatar Section Skeleton */}
              <div className="space-y-3">
                 <Skeleton className="h-4 w-16" /> {/* Sub-heading "Avatar" */}
                 <div className="flex items-center gap-4">
                    <Skeleton className="h-16 w-16 rounded-full" /> {/* Avatar */}
                    <div className="space-y-1 flex-grow">
                        <Skeleton className="h-4 w-3/4" /> {/* Text line 1 */}
                        <Skeleton className="h-3 w-1/2" /> {/* Text line 2 */}
                    </div>
                 </div>
                 <Skeleton className="h-4 w-24 mb-1" /> {/* Input Label */}
                 <Skeleton className="h-10 w-full" /> {/* Input */}
                 <Skeleton className="h-9 w-28 mt-2" /> {/* Button */}
              </div>

              <Separator />

              {/* Username Section Skeleton */}
              <div className="space-y-3">
                 <Skeleton className="h-4 w-20" /> {/* Sub-heading "Username" */}
                 <Skeleton className="h-4 w-24 mb-1" /> {/* Input Label */}
                 <Skeleton className="h-10 w-full" /> {/* Input */}
                 <Skeleton className="h-3 w-3/4 mt-1" /> {/* Help text */}
                 <Skeleton className="h-9 w-32 mt-2" /> {/* Button */}
              </div>
            </CardContent>
          </Card>

          {/* Security Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4 mb-1" /> {/* Card Title */}
              <Skeleton className="h-4 w-1/2" /> {/* Card Description */}
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className="space-y-3">
                   <Skeleton className="h-4 w-20 mb-4" /> {/* Sub-heading "Password" */}
                   {/* Skeleton for 2 or 3 password fields + button */}
                   <Skeleton className="h-4 w-32 mb-1" /> {/* Label */}
                   <Skeleton className="h-10 w-full mb-2" /> {/* Input */}
                   <Skeleton className="h-4 w-32 mb-1" /> {/* Label */}
                   <Skeleton className="h-10 w-full mb-2" /> {/* Input */}
                   <Skeleton className="h-4 w-36 mb-1" /> {/* Label (Optional 3rd) */}
                   <Skeleton className="h-10 w-full mb-2" /> {/* Input (Optional 3rd) */}
                   <Skeleton className="h-9 w-36 mt-2" /> {/* Button */}
                </div>
            </CardContent>
          </Card>

          {/* Connected Accounts Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3 mb-1" /> {/* Card Title */}
              <Skeleton className="h-4 w-2/3" /> {/* Card Description */}
            </CardHeader>
            <CardContent>
              {/* Mimic the list structure */}
              <ul className='space-y-4'>
                 {/* Show 2-3 placeholder list items */}
                 {[...Array(3)].map((_, i) => (
                     <li key={i} className='flex items-center justify-between gap-3 p-3 border rounded-md'>
                         <div className="flex items-center gap-3">
                             <Skeleton className='h-6 w-6 rounded-sm' /> {/* Icon */}
                             <div className="space-y-1">
                                 <Skeleton className='h-4 w-24' /> {/* Provider Name */}
                                 <Skeleton className='h-3 w-32' /> {/* Connection Date */}
                             </div>
                         </div>
                         {/* Optional: Skeleton for a button */}
                         {/* <Skeleton className="h-8 w-20" /> */}
                     </li>
                 ))}
              </ul>
            </CardContent>
          </Card>

        </div>
      </Middle>
      <Right />
    </HolyGrail>
  );
}

export default SettingsLoading;