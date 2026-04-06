import { OpenAI } from 'openai';


const ITEM_REGEX = /(^|[\s,;])(item|product|description|desc|name|article|goods|صنف|منتج|الوصف|اسم|سلعة)([\s,;]|$)/i;
const QUANTITY_REGEX = /(^|[\s,;])(qty|quantity|qnty|quant|count|pcs|units|كمية|الكمية|عدد|وحدات)([\s,;]|$)/i;
const PRICE_REGEX = /(^|[\s,;])(price|unit\s*price|rate|cost|amount|سعر|السعر|سعر\s*الوحدة|تكلفة|قيمة)([\s,;]|$)/i;
const TOTAL_REGEX = /(^|[\s,;])(total|sum|subtotal|net|gross|amount\s*due|الإجمالي|المجموع|المجموع\s*الفرعي|صافي|الإجمالي\s*النهائي)([\s,;]|$)/i;

const HEADER_MATCHERS = [
  ITEM_REGEX,
  QUANTITY_REGEX,
  PRICE_REGEX,
  TOTAL_REGEX,
];

function getTable(tesxtAnnotations: any) {
  // const file = fs.readFileSync('output-example.json', 'utf8');
  // const obj = JSON.parse(file);
  const obj = tesxtAnnotations;
  console.log("file data: ", obj);
  for (let i = 0; i < obj.length; i++) {
    const row = obj[i];
    const values = Object.values(row).map(v => String(v ?? ''));

    const isHeader = HEADER_MATCHERS.some(regex =>
      values.some(val => regex.test(val))
    );

    if (isHeader) {
      obj.splice(0, i); // remove rows before the header
      return obj;
    }
  }

  throw new Error('No header found');
}

async function callGoogleCloudVisionAPI(image: File): Promise<any> {
  const apiKey = "AIzaSyDMZIGSg8Tlmy-KNSyCCfB8QfxFYEjaTF8"; // add api key here manually (fr5a and sla7)

  const test_image_url = "https://pbs.twimg.com/media/Fjfg7PzWQAElNEu?format=jpg&name=large";


  console.log('Sending image to Google Cloud Vision (REST API)...');

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

  const body = {
    requests: [
      {
        image: {
          source: {
            imageUri: test_image_url
          }
        },
        features: [
          {
            type: "TEXT_DETECTION"
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    const textAnnotations = result.responses[0].textAnnotations;
    const table = getTable(textAnnotations);

    console.log('Text annotations:', table);
    // fs.writeFileSync('table.json', JSON.stringify(table, null, 2));
    // fs.writeFileSync('textAnnotations.json', JSON.stringify(textAnnotations, null, 2));
    // fs.writeFileSync('fulltext.json', JSON.stringify(result, null, 2));
    if (result.error) {
      console.error('Error from Google Cloud Vision:', result.error.message);
      return;
    }


    const detections = result.responses[0].textAnnotations;

    console.log('Detected Text:');
    if (detections && detections.length > 0) {
      console.log(detections[0].description); // The first element is the full text
    } else {
      console.log('No text detected.');
    }

    return detections;
  } catch (err) {
    console.error('Error during OCR analysis:', err.message);
  }

}
async function callOpenAI(parsedTokens: any): Promise<any> {
  // const tokens = fs.readFileSync("res2.json");
  // const parsedTokens = JSON.parse(tokens);

  const apiKey = ""; // add api key here manually (fr5a and sla7)
  if (!apiKey) {
    console.error("Please set openai key.");
    return;
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const systemPrompt = `You are a receipt parser. You will receive an array of OCR tokens extracted from a receipt.
Extract all the data from it like date,totoal payment method, etc
Each token has a "description" (the word) and a "boundingPoly" with vertex coordinates indicating its position on the receipt.
Your job is to analyze the spatial layout and text to identify all purchased items.
Return ONLY a valid JSON array, no explanation, no markdown. Format:
{
  status: "success",
  message: null, // if there is an error, this will be the error message
  confidence: 0.85, // confidence of the prediction
  data: {
      date: "2020-01-01",
      time: "12:00:00",
      store: "abo lbn",
      delivery_fee: 10,
      delivery_number: 01000049956,
      tax: 0,
      service: 0,
      payment_method: "Cash",
      total_price: 300,
      discount: 0,
      shipping_address: {
        address: "123 Main St",
        city: "Anytown",
        country: "EGYPT"
      },
      items: [
        {
          name: "Item 1",
          price: 100,
          quantity: 10
        },
        {
          name: "Item 2",
          price: 200,
          quantity: 20
        }
      ],
  },
}
If quantity is not found, default to 1. If price is not found, set to null.`;

  console.log('Sending tokens to OpenAI (gpt-4o)...');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: JSON.stringify(parsedTokens)
        }
      ],
      max_tokens: 1024,
    });

    const raw = response.choices[0].message.content;

    // Strip markdown code fences if present
    const clean = raw!.replace(/```json|```/g, '').trim();
    const items = JSON.parse(clean);

    console.log('Parsed Items:', items);
    return items;

  } catch (err) {
    console.error('Error during OpenAI analysis:', err.message);
  }
}

export async function tranformImage(image: File): Promise<any> {
  try {
    const googleResponse = await callGoogleCloudVisionAPI(image);
    const parsedTokens = await callOpenAI(googleResponse);


    return parsedTokens;
  } catch (err) {
    console.error('Error during OCR analysis:', err.message);
  }
}


export function createWpSendMessageLink(message: string, phone: string): string {
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
