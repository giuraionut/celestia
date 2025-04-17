import { PostSuggestion } from '@/types/types';
import { Community, ExtendedPost, Post, User, Vote } from '@prisma/client';

import db from "@/lib/db";


type RawSearchResult = Post & {
  highlight: string;
  rank: number;
  community: string;
  author: string;
  votes: string;
};

/**
 * Search for posts using SQLite FTS
 * @param query Search query string
 * @param limit Maximum number of results to return
 * @param highlightTags HTML tags for highlighting matched terms [openTag, closeTag]
 * @returns Array of posts matching the search query
 */


export async function searchPosts(
  query: string,
  limit: number = 20,
  highlightTags?: [string, string],
  cursor?: string
): Promise<{ posts: ExtendedPost[]; nextCursor?: string }> {
  if (!query || query.trim() === '') {
    return { posts: [] };
  }
  const sanitizedQuery = query.trim().replace(/'/g, "''");

  try {
    let cursorCondition = "";
    const params: Array<string | number | boolean> = [];

    params.push(highlightTags ? highlightTags[0] : "");
    params.push(highlightTags ? highlightTags[1] : "");

    params.push(`${sanitizedQuery}*`);

    if (cursor) {

      const cursorParam = cursor; // Keep original cursor value
      const cursorResult = await db.$queryRawUnsafe<{ rank: number }[]>(`
            SELECT CAST(bm25(PostFTS) * 100 AS INTEGER) as rank
            FROM PostFTS
            WHERE id = ?
          `, cursorParam);

      const cursorRank = cursorResult[0]?.rank;

      if (cursorRank !== undefined) {
        cursorCondition = `AND (CAST(bm25(PostFTS) * 100 AS INTEGER) < ? OR (CAST(bm25(PostFTS) * 100 AS INTEGER) = ? AND Post.id > ?))`;
        params.push(cursorRank);
        params.push(cursorRank);
        params.push(cursorParam);
      }
    }

    params.push(limit + 1);

    const results = await db.$queryRawUnsafe<RawSearchResult[]>(`
      SELECT
        Post.*,
        highlight(PostFTS, 2, ?, ?) as highlight,
        CAST(bm25(PostFTS) * 100 AS INTEGER) as rank,
        json_object(
          'id', Community.id, 'name', Community.name, 'description', Community.description,
          'createdAt', Community.createdAt, 'updatedAt', Community.updatedAt, 'image', Community.image,
          'authorId', Community.authorId, 'isDeleted', Community.isDeleted, 'isPrivate', Community.isPrivate,
          'totalPosts', Community.totalPosts, 'totalMembers', Community.totalMembers, 'totalManagers', Community.totalManagers
        ) as community,
        json_object(
          'id', User.id, 'name', User.name, 'image', User.image, 'isDeleted', User.isDeleted,
          'createdAt', User.createdAt, 'updatedAt', User.updatedAt, 'email', User.email, 'emailVerified', User.emailVerified
        ) as author,
        (
          SELECT json_group_array( json_object( 'id', Vote.id, 'userId', Vote.userId, 'type', Vote.type ))
          FROM Vote
          WHERE Vote.postId = Post.id
        ) as votes
      FROM Post
      JOIN PostFTS ON Post.id = PostFTS.id
      JOIN Community ON Post.communityId = Community.id
      JOIN User ON Post.authorId = User.id
      LEFT JOIN RemovedPostFromCommunity rpfc ON Post.id = rpfc.postId
      WHERE PostFTS MATCH ?
        AND Post.isDeleted = 0
        AND rpfc.id IS NULL
        ${cursorCondition}
      ORDER BY CAST(bm25(PostFTS) * 100 AS INTEGER) DESC, Post.id ASC
      LIMIT ?
  `, ...params);

    let nextCursor: string | undefined = undefined;
    const finalResults = [...results];

    if (finalResults.length > limit) {
      const nextItem = finalResults.pop();
      nextCursor = nextItem?.id;
    }

    const posts: ExtendedPost[] = finalResults.map((r: RawSearchResult): ExtendedPost => {
      let parsedCommunity: Community;
      let parsedAuthor: User;
      let parsedVotes: Vote[];

      try {
        parsedCommunity = JSON.parse(r.community);
        parsedAuthor = JSON.parse(r.author);
        parsedVotes = r.votes ? JSON.parse(r.votes) : [];
      } catch (e) {
        console.error("Failed to parse JSON from raw query result:", e, r);
        parsedCommunity = {} as Community;
        parsedAuthor = {} as User;
        parsedVotes = [];
      }

      const {
        rank: _rank,
        community: _community,
        author: _author,
        votes: _votes,
        isDeleted: rawIsDeleted,
        ...restOfPost
      } = r;

      const postData = {
        ...restOfPost,
        createdAt: new Date(restOfPost.createdAt),
        updatedAt: new Date(restOfPost.updatedAt),
        isDeleted: Boolean(rawIsDeleted)
      };

      return {
        ...postData,
        highlight: r.highlight,
        community: parsedCommunity,
        author: parsedAuthor,
        votes: parsedVotes
      };
    });

    return { posts, nextCursor };

  } catch (error) {
    console.error('Error searching posts:', error);
    return { posts: [], nextCursor: undefined };
  }
}


/**
 * Get search suggestions based on a partial query
 * @param partialQuery Partial query to get suggestions for
 * @param limit Maximum number of suggestions to return
 * @returns Array of suggested search terms
 */
export async function getSearchSuggestions(
  partialQuery: string,
  limit: number = 5,
  snippetTags: [string, string],
): Promise<PostSuggestion[]> {
  if (!partialQuery || partialQuery.trim() === '') {
    return [];
  }
  console.log("-----------------GET SEARCH SUGGESTIONS---------------");
  const sanitizedQuery = partialQuery.trim().replace(/'/g, "''");

  try {
    const results = await db.$queryRawUnsafe<{
      id: string;
      title: string;
      snippet: string;
      communityName: string;
    }[]>(`
    SELECT DISTINCT
        PostFTS.id,
        PostFTS.title,
        snippet(PostFTS, 2, '${snippetTags[0]}', '${snippetTags[1]}', '...', 8) AS snippet,
        Community.name AS communityName
      FROM PostFTS
      JOIN Post ON PostFTS.id = Post.id
      JOIN Community ON Post.communityId = Community.id
      LEFT JOIN RemovedPostFromCommunity rpfc ON Post.id = rpfc.postId
      WHERE PostFTS.plainTextContent MATCH ?
        AND Post.isDeleted = 0
        AND rpfc.id IS NULL
      LIMIT ?
    `, `${sanitizedQuery}*`, limit);

    const maxLength = 100;
    return results.map(r => ({
      id: r.id,
      title: r.title,
      snippet: r.snippet.length > maxLength ? r.snippet.substring(0, maxLength) + '...' : r.snippet,
      communityName: r.communityName.toLowerCase()
    }));
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

