import * as dotenv from 'dotenv-flow'
import express from 'express'
import mongoose, { Schema } from 'mongoose'

dotenv.config()

const app = express()
const port = process.env.SERVER_PORT || 8080 // default port to listen

const BadooModel = mongoose.model(
    'Badoo',
    new Schema(
        {
            __id: Number,
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
            const now = Date.now()
            const emails = recipients.map((it: any) => it.email)
            return BadooModel.updateMany(
                { email: { $in: emails } },
                { $set: { status: { num, template, updated: now } } }
            )
                .then(() =>
                    // sending `mailto:` redirect
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
                )
                .then(() =>
                    console.log(
                        `Generated email for: ${recipients.map(
                            (it: any) => it.email
                        )}`
                    )
                )
        })
        .catch(err => {
            console.log(err)
            res.status(500).send(err)
        })
})

// start the Express server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`)
})
