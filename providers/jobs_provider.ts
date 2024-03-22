import type { ApplicationService } from '@adonisjs/core/types'
import { fsReadAll, importDefault, slash } from '@poppinss/utils'
import { fileURLToPath } from 'node:url'
import { basename, extname, relative } from 'node:path'
import { Job } from '../index.js'

const JS_MODULES = ['.js', '.cjs', '.mjs']

export default class SchedulerProvider {
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

    this.app.container.singleton('scannedJobs', () => jobs)
  }
}

declare module '@adonisjs/core/types' {
  export interface ContainerBindings {
    scannedJobs: Record<string, typeof Job>
  }
}
