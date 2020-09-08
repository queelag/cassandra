const tc = <T>(f: () => T): T | Error => {
  try {
    return f()
  } catch (e) {
    console.error(e)
    return new Error(e)
  }
}

export default tc
