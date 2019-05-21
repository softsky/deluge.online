import { expect, should } from 'chai'
import express from 'express'
import { SocksProxy } from './socks-proxy'

const app = express()
let server: any
describe('socks-proxy', () => {
    jest.setTimeout(10000)
    beforeAll(
        done =>
            (server = app.listen(58888, () => {
                console.log('Server started')
                done()
            }))
    ) // running local express server
    afterAll(() => server.close()) // shutting down local express server

    it('default non-proxy initialization', done =>
        SocksProxy('localhost', 58888, null).then((socket: any) => {
            console.log('connected')
            expect(socket).toExist()
            console.log(JSON.stringify(socket))
            socket.on('data', (line: any) =>
                console.log(line.toString('utf-8'))
            )
            socket.write('GET / HTTP/1.0\r\n\r\n')
            socket.on('close', done)
            return socket
        }))
})
