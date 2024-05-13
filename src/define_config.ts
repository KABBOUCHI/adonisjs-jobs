import type { ConnectionOptions, JobsOptions, WorkerOptions } from 'bullmq'

type Config = {
  connection: ConnectionOptions
  queue: string
  queues: string[]
  options: JobsOptions
  workerOptions?: WorkerOptions
}

export function defineConfig(config: Config) {
  return config
}
