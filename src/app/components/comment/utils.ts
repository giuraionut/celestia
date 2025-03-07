'use client'
import { usePathname } from "next/navigation";
export const useCurrentPath = () => {
    const currentUrl = usePathname();
    const segments = currentUrl.split('/');
    const isCommentPage = segments.includes('comments');
    const isFullDiscussion = segments.at(-1) === 'comments';
    const currentCommentId = isCommentPage ? segments.pop() : null;
    const baseUrl = segments.join('/');
    return { currentUrl, isCommentPage, isFullDiscussion, currentCommentId, baseUrl };
};