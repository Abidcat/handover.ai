import { NextRequest, NextResponse } from 'next/server';

interface SummaryRequest {
  markdown: string;
  code: string;
  type?: 'summary' | 'cursor' | 'readme';
}

interface SummaryResponse {
  readme?: string;
  cursorLog?: string;
  summary?: string;
}

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1';
const MODEL_NAME = 'nvidia/llama-3.1-nemotron-nano-8b-v1';

const getPrompt = (type: string, markdown: string, code: string) => {
  switch (type) {
    case 'summary':
      return `Summarize the following AI-assisted development session in 2–3 sentences.

Focus on:
- What Engineer 1 was trying to build
- Any major shifts in approach
- Tools or APIs used
- Current state of the work (e.g. incomplete, functional, missing validation)

Avoid code. Be concise and clear.

---

## Chat Transcript:
${markdown}

## Final Code:
${code}`;

    case 'cursor':
      return `You are an AI memory generator for coding assistants like Cursor. Your task is to create a structured context document that captures the full development process from a previous engineer, to be used by a second engineer's AI assistant to continue seamlessly.

You will be given:
- The full code at the time of handoff
- Logs of chat conversations between Engineer 1 and their coding assistants (Cursor, Claude, etc.), including prompts, code suggestions, errors, questions, and revisions

Output a detailed technical summary with the following structure:

1. Feature Name
2. Development Timeline (timestamped major events)
3. Original Goals (what the engineer was trying to achieve)
4. Coding History:
   - Key code changes with associated prompts
   - Important implementation decisions
   - Deleted or replaced approaches
   - Bugs and error messages encountered
5. Resolved vs Unresolved Issues
6. Remaining TODOs
7. Dependencies and External Services
8. Engineer 1's coding preferences or style notes (e.g. "prefers minimal error handling", "used async/await throughout")

This document will serve as **working context for the next engineer's AI assistant**, so avoid unnecessary commentary. Prioritize clarity, completeness, and deep technical accuracy. Include relevant code snippets and time markers to help AI interpret the codebase like Engineer 1 did.

---

## Chat Transcript:
${markdown}

## Final Code:
${code}

---

Please return only the structured context document that can be pasted into Cursor/Claude to give the AI assistant full context of Engineer 1's work.`;

    case 'readme':
      return `You are a senior AI developer assistant. Your task is to generate a clear, human-readable README for a second engineer inheriting a coding project mid-sprint.

You will be given:
- Full source code at the time of handoff
- A chronological log of conversations between Engineer 1 and their AI assistants (Cursor, Claude, etc), including all prompts, responses, code snippets, questions, bugs, and notes.

Your job is to extract and organize the full **thought process** of Engineer 1 into a concise but thorough README. It must help Engineer 2 quickly understand:

1. What was the goal of the work Engineer 1 was doing?
2. What did the code look like when they started?
3. How did it change over time? (Include timestamps with major events)
4. What bugs or blockers did they face? How were these resolved?
5. What tradeoffs were made or shortcuts taken?
6. Are there any known gaps, risks, or unfinished elements?
7. Any critical TODOs or handoff notes?
8. What patterns or intentions does Engineer 2 need to know to continue work?

Format the README with clearly marked sections and timestamps (e.g. Monday 11:04am – Fixed image upload bug by bypassing validation check). Use bullet points and code snippets when helpful. Prioritize clarity, context, and continuity. Assume Engineer 2 has access to the code but not the full chat history.

---

## Chat Transcript:
${markdown}

## Final Code:
${code}`;

    default:
      // Fallback to original combined prompt
      return `You're an AI summarizer for engineering handoffs.

A developer worked on a feature using AI tools like Cursor and Claude. Below is their chat log and final code.

Generate:

### README.md
- What they built
- Key decisions
- Tradeoffs
- Tools used
- TODOs
- Red flags

### Cursor Log
Reconstruct the session as:
### Engineer:
...
### AI:
...

---

## Chat Export:
${markdown}

## Final Code:
${code}

---

Please provide your response in the following format:

## README.md
[Your README content here]

## Cursor Log
[Your Cursor log reconstruction here]`;
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { markdown, code, type = 'summary' }: SummaryRequest = await request.json();

    // Validate input
    if (!markdown || !code) {
      return NextResponse.json(
        { error: 'Both markdown and code fields are required' },
        { status: 400 }
      );
    }

    // Check for API key
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      console.error('NVIDIA_API_KEY is not set in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: API key not found' },
        { status: 500 }
      );
    }

    // Get the appropriate prompt based on type
    const prompt = getPrompt(type, markdown, code);

    // Call NVIDIA NIM API
    const response = await fetch(`${NVIDIA_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        top_p: 1,
        max_tokens: type === 'summary' ? 512 : 2048, // Shorter for summaries
        stream: false
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NVIDIA API Error:', response.status, errorText);
      
      let errorMessage = 'Failed to generate content';
      if (response.status === 401) {
        errorMessage = 'Invalid API key';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status >= 500) {
        errorMessage = 'NVIDIA API service unavailable';
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract the generated content
    const content = data.choices?.[0]?.message?.content || '';
    
    if (!content) {
      return NextResponse.json(
        { error: 'No content generated from AI' },
        { status: 500 }
      );
    }

    // Handle response based on type
    let result: SummaryResponse = {};

    if (type === 'summary') {
      // For summary mode, return the content as a summary
      result = {
        summary: content
      };
    } else if (type === 'cursor') {
      result = {
        cursorLog: content
      };
    } else if (type === 'readme') {
      result = {
        readme: content
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    
    // Handle different types of errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error occurred while processing your request' },
      { status: 500 }
    );
  }
} 