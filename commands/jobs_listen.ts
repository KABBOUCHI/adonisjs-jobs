import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from '../index.js'

export default class JobsListen extends BaseCommand {
  static commandName = 'jobs:listen'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @flags.array({
    description: 'The names of the queues to work',
    alias: 'q',
    parse(input) {
      return input.flatMap((queue) =>
        queue
          .split(',')
          .map((q) => q.trim())
          .filter(Boolean)
      )
    },
  })
  declare queue: string[]

  @flags.array({
    description: 'Amount of jobs that a single worker is allowed to work on in parallel.',
    alias: 'c',
    parse(input) {
      return input.flatMap((c) =>
        String(c)
          .split(',')
          .map((q) => q.trim())
          .filter(Boolean)
          .map((v) => Number.parseInt(v))
          .filter((v) => !Number.isNaN(v))
      )
    },
    default: [1],
  })
  declare concurrency: number[]

  async run() {
    const router = await this.app.container.make('router')
    router.commit()

    const worker = new Worker(this.app, {
      queues: this.queue,
      concurrency: this.concurrency,
    })

    this.app.terminating(async () => {
      await worker.stop()
    })

    await worker.start()
  }
}
