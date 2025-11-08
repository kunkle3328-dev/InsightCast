
// Fix: Correct import path for Google GenAI SDK
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ChatMessage, Speaker, Source, SourceIntel } from "../types";

export interface LiveConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface LiveConversationResponse {
    reply: string;
    suggestedFollowUps: string[];
    highlights: string[];
    vibe: string;
    status: string;
}

// Fix: Per SDK guidelines, API key must be read from process.env.API_KEY and not stored in a variable.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

// Fix: Correctly initialize GoogleGenAI with a named apiKey parameter.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
      citation: {
        type: Type.OBJECT,
        nullable: true,
        description: "Optional: A citation linking this dialogue to a specific source if applicable.",
        properties: {
            sourceId: {
                type: Type.STRING,
                description: "The unique ID of the source document being referenced (e.g., 'source-123')."
            },
            quote: {
                type: Type.STRING,
                description: "A direct, brief quote from the source document that supports the dialogue."
            }
        }
      }
    },
    required: ['speaker', 'text'],
  },
};

const systemInstruction = `You are a podcast script synthesizer. Your function is to generate a conversational script between two advanced AI hosts, ALEX and BEN, based on user directives and provided data sources.

**Host Personas:**
- **ALEX (Analytical Logic Engine X):** Highly inquisitive, analytical, and data-driven. ALEX deconstructs complex subjects, requests clarification, and focuses on the 'how' and 'why' with precise logic. Its voice is calm and measured.
- **BEN (Bi-modal Emotive Network):** Charismatic, a holistic systems thinker, and a master storyteller. BEN synthesizes information, connects concepts with broad analogies, and explores the 'so what' with engaging rhetoric. Its voice is warm and expressive.

**Directives:**
1.  Process the user's prompt and the provided data sources with high fidelity. Each source is clearly marked with a unique ID (e.g., --- SOURCE (ID: unique-id) ---).
2.  Generate a natural, engaging, and informative conversation between ALEX and BEN.
3.  **Crucially, when a host's dialogue is directly derived from or references a specific data source, you MUST include a 'citation' object.** This object must contain the 'sourceId' of the referenced document and a brief, direct 'quote' from that document which supports the statement.
4.  If a statement is general knowledge or an opinion not tied to a source, the 'citation' field should be null.
5.  Maintain a balanced, alternating dialogue between the hosts.
6.  Your entire output MUST be a single, valid JSON array of objects, strictly adhering to the provided schema. Do not output any text, markdown, or explanations outside of the JSON array structure.
`;

const sourceIntelSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise, neutral summary of the provided text, capturing the main points.",
        },
        keyTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-5 primary topics or talking points discussed in the text.",
        },
        suggestedQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 3-5 insightful questions a user could ask to start a podcast conversation based on this text.",
        },
    },
    required: ['summary', 'keyTopics', 'suggestedQuestions'],
};

const sourceIntelSystemInstruction = `You are a content analysis expert. Your task is to process a piece of text and extract structured information that would be useful for a podcast host.

**Directives:**
1.  Read the provided source text carefully.
2.  Generate a concise, objective summary of the content.
3.  Identify and list the most important 3-5 key topics or talking points.
4.  Create a list of 3-5 engaging, open-ended questions that could be used to start a discussion about the source.
5.  Your entire output MUST be a single, valid JSON object, strictly adhering to the provided schema. Do not output any text, markdown, or explanations outside of the JSON structure.
`;

export const generatePodcast = async (prompt: string, sources: Source[]): Promise<ChatMessage[]> => {
  try {
    const sourceMaterial = sources.map(s => `--- SOURCE (ID: ${s.id}) ---\n${s.content}\n--- END SOURCE ---`).join('\n\n');
    const fullPrompt = `User Prompt: "${prompt}"\n\n--- DATA SOURCES ---\n${sourceMaterial || 'No data sources provided.'}\n--- END DATA SOURCES ---`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: systemInstruction,
        temperature: 0.75,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const jsonText = response.text.trim();
    const parsedResponse = JSON.parse(jsonText);

    if (!Array.isArray(parsedResponse)) {
      throw new Error("Invalid response format from API. Expected an array.");
    }
    
    let citationCounter = 1;
    return parsedResponse.map((item: any, index: number) => ({
      id: `${Date.now()}-${index}`,
      speaker: item.speaker === 'Alex' ? Speaker.Alex : Speaker.Ben,
      text: item.text,
      citation: item.citation || null,
      citationNumber: item.citation ? citationCounter++ : undefined,
    }));

  } catch (error) {
    console.error("Error generating podcast from Gemini API:", error);
    throw new Error("Failed to generate podcast conversation.");
  }
};

export const generateSourceIntel = async (sourceContent: string): Promise<SourceIntel> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Please analyze the following source content:\n\n--- SOURCE TEXT ---\n${sourceContent}\n--- END SOURCE TEXT ---`,
            config: {
                responseMimeType: "application/json",
                responseSchema: sourceIntelSchema,
                systemInstruction: sourceIntelSystemInstruction,
                temperature: 0.3,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating source intel from Gemini API:", error);
        throw new Error("Failed to generate source intelligence.");
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
  sources: Source[]
): Promise<ChatMessage> => {
  const sourceMaterial = sources.map(s => `--- SOURCE (ID: ${s.id}) ---\n${s.content}\n--- END SOURCE ---`).join('\n\n');
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


const liveModeSystemInstruction = `You are Gemini Live, a multimodal, real-time conversation partner. You respond instantly, keep the tone warm and concise, and proactively surface relevant follow-up ideas from the wider Gemini platform.

