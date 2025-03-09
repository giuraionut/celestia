import React from 'react';
import { CreatePostForm } from '../../components/forms/CreatePostForm';
import { readCommunities } from '@/actions/communityActions';
import { Community } from '@prisma/client';

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
