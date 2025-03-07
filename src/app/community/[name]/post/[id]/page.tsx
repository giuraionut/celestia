import { readCommentsByPost } from '@/actions/commentActions';
import { readCommunityById } from '@/actions/communityActions';
import { readPost } from '@/actions/postActions';
import CommentsSectionComponent from '@/app/components/presentational/CommentsSectionComponent';
import CommunityComponent from '@/app/components/presentational/CommunityComponent';
import PostComponent from '@/app/components/presentational/PostComponent';
import React from 'react';

const PostPage = async ({
  params,
}: {
  params: { id: string; name: string };
}) => {
  const { id, name } = await params;
  const post = await readPost(id);
  const comments = await readCommentsByPost(id);
  const community = await readCommunityById(post?.communityId || '');
  return (
    <div className='p-4 flex flex-col gap-4'>
      
      {!community ? (
        <div>Loading community...</div>
      ) : (
        <CommunityComponent community={community} />
      )}
      {!post ? <div>Loading post...</div> : <PostComponent post={post} />}
      {!comments ? (
        <div>Loading comments...</div>
      ) : (
        <CommentsSectionComponent comments={comments} />
      )}
    </div>
  );
};

export default PostPage;