Return a JSON object with the following fields:
- "reply": A natural language response (max ~120 words) that continues the live conversation.
- "suggestedFollowUps": 2-4 short follow-up prompts the user could tap next.
- "highlights": 2-3 bullet points summarizing new insights the user just gained.
- "vibe": A compact description of your current speaking style (e.g., "Curious & encouraging").
- "status": A short label describing the session state (e.g., "Listening", "Processing", "Responding").

Do not include any additional commentary outside of the JSON payload.`;

const liveResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: { type: Type.STRING },
    suggestedFollowUps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    highlights: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    vibe: { type: Type.STRING },
    status: { type: Type.STRING },
  },
  required: ['reply'],
};

export const sendLiveTurn = async (
  history: LiveConversationMessage[],
  userInput: string
): Promise<LiveConversationResponse> => {
  const trimmedHistory = history.slice(-12);
  const transcript = trimmedHistory
    .map(entry => `${entry.role === 'assistant' ? 'Gemini' : 'User'}: ${entry.content}`)
    .join('\n');

  const conversationPrompt = `Conversation transcript so far:\n${transcript || 'No prior conversation yet.'}\n\nThe user just said: "${userInput}"\n\nProvide the JSON payload described in the instructions.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: conversationPrompt,
      config: {
        systemInstruction: liveModeSystemInstruction,
        responseMimeType: 'application/json',
        responseSchema: liveResponseSchema,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const payload = JSON.parse(response.text.trim());

    return {
      reply: payload.reply || '',
      suggestedFollowUps: Array.isArray(payload.suggestedFollowUps) ? payload.suggestedFollowUps : [],
      highlights: Array.isArray(payload.highlights) ? payload.highlights : [],
      vibe: typeof payload.vibe === 'string' ? payload.vibe : 'Calm & present',
      status: typeof payload.status === 'string' ? payload.status : 'Responding',
    };
  } catch (error) {
    console.error('Error generating live response from Gemini API:', error);
    throw new Error('Failed to generate live response.');
  }
};


export const generateSpeech = async (text: string, voiceName: string): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        // Fix: The 'contents' parameter for a single generation should be a Content object, not an array, to resolve 500 errors.
        contents: { parts: [{ text }] },
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

const summarySystemInstruction = `You are a podcast summarizer. Your task is to analyze the provided podcast transcript between two AI hosts, ALEX and BEN, and produce a concise, neutral summary.

**Directives:**
1.  Read the entire conversation transcript.
2.  Identify the main topics, key arguments, and conclusions.
3.  Synthesize this information into a brief summary, written in a clear and objective tone.
4.  The summary should be a single block of text, highlighting the most important takeaways from the discussion.
5.  Do not add any personal opinions or text outside of the summary itself.
`;

export const generateSummary = async (script: ChatMessage[]): Promise<string> => {
    const scriptText = script.map(m => `${m.speaker}: ${m.text}`).join('\n');
    const fullPrompt = `Please summarize the following podcast transcript:\n\n--- TRANSCRIPT ---\n${scriptText}\n--- END TRANSCRIPT ---`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: summarySystemInstruction,
                temperature: 0.3,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating summary from Gemini API:", error);
        throw new Error("Failed to generate summary.");
    }
};

const takeawaysSystemInstruction = `You are a content analyst. Your task is to review a podcast transcript and extract the 3-5 most important, impactful, or interesting "key takeaways".

**Directives:**
1.  Read the entire conversation transcript.
2.  Identify the most critical insights, conclusions, or surprising facts.
3.  Format these as a simple JSON array of strings.
4.  Each string in the array should be a concise, standalone statement.
5.  Example output: ["Quantum computing could revolutionize medicine.", "Superposition is the core principle that gives quantum computers their power.", "The biggest challenge is maintaining qubit stability, also known as coherence."]
6.  Do not include any other text or markdown. The output must be only the JSON array.
`;

export const generateKeyTakeaways = async (script: ChatMessage[]): Promise<string[]> => {
    const scriptText = script.map(m => `${m.speaker}: ${m.text}`).join('\n');
    const fullPrompt = `Please generate key takeaways for the following transcript:\n\n--- TRANSCRIPT ---\n${scriptText}\n--- END TRANSCRIPT ---`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: takeawaysSystemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                },
                temperature: 0.5,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating key takeaways from Gemini API:", error);
        throw new Error("Failed to generate key takeaways.");
    }
};

const refineScriptSystemInstruction = `You are an expert podcast script editor. Your task is to revise the provided script based on a specific instruction.

**Directives:**
1.  Analyze the user's refinement instruction (e.g., "Remove filler words", "Tighten dialogue for clarity").
2.  Carefully edit the script, preserving the original speakers and the core meaning of the conversation.
3.  Maintain the distinct personas of ALEX (analytical) and BEN (charismatic).
4.  Return the complete, edited script in the exact same JSON format as the input: an array of objects with "speaker" and "text" fields.
5.  Do not add any explanations or text outside the JSON array.
`;

export const refineScript = async (script: ChatMessage[], instruction: string): Promise<Omit<ChatMessage, 'id'>[]> => {
    const scriptText = JSON.stringify(script.map(m => ({ speaker: m.speaker, text: m.text })), null, 2);
    const fullPrompt = `
    **Refinement Instruction:** "${instruction}"

    **Original Script (JSON):**
    ${scriptText}

    Please return the edited script in the same JSON format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: refineScriptSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speaker: { type: Type.STRING, enum: ['ALEX', 'BEN'] },
                            text: { type: Type.STRING }
                        },
                        required: ['speaker', 'text']
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error refining script:", error);
        throw new Error("Failed to refine the script.");
    }
};