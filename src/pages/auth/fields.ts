/** A practical email check (something@domain.tld); the API has the last word. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The sign-in pages validate with react-hook-form's own rules rather than a schema library: they are a signed-out
// visitor's first load, and two fields don't need one.
export const emailRules = (message: string) => ({
  validate: (value: string) => EMAIL.test(value.trim()) || message,
});

export const requiredRules = (message: string) => ({ required: message });
