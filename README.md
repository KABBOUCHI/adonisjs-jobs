<div align="center">
  <h1><b>AdonisJS Jobs</b></h1>

  <p>Job processing for AdonisJS v6 using [BullMQ](https://bullmq.io/)</p>
</div>

## Getting Started

This package is available in the npm registry.

```bash
pnpm install adonisjs-jobs
```

Next, configure the package by running the following command.

```bash
node ace configure adonisjs-jobs
```

## Creating Jobs
You can create a new job by running the following command.
```sh
node ace jobs:make SendEmail
```

## Listening for Jobs

First, you need to start the jobs listener, you can spawn multiple listeners to process jobs concurrently.
```sh
node ace jobs:listen  # default queue from env `REDIS_QUEUE`

node ace jobs:listen --queue=high
node ace jobs:listen --queue=high --queue=medium
node ace jobs:listen --queue=high,medium,low

node ace jobs:listen --queue=high --concurrency=3
```

## Dispatching Jobs

Dispatching jobs is as simple as importing the job class and calling
```ts
import SendEmail from 'path/to/jobs/send_email.js'

await SendEmail.dispatch({ ... })

await SendEmail.dispatch({ ... }, { // for more job options check https://docs.bullmq.io/
  attempts: 3,
  delay: 1000,
})
```

## Import Aliases (optional)

update your `package.json` and `tsconfig.json` to use import aliases

`package.json`
```json
{
  "imports": {
    "#jobs/*": "./app/jobs/*.js"
  }
}
```
`tsconfig.json`
```json
{
  "compilerOptions": {
    "paths": {
      "#jobs/*": ["./app/jobs/*.js"]
    }
  }
}
```

```ts
import SendEmail from '#jobs/send_email.js'

await SendEmail.dispatch({ ... })
```


## Jobs Dashboard

You can view the jobs dashboard by adding the following route to your `start/routes.ts` file.

```ts
import router from '@adonisjs/core/services/router'

router.jobs() // default is /jobs

// or

router.jobs('/my-jobs-dashboard')
```

`router.jobs()` returns a route group, you can add middleware to the group

```ts
router.jobs().use(
  middleware.auth({
    guards: ['basicAuth'],
  })
)

```