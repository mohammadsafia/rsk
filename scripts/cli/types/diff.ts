export type DiffStatus = 'new' | 'updated' | 'deleted' | 'unchanged';

export type DiffLine = {
  type: 'added' | 'removed' | 'context';
  content: string;
};

export type SchemaDiffResult = {
  name: string;
  status: DiffStatus;
  lines: DiffLine[];
};
