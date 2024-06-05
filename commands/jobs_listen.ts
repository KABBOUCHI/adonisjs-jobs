import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from 'bullmq'
import type { Job, defineConfig } from '../index.js'

export default class JobsListen extends BaseCommand {
  static commandName = 'jobs:listen'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  @flags.array({
    description: 'The names of the queues to work',
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

  @flags.number({
    description: 'Amount of jobs that a single worker is allowed to work on in parallel.',
    default: 1,
  })
  declare concurrency: number

  async run() {
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {})
    const logger = await this.app.container.make('logger')
    const router = await this.app.container.make('router')
    const jobs = await this.app.container.make('jobs.list')
    const queues = this.queue || [config.queue]
    const workers: Worker[] = []

    router.commit()

    this.app.terminating(async () => {
      await Promise.allSettled(workers.map((worker) => worker.close()))
    })

    for (const queueName of queues) {
      const worker = new Worker(
        queueName,
        async (job) => {
          const jobClass = jobs[job.name]

          if (!jobClass) {
            logger.error(`Cannot find job ${job.name}`)
          }
          let instance: Job

          try {
            instance = await this.app.container.make(jobClass)
          } catch (error) {
            logger.error(`Cannot instantiate job ${job.name}`)
            return
          }

          instance.job = job
          instance.logger = logger

          logger.info(`Job ${job.name} started`)
          await instance.handle(job.data)
          logger.info(`Job ${job.name} finished`)
        },
        {
          ...(config.workerOptions || {}),
          connection: config.connection,
          concurrency: this.concurrency,
        }
      )

      worker.on('failed', (_job, error) => {
        logger.error(error.message, [])
      })

      workers.push(worker)
    }

    logger.info(`Processing jobs from the ${JSON.stringify(queues)} queues.`)
  }
}
