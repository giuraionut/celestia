'use client';
import { memo, useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExtendedComment, Comment } from '@prisma/client';
import { cn } from '@/lib/utils';
import { CommentTree } from './CommentTree';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useTreeContext } from './CommentTreeContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MinusCircleIcon, PlusCircleIcon } from 'lucide-react';
import TiptapEditor from '../tiptap/TiptapEditor';
import { jsonToHtml } from '../tiptap/utils';

import {
  addReply,
  deleteComment,
  updateComment,
} from '@/actions/commentActions';
import { CommentNodeConnector } from './CommentNodeConnector';
import { useSession } from 'next-auth/react';
import { useCommentsContext } from './CommentsContext';
import { LoginDialog } from '../shared/LoginDialog';
import CommentVote from './CommentVote';

interface TreeNodeProps {
  comment: ExtendedComment;
  path: number[];
  isLastChild?: boolean;
  isParent?: boolean;
  hasParent?: boolean;
  index: number;
  updateCommentInTree: (updatedComment: ExtendedComment) => void;
}

export const CommentNode = ({
  comment,
  path,
  isLastChild = false,
  isParent = false,
  hasParent = false,
  updateCommentInTree,
}: TreeNodeProps) => {
  const { selectedPath, setSelectedPath } = useTreeContext();
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedPath(path);
    },
    [setSelectedPath, path]
  );

  const currentPath = usePathname(); // You can also use your custom hook here if needed
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded((prev) => !prev);
  }, []);
  return (
    <li className={cn(`relative ml-2 mt-2 list-none`)}>
      <CommentNodeConnector
        path={path}
        selectedPath={selectedPath}
        isLastChild={isLastChild}
        isParent={isParent}
        hasParent={hasParent}
      />
      <div className={cn(`marker:content-none custom-details`)}>
        <div
          onMouseEnter={handleClick}
          onMouseLeave={() => setSelectedPath([])}
        >
          {isParent && (
            <div>
              {path.length >= 5 ? (
                <Link href={`${currentPath}/${comment.id}`}>
                  <PlusCircleIcon
                    className={cn(
                      `w-4 h-4 absolute -left-[1.5rem] top-2 text-border bg-background hover:text-primary cursor-pointer`
                    )}
                  />
                </Link>
              ) : (
                !isExpanded && (
                  <PlusCircleIcon
                    className={cn(
                      `w-4 h-4 absolute -left-[1.5rem] top-2 text-border bg-background hover:text-primary cursor-pointer`
                    )}
                    onClick={toggleExpand}
                  />
                )
              )}
              {isExpanded && (
                <MinusCircleIcon
                  className={cn(
                    `w-4 h-4 absolute -left-[1.5rem] top-2 text-border bg-background hover:text-primary cursor-pointer`
                  )}
                  onClick={toggleExpand}
                />
              )}
            </div>
          )}
          <div
            className={cn(
              `border border-border rounded-md p-2 bg-background flex flex-col gap-2`
            )}
          >
            <Header comment={comment} />
            <Content comment={comment} />
            <Footer
              comment={comment}
              updateCommentInTree={updateCommentInTree}
            />
          </div>
        </div>
        <AnimatePresence>
          {comment.replies && comment.replies.length > 0 && isExpanded && (
            <motion.div
              className='ml-4'
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <CommentTree
                comments={comment.replies}
                path={path}
                updateCommentInTree={updateCommentInTree}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
};

const Header = memo(
  ({
    className,
    comment,
  }: {
    className?: string;
    comment: ExtendedComment;
  }) => {
    return (
      <div className={cn('flex items-center gap-4', className)}>
        <Avatar
          className='inline-flex size-[35px] select-none items-center justify-center overflow-hidden rounded-full
         bg-foreground/10 align-middle cursor-pointer border-[1.5px] border-border transition-all duration-150 ease-in-out'
        >
          <AvatarImage
            className='size-full rounded-[inherit] object-cover'
            src={comment?.author?.image || ''}
            alt={comment?.author?.name || 'User'}
          />
          <AvatarFallback
            className='leading-1 flex size-full items-center justify-center bg-foreground/10 text-[15px] font-medium text-foreground'
            delayMs={600}
          >
            {comment?.author?.name?.[0] || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className='flex items-center gap-4'>
          <strong className='text-md font-semibold'>
            {comment?.author?.name || 'Unknown User'}
          </strong>
          <small className='text-sm'>
            {new Date(comment.createdAt).toLocaleString()}
            {comment.id}
          </small>
        </div>
      </div>
    );
  }
);

const Content = memo(
  ({
    comment,
    className,
  }: {
    comment: ExtendedComment;
    className?: string;
  }) => {
    return (
      <div className={cn('ml-12', className)}>
        {comment.isDeleted ? (
          <div className='text-sm text-gray-400'>
            This comment has been deleted.
          </div>
        ) : (
          <div
            className='tiptap'
            dangerouslySetInnerHTML={{
              __html: jsonToHtml(comment.content),
            }}
          />
        )}
      </div>
    );
  }
);
const Footer = memo(
  ({
    comment,
    className,
    updateCommentInTree,
  }: {
    comment: ExtendedComment;
    className?: string;
    updateCommentInTree: (updatedComment: ExtendedComment) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [editorContent, setEditorContent] = useState<string>('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const { data: session } = useSession();
    const context = useCommentsContext();

    const userVote =
      comment.votes?.find((vote) => vote.userId === context.session?.user.id) || null;
    const handleEditComment = useCallback(async () => {
      const editedComment: Comment = {
        id: comment.id,
        content: editorContent,
        createdAt: comment.createdAt,
        updatedAt: new Date(),
        authorId: comment.authorId,
        parentId: comment.parentId,
        postId: comment.postId,
        isDeleted: comment.isDeleted,
        totalUpvotes: comment.totalUpvotes,
        totalDownvotes: comment.totalDownvotes,
        voteScore: 0
      };

      try {
        await updateComment(editedComment);
        updateCommentInTree({ ...comment, content: editorContent });
        toast.success('Comment edited successfully');
        setIsEditing(false);
      } catch (error) {
        toast.error('Failed to edit comment', {
          description: (error as Error).message,
        });
      }
    }, [comment, editorContent]);

    const handleReplyComment = useCallback(async () => {
      if (context.sessionStatus==='unauthenticated') {
        setIsLoginModalOpen(true);
        return;
      }
      const reply: Comment = {
        content: editorContent,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: '',
        authorId: '',
        parentId: comment.id,
        postId: comment.postId,
        isDeleted: comment.isDeleted,
        totalUpvotes: comment.totalUpvotes,
        totalDownvotes: comment.totalDownvotes,
        voteScore: 0
      };
      try {
        const newReply = await addReply(reply, comment);
        if (newReply) {
          updateCommentInTree({
            ...comment,
            replies: [...(comment.replies || []), newReply],
          });
        }

        toast.success('Reply added successfully');
        setIsReplying(false);
      } catch (error) {
        toast.error('Failed to add reply', {
          description: (error as Error).message,
        });
      }
    }, [comment, editorContent]);

    const handleDeleteComment = useCallback(async () => {
      try {
        await deleteComment(comment);
        updateCommentInTree({ ...comment, isDeleted: true });
        context.decrementCommentCount();
        toast.success('Comment deleted successfully');
      } catch (error) {
        toast.error('Failed to delete comment', {
          description: (error as Error).message,
        });
      }
    }, [comment]);

    return (
      <div className={cn('ml-12 flex flex-col gap-4', className)}>
        <div className='flex items-center gap-2 rounded-md'>
          <CommentVote
            comment={comment}
            vote={userVote}
          />
          {session?.user.id === comment.authorId && (
            <>
              <button
                disabled={comment.isDeleted}
                onClick={() => setIsEditing(!isEditing)}
                className={cn('text-sm transition px-2 py-1 rounded-md', {
                  'text-blue-500/70 hover:bg-blue-100/70': !comment.isDeleted,
                  'text-foreground/50 opacity-50': comment.isDeleted,
                })}
              >
                {isEditing ? 'Cancel Edit' : 'Edit'}
              </button>

              <button
                disabled={comment.isDeleted}
                onClick={() => handleDeleteComment()}
                className={cn('text-sm transition px-2 py-1 rounded-md ', {
                  'text-red-500/70 hover:bg-red-100/70': !comment.isDeleted,
                  'text-foreground/50 opacity-50': comment.isDeleted,
                })}
              >
                Delete
              </button>
            </>
          )}

          <button
            disabled={comment.isDeleted}
            onClick={() => {
              context.sessionStatus === 'authenticated'
                ? setIsReplying(!isReplying)
                : setIsLoginModalOpen(true);
            }}
            className={cn('text-sm transition px-2 py-1 rounded-md', {
              'text-green-500/70 hover:bg-green-100/70': !comment.isDeleted,
              'text-foreground/50 opacity-50': comment.isDeleted,
            })}
          >
            {isReplying ? 'Cancel Reply' : 'Reply'}
          </button>
        </div>
        {isReplying && (
          <TiptapEditor
            className={cn(`p-4`)}
            onContentChange={(jsonData) => setEditorContent(jsonData)}
          >
            <div className='mt-2 flex justify-between'>
              <button
                onClick={handleReplyComment}
                className='mt-2 text-blue-500/70'
              >
                Submit Reply
              </button>
            </div>
          </TiptapEditor>
        )}
        {isEditing && (
          <TiptapEditor
            className={cn(`p-4`)}
            initialContent={comment.content}
            onContentChange={(jsonData) => setEditorContent(jsonData)}
          >
            <div className='m-2 flex justify-between'>
              <button
                onClick={handleEditComment}
                className='mt-2 text-blue-500/70'
              >
                Save Changes
              </button>
            </div>
          </TiptapEditor>
        )}
        <LoginDialog
          open={isLoginModalOpen}
          onOpenChange={setIsLoginModalOpen}
        />
      </div>
    );
  }
);
