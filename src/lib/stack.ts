/**
 * Ensure the environment supports stack capturing.
 */
const isSupported = () =>
  ['stackTraceLimit', 'prepareStackTrace', 'captureStackTrace'].every(
    (method) => method in Error
  )

/**
 * Get the current stack.
 */
const get = (limit = Infinity) => {
  if (!isSupported()) {
    throw new Error(
      'Cannot use next-cache-tags automatic path resolving outside V8 runtimes.'
    )
  }

  const target = {} as { stack: NodeJS.CallSite[] }

  const initials = {
    stackTraceLimit: Error.stackTraceLimit,
    prepareStackTrace: Error.prepareStackTrace,
  }

  Error.stackTraceLimit = limit

  // Override
  Error.prepareStackTrace = function (_obj, stack) {
    console.log('opa')
    return stack
  }

  // Execute stack capturing.
  Error.captureStackTrace(target, exports.get)

  const stack = target.stack

  // Recover initials.
  Error.prepareStackTrace = initials.prepareStackTrace
  Error.stackTraceLimit = initials.stackTraceLimit

  return stack
}

export { get }
