/**
 * SchemaParser — Parses OpenAPI schemas into Intermediate Representation (IR).
 * Uses the Visitor pattern to traverse schema nodes.
 */

import type {
  OpenAPIDocument,
  OpenAPISchemaObject,
  IRSchema,
  IRProperty,
  IRImport,
} from '../types/index.js';
import { type SchemaNodeVisitor, walkSchema } from './SchemaVisitor.js';
import { extractRefName } from '../utils/naming.js';

type PropertyResult = {
  type: string;
  isArray: boolean;
  isReference: boolean;
  referenceName?: string;
  nullable: boolean;
};

/**
 * Visitor that converts an OpenAPI property schema into a PropertyResult.
 */
class PropertyVisitor implements SchemaNodeVisitor<PropertyResult> {
  visitObject(
    _name: string,
    schema: OpenAPISchemaObject
  ): PropertyResult {
    // Map type: additionalProperties defines the value type (e.g., Record<string, Array<SlotTimeRange>>)
    if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
      const valueResult = walkSchema('value', schema.additionalProperties, this);
      return {
        type: `Record<string, ${valueResult.type}>`,
        isArray: false,
        isReference: valueResult.isReference,
        referenceName: valueResult.referenceName,
        nullable: schema.nullable ?? false,
      };
    }

    return {
      type: 'Record<string, unknown>',
      isArray: false,
      isReference: false,
      nullable: schema.nullable ?? false,
    };
  }

  visitEnum(
    _name: string,
    schema: OpenAPISchemaObject,
    values: string[]
  ): PropertyResult {
    const type = values.map((v) => `'${v}'`).join(' | ');
    return {
      type,
      isArray: false,
      isReference: false,
      nullable: schema.nullable ?? false,
    };
  }

  visitArray(
    _name: string,
    schema: OpenAPISchemaObject,
    items: OpenAPISchemaObject
  ): PropertyResult {
    const inner = walkSchema('items', items, this);
    return {
      type: `Array<${inner.type}>`,
      isArray: true,
      isReference: inner.isReference,
      referenceName: inner.referenceName,
      nullable: schema.nullable ?? false,
    };
  }

  visitPrimitive(
    _name: string,
    schema: OpenAPISchemaObject
  ): PropertyResult {
    return {
      type: mapPrimitiveType(schema),
      isArray: false,
      isReference: false,
      nullable: schema.nullable ?? false,
    };
  }

  visitReference(_name: string, ref: string): PropertyResult {
    const refName = extractRefName(ref);
    return {
      type: refName,
      isArray: false,
      isReference: true,
      referenceName: refName,
      nullable: false,
    };
  }

  visitAllOf(
    _name: string,
    schema: OpenAPISchemaObject,
    allOf: OpenAPISchemaObject[]
  ): PropertyResult {
    // For property-level allOf, merge into a single type
    // If there's a single $ref, use that; otherwise intersection
    const refs = allOf.filter((s) => s.$ref);
    if (refs.length === 1 && refs[0].$ref) {
      const refName = extractRefName(refs[0].$ref);
      return {
        type: refName,
        isArray: false,
        isReference: true,
        referenceName: refName,
        nullable: schema.nullable ?? false,
      };
    }

    const types = allOf.map((s) => walkSchema('allOf', s, this).type);
    return {
      type: types.join(' & '),
      isArray: false,
      isReference: false,
      nullable: schema.nullable ?? false,
    };
  }

  visitOneOf(
    _name: string,
    schema: OpenAPISchemaObject,
    oneOf: OpenAPISchemaObject[]
  ): PropertyResult {
    const types = oneOf.map((s) => walkSchema('oneOf', s, this).type);
    return {
      type: types.join(' | '),
      isArray: false,
      isReference: false,
      nullable: schema.nullable ?? false,
    };
  }
}

export class SchemaParser {
  private propertyVisitor = new PropertyVisitor();

