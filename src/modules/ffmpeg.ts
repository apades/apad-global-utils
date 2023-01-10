import prompts from 'prompts'
import mimetype from 'mime-types'
import path from 'path'
import fs from 'fs-extra'
import ws from 'windows-shortcuts'
import { getVideoStreamInfoList, subtitleVideoToMp4 } from '../ffmpeg'
import ora from 'ora'
import { wait } from '../utils'
import { isUndefined } from 'lodash'

declareFunction(
  {
    name: 'MKV转字幕MP4',
  },
  async (props) => {
    const runAtDir = process.cwd()

    const videoSrc = await selectFile(runAtDir)
    if (!/video/.test(mimetype.contentType(videoSrc) + '')) {
      return console.error(`这个文件[${videoSrc}]不是视频`.red)
    }
    const streamLoading = ora('获取视频流信息中').start()
    const videoStreamInfoList = await getVideoStreamInfoList(videoSrc)
    streamLoading.stop()

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
    if (isUndefined(subtitleIndex)) return
    console.log(
      `⚙ 字幕选择index:${subtitleIndex} ${videoStreamInfoList.Subtitle[subtitleIndex].stream} `
    )
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
)

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

  if (isUndefined(file)) return
  if (file.isDir) return selectFile(file.src)

  return await new Promise<string>((res) => {
    ws.query(file.src, (err, link) => {
      res(link?.target || file.src)
    })
  })
}
