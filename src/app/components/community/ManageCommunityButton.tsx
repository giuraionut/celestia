'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';

const ManageCommunityButton = ({communityName}:{communityName:string}) => {
  return (
    <Button asChild className='cursor-pointer'>
      <Link href={`/community/${communityName}/posts/manage`}> Manage</Link>
    </Button>
  );
};

export default ManageCommunityButton;
