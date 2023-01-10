import type { declareFunction as _declareFunction } from '../core'

declare global {
  var declareFunction: typeof _declareFunction
}
