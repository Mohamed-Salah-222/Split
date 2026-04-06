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
  const def = "+201"
  if (!phone.startsWith(def)) {
    if (phone.length === 11) {
      return def + phone.slice(2, 11);
    }
  }
  return phone
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
