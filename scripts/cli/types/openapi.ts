/**
 * OpenAPI helper types for working with swagger specs.
 */

export type OpenAPISchemaObject = {
  type?: string;
  format?: string;
  description?: string;
  enum?: string[];
  properties?: Record<string, OpenAPISchemaObject>;
  required?: string[];
  items?: OpenAPISchemaObject;
  $ref?: string;
  allOf?: OpenAPISchemaObject[];
  oneOf?: OpenAPISchemaObject[];
  anyOf?: OpenAPISchemaObject[];
  nullable?: boolean;
  deprecated?: boolean;
  readOnly?: boolean;
  additionalProperties?: boolean | OpenAPISchemaObject;
};

export type OpenAPIDocument = {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
  };
  paths?: Record<string, unknown>;
  components?: {
    schemas?: Record<string, OpenAPISchemaObject>;
  };
  definitions?: Record<string, OpenAPISchemaObject>;
};
