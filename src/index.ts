require('dotenv-flow').config()
import express from 'express'

import Email from 'email-templates'
import imaps from 'imap-simple'
import * as _ from 'lodash'
import * as path from 'path'
import * as request from 'request-promise'

const {
    CHECKME_MAILBOX,
    CHECKME_PASSWORD,
    CHECKME_EMAIL_ALIAS,
    SUPPORT_EMAIL,
    SUPPORT_PHONE,
    LOCALE
} = process.env

const app = express()
const port = process.env.PORT || 8080 // default port to listen

import nodemailer from 'nodemailer'
import { pugEngine } from 'nodemailer-pug-engine'

const transport =
    process.env.NODE_ENV === 'production'
        ? {
              service: 'gmail',
              auth: {
                  user: CHECKME_MAILBOX,
                  pass: CHECKME_PASSWORD
              }
          }
        : {
              jsonTransport: true
          }

const email = new Email({
    message: {
        from: CHECKME_MAILBOX || 'checkme@softsky.company'
    },
    juice: false,
    juiceResources: {
        preserveImportant: true,
        webResources: {
            relativeTo: path.resolve('templates'),
            images: true // <--- set this as `true`
        }
    },
    transport,
    // preview: true,
    views: { root: 'templates' }
})

const options = {
    uri:
        'https://haveibeenpwned.com/api/v2/breachedaccount/gutsal.arsen@gmail.com',
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
}

const B = require('./__resources/breaches.json')

request
    .get(options)
    .then(resp => resp.data)
    // Promise.resolve(B)
    .then((breaches: any) => {
        console.log('User has %d breaches', breaches.length)
        email
            .send({
                template: 'account-report',
                message: {
                    to: 'gutsal.arsen@gmail.com'
                },
                locals: {
                    email: 'a.gutsal@softsky.company',
                    checkme_email: CHECKME_EMAIL_ALIAS,
                    support_email: SUPPORT_EMAIL,
                    support_phone: SUPPORT_PHONE,
                    breached_count: 387,
                    transactionId: 'd7f6037e1b1146dabab8f24fa98e7d43',
                    reportDate: new Date().toLocaleDateString(LOCALE),
                    name: {
                        full: 'Andrew Barvinsky',
                        first: 'John',
                        last: 'Doe'
                    },
                    breaches,
                    friend_count: 5,
                    mailto_friends: mailto({ cc: CHECKME_EMAIL_ALIAS }),
                    tos_url: 'https://softsky.company/tos'
                }
            })
            .then((res: any) => {
                console.log('res.originalMessage', res.originalMessage)
            })
            .catch(console.error)
    })
    .catch((err: any) => {
        console.error(err)
    })

export const mailto = (mobj: any) =>
    (mobj.to ? `mailto:${mobj.to}?` : 'mailto:?') +
    ['cc', 'bcc', 'subject', 'body']
        .filter(it => _.isEmpty(mobj[it]) === false)
        .map(it => `${it}=${mobj[it]}`)
        .join('&')

// define a route handler for mailto:cc=checkme
app.get('/cc', (req: any, res: any) => {
    res.redirect(mailto({ cc: CHECKME_MAILBOX }))
})

