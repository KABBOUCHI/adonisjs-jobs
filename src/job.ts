import { Job as BullmqJob, JobsOptions } from 'bullmq'
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
    const { dispatch } = await import('../services/main.js')

    return await dispatch(this, payload, options)
  }

  abstract handle(payload: any): Promise<void> | void
}
