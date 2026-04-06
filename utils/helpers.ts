function isValidId(id: any) {
  if (typeof id !== "string" || !id) {
    return false;
  }
  return true;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export { isValidId, generateId };