app.get('/*.svg', (req: any, res: any) => {
    res.contentType('image/svg+xml').send(
        '<svg width="900" height="500" aria-label="A chart." style="overflow: hidden;"><defs id="_ABSTRACT_RENDERER_ID_0"></defs><rect x="0" y="0" width="900" height="500" stroke="none" stroke-width="0" fill="#ffffff"></rect><g><text text-anchor="start" x="161" y="70.9" font-family="Arial" font-size="14" font-weight="bold" stroke="none" stroke-width="0" fill="#000000">My Daily Activities</text><rect x="161" y="59" width="579" height="14" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect></g><g><rect x="542" y="96" width="198" height="106" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect><g column-id="Work"><rect x="542" y="96" width="198" height="14" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect><g><text text-anchor="start" x="561" y="107.9" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#222222">Work</text></g><circle cx="549" cy="103" r="7" stroke="none" stroke-width="0" fill="#3366cc"></circle></g><g column-id="Eat"><rect x="542" y="119" width="198" height="14" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect><g><text text-anchor="start" x="561" y="130.9" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#222222">Eat</text></g><circle cx="549" cy="126" r="7" stroke="none" stroke-width="0" fill="#dc3912"></circle></g><g column-id="Commute"><rect x="542" y="142" width="198" height="14" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect><g><text text-anchor="start" x="561" y="153.9" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#222222">Commute</text></g><circle cx="549" cy="149" r="7" stroke="none" stroke-width="0" fill="#ff9900"></circle></g><g column-id="Watch TV"><rect x="542" y="165" width="198" height="14" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect><g><text text-anchor="start" x="561" y="176.9" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#222222">Watch TV</text></g><circle cx="549" cy="172" r="7" stroke="none" stroke-width="0" fill="#109618"></circle></g><g column-id="Sleep"><rect x="542" y="188" width="198" height="14" stroke="none" stroke-width="0" fill-opacity="0" fill="#ffffff"></rect><g><text text-anchor="start" x="561" y="199.9" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#222222">Sleep</text></g><circle cx="549" cy="195" r="7" stroke="none" stroke-width="0" fill="#990099"></circle></g></g><g><path d="M340,251L340,97A154,154,0,0,1,379.8581329457882,399.75257724851656L340,251A0,0,0,0,0,340,251" stroke="#ffffff" stroke-width="1" fill="#3366cc"></path><text text-anchor="start" x="438.1707648577682" y="240.34252366466197" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#ffffff">45.8%</text></g><g><path d="M340,251L191.2474227514835,290.8581329457882A154,154,0,0,1,340,97L340,251A0,0,0,0,0,340,251" stroke="#ffffff" stroke-width="1" fill="#990099"></path><text text-anchor="start" x="225.02377088259124" y="183.02217618173913" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#ffffff">29.2%</text></g><g><path d="M340,251L231.1055556972717,359.89444430272835A154,154,0,0,1,191.2474227514835,290.8581329457882L340,251A0,0,0,0,0,340,251" stroke="#ffffff" stroke-width="1" fill="#109618"></path><text text-anchor="start" x="217.79914743775038" y="317.21509081498266" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#ffffff">8.3%</text></g><g><path d="M340,251L300.1418670542118,399.75257724851656A154,154,0,0,1,231.1055556972717,359.89444430272835L340,251A0,0,0,0,0,340,251" stroke="#ffffff" stroke-width="1" fill="#ff9900"></path><text text-anchor="start" x="261.2228787133989" y="364.63316362130666" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#ffffff">8.3%</text></g><g><path d="M340,251L379.8581329457882,399.75257724851656A154,154,0,0,1,300.1418670542118,399.75257724851656L340,251A0,0,0,0,0,340,251" stroke="#ffffff" stroke-width="1" fill="#dc3912"></path><text text-anchor="start" x="324" y="387.9827092057096" font-family="Arial" font-size="14" stroke="none" stroke-width="0" fill="#ffffff">8.3%</text></g><g></g></svg>'
    )
})

const config = {
    imap: {
        user: CHECKME_MAILBOX || 'checkme@softsky.company',
        password: CHECKME_PASSWORD || '',
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: {
            rejectUnauthorized: false
        },
        authTimeout: 30000
        // debug: console.log
    }
}

const searchCriteria = ['UNSEEN']

const searchAndFetchPromise = async (conn: any) => true

const fetchOptions = {
    bodies: ['HEADER.FIELDS (FROM TO CC BCC DATE)'],
    markSeen: true
}

// start the Express server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)

    console.log('Connecting to IMAP')
    imaps
        .connect(config)
        .then((conn: any) =>
            conn
                .openBox('INBOX')
                .then(() =>
                    conn.on('mail', (numMessages: number) =>
                        searchAndFetchPromise(conn)
                    )
                )
                .then(() => searchAndFetchPromise(conn))
        )
        .catch((err: any) => console.error(err))
})
