import { ExtendedComment } from "@prisma/client";

export function isParentOf(potentialParentPath: number[], nodePath: number[]): boolean {
    if (potentialParentPath.length !== nodePath.length - 1) {
        return false;
    }
    for (let i = 0; i < potentialParentPath.length; i++) {
        if (potentialParentPath[i] !== nodePath[i]) {
            return false;
        }
    }
    return true;
}

export function isChild(potentialChildPath: number[], nodePath: number[]): boolean {
    return isParentOf(nodePath, potentialChildPath);
}


export function isAncestor(potentialAncestorPath: number[], nodePath: number[]): boolean {
    if (potentialAncestorPath.length >= nodePath.length) {
        return false;
    }
    for (let i = 0; i < potentialAncestorPath.length; i++) {
        if (potentialAncestorPath[i] !== nodePath[i]) {
            return false;
        }
    }
    return true;
}

export function isDescendant(potentialDescendantPath: number[], nodePath: number[]): boolean {
    return isAncestor(nodePath, potentialDescendantPath); // Reuse isAncestor logic
}


export function isSibling(pathA: number[], pathB: number[]): boolean {
    if (pathA.length !== pathB.length || pathA.length === 0) return false;
    for (let i = 0; i < pathA.length - 1; i++) {
        if (pathA[i] !== pathB[i]) {
            return false;
        }
    }
    return true;
}


export function isCousin(node1Path: number[], node2Path: number[]): boolean {
    if (node1Path.length !== node2Path.length) {
        return false;
    }
    if (JSON.stringify(node1Path) === JSON.stringify(node2Path)) {
        return false;
    }

    if (node1Path.length <= 2) {
        return false;
    }
    const grandparentPath1 = node1Path.slice(0, -2);
    const grandparentPath2 = node2Path.slice(0, -2);
    for (let i = 0; i < grandparentPath1.length; i++) {
        if (grandparentPath1[i] !== grandparentPath2[i]) {
            return false;
        }
    }
    return !isSibling(node1Path, node2Path);
}




export function isSelf(nodePath: number[], potentialSelfPath: number[]): boolean {
    return JSON.stringify(nodePath) === JSON.stringify(potentialSelfPath);
}


export function getUncleDegree(
    potentialUnclePath: number[],
    potentialNephewPath: number[]
): number | null {


    if (isAncestor(potentialUnclePath, potentialNephewPath)) return null;
    const diff = potentialNephewPath.length - potentialUnclePath.length;
    if (diff < 1) {
        return null;
    }
    const candidate = potentialNephewPath.slice(0, potentialUnclePath.length);
    if (!isSibling(candidate, potentialUnclePath)) {
        return null;
    }
    return diff - 1;
}

/**
 * Returns the degree of the nephew relationship.
 * It’s simply the reverse of the uncle relationship.
 *
 * @param potentialNephewPath - The path for the potential nephew.
 * @param potentialUnclePath - The path for the potential uncle.
 */
export function getNephewDegree(
    potentialNephewPath: number[],
    potentialUnclePath: number[]
): number | null {
    return getUncleDegree(potentialUnclePath, potentialNephewPath);
}

export function isHigherUp(path1: number[], path2: number[]): boolean {
    const minLength = Math.min(path1.length, path2.length);

    let commonLength = 0;
    for (let i = 0; i < minLength; i++) {
        if (path1[i] === path2[i]) {
            commonLength++;
        } else {
            break;
        }
    }

    if (commonLength === path1.length && path1.length < path2.length) {
        return true;
    }
    if (commonLength === path2.length && path2.length < path1.length) {
        return false;
    }


    if (commonLength < minLength) {
        return path1[commonLength] < path2[commonLength];
    }
    return false;
}

export const isLastChild = (
    index: number,
    siblings: ExtendedComment[]
): boolean => {
    return index === siblings.length - 1;
};
