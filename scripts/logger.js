"use strict";

const maskString = (s) => {
  const maskedEmail = s.replace(/\b([A-Z0-9._%+-])([A-Z0-9._%+-]*?)@([A-Z0-9.-]+)\b/gi, (_, a) => `${a}***@***`)
  return maskedEmail.replace(/\b[A-Za-z0-9-_]{20,}\b/g, (t) => `${t.slice(0, 6)}***`)
}

const maskArg = (a) => {
  if (typeof a === 'string') return maskString(a)
  try {
    if (typeof a === 'object' && a !== null) {
      const json = JSON.stringify(a)
      return maskString(json)
    }
  } catch (_) {}
  return a
}

exports.info = (...args) => {
  if (process.env.NODE_ENV === 'production') return
  console.log(...args.map(maskArg))
}

exports.warn = (...args) => {
  console.warn(...args.map(maskArg))
}

exports.error = (...args) => {
  console.error(...args.map(maskArg))
}

module.exports = exports
