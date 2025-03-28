import { PostSuggestion } from '@/types/types';
import { ExtendedPost, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();



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
  // Sanitize query to prevent SQL injection
  const sanitizedQuery = query.trim().replace(/'/g, "''");

  try {
    let cursorCondition = "";
    const params: any[] = [`${sanitizedQuery}*`];
    if (cursor) {
      // Get the BM25 score multiplied by 100 and cast as INTEGER for the cursor post.
      const cursorResult = await prisma.$queryRawUnsafe<{ rank: number }[]>(`
        SELECT CAST(bm25(PostFTS) * 100 AS INTEGER) as rank
        FROM PostFTS
        WHERE id = ?
      `, cursor);
      const cursorRank = cursorResult[0]?.rank;
      if (cursorRank !== undefined) {
        // Use a tie-breaker: (BM25 > cursorRank) OR (equal BM25 and Post.id > cursor)
        cursorCondition = "AND (CAST(bm25(PostFTS) * 100 AS INTEGER) > ? OR (CAST(bm25(PostFTS) * 100 AS INTEGER) = ? AND Post.id > ?))";
        params.push(cursorRank, cursorRank, cursor);
      }
    }
    // Fetch one extra row to check if there's a next page.
    params.push(limit + 1);

    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        Post.*,
        highlight(
          PostFTS, 
          2, 
          '${highlightTags ? highlightTags[0] : ""}', 
          '${highlightTags ? highlightTags[1] : ""}'
        ) as highlight,
        CAST(bm25(PostFTS) * 100 AS INTEGER) as rank,
        json_object(
          'id', Community.id,
          'name', Community.name,
          'description', Community.description,
          'createdAt', Community.createdAt,
          'updatedAt', Community.updatedAt,
          'image', Community.image,
          'authorId', Community.authorId,
          'isDeleted', Community.isDeleted,
          'totalMembers', Community.totalMembers,
          'totalManagers', Community.totalManagers
        ) as community,
        json_object(
          'id', User.id,
          'name', User.name,
          'image', User.image,
          'isDeleted', User.isDeleted,
          'createdAt', User.createdAt,
          'updatedAt', User.updatedAt,
          'email', User.email
        ) as author,
        (
          SELECT json_group_array(
            json_object(
              'id', Vote.id,
              'userId', Vote.userId,
              'type', Vote.type
            )
          )
          FROM Vote 
          WHERE Vote.postId = Post.id
        ) as votes
      FROM Post
      JOIN PostFTS ON Post.id = PostFTS.id
      JOIN Community ON Post.communityId = Community.id
      JOIN User ON Post.authorId = User.id
      WHERE PostFTS MATCH ? 
        AND Post.isDeleted = 0
        ${cursorCondition}
      ORDER BY CAST(bm25(PostFTS) * 100 AS INTEGER) ASC, Post.id ASC
      LIMIT ?
    `, ...params);
    

    // Determine nextCursor if we got one extra row.
    let nextCursor: string | undefined = undefined;
    if (results.length > limit) {
      const nextItem = results.pop();
      nextCursor = nextItem.id;
    }
    // Map results and parse the nested community JSON string.
    const posts = results.map((r) => {
      try {
        r.community = JSON.parse(r.community);
        r.votes = JSON.parse(r.votes);
        r.author = JSON.parse(r.author);
      } catch (error) {
        // if already parsed or parsing fails, leave it as-is.
      }
      delete r.rank;
      return r;
    });
    return { posts, nextCursor };
  } catch (error) {
    console.error('Error searching posts:', error);
    return { posts: [] };
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
    // Join PostFTS with Post and Community to get the community name.
    const results = await prisma.$queryRawUnsafe<{
      id: string;
      title: string;
      snippet: string;
      communityName: string;
    }[]>(`
      SELECT DISTINCT PostFTS.id, PostFTS.title,
        snippet(PostFTS, 2, '${snippetTags[0]}', '${snippetTags[1]}', '...', 8) AS snippet,
        Community.name AS communityName
      FROM PostFTS
      JOIN Post ON PostFTS.id = Post.id
      JOIN Community ON Post.communityId = Community.id
      WHERE PostFTS.plainTextContent MATCH ?
      AND Post.isDeleted = 0
      LIMIT ?
    `, `${sanitizedQuery}*`, limit);

    const maxLength = 100; // Example max length for the snippet
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

