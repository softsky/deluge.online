require('dotenv-flow').config()
import express from 'express'

import Email from 'email-templates'
import * as fs from 'fs'
import imaps from 'imap-simple'
import * as _ from 'lodash'
import MarkdownIt from 'markdown-it'
import * as path from 'path'
import * as request from 'request-promise'
import { mailto } from '../lib/mailto'

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
            images: false // <--- set this as `true`
        }
    },
    transport,
    // preview: true,
    views: { root: 'templates' }
})

const emailToCheck = 'gutsal.arsen@gmail.com'

const options = {
    uri: `https://haveibeenpwned.com/api/v2/breachedaccount/${emailToCheck}`,
    headers: {
        'User-Agent': 'Request-Promise'
    },
    json: true // Automatically parses the JSON string in the response
}

const B = require('./__resources/breaches.json')

request
    .get(options)
    .then(resp => resp || [])
    // Promise.resolve(B)
    .then((breaches: any) => {
        console.log(breaches)
        console.log('User has %d breaches', breaches.length)
        email
            .send({
                template: 'account-report',
                message: {
                    from: 'checkme@softsky.company',
                    to: emailToCheck
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
                    tos_url: 'https://deluge-online.herokuapp.com/tos'
                }
            })
            .then((res: any) => {
                console.log('res.originalMessage', res.originalMessage)
            })
            .catch(console.error)
    })
    .catch((err: any) => {
        if (err.statusCode === 404) {
            console.log('Address not found in the database!')
        } else {
            console.error(err)
        }
    })

// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, '../templates'));

app.get('/', (req: any, res: any) =>
    res.status(200).send('SOFTSKY Account Audit')
)

app.get('/report/:emailToCheck', (req: any, res: any) => {
    email
        .render(
            'account-report/html',
            _.extend(
                {
                    email: req.params.emailToCheck,
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
                    breaches: B,
                    friend_count: 5,
                    mailto_friends: mailto({ cc: CHECKME_EMAIL_ALIAS }),
                    tos_url: 'https://softsky.company/tos'
                },
                req.query
            )
        )
        .then(body => res.status(200).send(body))
        .catch(err => res.status(400).send(err))
})

const md = new MarkdownIt()
const tosMD = fs.readFileSync('src/tos.md').toString()

app.get('/tos', (req: any, res: any) => {
    res.status(200).send(md.render(tosMD))
})

// define a route handler for mailto:cc=checkme
app.get('/cc', (req: any, res: any) => {
    res.redirect(mailto({ cc: CHECKME_MAILBOX }))
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
