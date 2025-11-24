import type { ApplicationService } from '@adonisjs/core/types'
import ClosureJob from './jobs/closure_job.js'
import { Queue as BullmqQueue, JobsOptions } from 'bullmq'
import { Job } from './job.js'
import { type defineConfig } from './define_config.js'
import * as devalue from 'devalue'

export class Dispatcher {
  constructor(private app: ApplicationService) {}

  async dispatch(
    jobOrClosure: Function | typeof Job,
    payload: any,
    options: JobsOptions & { queueName?: string } = {}
  ) {
    let isClosure = !(
      typeof jobOrClosure === 'function' && /^class\s/.test(jobOrClosure.toString())
    )
    let job = isClosure ? ClosureJob : jobOrClosure
    payload = isClosure
      ? {
          serializedClosure: jobOrClosure.toString(),
        }
      : payload

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

    const bullmqJob = await queue.add(job.name, devalue.stringify(payload), options)

    return bullmqJob.id
  }
}
