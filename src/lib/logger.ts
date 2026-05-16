type AnyArg = unknown

const maskString = (s: string) => {
  const maskedEmail = s.replace(/\b([A-Z0-9._%+-])([A-Z0-9._%+-]*?)@([A-Z0-9.-]+)\b/gi, (_, a) => `${a}***@***`)
  
  const maskedTokens = maskedEmail.replace(/\b[A-Za-z0-9-_]{20,}\b/g, t => `${t.slice(0,6)}***`)
  return maskedTokens
}

const maskArg = (a: AnyArg): AnyArg => {
  if (typeof a === 'string') return maskString(a)
  try {
    if (typeof a === 'object' && a !== null) {
      const json = JSON.stringify(a)
      const masked = maskString(json)
      return JSON.parse(masked)
    }
  } catch (_) {
  }
  return a
}

export const info = (...args: AnyArg[]) => {
  if (process.env.NODE_ENV === 'production') return
  console.log(...args.map(maskArg))
}

export const warn = (...args: AnyArg[]) => {
  console.warn(...args.map(maskArg))
}

export const error = (...args: AnyArg[]) => {
  console.error(...args.map(maskArg))
}

export default { info, warn, error }
