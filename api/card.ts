import { NowRequest, NowResponse } from "@vercel/node"
import util from 'minecraft-server-util'
import { StatusResponse } from "minecraft-server-util/src/model/StatusResponse";
import { createCanvas, registerFont, loadImage } from 'canvas'
import path from "path";

// https://wiki.vg/Protocol_version_numbers
const VERSIONS = [
    { protocol_version: 61, minecraft_versions: ['1.5.2'] },
    { protocol_version: 73, minecraft_versions: ['1.6.1'] },
    { protocol_version: 74, minecraft_versions: ['1.6.2'] },
    { protocol_version: 78, minecraft_versions: ['1.6.4'] },
    { protocol_version: 4, minecraft_versions: ['1.7.2', '1.7.4', '1.7.5'] },
    { protocol_version: 5, minecraft_versions: ['1.7.6', '1.7.7', '1.7.8', '1.7.10'] },
    { protocol_version: 47, minecraft_versions: ['1.8', '1.8.1', '1.8.2', '1.8.3', '1.8.4', '1.8.5', '1.8.6', '1.8.7', '1.8.8', '1.8.9'] },
    { protocol_version: 107, minecraft_versions: ['1.9'] },
    { protocol_version: 108, minecraft_versions: ['1.9.1'] },
    { protocol_version: 109, minecraft_versions: ['1.9.2'] },
    { protocol_version: 110, minecraft_versions: ['1.9.3', '1.9.4'] },
    { protocol_version: 210, minecraft_versions: ['1.10', '1.10.1', '1.10.2'] },
    { protocol_version: 315, minecraft_versions: ['1.11'] },
    { protocol_version: 316, minecraft_versions: ['1.11.1', '1.11.2'] },
    { protocol_version: 316, minecraft_versions: ['1.11.1', '1.11.2'] },
    { protocol_version: 335, minecraft_versions: ['1.12'] },
    { protocol_version: 338, minecraft_versions: ['1.12.1'] },
    { protocol_version: 340, minecraft_versions: ['1.12.2'] },
    { protocol_version: 393, minecraft_versions: ['1.13'] },
    { protocol_version: 401, minecraft_versions: ['1.13.1'] },
    { protocol_version: 404, minecraft_versions: ['1.13.2'] },
    { protocol_version: 477, minecraft_versions: ['1.14'] },
    { protocol_version: 480, minecraft_versions: ['1.14.1'] },
    { protocol_version: 485, minecraft_versions: ['1.14.2'] },
    { protocol_version: 490, minecraft_versions: ['1.14.3'] },
    { protocol_version: 498, minecraft_versions: ['1.14.4'] },
    { protocol_version: 573, minecraft_versions: ['1.15'] },
    { protocol_version: 575, minecraft_versions: ['1.15.1'] },
    { protocol_version: 578, minecraft_versions: ['1.15.2'] },
    { protocol_version: 735, minecraft_versions: ['1.16'] },
    { protocol_version: 736, minecraft_versions: ['1.16.1'] },
    { protocol_version: 751, minecraft_versions: ['1.16.2'] },
    { protocol_version: 753, minecraft_versions: ['1.16.3'] },
    { protocol_version: 754, minecraft_versions: ['1.16.4', '1.16.5'] },
    { protocol_version: 755, minecraft_versions: ['1.17'] },
    { protocol_version: 756, minecraft_versions: ['1.17.1'] },
]

const FONT_PATH = path.join(__dirname, '..', 'fonts', 'rounded-mplus-1p-medium.ttf')
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 128
const FAVICON_WIDTH = 128
const FAVICON_HEIGHT = 128
const TEXT_COLOR = "#000000"
const BACKGROUND_COLOR = "#87cefa"
const FONT_SIZE = 32
const FONT_FAMILY = 'rounded-mplus-1p-medium'

const makeNotFoundErrorImage = (address) => {
    registerFont(FONT_PATH, { family: FONT_FAMILY })
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Text
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('(404) Not Found Error', 50, 40)
    ctx.fillText('Cannnot find that server', 50, 75)
    ctx.fillText(address, 50, 110)

    return canvas.toBuffer('image/png')
} 

const makeInternalServerErrorImage = () => {
    registerFont(FONT_PATH, { family: FONT_FAMILY })
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Text
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText('(500) Internal Server Error', 50, 75)

    return canvas.toBuffer('image/png')
} 

const makeImage = async (address: string, status: StatusResponse) => {
    registerFont(FONT_PATH, { family: FONT_FAMILY })
    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    // Server Favicon
    if (status.favicon != null) {
        const fav = status.favicon.split(",").slice(1).join(",");
        const favBuffer = Buffer.from(fav, "base64");
        const favImage = await loadImage(favBuffer)
        ctx.drawImage(favImage, (CANVAS_WIDTH - FAVICON_WIDTH), 0, FAVICON_WIDTH, FAVICON_HEIGHT)
    }

    // Text 
    ctx.font = `${FONT_SIZE}px ${FONT_FAMILY}`
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(address, 50, 40);
    ctx.fillText(`${status.onlinePlayers} / ${status.maxPlayers}`, 50, 75)
    ctx.fillText(`Ping ${status.roundTripLatency}ms`, 50, 110)

    /*
    const version = VERSIONS.find(v => v.protocol_version === status.protocolVersion)
    ctx.fillText(`Version${(version.minecraft_versions.length > 1 ? 's' : '')} ${version.minecraft_versions.join(' / ')}`, 50, 550)
    */

    return canvas.toBuffer('image/png')
}

export default async (req: NowRequest, res: NowResponse) => {
    res.setHeader("X-Robots-Tag", "noindex")
    const address = req.query["address"]

    if (typeof address !== "string") return res.status(400).write("invalid type")

    try {
        util.status(address).then((status) => {
            if(!status || status == null){
                res.status(404)
                res.send(makeNotFoundErrorImage(address))
                return
            }
            return status
        }).then((status) => {
            makeImage(address, status).then((img) => {
                res.setHeader("Link", `<${address}>; rel="canonical"`);
                res.setHeader("Content-Type", "image/png");
                res.setHeader("Content-DPR", "2.0");
                res.send(img);
            });
        })
    } catch (error) {
        res.status(500)
        res.send(makeInternalServerErrorImage())
    }
}
