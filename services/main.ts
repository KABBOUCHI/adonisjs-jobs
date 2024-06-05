import app from '@adonisjs/core/services/app'
import { JobsOptions } from 'bullmq'
import type { Dispatcher } from '../src/dispatcher.js'
import type { Job } from '../src/job.js'

let dispatcher: Dispatcher

await app.booted(async () => {
  dispatcher = await app.container.make('jobs.dispatcher')
})

export const dispatch = async (
  jobOrClosure: Function | typeof Job,
  payload: any = {},
  options: JobsOptions & { queueName?: string } = {}
) => {
  await dispatcher.dispatch(jobOrClosure, payload, options)
}

export { dispatcher as default }