  /**
   * Parse all schemas from an OpenAPI document into IR.
   */
  parse(doc: OpenAPIDocument): Map<string, IRSchema> {
    const rawSchemas = doc.components?.schemas ?? doc.definitions ?? {};
    const result = new Map<string, IRSchema>();

    for (const [name, schema] of Object.entries(rawSchemas)) {
      const irSchema = this.parseSchema(
        name,
        schema as OpenAPISchemaObject,
        rawSchemas as Record<string, OpenAPISchemaObject>
      );
      result.set(name, irSchema);
    }

    return result;
  }

  /**
   * Parse a single schema into IR.
   */
  private parseSchema(
    name: string,
    schema: OpenAPISchemaObject,
    _allSchemas: Record<string, OpenAPISchemaObject>
  ): IRSchema {
    // Enum type
    if (schema.enum && schema.enum.length > 0) {
      return {
        name,
        description: schema.description,
        kind: 'enum',
        properties: [],
        enumValues: schema.enum,
        imports: [],
        deprecated: schema.deprecated,
      };
    }

    // Object type (explicit or has properties)
    if (schema.type === 'object' || schema.properties || schema.allOf) {
      return this.parseObjectSchema(name, schema);
    }

    // Alias type (e.g., type Foo = string)
    const result = walkSchema(name, schema, this.propertyVisitor);
    return {
      name,
      description: schema.description,
      kind: 'alias',
      properties: [],
      aliasType: result.type,
      imports: result.referenceName
        ? [{ name: result.referenceName, from: result.referenceName }]
        : [],
      deprecated: schema.deprecated,
    };
  }

  /**
   * Parse an object schema, handling allOf composition.
   */
  private parseObjectSchema(
    name: string,
    schema: OpenAPISchemaObject
  ): IRSchema {
    let mergedProperties: Record<string, OpenAPISchemaObject> = {};
    let mergedRequired: string[] = [];
    const imports: IRImport[] = [];

    // Handle allOf by merging all properties
    if (schema.allOf) {
      for (const part of schema.allOf) {
        if (part.$ref) {
          const refName = extractRefName(part.$ref);
          // For allOf with $ref, we'd ideally resolve it,
          // but since we generate separately, treat as an import
          imports.push({ name: refName, from: refName });
        }
        if (part.properties) {
          mergedProperties = { ...mergedProperties, ...part.properties };
        }
        if (part.required) {
          mergedRequired = [...mergedRequired, ...part.required];
        }
      }
    }

    // Merge top-level properties
    if (schema.properties) {
      mergedProperties = { ...mergedProperties, ...schema.properties };
    }
    if (schema.required) {
      mergedRequired = [...mergedRequired, ...schema.required];
    }

    const properties: IRProperty[] = [];

    for (const [propName, propSchema] of Object.entries(mergedProperties)) {
      const result = walkSchema(propName, propSchema, this.propertyVisitor);

      if (result.referenceName && result.referenceName !== name) {
        const alreadyImported = imports.some((i) => i.name === result.referenceName);
        if (!alreadyImported) {
          imports.push({
            name: result.referenceName,
            from: result.referenceName,
          });
        }
      }

      properties.push({
        name: propName,
        type: result.type,
        required: mergedRequired.includes(propName),
        nullable: result.nullable,
        isArray: result.isArray,
        isReference: result.isReference,
        referenceName: result.referenceName,
        description: propSchema.description,
        deprecated: propSchema.deprecated,
        readOnly: propSchema.readOnly,
      });
    }

    return {
      name,
      description: schema.description,
      kind: 'object',
      properties,
      imports,
      deprecated: schema.deprecated,
    };
  }
}

/**
 * Map OpenAPI primitive types to TypeScript types.
 */
function mapPrimitiveType(schema: OpenAPISchemaObject): string {
  switch (schema.type) {
    case 'string':
      if (schema.format === 'date' || schema.format === 'date-time') {
        return 'string';
      }
      if (schema.format === 'binary') {
        return 'Blob';
      }
      if (schema.format === 'uuid') {
        return 'string';
      }
      return 'string';

    case 'integer':
    case 'number':
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'null':
      return 'null';

    default:
      return 'unknown';
  }
}
