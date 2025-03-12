import {
  isUserMemberOfCommunity,
  readCommunityByName,
} from '@/actions/communityActions';
import React from 'react';
import Image from 'next/image';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/presentational/HolyGrail';
import JoinCommunityButton from '@/app/components/client/JoinCommunityButton';

const CommunityPage = async ({ params }: { params: { name: string } }) => {
  const { name } = await params;
  const community = await readCommunityByName(name);
  const isMemberOfCommunity =
    (community && (await isUserMemberOfCommunity(community.id))) || false;
  if (!community) return <div>Loading...</div>;
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div className='m-4 border rounded-lg flex flex-col gap-4 h-48'>
          <div className='relative flex gap-4 rounded-t-lg p-4 w-full'>
            <Image
              src={community.image}
              className='w-20 h-20 rounded-full object-cover'
              alt={community.name}
              width={200}
              height={200}
            />
            <div className='w-full flex flex-col'>
              <div className='text-4xl font-bold'>{community.name}</div>
              <div className='flex items-center justify-between w-full'>
                <div>
                  Created by {community.author?.name} on{' '}
                  {new Date(community.createdAt).toDateString()}
                </div>
                <JoinCommunityButton
                  communityId={community.id}
                  isMemberOfCommunity={isMemberOfCommunity}
                />
              </div>
            </div>
            <div className='absolute inset-0 bg-accent -z-10'></div>
          </div>
          <div className='pb-4 px-4'>
            <div>{community.description}</div>
          </div>
        </div>
      </Middle>
      <Right>
        <div className='sticky top-0 w-full p-4 '>Column 1</div>
      </Right>
    </HolyGrail>
  );
};

export default CommunityPage;
