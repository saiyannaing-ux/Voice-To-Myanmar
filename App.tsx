
import { GoogleGenAI, Modality, Type } from "@google/genai";

export const refineMyanmarText = async (rawText: string): Promise<string> => {
  if (!rawText.trim()) return '';
  
  // Use process.env.API_KEY directly in the constructor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
      You are a professional bilingual linguist specializing in Myanmar and English. 
      The following text is a raw speech-to-text transcription which may contain a mix of Myanmar and English (code-switching).
      
      Your task:
      1. Refine the text into natural, flowing, and grammatically correct sentences.
      2. Fix punctuation and remove redundant fillers (like "um", "ah", "ဟိုလေ").
      3. PRESERVE English words/terms if they are used as loanwords or technical terms (e.g., "Meeting", "Check", "File").
      4. Ensure the transition between Myanmar and English script is clean.
      5. Return ONLY the refined text. No explanations.

      RAW TRANSCRIPTION:
      ${rawText}
    `,
    config: {
      temperature: 0.3,
    },
  });

  return response.text || rawText;
};

export const createLiveSession = (
  callbacks: {
    onTranscription: (text: string) => void;
    onError: (err: any) => void;
    onClose: () => void;
  }
) => {
  // Use process.env.API_KEY directly in the constructor
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => console.log('Live session opened'),
      onmessage: async (message) => {
        if (message.serverContent?.inputTranscription) {
            callbacks.onTranscription(message.serverContent.inputTranscription.text);
        }
      },
      onerror: (e) => callbacks.onError(e),
      onclose: () => callbacks.onClose(),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      systemInstruction: `
        You are a highly accurate transcription assistant. 
        You will hear speech in Myanmar, English, or a mixture of both (code-switching). 
        Transcribe exactly what is spoken. 
        - Write Myanmar speech in Myanmar Unicode script.
        - Write English speech in standard English (Latin) script.
        - Do not translate the English into Myanmar or vice versa.
        - Be precise with technical English terms used in conversation.
        - You don't need to respond with audio, just provide transcription data.
      `,
    },
  });
};
