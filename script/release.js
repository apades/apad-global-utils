const fs = require('fs-extra'),
  package = require('../package.json'),
  path = require('path'),
  child_process = require('child_process')
require('colors')

//
;(async () => {
  const specialVer = process.argv[2]
  let newVer = ''

  console.log('旧版本', package.version.green)
  if (specialVer) {
    newVer = specialVer
  } else {
    let newVerArr = package.version.split('.')
    newVerArr[newVerArr.length - 1]++
    newVer = newVerArr.join('.')
  }

  console.log('新版本', newVer.green)

  package.version = newVer
  fs.writeFileSync(
    path.resolve(__dirname, '../package.json'),
    JSON.stringify(package, null, 2),
    'utf-8'
  )

  await exec('git', ['add', '*'])
  await exec('git', ['commit', '-m', `release: v${newVer}`])
  await exec('git', ['tag', `v${newVer}`])
  await exec('git', ['push'])
  await exec('git', ['push', '--tags'])
})()

function exec(command, option = []) {
  const child = child_process.spawn(command, option)
  console.log(`⚡ ${generExecCode(command, option)}`)
  return new Promise((res, rej) => {
    child.on('close', res)
    child.on('error', rej)
    child.stderr.on('data', rej)
    child.stdout.pipe(process.stdout)
    child.stderr.pipe(process.stderr)
    process.stdin.pipe(child.stdin)
  })
}

function generExecCode(command, option = []) {
  return [command, ...option.map((o) => (/ /.test(o) ? `"${o}"` : o))].join(' ')
}
