import { Queue as BullmqQueue, Job as BullmqJob } from 'bullmq'
import { defineConfig } from './define_config.js'
import type { ApplicationService } from '@adonisjs/core/types'

type JobHandle<T> = T extends (payload: infer P) => any ? P : undefined

export abstract class Job {
  declare job: BullmqJob
  declare static app: ApplicationService

  static async dispatch<T extends Job>(
    this: new (job: any) => T,
    payload: JobHandle<T['handle']>,
    queueName: string = 'default'
  ) {
    //@ts-ignore
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {})

    const queue = new BullmqQueue(queueName, {
      connection: config.connection,
    })

    await queue.add(this.name, payload)

    await queue.close()
  }

  abstract handle(payload: any): Promise<void> | void
}
