import * as dotenv from 'dotenv-flow'
import express from 'express'
import mongoose, { Schema } from 'mongoose'

import imaps from 'imap-simple'
import * as _ from 'lodash'

dotenv.config()

const app = express()
const port = process.env.SERVER_PORT || 8080 // default port to listen

const BadooModel = mongoose.model(
    'Badoo',
    new Schema(
        {
            email: String,
            num: Number,
            pwd_hash: String,
            fullname: String,
            firstname: String,
            lastname: String,
            status: Object,
            date_of_birth: Date,
            age_as_of_2012: Number,
            gender: String,
            num1: Number,
            num2: Number,
            num3: Number
        },
        { collection: 'badoo' }
    )
)

mongoose
    .connect(process.env.MONGODB_URL || '', { useNewUrlParser: true })
    .then(() => console.log(`Connected to ${process.env.MONGODB_URL}`))
    .catch((err: any) => {
        console.error(err)
    })

const mailto = (mobj: any) =>
    `mailto:${mobj.to}?subject=${mobj.subject}&body=${mobj.body}`

// define a route handler for the default home page
app.get('/:num@:template', (req: any, res: any) => {
    const template = req.params.template
    const num = req.params.num
    console.log(template)
    // lookng up for next recipiets to deliver message to
    return BadooModel.find(
        { num1: num, status: { $exists: false } },
        { _id: 1, email: 1, status: 1 }
    )
        .limit(parseInt(process.env.RECEIPIENT_LIMIT || '15', 10))
        .then((recipients: any[]) => {
            // setting status to `false`
            const emails = recipients.map((it: any) => it.email)
            console.log(
                `Generated email for: ${recipients.map((it: any) => it.email)}`
            )
            res.redirect(
                mailto(
                    require(`../templates/${template}.js`)({
                        num,
                        template,
                        recipients: recipients
                            .concat({ email: process.env.TRAP_MAILBOX })
                            .map((it: any) => it.email)
                            .join(','),
                        url: `http://mail.softsky.company/${num}@${template}`
                    })
                )
            )
        })
        .catch(err => {
            console.log(err)
            res.status(500).send(err)
        })
})

const config = {
    imap: {
        user: 'trap@softsky.com.ua',
        password: 'Xt12Ujnj12',
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

const fetchOptions = {
    bodies: ['HEADER.FIELDS (FROM TO DATE)'],
    markSeen: true
}

const searchAndFetchPromise = async (conn: any) =>
    conn
        .search(searchCriteria, fetchOptions)

        .then((results: any) =>
            _.flatten(
                results.map((it: any) => it.parts.map((that: any) => that.body))
            )
        )
        .then((bodies: any[]) => {
            const now = Date.now()
            let recipients: string[] = bodies.map((it: any) =>
                it.to.map((to: any) =>
                    to
                        .split(/,/)
                        .map((i: string) =>
                            i.match(
                                /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi
                            )
                        )
                )
            )

            recipients = _.uniq(
                _.flattenDepth(
                    _.pull(recipients, process.env.TRAP_MAILBOX as string),
                    3
                )
            )

            return BadooModel.updateMany(
                { email: { $in: recipients } },
                { $set: { status: { updated: now } } }
            ).then(() => console.log('Updated recipients:', recipients))
        })

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
