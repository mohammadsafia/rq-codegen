export function validateName(value: string): true | string {
  if (!value || value.trim() === '') return 'Name is required';
  if (/[^a-zA-Z0-9-]/.test(value)) return 'Name must be alphanumeric (hyphens allowed)';
  return true;
}

export function validatePascalCase(value: string): true | string {
  if (!value || !/^[A-Z][a-zA-Z0-9]*$/.test(value)) {
    return 'Name must be PascalCase (e.g., UserProfile)';
  }
  return true;
}
