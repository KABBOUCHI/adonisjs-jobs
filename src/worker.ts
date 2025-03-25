import type { ApplicationService } from '@adonisjs/core/types'
import { Worker as BullWorker } from 'bullmq'
import { defineConfig } from './define_config.js'
import type { Job } from './job.js'

export interface WorkerOptions {
  queues?: string[]
  concurrency?: number
}

export class Worker {
  workers: BullWorker[] = []

  constructor(
    public app: ApplicationService,
    public config: WorkerOptions = { queues: [], concurrency: 1 }
  ) {}

  async start() {
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {})
    const logger = await this.app.container.make('logger')
    const jobs = await this.app.container.make('jobs.list')
    const queues =
      this.config.queues && this.config.queues.length ? this.config.queues : [config.queue]
    const workers: BullWorker[] = []

    this.app.terminating(async () => {
      await Promise.allSettled(workers.map((worker) => worker.close()))
    })

    for (const queueName of queues) {
      const worker = new BullWorker(
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
          concurrency: this.config.concurrency,
        }
      )

      worker.on('failed', (_job, error) => {
        logger.error(error.message, [])
      })

      this.workers.push(worker)
    }

    logger.info(`Processing jobs from the ${JSON.stringify(queues)} queues.`)
  }

  async stop() {
    await Promise.allSettled(this.workers.map((w) => w.close()))
  }
}
