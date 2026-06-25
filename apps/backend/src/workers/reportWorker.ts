/**
 * Atlas AI Report Worker (Gemini Edition)
 *
 * BullMQ Worker that processes jobs from the 'ai-reports' queue using
 * the official Google Gen AI SDK (@google/genai) with gemini-2.5-flash.
 *
 * Architecture:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Model: gemini-2.5-flash
 * 2. Structured Output: Enforced via Zod schema (summary, flaggedIssues, recommendedActions).
 * 3. Dead-Letter Strategy: BullMQ retries up to 3x with exponential
 *    backoff. On the 4th failure (attemptsMade == 3), the job is moved
 *    to the DLQ.
 */

import dotenv from 'dotenv';
dotenv.config();

import { Worker, type Job } from 'bullmq';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';
import type { AiReportJobPayload } from '../queues/aiReportQueue.js';
import { jobEventEmitter } from '../routes/events.js';
import { db } from '../db/index.js';
import { aiReports } from '../db/schema.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const QUEUE_NAME = 'ai-reports';
const MODEL_NAME = 'gemini-2.5-flash';

// ─── Zod Schema for App Layer ─────────────────────────────────────────────────

export const ReportSchema = z.object({
  summary: z.string(),
  flaggedIssues: z.array(z.string()),
  recommendedActions: z.array(z.string()),
});

export type AtlasReport = z.infer<typeof ReportSchema>;

// ─── Report Processor ─────────────────────────────────────────────────────────

async function processReportJob(
  bullJob: Job<AiReportJobPayload>
): Promise<AtlasReport> {
  const data = bullJob.data;

  // Initialize the official Google Gen AI SDK
  const ai = new GoogleGenAI({
    // automatically picks up GEMINI_API_KEY from environment
    apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || 'dummy-key',
  });

  console.log(
    `[reportWorker] Processing job ${data.jobNumber} | ` +
    `Attempt ${bullJob.attemptsMade + 1}/4 | Model: ${MODEL_NAME}`
  );

  const systemInstruction = `You are an AI field operations report writer for Atlas, a B2B platform.
Your task is to draft a structured inspection report based ONLY on the job data provided.
Do not invent or hallucinate data. Respond with the exact JSON structure required.`;

  const userPrompt = `Generate a structured inspection report for the following completed field job:

Job Number: ${data.jobNumber}
Title: ${data.title}
Location: ${data.location}
Status: ${data.status}
Priority: ${data.priority}
Technician: ${data.technicianName ?? 'Unassigned'}
Notes: ${data.notes ?? 'No notes provided'}
Checklist Items:
${data.checklist.map((c) => `- ${c}`).join('\n')}
`;

  // ── Call Gemini API ────────────────────────────────────────────────────────
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: userPrompt,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.1,
      // Define the required structured output format
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A detailed text description of the inspection.",
          },
          flaggedIssues: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of text items representing failures or warning signs.",
          },
          recommendedActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of text items outlining next steps.",
          },
        },
        required: ["summary", "flaggedIssues", "recommendedActions"],
      },
    },
  });

  const rawContent = response.text;
  if (!rawContent) {
    throw new Error('Gemini API returned an empty response');
  }

  // ── Zod Validation ─────────────────────────────────────────────────────────
  // If the schema doesn't match, Zod throws → BullMQ catches it and retries the job
  const parsed = ReportSchema.parse(JSON.parse(rawContent));

  console.log(
    `[reportWorker] ✅ Report generated for ${data.jobNumber} | ` +
    `Model: ${MODEL_NAME} | Flagged issues: ${parsed.flaggedIssues.length}`
  );

  return parsed;
}

// ─── Worker Initialization ────────────────────────────────────────────────────

export function startReportWorker(): Worker<AiReportJobPayload> {
  const worker = new Worker<AiReportJobPayload>(
    QUEUE_NAME,
    processReportJob,
    {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
      concurrency: 2, // Process up to 2 reports simultaneously
    }
  );

  // ── Event Handlers ─────────────────────────────────────────────────────────

  worker.on('completed', async (job, result: AtlasReport) => {
    console.log(
      `[DLQ] ✅ Job ${job.id} completed | ` +
      `Summary: ${result.summary.substring(0, 80)}...`
    );

    // Persist the report to PostgreSQL for the dashboard
    try {
      await db.insert(aiReports).values({
        jobId: job.data.jobId,
        jobNumber: job.data.jobNumber,
        title: job.data.title,
        location: job.data.location,
        priority: job.data.priority,
        summary: result.summary,
        flaggedIssues: JSON.stringify(result.flaggedIssues),
        recommendedActions: JSON.stringify(result.recommendedActions),
      });
      console.log(`[reportWorker] 💾 Report saved to DB for job ${job.data.jobNumber}`);
    } catch (dbErr) {
      console.error(`[reportWorker] ❌ Failed to save report to DB:`, dbErr);
    }

    // Send an SSE update indicating AI report is done
    jobEventEmitter.emit('job_updated', {
      id: job.data.jobId,
      status: 'completed',
      column: 'completed',
      aiReportGenerated: true,
      jobNumber: job.data.jobNumber,
      title: job.data.title,
    });
  });

  worker.on('failed', (job, err) => {
    const attemptsMade = job?.attemptsMade || 0;
    const maxAttempts = job?.opts.attempts ?? 3;

    if (attemptsMade >= maxAttempts) {
      // All retries exhausted — treat as Dead Letter Queue entry
      console.error(
        `\n[DLQ] ☠️  DEAD LETTER: Job ${job?.id} (${job?.data?.jobNumber}) moved to DLQ after failing all retries.` +
        `\n[DLQ]    Job ID:   ${job?.id}` +
        `\n[DLQ]    Job Data: ${JSON.stringify(job?.data)}` +
        `\n[DLQ]    Error:    ${err.message}` +
        `\n[DLQ]    Action:   Manual triage required. Inspect via BullMQ Board.\n`
      );
    } else {
      console.warn(
        `[reportWorker] ⚠️  Job ${job?.id} failed (attempt ${attemptsMade}/${maxAttempts}). ` +
        `Retrying with exponential backoff. Error: ${err.message}`
      );
    }
  });

  worker.on('error', (err) => {
    console.error('[reportWorker] Worker error:', err.message);
  });

  console.log(`🤖 AI Report Worker (Gemini) started — listening on queue: "${QUEUE_NAME}"`);
  return worker;
}
