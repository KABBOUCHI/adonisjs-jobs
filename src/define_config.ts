import type { ConnectionOptions, JobsOptions } from 'bullmq'

type Config = {
  connection: ConnectionOptions
  queue: string
  queues: string[]
  options: JobsOptions
}

export function defineConfig(config: Config) {
  return config
}
