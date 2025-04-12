import type { ExtendedPost, Comment } from '@prisma/client'; // Adjust the import path if necessary


export type Cursor = {
  nextCursor?: string;
}

export type PostSuggestion = {
  id: string;
  title: string;
  snippet: string;
  communityName: string;
};



// Define the base OverviewPost type, ensuring it includes all fields
// from ExtendedPost plus the specific additions needed for the overview.
export type OverviewPost = ExtendedPost & {
  type: 'post';
  // Ensure these relations are included in your Prisma query within readCommentsAndPostsByUserId
  community: {
    name: string;
    image: string;
  } | null; // Assuming community can be null for some posts? Adjust if not.
  votes: Array<{ userId: string }>; // Use non-optional if always included
  savedBy: Array<{ userId: string }>; // Use non-optional if always included
  hiddenBy: Array<{ userId: string }>; // Use non-optional if always included
  // totalComments should already exist in ExtendedPost based on your original definition
};

// Define the base OverviewComment type
export type OverviewComment = Comment & {
  type: 'comment';
  // Ensure these relations are included in your Prisma query
  post: ExtendedPost & {
    community?: { name: string }; // Make sure post and its community are selected
  }; // Assuming comments always belong to a post? Adjust if optional.
};

// Union type for overview items
export type OverviewItem = OverviewPost | OverviewComment;
export type FetchedItem =
  | (ExtendedPost & {
      // Make relations optional if they might not be included in all cases by the query
      votes?: Array<{ userId: string }>;
      savedBy?: Array<{ userId: string }>;
      hiddenBy?: Array<{ userId: string }>;
      community?: { name: string; image: string } | null;
      // If using _count in the query:
      _count?: { comments?: number };
    })
  | (Comment & {
      post?: (ExtendedPost & { community?: { name: string } }) | null;
    });
export function isOverviewPost(item: OverviewItem): item is OverviewPost {
  return item.type === 'post';
}

export function isOverviewComment(item: OverviewItem): item is OverviewComment {
  return item.type === 'comment';
}