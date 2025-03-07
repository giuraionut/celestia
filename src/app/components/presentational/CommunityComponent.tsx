import { Community } from '@prisma/client';
import React from 'react';

const CommunityComponent = ({ community }: { community: Community }) => {
  return (
    <div className='flex gap-4 items-center border'>
      <img src={community.image} className='w-10 h-10 rounded-full' />

      <div>{community.name}</div>
    </div>
  );
};

export default CommunityComponent;
