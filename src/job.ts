import { Queue as BullmqQueue, Job as BullmqJob, JobsOptions } from 'bullmq'
import { defineConfig } from './define_config.js'
import type { ApplicationService, LoggerService } from '@adonisjs/core/types'

type JobHandle<T> = T extends (payload: infer P) => any ? (undefined extends P ? any : P) : any

export abstract class Job {
  declare job: BullmqJob
  declare logger: LoggerService
  declare static app: ApplicationService

  static async dispatch<T extends Job>(
    this: new () => T,
    payload: JobHandle<T['handle']>,
    options: JobsOptions & { queueName?: string } = {}
  ) {
    // @ts-ignore
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {}) as ReturnType<
      typeof defineConfig
    >
    // @ts-ignore
    const queues = await this.app.container.make('jobs.queues')
    const queueName = options.queueName || config.queues[0]
    const queue = queues[queueName] as BullmqQueue

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`)
    }

    const job = await queue.add(this.name, payload, options)

    return job.id
  }

  abstract handle(payload: any): Promise<void> | void
}
