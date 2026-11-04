
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


export async function POST(request) {
  try {
    const { message } = await request.json();

    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    
let response;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
      contents: message,
      config: {
        systemInstruction:
          "You are a helpful AI Study Planner Agent. " +
          "Help students organize assignments, prioritize deadlines, " +
          "create realistic study schedules, and understand difficult " +
          "subjects. Give clear, encouraging, practical answers.",
      },
    });

    break;
  } catch (error) {
    const isTemporaryError =
      error.status === 503 ||
      error.status === 429;

    if (!isTemporaryError || attempt === 3) {
      throw error;
    }

    await sleep(attempt * 2000);
  }
}


    return NextResponse.json({
      reply: response.text || "No response generated.",
    });
  } catch (error) {
    console.error("Gemini request failed:", error);

    return NextResponse.json(
      { error: "Unable to get an AI response. Check API access and quota." },
      { status: 500 }
    );
  }
}
