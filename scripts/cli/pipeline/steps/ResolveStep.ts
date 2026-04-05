/**
 * ResolveStep — Resolves $ref dependencies to ensure all imported types are included.
 * If a selected schema imports a type that isn't selected, auto-include it.
 * Prints a visual dependency tree so the user sees exactly what gets generated.
 */

import type { PipelineStep } from '../Pipeline.js';
import { logger, type TreeNode } from '../../utils/logger.js';

export function createResolveStep(): PipelineStep {
  return {
    name: 'Resolve',
    async execute(ctx) {
      const originalSelected = new Set(ctx.selectedSchemas);
      const resolvedSet = new Set(ctx.selectedSchemas);

      // Track parent → children relationships for tree display
      const childrenMap = new Map<string, string[]>();
      for (const key of ctx.selectedSchemas) {
        childrenMap.set(key, []);
      }

      // BFS to resolve all transitive dependencies
      const queue = [...ctx.selectedSchemas];
      let added = 0;

      while (queue.length > 0) {
        const key = queue.pop()!;
        const schema = ctx.schemas.get(key);
        if (!schema) continue;

        const endpointPrefix = key.split('::')[0];

        for (const imp of schema.imports) {
          const depKey = `${endpointPrefix}::${imp.name}`;
          if (!resolvedSet.has(depKey) && ctx.schemas.has(depKey)) {
            resolvedSet.add(depKey);
            queue.push(depKey);
            added++;

            // Track that this dep was pulled in by `key`
            const parentChildren = childrenMap.get(key) ?? [];
            parentChildren.push(depKey);
            childrenMap.set(key, parentChildren);

            // Initialize children list for the new dep
            if (!childrenMap.has(depKey)) {
              childrenMap.set(depKey, []);
            }
          }
        }
      }

      ctx.selectedSchemas = Array.from(resolvedSet);
      ctx.stats.selectedSchemas = ctx.selectedSchemas.length;
      ctx.stats.autoResolvedSchemas = added;

      // Print dependency tree
      if (added > 0) {
        printDependencyTree(originalSelected, childrenMap);
        logger.blank();
        logger.dim(`  Auto-included ${added} dependency schema(s).`);
      } else if (originalSelected.size > 0 && originalSelected.size < ctx.stats.totalSchemas) {
        logger.dim('  No additional dependencies.');
      }
    },
  };
}

/**
 * Build and print a visual dependency tree from the parent→children map.
 */
function printDependencyTree(
  roots: Set<string>,
  childrenMap: Map<string, string[]>
): void {
  logger.blank();
  logger.dim('  Dependency tree:');

  const treeRoots: TreeNode[] = [];

  for (const rootKey of roots) {
    const rootName = rootKey.split('::')[1];
    treeRoots.push(buildTreeNode(rootKey, rootName, childrenMap, new Set()));
  }

  logger.tree(treeRoots);
}

/**
 * Recursively build a TreeNode from the childrenMap.
 */
function buildTreeNode(
  key: string,
  label: string,
  childrenMap: Map<string, string[]>,
  visited: Set<string>
): TreeNode {
  if (visited.has(key)) {
    return { label: `${label} (circular)` };
  }
  visited.add(key);

  const childKeys = childrenMap.get(key) ?? [];
  const children: TreeNode[] = childKeys
    .sort((a, b) => a.localeCompare(b))
    .map((childKey) => {
      const childName = childKey.split('::')[1];
      return buildTreeNode(childKey, childName, childrenMap, new Set(visited));
    });

  return {
    label,
    children: children.length > 0 ? children : undefined,
  };
}
