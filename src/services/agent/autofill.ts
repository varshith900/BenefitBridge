import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Part } from '@google/generative-ai';
import type { UserProfile } from '../../types/user';

export interface ExtractedField {
  field: keyof UserProfile;
  label: string;
  value: string;
  confidence: 'High' | 'Medium' | 'Low';
  evidence: string;
}

export interface ExtractionResult {
  success: boolean;
  fields: ExtractedField[];
  message: string;
}

// Map common document types to the fields we expect to find
const DOC_FIELD_MAPPING: Record<string, Array<{ key: keyof UserProfile, label: string }>> = {
  'Aadhaar Card': [
    { key: 'dateOfBirth', label: 'Date of Birth' },
    { key: 'state', label: 'State' },
  ],
  'PAN Card': [
    { key: 'dateOfBirth', label: 'Date of Birth' }
  ],
  'Income Certificate': [
    { key: 'annualIncome', label: 'Annual Income' },
    { key: 'state', label: 'State' }
  ],
  'Caste Certificate': [
    { key: 'state', label: 'State' }
  ],
  'Degree Certificate': [
    { key: 'educationLevel', label: 'Education Level' }
  ]
};

async function fileToGenerativePart(file: File): Promise<Part> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function processDocumentForAutofill(
  file: File, 
  documentType: string
): Promise<ExtractionResult> {
  try {
    const expectedFields = DOC_FIELD_MAPPING[documentType];
    
    // If we don't know what to extract from this document, return empty fields but success
    if (!expectedFields || expectedFields.length === 0) {
      return {
        success: true,
        fields: [],
        message: 'Document saved successfully. No profile fields to extract from this document type.'
      };
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const isGeminiAvailable = !!apiKey && apiKey.startsWith('AIzaSy');

    if (!isGeminiAvailable) {
      console.warn('Gemini API key is missing or invalid. Skipping autofill extraction.');
      return {
        success: true,
        fields: [],
        message: 'Document saved successfully. (AI extraction skipped due to missing API key)'
      };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
      systemInstruction: "You are a secure document data extractor. Never output the full text of the document. Only output valid JSON matching the requested schema."
    });

    
    const filePart = await fileToGenerativePart(file);
    const fieldNames = expectedFields.map(f => f.key).join(', ');
    
    const prompt = `
Extract the following fields from this ${documentType}: ${fieldNames}.

Respond ONLY with a JSON array of objects. Do not wrap in markdown or backticks.
If a field is not found or unclear, do not include it in the array.

Format for each object:
{
  "field": "the field key",
  "value": "the extracted value. For dates use YYYY-MM-DD. For income use a range like '250001-500000'. For state use 2-letter code.",
  "confidence": "High, Medium, or Low",
  "evidence": "A short 3-5 word snippet from the document proving the value"
}
`;

    const result = await model.generateContent([prompt, filePart]);
    const responseText = result.response.text();
    
    // Attempt to parse JSON
    let parsed: any[] = [];
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      return {
        success: false,
        fields: [],
        message: 'Could not structure the data from this document. It was saved to your vault but no profile fields were extracted.'
      };
    }

    if (!Array.isArray(parsed)) {
      return {
        success: false,
        fields: [],
        message: 'Extraction returned invalid format.'
      };
    }

    const extractedFields: ExtractedField[] = [];
    
    for (const item of parsed) {
      const match = expectedFields.find(f => f.key === item.field);
      if (match && item.value && item.confidence && item.evidence) {
        extractedFields.push({
          field: match.key,
          label: match.label,
          value: item.value,
          confidence: ['High', 'Medium', 'Low'].includes(item.confidence) ? item.confidence : 'Medium',
          evidence: item.evidence
        });
      }
    }

    if (extractedFields.length === 0) {
      return {
        success: true,
        fields: [],
        message: `Saved to vault. No relevant profile fields were found in this ${documentType}.`
      };
    }

    return {
      success: true,
      fields: extractedFields,
      message: `Extracted ${extractedFields.length} field(s) from your ${documentType}. Please review before applying.`
    };

  } catch (error: any) {
    console.error("Document extraction failed", error);
    return {
      success: false,
      fields: [],
      message: 'Automated extraction could not be completed. The document is securely stored in your vault.'
    };
  }
}
