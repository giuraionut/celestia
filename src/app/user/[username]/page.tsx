import { fetchUserProfileByName } from '@/actions/authActions';
import { readCommentsByUserId } from '@/actions/commentActions';
import { readPostsByUserId } from '@/actions/postActions';
import CommentList from '@/app/components/client/CommentList';
import LoadMore from '@/app/components/client/LoadMore';
import PostList from '@/app/components/client/PostList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React, { ReactNode } from 'react';

const UserPage = async ({ params }: { params: { username: string } }) => {
  const { username } = await params;
  const email = decodeURIComponent(username);
  const user = await fetchUserProfileByName({ email: email });
  if (!user) return <div>User not found</div>;

  if (user.isDeleted) return <div>User not found</div>;

  const userPosts = await readPostsByUserId({ userId: user.id });
  const posts = userPosts?.posts || [];
  const postsNextCursor = userPosts?.nextCursor || null;

  const userComments = await readCommentsByUserId({ userId: user.id });
  const comments = userComments?.comments || [];
  const commentsNextCursor = userComments?.nextCursor || null;

  async function loadMoreUserPosts(
    cursor?: string
  ): Promise<[ReactNode, string | null]> {
    'use server';
    if (!user) throw new Error('User not found');
    const userPosts = await readPostsByUserId({
      userId: user.id,
      cursor,
    });
    const posts = userPosts?.posts || [];
    const nextCursor = userPosts?.nextCursor || null;
    return [
      <PostList key={cursor || 'initial'} posts={posts} userId={user.id} />,
      nextCursor,
    ];
  }

  async function loadMoreUserComments(
    cursor?: string
  ): Promise<[ReactNode, string | null]> {
    'use server';
    if (!user) throw new Error('User not found');
    const userComments = await readCommentsByUserId({
      userId: user.id,
      cursor,
    });
    const comments = userComments?.comments || [];
    const nextCursor = userComments?.nextCursor || null;
    return [
      <CommentList key={cursor || 'initial'} comments={comments} userId={user.id} />,
      nextCursor,
    ];
  }
  return (
    <Tabs defaultValue='posts' className='w-[400px]'>
      <TabsList className='grid w-full grid-cols-2'>
        <TabsTrigger value='posts'>Posts</TabsTrigger>
        <TabsTrigger value='comments'>Comments</TabsTrigger>
      </TabsList>
      <TabsContent value='posts'>
        <LoadMore
          loadMoreAction={loadMoreUserPosts}
          initialCursor={postsNextCursor}
        >
          <PostList posts={posts} userId={user.id} />
        </LoadMore>
      </TabsContent>
      <TabsContent value='comments'>
       <LoadMore
          loadMoreAction={loadMoreUserComments}
          initialCursor={commentsNextCursor}
        >
          <CommentList comments={comments} userId={user.id} />
        </LoadMore>
      </TabsContent>
    </Tabs>
  );
};

export default UserPage;
