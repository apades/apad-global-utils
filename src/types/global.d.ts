declare type dykey<T = any> = {
  [key: string]: T
}

declare type ParamType<T> = T extends (...args: infer P) => any ? P : T
