import { fetchCommentsByPost } from "@/actions/commentActions";
import { logCommunityVisit, readCommunityById } from "@/actions/communityActions";
import { readPost } from "@/actions/postActions";
import { ExtendedPost } from "@prisma/client";

// actions/postActions.ts
export async function getPostData(postId: string) {
    const post = await readPost(postId);
    if (!post) throw new Error('Post not found');

    return post;
}

export async function getCommunityData(post: ExtendedPost, userId: string) {
    const [comments, community] = await Promise.all([
        fetchCommentsByPost({ postId: post.id, limit: 10 }),
        readCommunityById(post.communityId),
    ]);

    if (community && userId) {
        await logCommunityVisit(userId, community.id);
    }

    return { comments, community };
}
