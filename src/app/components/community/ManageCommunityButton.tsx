'use client';
import { Button } from '@/components/ui/button';
import React from 'react';
import { toast } from 'sonner';

const ManageCommunityButton = () => {
  return (
    <Button className='cursor-pointer'
      onClick={() => {
        toast.info('Not implemented yet.');
      }}
    >
      Manage
    </Button>
  );
};

export default ManageCommunityButton;
