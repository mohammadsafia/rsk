/**
 * Naming convention utilities for DTO generation.
 */

/**
 * Extract the type name from an OpenAPI $ref string.
 * e.g. "#/components/schemas/UserDto" → "UserDto"
 *      "#/definitions/UserDto" → "UserDto"
 */
export function extractRefName(ref: string): string {
  const parts = ref.split('/');
  return parts[parts.length - 1];
}

/**
 * Convert a string to PascalCase for enum member names.
 * e.g. "my-value" → "MyValue", "MY_VALUE" → "MyValue"
 */
export function toPascalCase(str: string): string {
  return str
    .replace(/[-_]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^(.)/, (_, char) => char.toUpperCase());
}

/**
 * Check if a schema name represents an enum-like type
 * (heuristic: no "Dto" suffix and typically short names like "Status", "EventType").
 */
export function isLikelyEnumName(name: string): boolean {
  const enumSuffixes = ['Status', 'Type', 'Kind', 'Mode', 'Role', 'Level', 'State', 'Category'];
  return enumSuffixes.some((suffix) => name.endsWith(suffix)) && !name.includes('Dto');
}

/**
 * Sanitize a property name for TypeScript (handle reserved words, special chars).
 */
export function sanitizePropertyName(name: string): string {
  const reserved = new Set([
    'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
    'default', 'delete', 'do', 'else', 'enum', 'export', 'extends',
    'false', 'finally', 'for', 'function', 'if', 'import', 'in',
    'instanceof', 'new', 'null', 'return', 'super', 'switch', 'this',
    'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with',
  ]);

  if (reserved.has(name) || /[^a-zA-Z0-9_$]/.test(name)) {
    return `'${name}'`;
  }
  return name;
}
