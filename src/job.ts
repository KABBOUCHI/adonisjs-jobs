import { Queue as BullmqQueue, Job as BullmqJob, JobsOptions } from 'bullmq'
import { defineConfig } from './define_config.js'
import type { ApplicationService, LoggerService } from '@adonisjs/core/types'

type JobHandle<T> = T extends (payload: infer P) => any ? P : undefined

export abstract class Job {
  declare job: BullmqJob
  declare logger: LoggerService
  declare static app: ApplicationService

  static async dispatch<T extends Job>(
    this: new (job: any) => T,
    payload: JobHandle<T['handle']>,
    options: JobsOptions & { queueName?: string } = {}
  ) {
    //@ts-ignore
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {})
    const queueName = options.queueName || config.queues[0]
    const queue = new BullmqQueue(queueName, {
      connection: config.connection,
    })

    await queue.add(this.name, payload, options)

    await queue.close()
  }

  abstract handle(payload: any): Promise<void> | void
}
