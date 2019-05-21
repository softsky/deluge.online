import mongoose from 'mongoose'
import { BadooModel, EmailSplitModel } from './models'

const nodemailer = require('nodemailer')

const dns = require('dns-then')
// const socks = require('@luminati-io/socksv5')

import delay from 'delay'
import PQueue from 'p-queue'

const Q = new PQueue({ concurrency: 1 })

mongoose
    .connect(process.env.MONGODB_URL || '', { useNewUrlParser: true })
    .then(() => console.log(`Connected to ${process.env.MONGODB_URL}`))
    .then(() =>
        // async..await is not allowed in global scope, must use a wrapper

        EmailSplitModel.aggregate([
            { $group: { _id: '$domain', locals: { $push: '$local' } } },
            { $limit: 100 }
        ]).then((domains: any[]) => {
            console.log(`Got ${JSON.stringify(domains)} domains`)
            domains.forEach((domainRec: any) => {
                const domain = domainRec._id
                console.log(`Adding ${domain} to queue`)
                Q.add(
                    () =>
                        new Promise((resolve, reject) =>
                            dns.resolveMx(domain).then((addresses: any[]) => {
                                const sortedAddresses = addresses.sort(
                                    (a, b) => a.priority - b.priority
                                )

                                const mx: string = sortedAddresses[0].exchange
                                console.log(
                                    `Attempting to connect to ${domain}:${mx}`
                                )

                                const transporter = nodemailer.createTransport({
                                    // service: 'gmail',
                                    // auth: {
                                    //     user: 'trap@softsky.com.ua',
                                    //     pass: 'Xt12Ujnj12'
                                    // },
                                    host: mx,
                                    port: 25,
                                    secure: false

                                    //                                  proxy: 'socks5://localhost:1080'
                                })

                                // enable support for socks URLs
                                transporter.set(
                                    'proxy_socks_module',
                                    require('socks')
                                )

                                const msgObj = require('../templates/badoo.hacked')(
                                    {
                                        num: 50,
                                        template: 'badoo.hacked',
                                        from: process.env.CHECKME_MAILBOX,
                                        to: domainRec.locals
                                            .map((it: any) => `${it}@${domain}`)
                                            .join(',')
                                        // cc: domainRec.locals.map((it: any) => `${it}@${domain}`).join(','),
                                    }
                                )

                                msgObj.text = msgObj.body
                                delete msgObj.body
                                msgObj.html = undefined // `<body>${msgObj.body}</body>`

                                return transporter
                                    .sendMail(msgObj)
                                    .then((result: any) =>
                                        console.log(
                                            'Email sent succesfully',
                                            result
                                        )
                                    )
                                    .catch((err: any) =>
                                        console.error('Email send failed', err)
                                    )
                                    .finally(
                                        () =>
                                            console.log(
                                                'Closing transporter',
                                                transporter.close()
                                            ),
                                        resolve()
                                    )

                                // socks.connect({
                                //     host: mx,
                                //     port: 25,
                                //     proxyHost: '127.0.0.1',
                                //     proxyPort: 1080,
                                //     auths: [socks.auth.None()]
                                // }, async (socket: any) => {
                                //     console.log(`Connected to ${domain}:${mx}`);
                                //     const emails = domainRec.locals
                                //     const s = new SMTPClient({socket:socket})
                                //     await s.connect()
                                //     await s.greet({hostname: mx}) // runs EHLO command or HELO as a fallback
                                //     console.log('Greet');
                                //     await s.mail({from: 'trap@softsky.company'}) // runs MAIL FROM command
                                //     console.log('Mail');
                                //     await s.rcpt({to: emails}); // runs RCPT TO command (run this multiple times to add more recii)
                                //     console.log('RCPT accepted');
                                //     //await s.data('mail source'); // runs DATA command and streams email source
                                //     await s.quit(); // runs QUIT command
                                // })
                                //     .on('error', (err:any) => {  console.error(err); reject(err)  })
                                //     .on('close', (err:any) => {  console.log('Connection closed'); reject(err)  })
                            }, reject)
                        )
                ).catch(console.error)
            })
        })
    )
    .catch((err: any) => {
        console.error(err)
    })
    .finally(() => mongoose.disconnect())
