function isValidId(id: any): id is string {
  return typeof id === "string" && id.length > 0;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";

  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("20") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return "20" + digits.slice(1);
  }

  if (digits.length === 10) {
    return "20" + digits;
  }

  return digits;
}

function createWpSendMessageLink(message: string, phone: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
}

export { createWpSendMessageLink, generateId, isValidId, normalizePhoneNumber };
