import { readPosts } from '@/actions/postActions';
import { Button } from '@/components/ui/button';
import { authOptions } from '@/lib/auth';
import { ExtendedPost } from '@prisma/client';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import SignOutButton from './components/client/SignOutButton';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const result = await readPosts();
  const posts = result?.posts || [];
  const nextCursor = result?.nextCursor;
  return (
    <div>
      {session && session.user.email
        ? `Hello, ${session.user.email}`
        : 'Not signed in'}

      {session && <SignOutButton />}
      <Button>Hello</Button>
      {posts &&
        posts.map(
          (post: ExtendedPost) =>
            post.community && (
              <Link
                key={post.id}
                href={`/community/${post.community.name}/post/${post.id}/comments`}
              >
                <h2>{post.title}</h2>
              </Link>
            )
        )}
    </div>
  );
}
