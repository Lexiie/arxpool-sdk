import { z } from 'zod';
import { ArxPoolError } from './errors.js';

const DEFAULT_API_BASE = 'https://collector.arxpool.dev';

const configSchema = z.object({
  apiBase: z
    .string()
    .url()
    .refine((value) => value.startsWith('https://'), 'Collector endpoint must use HTTPS'),
  mxeId: z.string().min(1).optional(),
  attesterSecret: z.string().min(32).optional(),
  arciumApiKey: z.string().min(16).optional()
});

export type SdkConfig = z.infer<typeof configSchema>;
export type ConfigureInput = Partial<SdkConfig>;

const envDefaults: ConfigureInput = {
  apiBase: process.env.ARXPOOL_API_BASE ?? DEFAULT_API_BASE,
  mxeId: process.env.ARXPOOL_MXE_ID ?? undefined,
  attesterSecret: process.env.ARXPOOL_ATTESTER_SECRET ?? undefined,
  arciumApiKey: process.env.ARCIUM_API_KEY ?? undefined
};

let activeConfig: SdkConfig = configSchema.parse({
  ...envDefaults,
  apiBase: envDefaults.apiBase ?? DEFAULT_API_BASE
});

export const configure = (input: ConfigureInput): SdkConfig => {
  activeConfig = configSchema.parse({
    ...activeConfig,
    ...input,
    apiBase: input.apiBase ?? activeConfig.apiBase ?? DEFAULT_API_BASE
  });
  return { ...activeConfig };
};

export const getConfig = (requiredKeys: (keyof SdkConfig)[] = []): SdkConfig => {
  const config = configSchema.parse(activeConfig);
  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new ArxPoolError('CONFIG_MISSING', `Missing required config value: ${String(key)}`);
    }
  }
  return { ...config };
};
