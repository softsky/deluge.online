require('dotenv-flow').config()
import express from 'express'

import Email from 'email-templates'
import * as fs from 'fs'
import imaps from 'imap-simple'
import * as _ from 'lodash'
import MarkdownIt from 'markdown-it'
import * as path from 'path'

import { BREACHES, BreachesForAccount } from '../lib/hibp'
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

const emailTemplate = new Email({
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

let x
const emailToCheck = 'Arsen A. Gutsal <gutsal.arsen@gmail.com>'
const emailAddress =
    ((x = emailToCheck.match(/(.*)\<([\.a-zA-Z0-9\@]*)\>/)) && x[2]) ||
    emailToCheck
const fullName =
    ((x = emailToCheck.match(/(.*)\<([\.\_\-\+a-zA-Z0-9\@]*)\>/)) && x[1]) || ''

const getRenderOptions = (email: string, breaches: any[]) => {
    return {
        email,
        checkme_email: CHECKME_EMAIL_ALIAS,
        support_email: SUPPORT_EMAIL,
        support_phone: SUPPORT_PHONE,
        breached_count: BREACHES.length,
        transactionId: 'd7f6037e1b1146dabab8f24fa98e7d43',
        reportDate: new Date().toLocaleDateString(LOCALE),
        full_name: fullName,
        friend_count: 5,
        items_to_show: 30,
        mailto_friends: mailto({
            cc: CHECKME_EMAIL_ALIAS,
            subject: '👆 Have you checked your account already?'
        }),
        payment_request_url:
            'https://docs.google.com/forms/d/1xk2wdx1yZ4V2DsbeleCKkr11QnORoq8d3yQZhR_267M/',
        tos_url: 'https://deluge-online.herokuapp.com/tos',
        breaches
    }
}

BreachesForAccount(emailAddress)
    .then((breaches: any[]) =>
        emailTemplate
            .send({
                template: 'account-report',
                message: {
                    from: 'checkme@softsky.company',
                    to: emailToCheck
                },
                locals: getRenderOptions(emailAddress, breaches)
            })
            .catch(console.error)
    )
    .catch(console.error)

// app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, '../templates'));

app.get('/', (req: any, res: any) =>
    res.status(200).send('SOFTSKY Account Audit')
)

app.get('/report/:emailToCheck', (req: any, res: any) => {
    if (req.params.emailToCheck) {
        BreachesForAccount(req.params.emailToCheck).then((breaches: any[]) =>
            emailTemplate
                .render(
                    'account-report/html',
                    _.extend(
                        getRenderOptions(req.params.emailToCheck, breaches),
                        req.query
                    )
                )
                .then(body => res.status(200).send(body))
                .catch(err => res.status(400).send(err))
        )
    } else {
        console.error(
            '/report/:emailToCheck <== emailToCheck must be specified'
        )
        res.status(400).send(
            '/report/:emailToCheck <== emailToCheck must be specified'
        )
    }
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
