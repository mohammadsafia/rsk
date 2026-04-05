/**
 * Intermediate Representation (IR) types.
 * These types decouple the OpenAPI schema from the output format,
 * enabling multiple generation targets from a single parsed IR.
 */

export type IRSchemaKind = 'object' | 'enum' | 'alias';

export type IRImport = {
  name: string;
  from: string;
};

export type IRProperty = {
  name: string;
  type: string;
  required: boolean;
  nullable: boolean;
  isArray: boolean;
  isReference: boolean;
  referenceName?: string;
  description?: string;
  deprecated?: boolean;
  readOnly?: boolean;
};

export type IRSchema = {
  name: string;
  description?: string;
  kind: IRSchemaKind;
  properties: IRProperty[];
  enumValues?: string[];
  aliasType?: string;
  imports: IRImport[];
  deprecated?: boolean;
};
