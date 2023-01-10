export let wait = (time = 0): Promise<void> =>
  new Promise((res) =>
    setTimeout(() => {
      res()
    }, time)
  )

export function processOnUserAbort(callback: () => void) {
  process.on('SIGHUP', callback)
  process.on('SIGINT', callback)
  process.on('SIGQUIT', callback)
  process.on('SIGKILL', callback)

  return () => {
    process.off('SIGHUP', callback)
    process.off('SIGINT', callback)
    process.off('SIGQUIT', callback)
    process.off('SIGKILL', callback)
  }
}
