import { OpenAI } from "openai";

// API keys — only the dev team uses this app, hardcoding is acceptable per project decision
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
const GOOGLE_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY ?? "";

export type ParsedReceipt = {
  status: "success" | "error";
  message: string | null;
  confidence: number;
  data: {
    date: string | null;
    time: string | null;
    store: string | null;
    delivery_fee: number | null;
    delivery_number: string | null;
    tax: number;
    service: number;
    payment_method: string | null;
    total_price: number;
    discount: number;
    shipping_address: {
      address: string | null;
      city: string | null;
      country: string | null;
    };
    items: Array<{
      name: string;
      price: number | null;
      quantity: number;
    }>;
  };
};

/**
 * Sends a base64-encoded image to Google Cloud Vision and returns the OCR text annotations.
 * The image parameter must be a base64 string (no data URI prefix).
 */
async function callGoogleCloudVisionAPI(base64Image: string): Promise<any[]> {
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error("Google Vision API key is missing");
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

  const body = {
    requests: [
      {
        image: {
          content: base64Image,
        },
        features: [
          {
            type: "TEXT_DETECTION",
            maxResults: 1,
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Google Vision HTTP ${response.status}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(`Google Vision error: ${result.error.message}`);
  }

  if (!result.responses || !result.responses[0]) {
    throw new Error("Google Vision returned empty response");
  }

  if (result.responses[0].error) {
    throw new Error(`Google Vision response error: ${result.responses[0].error.message}`);
  }

  const textAnnotations = result.responses[0].textAnnotations;

  if (!textAnnotations || textAnnotations.length === 0) {
    throw new Error("No text detected in image");
  }

  return textAnnotations;
}

/**
 * Sends OCR tokens to OpenAI to parse them into a structured receipt.
 */
async function callOpenAI(textAnnotations: any[]): Promise<ParsedReceipt> {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key is missing — set OPENAI_API_KEY in backend/requests.ts");
  }

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const systemPrompt = `You are a receipt parser. You will receive an array of OCR tokens extracted from a receipt by Google Cloud Vision.
Each token has a "description" (the detected word) and a "boundingPoly" with vertex coordinates indicating its position on the receipt.
Your job is to analyze the spatial layout and text to identify all purchased items, prices, totals, and metadata.

Return ONLY a valid JSON object, no explanation, no markdown code fences. Use this exact format:
{
  "status": "success",
  "message": null,
  "confidence": 0.85,
  "data": {
    "date": "2020-01-01",
    "time": "12:00:00",
    "store": "Store name",
    "delivery_fee": null,
    "delivery_number": null,
    "tax": 0,
    "service": 0,
    "payment_method": "Cash",
    "total_price": 300,
    "discount": 0,
    "shipping_address": {
      "address": null,
      "city": null,
      "country": "EGYPT"
    },
    "items": [
      { "name": "Item 1", "price": 100, "quantity": 1 },
      { "name": "Item 2", "price": 200, "quantity": 2 }
    ]
  }
}

Rules:
- If quantity is not found for an item, default to 1.
- If price is not found, set to null.
- If a field is unknown, use null (or 0 for numeric totals like tax/discount).
- Status must be "success" if you successfully parsed at least the items array.
- Always return valid JSON parseable by JSON.parse().`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(textAnnotations) },
    ],
    max_tokens: 2048,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("OpenAI returned empty content");
  }

  // Strip markdown code fences if the model added them despite instructions
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean) as ParsedReceipt;
  } catch (err) {
    throw new Error(`OpenAI returned invalid JSON: ${clean.slice(0, 200)}`);
  }
}

/**
 * Main entry point. Takes a base64-encoded image of a receipt and returns a parsed structure.
 * Throws on any failure — the caller should wrap in try/catch.
 */
export async function transformImage(base64Image: string): Promise<ParsedReceipt> {
  if (!base64Image) {
    throw new Error("No image provided");
  }

  const ocrTokens = await callGoogleCloudVisionAPI(base64Image);
  const parsed = await callOpenAI(ocrTokens);
  return parsed;
}

// Backwards-compat alias for the misspelled name used elsewhere
export const tranformImage = transformImage;

/**
 * Builds a WhatsApp send-message link with proper URL encoding.
 * Phone number must already be normalized to international format without the + sign.
 */
export function createWpSendMessageLink(message: string, phone: string): string {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMessage}`;
}
