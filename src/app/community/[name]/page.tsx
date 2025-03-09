import { readCommunityByName } from '@/actions/communityActions';
import React from 'react';
import Image from 'next/image';

const CommunityPage = async ({ params }: { params: { name: string } }) => {
  const { name } = await params;
  const community = await readCommunityByName(name);
  if (!community) return <div>Loading...</div>;
  return (
    <div className='flex h-full w-full  md:flex-row flex-col'>
      <div className='md:flex-[.5] hidden md:flex'>
        <div className='sticky top-0 w-full p-4 '>Column 1</div>
      </div>

      <div className='flex-1 flex border-l border-r'>
        <div className='m-4 border rounded-lg flex flex-col gap-4 w-full'>
          <div className='relative flex gap-4 overflow-hidden items-center rounded-t-lg p-4'>
            <Image
              src={community.image}
              className='w-20 h-20 rounded-full'
              alt={community.name}
              width={200}
              height={200}
            />
            <div>
              <div>
                <div className='text-4xl font-bold'>{community.name}</div>
                Created by {community.author?.name} on{' '}
                {new Date(community.createdAt).toDateString()}
              </div>
            </div>
            <div className='absolute inset-0 bg-accent -z-10'></div>
          </div>
          <div className='pb-4 px-4'>
            <div>
             {community.description}
            </div>
          </div>
        </div>
      </div>
      <div className='md:flex-[.5] hidden md:flex'>
        <div className='sticky top-0 w-full p-4 '>Column 1</div>
      </div>
    </div>
  );
};

export default CommunityPage;
