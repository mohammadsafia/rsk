/**
 * Logger utility with colored output and spinners.
 */

import chalk from 'chalk';
import ora, { type Ora } from 'ora';

class Logger {
  info(message: string): void {
    console.log(chalk.blue('info'), message);
  }

  success(message: string): void {
    console.log(chalk.green('done'), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow('warn'), message);
  }

  error(message: string): void {
    console.log(chalk.red('error'), message);
  }

  dim(message: string): void {
    console.log(chalk.dim(message));
  }

  blank(): void {
    console.log();
  }

  heading(message: string): void {
    console.log();
    console.log(chalk.bold.cyan(message));
    console.log(chalk.dim('─'.repeat(message.length)));
  }

  table(rows: [string, string | number][]): void {
    const maxKeyLen = Math.max(...rows.map(([key]) => key.length));
    for (const [key, value] of rows) {
      console.log(`  ${chalk.dim(key.padEnd(maxKeyLen))}  ${chalk.white(String(value))}`);
    }
  }

  spinner(text: string): Ora {
    return ora({ text, color: 'cyan' }).start();
  }

  fileCreated(relativePath: string): void {
    console.log(`  ${chalk.green('+')} ${relativePath}`);
  }

  fileUpdated(relativePath: string): void {
    console.log(`  ${chalk.yellow('~')} ${relativePath}`);
  }

  fileUnchanged(relativePath: string): void {
    console.log(`  ${chalk.dim('=')} ${relativePath}`);
  }

  fileNotInBE(relativePath: string): void {
    console.log(`  ${chalk.red('✗')} ${relativePath} ${chalk.red('(not in BE)')}`);
  }

  fileDeleted(relativePath: string): void {
    console.log(`  ${chalk.red('✗')} ${relativePath} ${chalk.red('(deleted - not in BE)')}`);
  }

  fileSkippedModified(relativePath: string): void {
    console.log(`  ${chalk.yellow('!')} ${relativePath} ${chalk.yellow('(not in BE, skipped - locally modified)')}`);
  }

  fileSkippedUntracked(relativePath: string): void {
    console.log(`  ${chalk.yellow('!')} ${relativePath} ${chalk.yellow('(not in BE, skipped - untracked)')}`);
  }

  schemaFound(name: string, endpoint: string): void {
    console.log(`    ${chalk.green('✓')} ${name} ${chalk.dim(`(found in ${endpoint})`)}`);
  }

  schemaNotFound(name: string): void {
    console.log(`    ${chalk.red('✗')} ${name} ${chalk.dim('(not found — skipped)')}`);
  }

  /**
   * Print a dependency tree with connectors.
   *
   * @param roots — Array of root nodes, each with optional children (recursive).
   */
  tree(
    roots: TreeNode[]
  ): void {
    for (const root of roots) {
      console.log(`    ${chalk.green(root.label)}`);
      this.printTreeChildren(root.children ?? [], '    ');
    }
  }

  diffAdded(line: string): void {
    console.log(chalk.green(`  + ${line}`));
  }

  diffRemoved(line: string): void {
    console.log(chalk.red(`  - ${line}`));
  }

  diffFileHeader(filename: string): void {
    console.log();
    console.log(chalk.yellow(`~ ${filename}`));
  }

  diffSummary(counts: { new: number; updated: number; deleted: number; unchanged: number }): void {
    console.log();
    const parts = [
      chalk.green(`${counts.new} new`),
      chalk.yellow(`${counts.updated} updated`),
      chalk.cyan(`${counts.unchanged} unchanged`),
    ];
    if (counts.deleted > 0) {
      parts.splice(2, 0, chalk.red(`${counts.deleted} deleted`));
    }
    console.log(`Summary: ${parts.join(', ')}`);
  }

  private printTreeChildren(children: TreeNode[], prefix: string): void {
    for (let i = 0; i < children.length; i++) {
      const isLast = i === children.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      const childPrefix = isLast ? '    ' : '│   ';

      console.log(`${prefix}${chalk.dim(connector)}${chalk.yellow(children[i].label)}`);

      if (children[i].children && children[i].children!.length > 0) {
        this.printTreeChildren(children[i].children!, `${prefix}${childPrefix}`);
      }
    }
  }
}

export type TreeNode = {
  label: string;
  children?: TreeNode[];
};

export const logger = new Logger();
