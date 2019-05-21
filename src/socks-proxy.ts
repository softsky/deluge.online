const socks = require('@luminati-io/socksv5')
import net from 'net'

import * as _ from 'lodash'

const defaultTorOpts = {
    proxyHost: '127.0.0.1',
    proxyPort: 9050,
    auths: [socks.auth.None()]
}

const SocksProxy = (
    host: string,
    port: number,
    options: any = defaultTorOpts
) =>
    new Promise((resolve, reject) => {
        if (options === null) {
            console.log('Using direct connection')
            const socket = net.connect(port, host)
            socket.on('connect', () => resolve(socket))
            socket.on('error', (error: any) => reject(error))
            socket.on('close', () => console.log('Ending connection'))
        } else {
            socks.connect(
                _.merge(options, { host, port }),
                (socket: any) => resolve(socks),
                (error: any) => reject(error)
            )
        }
    })

export { SocksProxy }
