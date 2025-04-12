import { PostSuggestion } from '@/types/types';
import { Community, ExtendedPost, Post, PrismaClient, User, Vote } from '@prisma/client';

const prisma = new PrismaClient();

type RawSearchResult = Post & {
  highlight: string;
  rank: number;       // The integer rank
  community: string;  // JSON string from json_object
  author: string;     // JSON string from json_object
  votes: string;      // JSON string from json_group_array
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
  // Basic sanitization - consider more robust methods or Prisma.sql if possible
  const sanitizedQuery = query.trim().replace(/'/g, "''");

  try {
    let cursorCondition = "";
    // Parameters for $queryRawUnsafe - MUST be positional primitives
    const params: Array<string | number | boolean> = [];

    // Add highlight tags first as they come before MATCH param in the query
    params.push(highlightTags ? highlightTags[0] : "");
    params.push(highlightTags ? highlightTags[1] : "");

    // Add MATCH param
    params.push(`${sanitizedQuery}*`);

    if (cursor) {
      // Use Prisma.sql for better type safety and parameter handling if possible
      // For $queryRawUnsafe, keep parameters separate
      const cursorParam = cursor; // Keep original cursor value
      const cursorResult = await prisma.$queryRawUnsafe<{ rank: number }[]>(`
            SELECT CAST(bm25(PostFTS) * 100 AS INTEGER) as rank
            FROM PostFTS
            WHERE id = ?
          `, cursorParam); // Parameter for WHERE id = ?

      const cursorRank = cursorResult[0]?.rank;

      if (cursorRank !== undefined) {
        // Construct the SQL condition string
        cursorCondition = `AND (CAST(bm25(PostFTS) * 100 AS INTEGER) < ? OR (CAST(bm25(PostFTS) * 100 AS INTEGER) = ? AND Post.id > ?))`;
        // Add parameters for the cursor condition IN ORDER
        params.push(cursorRank); // Parameter for < ?
        params.push(cursorRank); // Parameter for = ?
        params.push(cursorParam); // Parameter for AND Post.id > ?
      }
    }

    // Add LIMIT param last
    params.push(limit + 1);

    // --- Execute the main search query ---
    // Order of placeholders must match order of params added
    const results = await prisma.$queryRawUnsafe<RawSearchResult[]>(`
          SELECT
            Post.*,
            highlight(PostFTS, 2, ?, ?) as highlight, -- highlight params
            CAST(bm25(PostFTS) * 100 AS INTEGER) as rank,
            json_object(
              'id', Community.id, 'name', Community.name, 'description', Community.description,
              'createdAt', Community.createdAt, 'updatedAt', Community.updatedAt, 'image', Community.image,
              'authorId', Community.authorId, 'isDeleted', Community.isDeleted,
              'totalMembers', Community.totalMembers, 'totalManagers', Community.totalManagers
            ) as community,
            json_object(
              'id', User.id, 'name', User.name, 'image', User.image, 'isDeleted', User.isDeleted,
              'createdAt', User.createdAt, 'updatedAt', User.updatedAt, 'email', User.email
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
          WHERE PostFTS MATCH ? -- MATCH param
            AND Post.isDeleted = 0
            ${cursorCondition} -- Appended string; corresponding params already added
          ORDER BY CAST(bm25(PostFTS) * 100 AS INTEGER) DESC, Post.id ASC
          LIMIT ? -- LIMIT param
      `, ...params); // Spread all collected parameters

    // --- Process results for pagination ---
    let nextCursor: string | undefined = undefined;
    const finalResults = [...results]; // Use mutable copy for pop

    if (finalResults.length > limit) {
      const nextItem = finalResults.pop(); // Remove and get the extra item
      nextCursor = nextItem?.id; // Use its ID as the cursor for the next page
    }

    // --- Map raw results to the final ExtendedPost structure ---
    const posts: ExtendedPost[] = finalResults.map((r: RawSearchResult): ExtendedPost => {
      // Parse JSON strings safely
      let parsedCommunity: Community;
      let parsedAuthor: User;
      let parsedVotes: Vote[];

      try {
        parsedCommunity = JSON.parse(r.community);
        parsedAuthor = JSON.parse(r.author);
        // Handle null votes string before parsing
        parsedVotes = r.votes ? JSON.parse(r.votes) : [];
      } catch (e) {
        console.error("Failed to parse JSON from raw query result:", e, r);
        // Decide how to handle parse errors, maybe throw or return a default structure
        // For now, let's use defaults, but logging is important
        parsedCommunity = {} as Community; // Or some default/null value
        parsedAuthor = {} as User;
        parsedVotes = [];
      }

      // Destructure to exclude raw JSON strings and rank, prefixing unused vars
      const {
        rank: _rank,
        community: _community,
        author: _author,
        votes: _votes,
        // Handle isDeleted if it's numeric (0/1) from DB
        isDeleted: rawIsDeleted,
        ...restOfPost // Keep the rest of the properties from Post.*
      } = r;

      // Convert dates and potentially boolean fields
      const postData = {
        ...restOfPost,
        createdAt: new Date(restOfPost.createdAt), // Ensure Date objects
        updatedAt: new Date(restOfPost.updatedAt), // Ensure Date objects
        isDeleted: Boolean(rawIsDeleted)         // Convert 0/1 to false/true
      };

      // Construct the final ExtendedPost object
      return {
        ...postData,             // Base post fields with corrected types
        highlight: r.highlight,  // Keep the highlight string
        community: parsedCommunity, // Use parsed object
        author: parsedAuthor,       // Use parsed object
        votes: parsedVotes          // Use parsed array
        // Ensure all properties required by ExtendedPost are present
      };
    });

    return { posts, nextCursor };

  } catch (error) {
    console.error('Error searching posts:', error);
    // Return the expected structure even on error
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

