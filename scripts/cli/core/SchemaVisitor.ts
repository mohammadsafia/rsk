/**
 * Visitor pattern for traversing OpenAPI schema nodes.
 * Separates traversal logic from processing logic.
 */

import type { OpenAPISchemaObject } from '../types/index.js';

export type SchemaVisitorResult<T> = {
  typeName: string;
  isArray: boolean;
  isReference: boolean;
  referenceName?: string;
  value: T;
};

/**
 * Visitor interface — implement to handle each schema node type.
 */
export type SchemaNodeVisitor<T> = {
  visitObject(
    name: string,
    schema: OpenAPISchemaObject,
    properties: Record<string, OpenAPISchemaObject>,
    required: string[]
  ): T;

  visitEnum(name: string, schema: OpenAPISchemaObject, values: string[]): T;

  visitArray(
    name: string,
    schema: OpenAPISchemaObject,
    items: OpenAPISchemaObject
  ): T;

  visitPrimitive(name: string, schema: OpenAPISchemaObject): T;

  visitReference(name: string, ref: string): T;

  visitAllOf(
    name: string,
    schema: OpenAPISchemaObject,
    allOf: OpenAPISchemaObject[]
  ): T;

  visitOneOf(
    name: string,
    schema: OpenAPISchemaObject,
    oneOf: OpenAPISchemaObject[]
  ): T;
};

/**
 * Walk an OpenAPI schema and dispatch to the appropriate visitor method.
 */
export function walkSchema<T>(
  name: string,
  schema: OpenAPISchemaObject,
  visitor: SchemaNodeVisitor<T>
): T {
  // $ref
  if (schema.$ref) {
    return visitor.visitReference(name, schema.$ref);
  }

  // allOf (composition / inheritance)
  if (schema.allOf && schema.allOf.length > 0) {
    return visitor.visitAllOf(name, schema, schema.allOf);
  }

  // oneOf / anyOf (union types)
  if (schema.oneOf && schema.oneOf.length > 0) {
    return visitor.visitOneOf(name, schema, schema.oneOf);
  }
  if (schema.anyOf && schema.anyOf.length > 0) {
    return visitor.visitOneOf(name, schema, schema.anyOf);
  }

  // Enum
  if (schema.enum && schema.enum.length > 0) {
    return visitor.visitEnum(name, schema, schema.enum);
  }

  // Array
  if (schema.type === 'array' && schema.items) {
    return visitor.visitArray(name, schema, schema.items);
  }

  // Object (explicit or has properties)
  if (schema.type === 'object' || schema.properties) {
    return visitor.visitObject(
      name,
      schema,
      schema.properties ?? {},
      schema.required ?? []
    );
  }

  // Primitive (string, number, integer, boolean)
  return visitor.visitPrimitive(name, schema);
}
