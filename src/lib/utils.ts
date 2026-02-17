import { twMerge } from "tailwind-merge"
 
type ClassValue =
  | ClassArray
  | ClassDictionary
  | string
  | number
  | null
  | boolean
  | undefined
type ClassDictionary = Record<string, any>
type ClassArray = ClassValue[]

function clsx(...inputs: ClassValue[]) {
  let result = ""

  for (const input of inputs) {
    if (!input && input !== 0) continue

    if (typeof input === "string" || typeof input === "number") {
      result = result ? `${result} ${input}` : String(input)
      continue
    }

    if (typeof input === "boolean") continue

    if (Array.isArray(input)) {
      const inner = clsx(...input)
      if (inner) result = result ? `${result} ${inner}` : inner
      continue
    }

    if (typeof input === "object") {
      for (const [key, value] of Object.entries(input)) {
        if (!value) continue
        result = result ? `${result} ${key}` : key
      }
    }
  }

  return result
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
