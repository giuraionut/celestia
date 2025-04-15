import { fetchUserProfileByName } from '@/actions/authActions';
import { findCommunityByName } from '@/actions/communityActions';
import { readPost } from '@/actions/postActions';
import type { Metadata } from 'next';

/**
 * A generic interface for metadata generation parameters.
 * 
 * @template T - The shape of the dynamic route parameters.
 */
export interface GenerateMetadataProps<T extends Record<string, string | undefined> = Record<string, string | undefined>> {
  params: Promise<T>;
  pageContext?: string;
}
export async function generateUserPageMetadata({
  params,
  pageContext,
}: GenerateMetadataProps): Promise<Metadata> {
  const { name } = await params;
  if (!name) {
    console.error('Username missing in params for metadata generation');
    return { title: 'Error | Celestia' };
  }
  const decodedName = decodeURIComponent(name);
  try {
    const user = await fetchUserProfileByName({ name: decodedName });
    if (!user || user.isDeleted) {
      return {
        title: 'User Not Found | Celestia',
        description: 'The requested user profile could not be found.',
      };
    }
    const username = user.name || 'User';
    pageContext = pageContext || 'No Context';
    const capitalizedContext = pageContext
    return {
      title: `${username}'s ${capitalizedContext} | Celestia`,
      description: `View ${pageContext.toLowerCase()} by ${username} on Celestia.`,
    };
  } catch (error) {
    console.error('Error fetching user for metadata:', error);
    return {
      title: 'Server Error | Celestia',
      description: 'Could not load user profile information.',
    };
  }
}

export async function generateCommunityMetadata({ params }: GenerateMetadataProps): Promise<Metadata> {
  const { name } = await params;

  if (!name) {
    console.error('Community name missing in params for metadata generation');
    return { title: 'Error | Celestia' };
  }
  const decodedName = decodeURIComponent(name);
  try {
    const community = await findCommunityByName(decodedName);
    if (!community) {
      return {
        title: 'Community Not Found | Celestia',
        description: 'The requested community could not be found.',
      };
    }
    const communityName = community.name || 'Community';
    return {
      title: `${communityName} Community | Celestia`,
      description: `View ${communityName} on Celestia.`,
    };
  } catch (error) {
    console.error('Error fetching community for metadata:', error);
    return {
      title: 'Server Error | Celestia',
      description: 'Could not load community information.',
    };
  }
}

export async function generatePostMetadata({
  params,
}: GenerateMetadataProps): Promise<Metadata> {
  const { postId } = await params;
  if (!postId) {
    console.error('Post id missing in params for metadata generation');
    return { title: 'Error | Celestia' };
  }
  try {
    const post = await readPost(postId);
    if (!post) {
      return {
        title: 'Post Not Found | Celestia',
        description: 'The requested post could not be found.',
      };
    }

    const postTitle = post.title || 'Post';
    return {
      title: `${postTitle} | Celestia`,
      description: `View ${postTitle} on Celestia.`,
    };
  } catch (error) {
    console.error('Error fetching post for metadata:', error);
    return {
      title: 'Server Error | Celestia',
      description: 'Could not load post information.',
    };
  }
}