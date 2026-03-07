/**
 * Optional host callbacks for platform-specific behavior.
 * The SDK never calls platform APIs directly - it invokes these callbacks when needed.
 * Sound and other side effects are the host's responsibility via UI callbacks.
 */
export type GameEngineHost = Record<string, never>
