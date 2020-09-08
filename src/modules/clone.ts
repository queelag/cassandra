import { deserialize, serialize } from 'v8'

const clone = <T>(v: any): T => deserialize(serialize(v))

export default clone
