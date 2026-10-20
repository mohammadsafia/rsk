/** A practical email check (something@domain.tld, no spaces, one @); the API has the last word. */
const isEmail = (value: string) => {
  const at = value.indexOf('@');
  const domain = value.slice(at + 1);
  // A dot inside the domain, with something on both sides.
  return at > 0 && at === value.lastIndexOf('@') && !/\s/.test(value) && domain.slice(1, -1).includes('.');
};

// The sign-in pages validate with react-hook-form's own rules rather than a schema library: they are a signed-out
// visitor's first load, and two fields don't need one.
export const emailRules = (message: string) => ({
  validate: (value: string) => isEmail(value.trim()) || message,
});

export const requiredRules = (message: string) => ({ required: message });
