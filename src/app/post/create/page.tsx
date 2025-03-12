import React from 'react';
import { readCommunities } from '@/actions/communityActions';
import { Community } from '@prisma/client';
import { CreatePostForm } from '@/app/components/forms/createPostForm';

const CreatePost = async () => {
  const communities = await readCommunities();
  return (
    <div>
      <div>CreatePost</div>
      {communities && <CreatePostForm communities={communities} />}
    </div>
  );
};

export default CreatePost;
