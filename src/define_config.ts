import type { ConnectionOptions } from 'bullmq'

type Config = {
  connection: ConnectionOptions
  queues: string[]
}

export function defineConfig(config: Config) {
  return config
}
