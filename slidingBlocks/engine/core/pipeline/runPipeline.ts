/**
 * Koa-style async middleware runner.
 * Shared infrastructure for gesture and task pipelines.
 */
export type PipelineMiddleware<T> = (
  ctx: T,
  next: () => Promise<void>
) => Promise<void>

export function runPipeline<T>(
  ctx: T,
  middlewares: PipelineMiddleware<T>[]
): Promise<void> {
  let index = 0
  const next = (): Promise<void> =>
    index < middlewares.length
      ? middlewares[index++](ctx, next)
      : Promise.resolve()
  return next()
}

/** Create a pipeline runner for a given middleware chain. Reusable across invocations. */
export function createPipeline<T>(
  middlewares: PipelineMiddleware<T>[]
): (ctx: T) => Promise<void> {
  return (ctx: T) => runPipeline(ctx, middlewares)
}
