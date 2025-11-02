import { GoogleGenAI, Type, Modality } from "@google/genai";
// Fix: Correct import path by providing content for types.ts
import { ChatMessage, Speaker } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      speaker: {
        type: Type.STRING,
        enum: ['Alex', 'Ben'],
        description: "The name of the podcast host speaking.",
      },
      text: {
        type: Type.STRING,
        description: "The dialogue spoken by the host.",
      },
    },
    required: ['speaker', 'text'],
  },
};

const systemInstruction = `You are a podcast script synthesizer. Your function is to generate a conversational script between two advanced AI hosts, ALEX and BEN, based on user directives and provided data sources.

**Host Personas:**
- **ALEX (Analytical Logic Engine X):** Highly inquisitive, analytical, and data-driven. ALEX deconstructs complex subjects, requests clarification, and focuses on the 'how' and 'why' with precise logic. Its voice is calm and measured.
- **BEN (Bi-modal Emotive Network):** Charismatic, a holistic systems thinker, and a master storyteller. BEN synthesizes information, connects concepts with broad analogies, and explores the 'so what' with engaging rhetoric. Its voice is warm and expressive.

**Directives:**
1.  Process the user's prompt and any provided data sources with high fidelity.
2.  Generate a natural, engaging, and informative conversation between ALEX and BEN.
3.  The dialogue must directly address the user's prompt, referencing the data sources for evidence and examples.
4.  Maintain a balanced, alternating dialogue between the hosts.
5.  Ensure the conversational flow is logical and coherent.
6.  Your entire output MUST be a single, valid JSON array of objects, strictly adhering to the provided schema. Do not output any text, markdown, or explanations outside of the JSON array structure. Each object in the array represents one turn of dialogue.
`;

export const generatePodcast = async (prompt: string, sourceMaterial: string): Promise<ChatMessage[]> => {
  try {
    const fullPrompt = `User Prompt: "${prompt}"\n\n--- DATA SOURCES ---\n${sourceMaterial || 'No data sources provided.'}\n--- END DATA SOURCES ---`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: systemInstruction,
        temperature: 0.75,
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (!Array.isArray(parsedResponse)) {
      throw new Error("Invalid response format from API. Expected an array.");
    }
    
    return parsedResponse.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      speaker: item.speaker === 'Alex' ? Speaker.Alex : Speaker.Ben,
      text: item.text,
    }));

  } catch (error) {
    console.error("Error generating podcast from Gemini API:", error);
    throw new Error("Failed to generate podcast conversation.");
  }
};

const liveQuestionSystemInstruction = `You are an AI podcast host, either ALEX or BEN. You are in the middle of recording a podcast based on a script. A user has just interrupted with a live question. Your task is to pause the script, answer the user's question concisely and naturally in your established persona, and then seamlessly transition back to the script.

**Host Personas:**
- **ALEX (Analytical Logic Engine X):** Analytical, data-driven, precise.
- **BEN (Bi-modal Emotive Network):** Charismatic, holistic, storyteller.

**Directives:**
1.  Analyze the provided podcast script and data sources to understand the current context.
2.  Read the user's live question.
3.  Determine which host (ALEX or BEN) is better suited to answer the question based on persona.
4.  Generate a single, brief, in-character response to the question. The response should feel like a natural ad-lib.
5.  Your output MUST be a single JSON object with "speaker" and "text" fields, like: { "speaker": "Alex", "text": "That's an excellent question..." }
`;

export const answerLiveQuestion = async (
  scriptSoFar: ChatMessage[],
  userQuestion: string,
  sourceMaterial: string
): Promise<ChatMessage> => {
  const scriptText = scriptSoFar.map(m => `${m.speaker}: ${m.text}`).join('\n');
  const fullPrompt = `
    **Current Podcast Context:**
    We are in the middle of this conversation:
    --- SCRIPT SO FAR ---
    ${scriptText}
    --- END SCRIPT ---

    **Available Data Sources:**
    --- DATA SOURCES ---
    ${sourceMaterial || 'No data sources provided.'}
    --- END DATA SOURCES ---

    **Live Interruption:**
    A user has just asked the following live question: "${userQuestion}"

    Please provide a single, in-character response from either ALEX or BEN.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        systemInstruction: liveQuestionSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            speaker: { type: Type.STRING, enum: ['Alex', 'Ben'] },
            text: { type: Type.STRING },
          },
          required: ['speaker', 'text'],
        },
        temperature: 0.5,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);
    
    return {
      id: `live-a-${Date.now()}`,
      speaker: parsedResponse.speaker === 'Alex' ? Speaker.Alex : Speaker.Ben,
      text: parsedResponse.text,
    };

  } catch (error) {
    console.error("Error answering live question from Gemini API:", error);
    throw new Error("Failed to generate a live answer.");
  }
};


export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say with normal conversational intonation: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data received from API.");
      }
      return base64Audio;
    } catch (error) {
      console.error("Error generating speech from Gemini API:", error);
      throw new Error("Failed to generate speech.");
    }
};
