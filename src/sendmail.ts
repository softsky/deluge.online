import mongoose from 'mongoose'
import { BadooModel } from './models'

import * as dotenv from 'dotenv-flow'
import * as _ from 'lodash'

const dns = require('dns-then')

import delay from 'delay'
dotenv.config()

mongoose
    .connect(process.env.MONGODB_URL || '', { useNewUrlParser: true })
    .then(() => console.log(`Connected to ${process.env.MONGODB_URL}`))
    .catch((err: any) => {
        console.error(err)
    })

// async.await is not allowed in global scope, must use a wrapper
BadooModel.find({ email: /.*@.*\.ua$/, status: { $exists: false } })
    .skip(0)
    .limit(25)
    .then(
        (results: any[]) =>
            [results[0]]
                .map(it => it.email)
                .forEach((email: string) => {
                    const parts: string[] = email.split('@')
                    const local: string = parts[0]
                    const domain: string = parts[1]

                    dns.resolveMx(domain)
                        .then(
                            (addresses: any[]) => {
                                const sortedAddresses = addresses.sort(
                                    (a, b) => a.priority - b.priority
                                )

                                return sortedAddresses
                            },
                            (err: any) => console.log('>> Error', err)
                        )
                        .then((sortedAddresses: any[]) => {
                            const mx = sortedAddresses[0].exchange
                            socks.connect(
                                {
                                    host: mx,
                                    port: 25,
                                    proxyHost: '127.0.0.1',
                                    proxyPort: 9050,
                                    auths: [socks.auth.None()]
                                },
                                (socket: any) => {
                                    console.log('>> SMTP connection successful')

                                    let dialog = [
                                        `HELO ${mx}`,
                                        `MAIL FROM:<$email>`
                                    ]
                                    dialog = dialog.concat(
                                        results.map(
                                            (rcpt: any) =>
                                                `RCPT TO:<${rcpt.email}>`
                                        ),
                                        'QUIT'
                                    )

                                    console.log(`Connected ${mx}`, email)
                                    socket.on('error', (err: any) =>
                                        console.log('Error', err)
                                    )
                                    socket.on('end', (line: string) =>
                                        console.log('Client disconnected')
                                    )

                                    let it = dialog.shift()
                                    while (dialog.length > 0) {
                                        Promise.all([
                                            new Promise((resolve, reject) => {
                                                console.log(it)

                                                socket.write(
                                                    it + '\r\n',
                                                    'UTF-8',
                                                    resolve
                                                )
                                            })
                                                .then(
                                                    () =>
                                                        new Promise(
                                                            (resolve, reject) =>
                                                                socket.on(
                                                                    'data',
                                                                    (
                                                                        line: string
                                                                    ) => {
                                                                        console.log(
                                                                            line.toString()
                                                                        )
                                                                        resolve(
                                                                            line.toString()
                                                                        )
                                                                    }
                                                                )
                                                        )
                                                )
                                                .then(line =>
                                                    console.log(line)
                                                ),
                                            delay(2000)
                                        ]).then(() => (it = dialog.shift()))
                                    }
                                }
                            )
                        })
                })

        // console.log(`Creating transport to send to ${email} using exchange ${sortedAddresses[0].exchange}`);
        // // create reusable transporter object using the default SMTP transport
        // var mail = require('mail').Mail({
        //     host: sortedAddresses[0].exchange,
        // });

        // const num = 50
        // const template = 'badoo.hacked'
        // const recipients = results

        // const msg = require(`../templates/${template}.js`)({
        //     num,
        //     template,
        //     recipients: recipients
        //         .concat({ email: process.env.CHECKME_MAILBOX })
        //         .map((it: any) => it.email)
        //         .join(','),
        //     url: `http://mail.softsky.company/${num}@${template}`
        // })

        // await new Promise((resolve, reject) =>
        //                   mail.message({
        //                       from: email,
        //                       to: [msg.recipients],
        //                       subject: msg.subject
        //                   })
        //                   .body(msg.body)
        //                   .send(function(err:any) {
        //                       if (err) reject(err)
        //                       else {
        //                           console.log('Sent!')
        //                           resolve('Sent')
        //                       }
        //                   }));
        // // setup email data with unicode symbols
        // // const mailOptions = {
        // //     from: email, // sender address
        // //     to: 'trap+23@softsky.company',
        // //     cc: 'trap@softsky.company',
        // //     subject: 'Hello ✔', // Subject line
        // //     text: 'Hello world?', // plain text body
        // //     html: '<b>Hello world?</b>' // html body
        // // }

        // // // send mail with defined transport object
        // // await transporter.sendMail(mailOptions)
        // //     .then((info:any) => {
        // //         console.log('Message sent: %s', info.messageId)
        // //         // Preview only available when sending through an Ethereal account
        // //         console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
        // //     })
        // //     .catch(console.error)

        // // Message sent: <[email protected]>
        // // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    )
    .catch(console.error)
