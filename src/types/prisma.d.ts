import { Post, Comment, Community, Vote, User, HiddenPost, SavedPost } from '@prisma/client';

declare module '@prisma/client' {
  /**
   * ExtendedPost
   *
   * An augmented version of the Post model that includes related fields such as the community,
   * author, comments, and votes.
   *
   * @example
   * const post: ExtendedPost = {
   *   id: 'abc123',
   *   title: 'Hello World',
   *   content: 'This is a sample post',
   *   createdAt: new Date(),
   *   updatedAt: new Date(),
   *   community: { id: 'com1', name: 'Community A', ... },
   *   author: { id: 'u1', name: 'Alice', ... },
   *   comments: [ ... ],
   *   votes: [ ... ]
   * }
   */
  export type ExtendedPost = Post & {
    /**
     * The community the post belongs to.
     */
    community?: Community;
    /**
     * The author who created the post.
     */
    author?: User;
    /**
     * List of comments on the post.
     */
    comments?: Comment[];
    /**
     * List of votes on the post.
     */
    votes?: Vote[];
    highlight?: string;
    hiddenBy?: HiddenPost[];
    savedBy?: SavedPost[];
  };

  /**
   * ExtendedComment
   *
   * An augmented version of the Comment model that includes related fields such as the author,
   * votes, and nested replies.
   *
   * @example
   * const comment: ExtendedComment = {
   *   id: 'c123',
   *   content: 'This is a comment',
   *   createdAt: new Date(),
   *   updatedAt: new Date(),
   *   isDeleted: false,
   *   author: { id: 'u2', name: 'Bob', ... },
   *   votes: [ ... ],
   *   replies: [ ... ]
   * }
   */
  export type ExtendedComment = Comment & {
    /**
     * The author of the comment.
     */
    author?: User;
    /**
     * The votes associated with the comment.
     */
    votes?: Vote[];
    /**
     * Nested replies to this comment.
     */
    replies?: Comment[];
    post?: ExtendedPost;
  };

  /**
   * ExtendedCommunity
   *
   * An augmented version of the Community model that includes additional relations such as the
   * managing author and the list of posts in the community.
   *
   * @example
   * const community: ExtendedCommunity = {
   *   id: 'com1',
   *   name: 'Community A',
   *   description: 'A sample community',
   *   createdAt: new Date(),
   *   updatedAt: new Date(),
   *   isDeleted: false,
   *   author: { id: 'u1', name: 'Alice', ... },
   *   posts: [ ... ]
   * }
   */
  export type ExtendedCommunity = Community & {
    /**
     * The user who manages the community.
     */
    author?: User;
    /**
     * The posts associated with the community.
     */
    posts: Post[] | ExtendedPost[];
    managers?: User[];
    members?: User[];
  };
}
