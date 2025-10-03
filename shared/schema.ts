import { z } from "zod";

export const dataPointSchema = z.object({
  timestamp: z.string(),
  thrust: z.number(),
  pressure: z.number(),
  deviceTimestamp: z.string().optional(),
});

export type DataPoint = z.infer<typeof dataPointSchema>;

export const serialConfigSchema = z.object({
  baudRate: z.number(),
  dataBits: z.number().optional(),
  stopBits: z.number().optional(),
  parity: z.enum(['none', 'even', 'odd']).optional(),
});

export type SerialConfig = z.infer<typeof serialConfigSchema>;
