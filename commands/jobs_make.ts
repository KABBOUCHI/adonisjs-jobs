import { BaseCommand, args } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import { stubsRoot } from '../index.js'
import stringHelpers from '@adonisjs/core/helpers/string'

export default class JobsMake extends BaseCommand {
  static commandName = 'jobs:make'
  static description = 'Make a new job class'

  static options: CommandOptions = {
    startApp: false,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({ description: 'Name of class' })
  declare name: string

  async run() {
    await this.generate()
  }

  private async generate() {
    const codemods = await this.createCodemods()

    codemods.makeUsingStub(stubsRoot, 'job.stub', {
      filename: stringHelpers.snakeCase(this.name),
      className: stringHelpers.pascalCase(this.name),
    })
  }
}
