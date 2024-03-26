import type { ApplicationService } from '@adonisjs/core/types'
import { fsReadAll, importDefault, slash } from '@poppinss/utils'
import { fileURLToPath } from 'node:url'
import { basename, extname, relative } from 'node:path'
import { Job, defineConfig } from '../index.js'
import { RouteGroup } from '@adonisjs/core/http'
import { resolveHTTPResponse } from '@trpc/server/http'
import { Context, appRouter } from '@queuedash/api'
import { Queue as BullmqQueue } from 'bullmq'

const JS_MODULES = ['.js', '.cjs', '.mjs']

export default class JobsProvider {
  constructor(protected app: ApplicationService) {}

  async boot() {
    const jobs: Record<string, typeof Job> = {}
    const jobsFiles = await fsReadAll(this.app.relativePath('app/jobs'), {
      pathType: 'url',
      ignoreMissingRoot: true,
      filter: (filePath: string) => {
        const ext = extname(filePath)

        if (basename(filePath).startsWith('_')) {
          return false
        }

        if (JS_MODULES.includes(ext)) {
          return true
        }

        if (ext === '.ts' && !filePath.endsWith('.d.ts')) {
          return true
        }

        return false
      },
    })

    for (let file of jobsFiles) {
      if (file.endsWith('.ts')) {
        file = file.replace(/\.ts$/, '.js')
      }

      const relativeFileName = slash(
        relative(this.app.relativePath('app/jobs'), fileURLToPath(file))
      )

      const jobClass = (await importDefault(() => import(file), relativeFileName)) as typeof Job
      jobClass.app = this.app
      jobs[jobClass.name] = jobClass
    }

    const router = await this.app.container.make('router')
    const config = this.app.config.get<ReturnType<typeof defineConfig>>('jobs', {})

    const queues = config.queues.reduce(
      (acc, name) => {
        const queue = new BullmqQueue(name, {
          connection: config.connection,
          defaultJobOptions: config.options,
        })

        acc[name] = queue

        return acc
      },
      {} as Record<string, BullmqQueue>
    )

    this.app.terminating(async () => {
      for (const queueName in queues) {
        await queues[queueName].close()
      }
    })

    this.app.container.singleton('jobs.list', () => jobs)
    this.app.container.singleton('jobs.queues', () => queues)

    router.jobs = (baseUrl: string = '/jobs') => {
      baseUrl = baseUrl.startsWith('/') ? baseUrl : '/' + baseUrl
      baseUrl = baseUrl.replace(/\/$/, '')

      return router.group(() => {
        router.get(baseUrl, async ({ response }) => {
          response.header('Content-Type', 'text/html')

          return /* HTML */ ` <!doctype html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>QueueDash App</title>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  window.__INITIAL_STATE__ = {
                    apiUrl: '${baseUrl}/trpc',
                    basename: '${baseUrl}',
                  }
                </script>
                <link
                  rel="stylesheet"
                  href="https://unpkg.com/@queuedash/ui@2.0.5/dist/styles.css"
                />
                <script
                  type="module"
                  src="https://unpkg.com/@queuedash/client@2.0.5/dist/main.mjs"
                ></script>
              </body>
            </html>`
        })

        router.any(`${baseUrl}/trpc/*`, async ({ request, response }) => {
          const path = request.url().split('/trpc/')[1]
          const url = new URL(request.completeUrl(true))

          const { body, status, headers } = await resolveHTTPResponse({
            createContext: async () => ({
              queues: Object.keys(queues).reduce(
                (acc, displayName) => {
                  acc.push({
                    queue: queues[displayName],
                    displayName,
                    type: 'bullmq' as const,
                  })

                  return acc
                },
                [] as Context['queues']
              ),
            }),
            router: appRouter,
            path,
            req: {
              query: url.searchParams,
              method: request.method(),
              headers: request.headers(),
              body: request.body(),
            },
          })
          if (headers) {
            Object.keys(headers).forEach((key) => {
              const value = headers[key]
              if (value) response.header(key, value)
            })
          }
          response.status(status)
          response.send(body)
        })

        router.get(`${baseUrl}/*`, async ({ response }) => {
          response.header('Content-Type', 'text/html')
          return /* HTML */ `<!doctype html>
            <html lang="en">
              <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>QueueDash App</title>
              </head>
              <body>
                <div id="root"></div>
                <script>
                  window.__INITIAL_STATE__ = {
                    apiUrl: '${baseUrl}/trpc',
                    basename: '${baseUrl}',
                  }
                </script>
                <link
                  rel="stylesheet"
                  href="https://unpkg.com/@queuedash/ui@2.0.5/dist/styles.css"
                />
                <script
                  type="module"
                  src="https://unpkg.com/@queuedash/client@2.0.5/dist/main.mjs"
                ></script>
              </body>
            </html>`
        })
      })
    }
  }
}

declare module '@adonisjs/core/http' {
  interface Router {
    jobs: (pattern?: string) => RouteGroup
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    'jobs.list': Record<string, typeof Job>
    'jobs.queues': Record<string, BullmqQueue>
  }
}
