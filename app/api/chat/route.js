
import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

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

    const response = await ai.models.generateContent({
     model: "gemini-3.8-flash",
      contents: message,
      config: {
        systemInstruction:
          "You are a helpful AI Study Planner Agent. " +
          "Help students organize assignments, prioritize deadlines, " +
          "create realistic study schedules, and understand difficult " +
          "subjects. Give clear, encouraging, practical answers.",
      },
    });

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
