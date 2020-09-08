class BufferUtils {
  static toString(buffer: any): string {
    return (buffer as Buffer).toString()
  }
}

export default BufferUtils
