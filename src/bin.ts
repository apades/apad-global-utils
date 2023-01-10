#!/usr/bin/env node
import 'colors'
import prompts from 'prompts'
import { declareMap, importModules } from './core'
;(async () => {
  await importModules()
  // 这里是如果有参数，则运行commander模式
  if (process.argv.length > 2) {
  }
  // 不然就运行prompts模式
  else {
    let { feat } = await prompts({
      name: 'feat',
      type: 'autocomplete',
      message: '选择功能',
      choices: Object.entries(declareMap).map(([key, val]) => {
        return { title: key, value: key }
      }),
    })

    if (declareMap[feat]) {
      declareMap[feat].callback?.({ argv: process.argv })
    }
  }
})()
