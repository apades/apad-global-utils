import fs from 'fs-extra'
import path from 'path'
import os from 'os'

type declareFunctionProps = ParamType<typeof declareFunction>
export const declareMap: dykey<{
  props: declareFunctionProps[0]
  callback: declareFunctionProps[1]
}> = {}

export function declareFunction(
  props: {
    name: string
    /**command模式用的命令 */
    command?: string
  },
  callback: (props: {
    argv: string[]
  }) => Promise<boolean | void> | boolean | void
) {
  declareMap[props.name] = { props, callback }
}
globalThis.declareFunction = declareFunction

export async function importModules() {
  let modules = fs
    .readdirSync(path.resolve(__dirname, './modules'))
    .map((file) => {
      let src = path.resolve(__dirname, `./modules/${file}`)

      if (os.platform() === 'win32') src.replace(/\\\\/g, '/')
      return src
    })

  modules.forEach((module) => require(module))
}
