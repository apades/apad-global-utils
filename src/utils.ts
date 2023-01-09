export let wait = (time = 0): Promise<void> =>
  new Promise((res) =>
    setTimeout(() => {
      res()
    }, time)
  )
