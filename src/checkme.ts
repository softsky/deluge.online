import mongoose from 'mongoose'
import { CheckRequested, LeakedAccounts } from './models'

import imaps from 'imap-simple'

const nodemailer = require('nodemailer')

import delay from 'delay'
import PQueue from 'p-queue'

const Q = new PQueue({ concurrency: 1 })

const searchCriteria = ['UNSEEN']

const fetchOptions = {
    bodies: ['HEADER.FIELDS (FROM TO CC DATE)'],
    markSeen: true
}

const extractRecipients = (bodies: any[]) =>
    bodies.map(body => _.get(body, { to, recipients: ['cc', 'bcc'] }))

const searchAndFetch = (imap: any) =>
    imap
        .search(searchCriteria, fetchOptions)
        .then((results: any) =>
            _.flatten(
                results.map((it: any) => it.parts.map((that: any) => that.body))
            )
        )
        .then((bodies: any[]) => {
            const now = Date.now()
            let recipients: string[] = extractRecipients(bodies)
            // bodies.map((it: any) =>
            //            it.to
            //            .concat(it.cc)
            //            .map((to: any) =>
            //                 to
            //                 .split(/,/)

            //           )

            recipients = _.pull(_.uniq(_.flattenDepth(recipients, 3)), process
                .env.CHECKME_MAILBOX as string)

            return BadooModel.updateMany(
                { email: { $in: recipients } },
                { $set: { status: { updated: now } } }
            ).then(() => console.log('Updated recipients:', recipients))
        })

mongoose
    .connect(process.env.MONGODB_URL || '', { useNewUrlParser: true })
    .then(() => console.log(`Connected to ${process.env.MONGODB_URL}`))
//    .then(() = {}) // scan IMAP for UNREAD

export { extractRecipients, searchAndFetch }
