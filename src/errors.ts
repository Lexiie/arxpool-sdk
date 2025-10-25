import { inspect } from 'node:util';

export type ArxPoolErrorCode =
  | 'CONFIG_INVALID'
  | 'CONFIG_MISSING'
  | 'COLLECTOR_NETWORK_DISABLED'
  | 'COLLECTOR_HTTP_ERROR'
  | 'POOL_NOT_FOUND'
  | 'INVALID_INPUT'
  | 'SIGNING_UNAVAILABLE'
  | 'VERIFICATION_FAILED'
  | 'COMPUTE_CLIENT_UNAVAILABLE'
  | 'COMPUTE_SUBMISSION_FAILED';

export interface ArxPoolErrorJSON {
  code: ArxPoolErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export class ArxPoolError extends Error {
  readonly code: ArxPoolErrorCode;

  readonly details?: Record<string, unknown>;

  constructor(
    code: ArxPoolErrorCode,
    message: string,
    options?: { cause?: unknown; details?: Record<string, unknown> }
  ) {
    super(message, { cause: options?.cause });
    this.name = 'ArxPoolError';
    this.code = code;
    this.details = options?.details;
  }

  toJSON(): ArxPoolErrorJSON {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {})
    };
  }
}

export function assertCondition(
  condition: unknown,
  code: ArxPoolErrorCode,
  message: string,
  details?: Record<string, unknown>
): asserts condition {
  if (!condition) {
    throw new ArxPoolError(code, message, { details });
  }
}

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return inspect(error);
}
