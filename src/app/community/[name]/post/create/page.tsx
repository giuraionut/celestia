import { readCommunityByName } from '@/actions/communityActions';
import { CreatePostForm } from '@/app/components/forms/createPostForm';
import {
  HolyGrail,
  Left,
  Middle,
  Right,
} from '@/app/components/presentational/HolyGrail';
import React from 'react';

const CreatePost = async ({ params }: { params: { name: string } }) => {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const community = await readCommunityByName(decodedName);
  if (!community) return <div>Community not found</div>;
  return (
    <HolyGrail>
      <Left />
      <Middle>
        <div>Create Post</div>
        <CreatePostForm community={community} />
      </Middle>
      <Right></Right>
    </HolyGrail>
  );
};

export default CreatePost;
