import { Job } from '../job.js'
import app from '@adonisjs/core/services/app'

type ClosureJobPayload = {
  serializedClosure: string
}

export default class ClosureJob extends Job {
  async handle(payload: ClosureJobPayload) {
    const { serializedClosure } = payload

    const url = app.makeURL().href

    const code = `
    const loadModule = async (module) => {
      const { resolve } = await import('import-meta-resolve')

      return await import(resolve(module, '${url}'))
    }

    return ${serializedClosure.replace(/import\(/g, 'loadModule(')}`

    const cb = new Function(code)()

    await cb()
  }
}
