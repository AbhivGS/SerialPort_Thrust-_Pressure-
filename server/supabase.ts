import { Buffer } from "node:buffer";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "serialgrapher-recordings";
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabaseClient: SupabaseClient | null = null;
let bucketInitialised = false;

export type SupabaseUploadResult = {
  provider: "supabase";
  path: string;
  publicUrl: string | null;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function getClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }

  return supabaseClient;
}

async function ensureBucket(client: SupabaseClient) {
  if (bucketInitialised) {
    return;
  }

  try {
    const { data } = await client.storage.getBucket(SUPABASE_BUCKET);
    if (!data) {
      await client.storage.createBucket(SUPABASE_BUCKET, {
        public: true,
        fileSizeLimit: "10485760",
      });
    }
  } catch (error) {
    console.warn("Failed to verify Supabase bucket", error);
  }

  bucketInitialised = true;
}

function toSafeFileName(baseName: string): string {
  const safeBase = baseName.replace(/[^a-zA-Z0-9-_]/g, "_") || "recording";
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${safeBase}-${timestamp}.csv`;
}

export async function uploadCsvToSupabase(fileName: string, csv: string): Promise<SupabaseUploadResult | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  await ensureBucket(client);

  const objectPath = toSafeFileName(fileName);
  const { error } = await client.storage
    .from(SUPABASE_BUCKET)
    .upload(objectPath, Buffer.from(csv, "utf-8"), {
      contentType: "text/csv",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = client.storage.from(SUPABASE_BUCKET).getPublicUrl(objectPath);

  return {
    provider: "supabase",
    path: objectPath,
    publicUrl: publicUrl ?? null,
  };
}
