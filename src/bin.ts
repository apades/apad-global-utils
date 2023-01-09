#!/usr/bin/env node
import fs from 'fs-extra'
import prompts from 'prompts'
import path from 'path'
import mimetype from 'mime-types'
import ws from 'windows-shortcuts'
import { subtitleVideoToMp4 } from './ffmpeg'
import 'colors'

//
import { getVideoStreamInfoList } from './ffmpeg'
;(async () => {
  const runAtDir = process.cwd()
  let file = ''
  // 这里是如果有参数，则运行commander模式
  if (process.argv.length > 2) {
  }
  // 不然就运行prompts模式
  else {
    let { feat } = await prompts({
      name: 'feat',
      type: 'autocomplete',
      message: '选择功能',
      choices: [{ title: '内嵌字幕视频转字幕MP4', value: 'subv2mp4' }],
    })

    switch (feat) {
      case 'subv2mp4': {
        const videoSrc = await selectFile(runAtDir)
        if (!/video/.test(mimetype.contentType(videoSrc) + '')) {
          return console.error(`这个文件[${videoSrc}]不是视频`.red)
        }
        const videoStreamInfoList = await getVideoStreamInfoList(videoSrc)
        let { subtitleIndex } = await prompts({
          name: 'subtitleIndex',
          type: 'select',
          message: '选择字幕',
          choices: videoStreamInfoList.Subtitle.map((v, i) => {
            return {
              title: v.metadata?.title ?? v.stream,
              description: Object.entries(v.metadata)
                .map((v) => v.join(':'))
                .join(','),
              value: i,
            }
          }),
        })
        console.log(`------字幕选择${subtitleIndex}-----`)
        let { videoName } = await prompts({
          name: 'videoName',
          type: 'text',
          initial: 'subtitle-out',
          message: '输入视频名字 (默认为subtitle-out)',
        })

        subtitleVideoToMp4(
          videoSrc,
          subtitleIndex,
          path.resolve(videoSrc, `../${videoName}.mp4`)
        )
      }
    }
  }
})()

async function selectFile(dir: string): Promise<any> {
  const { file } = await prompts({
    name: 'file',
    type: 'autocomplete',
    message: '选择文件',
    choices: [
      {
        title: '../'.yellow,
        value: {
          src: path.resolve(dir, '../'),
          isDir: true,
        },
      },
      ...fs
        .readdirSync(dir)
        .map((file) => {
          const src = path.resolve(dir, file)
          const isDir = fs.lstatSync(src).isDirectory()
          if (isDir)
            return {
              isDir: true,
              title: file.yellow,
              value: {
                src,
                isDir: true,
              },
            }
          return { title: file, value: { src } }
        })
        .sort(
          (a, b) =>
            (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) ||
            a.title.localeCompare(b.title)
        ),
    ],
  })

  if (file.isDir) return selectFile(file.src)

  return await new Promise<string>((res) => {
    ws.query(file.src, (err, link) => {
      res(link?.target || file.src)
    })
  })
}
