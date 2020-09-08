const tcp = <T>(f: () => Promise<T>): Promise<T | Error> => {
  return new Promise((resolve) => {
    f()
      .then(
        (v: T) => resolve(v),
        (e: any) => {
          console.error(e)
          resolve(new Error(e))
        }
      )
      .catch((e: any) => {
        console.error(e)
        resolve(new Error(e))
      })
  })
}

export default tcp
