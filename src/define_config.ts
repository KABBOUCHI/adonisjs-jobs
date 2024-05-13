import type { ConnectionOptions, JobsOptions, WorkerOptions } from 'bullmq'

type Config = {
  connection: ConnectionOptions
  queue: string
  queues: string[]
  options: JobsOptions
  workerOptions?: Omit<WorkerOptions, 'connection' | 'concurrency'>
}

export function defineConfig(config: Config) {
  return config
}
