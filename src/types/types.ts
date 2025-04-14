import type { ExtendedPost, Comment, User, Vote } from '@prisma/client'; // Adjust the import path if necessary


export type Cursor = {
  nextCursor?: string;
}

export type PostSuggestion = {
  id: string;
  title: string;
  snippet: string;
  communityName: string;
};



export type OverviewPost = ExtendedPost & {
  type: 'post';
  community: {
    name: string;
    image: string;
  } | null;
  votes: Array<{ userId: string }>;
  savedBy: Array<{ userId: string }>;
  hiddenBy: Array<{ userId: string }>;
};

export type OverviewComment = Comment & {
  type: 'comment';
  post: ExtendedPost & {
    community?: { name: string };
  };
  author: User;
  votes:Array<Vote>;
};

export type OverviewItem = OverviewPost | OverviewComment;
export type FetchedItem =
  | (ExtendedPost & {
    votes?: Array<{ userId: string }>;
    savedBy?: Array<{ userId: string }>;
    hiddenBy?: Array<{ userId: string }>;
    community?: { name: string; image: string } | null;
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