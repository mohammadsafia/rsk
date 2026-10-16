/**
 * Throw from FormWizard's onSubmit to report server-side field errors:
 * `throw new FormWizardError({ phone: 'Number already registered' })`.
 * The wizard sets each error and jumps to the first step that owns one of the fields.
 */
export class FormWizardError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(fieldErrors: Record<string, string>, message = 'FormWizard field errors') {
    super(message);
    this.name = 'FormWizardError';
    this.fieldErrors = fieldErrors;
  }
}
