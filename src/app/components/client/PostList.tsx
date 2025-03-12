import Link from 'next/link';
import { ExtendedPost, Vote } from '@prisma/client';
import PostCard from '../presentational/PostCard';

interface PostListProps {
  posts: ExtendedPost[];
  userId?: string;
}

export default function PostList({ posts, userId }: PostListProps) {
  return (
    <>
      {posts.map((post: ExtendedPost) => {
        const userVote =
          post.votes?.find((vote) => vote.userId === userId) || null;

        return (
          post.community && (
            <Link
              key={post.id}
              href={`/community/${post.community.name}/post/${post.id}/comments`}
            >
              <PostCard
                post={post}
                vote={userVote}
                className='h-auto w-[768px] mx-auto mb-4'
              />
            </Link>
          )
        );
      })}
    </>
  );
}
