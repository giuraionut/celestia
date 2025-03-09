import { cn } from '@/lib/utils';
import {
  isSibling,
  isAncestor,
  getUncleDegree,
  isHigherUp,
  isSelf,
  isParentOf,
} from './commentTreeUtils';

interface ConnectorProps {
  path: number[];
  selectedPath: number[];
  isLastChild?: boolean;
  isParent?: boolean;
  hasParent?: boolean;
}

export const CommentNodeConnector = ({
  path,
  selectedPath,
  isLastChild = false,
  isParent = false,
  hasParent = false,
}: ConnectorProps) => {
  const beforeClasses = cn(
    `absolute -top-2 -left-4 w-4 h-6 border-border`,
    {
      'border-l-primary':
        (isSibling(path, selectedPath) ||
          isAncestor(path, selectedPath) ||
          getUncleDegree(path, selectedPath) != null) &&
        (isHigherUp(path, selectedPath) || isSelf(path, selectedPath)),
      'border-b-primary':
        isSelf(path, selectedPath) || isAncestor(path, selectedPath),
      'border-l': path.length !== 1,
      'border-b': isParent || hasParent,
      'rounded-bl-lg': isLastChild && !isParentOf(path, selectedPath),
    }
  );

  const afterClasses = cn(
    `absolute top-[.4rem] -left-4 border-border w-4 h-full -z-10`,
    {
      'border-l-primary':
        (isSibling(path, selectedPath) ||
          getUncleDegree(path, selectedPath) != null) &&
        isHigherUp(path, selectedPath),
      'border-l': hasParent && !isLastChild,
    }
  );

  return (
    <>
      <span className={beforeClasses} />
      <span className={afterClasses} />
    </>
  );
};
