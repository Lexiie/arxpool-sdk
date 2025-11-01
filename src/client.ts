import { z } from "zod";
import { ArxPoolError } from "./errors.js";

const DEFAULT_NODE = "https://testnet.arx.arcium.com";

const modeSchema = z.union([z.literal("stub"), z.literal("testnet")]);

const configSchema = z.object({
  mode: modeSchema,
  node: z
    .string()
    .url()
    .refine((value) => value.startsWith("https://"), "Arcium node must use HTTPS"),
  attesterSecret: z.string().min(1).optional(),
  attesterKey: z.string().min(1).optional()
});

export type ArxPoolConfig = z.infer<typeof configSchema>;
export type ConfigureInput = Partial<ArxPoolConfig>;

const envDefaults: ConfigureInput = {
  mode: process.env.USE_STUB === "false" ? "testnet" : "stub",
  node: process.env.ARXPOOL_NODE ?? undefined,
  attesterSecret: process.env.ARXPOOL_ATTESTER_SECRET ?? undefined,
  attesterKey: process.env.ARXPOOL_ATTESTER_KEY ?? undefined
};

let activeConfig: ArxPoolConfig = configSchema.parse({
  mode: envDefaults.mode ?? "stub",
  node: envDefaults.node ?? DEFAULT_NODE,
  attesterSecret: envDefaults.attesterSecret,
  attesterKey: envDefaults.attesterKey
});

export const configure = (input: ConfigureInput): ArxPoolConfig => {
  activeConfig = configSchema.parse({
    ...activeConfig,
    ...input,
    mode: input.mode ?? activeConfig.mode ?? "stub",
    node: input.node ?? activeConfig.node ?? DEFAULT_NODE
  });
  return { ...activeConfig };
};

export const getConfig = (requiredKeys: (keyof ArxPoolConfig)[] = []): ArxPoolConfig => {
  const config = configSchema.parse(activeConfig);
  for (const key of requiredKeys) {
    if (!config[key]) {
      throw new ArxPoolError('CONFIG_MISSING', `Missing required config value: ${String(key)}`);
    }
  }
  return { ...config };
};
