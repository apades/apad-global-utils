import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs-extra'
import { wait } from './utils'

type VideoStreamInfo = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in 'Video' | 'Audio' | 'Subtitle' | 'Other']?: {
    stream: string
    metadata: dykey<string>
  }[]
}
export function getVideoStreamInfoList(videoSrc: string) {
  const child = spawn('ffprobe.exe', ['-i', videoSrc])

  return new Promise<VideoStreamInfo>((res) => {
    const data: VideoStreamInfo = {}
    child.on('close', () => res(data))
    child.stderr.on('data', (e) => {
      let info: string = e.toString()

      let streamInfoList = info.slice(info.indexOf('Stream'))

      let metadatasString = streamInfoList
        .split(/Stream.*\r?\n/)
        .filter((v) => !!v)

      let metadatas = metadatasString.map((v) => {
        let meta = v
          .replace(/Metadata:\r?\n/, '')
          .trim()
          .split(/\r?\n/)
          .filter((v) => !!v)
          .map((v) => {
            let index = v.indexOf(':')
            return [v.slice(0, index).trim(), v.slice(index + 1)]
          })
        return meta
      })

      let streams = streamInfoList.match(/Stream.*\r?\n/g)

      for (let i in streams) {
        function push(key: keyof VideoStreamInfo) {
          data[key] = data[key] || []
          data[key].push({ metadata, stream })
        }
        let stream = streams[i],
          metadata = Object.fromEntries(metadatas[i] as any)

        if (/Video/i.test(stream)) {
          push('Video')
          continue
        }
        if (/Audio/i.test(stream)) {
          push('Audio')
          continue
        }
        if (/Subtitle/i.test(stream)) {
          push('Subtitle')
          continue
        }
        push('Other')
      }
    })
  })
}

export function copyToMp4(
  videoSrc: string,
  outputSrc = path.resolve(videoSrc, '../out.mp4')
) {
  const child = spawn('ffmpeg', ['-i', videoSrc, '-c', 'copy', outputSrc])

  return new Promise<string>((res) => {
    child.on('close', () => res(outputSrc))
    // child.stderr.pipe(process.stdout)
    // process.stdin.pipe(child.stdin)
  })
}

export function getSubtitleFromVideo(
  videoSrc: string,
  subtitleIndex: number,
  outputSrc = path.resolve(videoSrc, '../subtitle.srt')
) {
  const child = spawn('ffmpeg', [
    '-i',
    videoSrc,
    '-map',
    `0:s:${subtitleIndex}`,
    outputSrc,
  ])

  return new Promise<string>((res) => {
    child.on('close', () => res(outputSrc))
    // child.stderr.pipe(process.stdout)
    // process.stdin.pipe(child.stdin)
  })
}

export async function subtitleVideoToMp4(
  videoSrc: string,
  subtitleIndex: number,
  outputSrc = path.resolve(videoSrc, '../subtitle-out.mp4')
) {
  console.log('--------copy成纯MP4--------')
  const pureVideo = await copyToMp4(videoSrc)
  await wait(1000)
  console.log('--------提取视频字幕--------')
  const subtitleFile = await getSubtitleFromVideo(videoSrc, subtitleIndex)
  await wait(2000)
  console.log('--------生成字幕MP4--------')
  const child = spawn('ffmpeg', [
    '-i',
    pureVideo,
    '-vf',
    `subtitles=${path.parse(subtitleFile).base}`,
    outputSrc,
  ])

  return new Promise((res) => {
    child.on('close', () => {
      // fs.unlink(pureVideo)
      // fs.unlink(subtitleFile)
      res(outputSrc)
    })
    child.stderr.pipe(process.stdout)
    process.stdin.pipe(child.stdin)
  })
}
