import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from 'bullmq'
import { defineConfig } from '../index.js'

export default class JobsListen extends BaseCommand {
  static commandName = 'jobs:listen'
  static description = ''

  static options: CommandOptions = {
    startApp: true,
    staysAlive: true,
  }

  async run() {
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {})
    const router = await this.app.container.make('router')
    router.commit()

    const jobs = await this.app.container.make('scannedJobs')

    for (const queueName of config.queues) {
      const worker = new Worker(
        queueName,
        async (job) => {
          console.log(job.name)

          const jobClass = jobs[job.name]

          if (!jobClass) {
            throw new Error(`Cannot find job ${job.name}`)
          }

          //@ts-ignore
          const instance = new jobClass()
          instance.job = job

          await instance.handle(job.data)
        },
        {
          connection: config.connection,
        }
      )

      worker.on('completed', (job) => {
        console.log(`${job.id} has completed!`)
      })

      worker.on('failed', (job, err) => {
        console.log(`${job?.id} has failed with ${err.message}`)
      })
    }
  }
}
