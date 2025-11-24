import { DateTime } from 'luxon'

export const REDUCERS = {
  DateTime: (value: any) => DateTime.isDateTime(value) && value.toISO(),
}

export const REVIVERS = {
  DateTime: (value: string) => DateTime.fromISO(value),
}
