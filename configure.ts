/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import ConfigureCommand from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  await codemods.makeUsingStub(stubsRoot, 'config/jobs.stub', {})

  await codemods.updateRcFile((rcFile: any) => {
    rcFile.addProvider('adonisjs-jobs/jobs_provider')
    rcFile.addCommand('adonisjs-jobs/commands')
  })

  await codemods.defineEnvVariables({
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    REDIS_PASSWORD: '',
  })

  await codemods.defineEnvValidations({
    leadingComment: 'Variables for configuring the jobs package',
    variables: {
      REDIS_HOST: `Env.schema.string()`,
      REDIS_PORT: `Env.schema.number()`,
      REDIS_PASSWORD: `Env.schema.string.optional()`,
    },
  })
}
