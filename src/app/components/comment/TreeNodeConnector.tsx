import { cn } from '@/lib/utils';
import {
  isSibling,
  isAncestor,
  getUncleDegree,
  isHigherUp,
  isSelf,
  isParentOf,
} from './treeFunctions';

interface ConnectorProps {
  path: number[];
  selectedPath: number[];
  isLastChild?: boolean;
  isParent?: boolean;
  hasParent?: boolean;
}

export const TreeNodeConnector = ({
  path,
  selectedPath,
  isLastChild = false,
  isParent = false,
  hasParent = false,
}: ConnectorProps) => {
  const beforeClasses = cn(
    `absolute -top-2 -left-4 w-4 h-6 border-border/20`,
    {
      'border-l-border':
        (isSibling(path, selectedPath) ||
          isAncestor(path, selectedPath) ||
          getUncleDegree(path, selectedPath) != null) &&
        (isHigherUp(path, selectedPath) || isSelf(path, selectedPath)),
      'border-b-border':
        isSelf(path, selectedPath) || isAncestor(path, selectedPath),
      'border-l': path.length !== 1,
      'border-b': isParent || hasParent,
      'rounded-bl-lg': isLastChild && !isParentOf(path, selectedPath),
    }
  );

  const afterClasses = cn(
    `absolute top-[.4rem] -left-4 border-border/20 w-4 h-full`,
    {
      'border-l-border':
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
