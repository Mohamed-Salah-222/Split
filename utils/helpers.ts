function isValidId(id: any) {
  if (typeof id !== "string" || !id) {
    return false;
  }
  return true;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}


function normalizePhoneNumber(phone: string): string {
  const countryCode = "+20";

  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  if (cleaned.startsWith(countryCode)) {
    return cleaned;
  }

  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return countryCode + cleaned.slice(1);
  }

  if (cleaned.length === 10 && !cleaned.startsWith('0')) {
    return countryCode + cleaned;
  }

  return phone;
}

function createWpSendMessageLink(message: string, phone: string): string {
  try {
    const baseUrl = "https://api.whatsapp.com/send?phone=";
    const url = baseUrl + phone + "&text=" + message;
    console.log("Created whatsapp message link: ", url);
    return url;
  }
  catch (error) {
    console.error("Error creating whatsapp message link: ", error);
    return "Error";
  }
}

export { isValidId, generateId, createWpSendMessageLink, normalizePhoneNumber };
