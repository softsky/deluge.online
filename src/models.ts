import mongoose, { Schema } from 'mongoose'

const BadooModel = mongoose.model(
    'Badoo',
    new Schema(
        {
            id: String,
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

const EmailSplitModel = mongoose.model(
    'EmailSplit',
    new Schema(
        {
            local: String,
            domain: String
        },
        { collection: 'emails_split' }
    )
)

const CheckRequested = mongoose.model(
    'CheckRequested',
    new Schema(
        {
            from: String,
            to: [],
            dateRequested: Date
        },
        { collection: 'check_requested' }
    )
)

const LeakedAccounts = mongoose.model(
    'LeakedAccounts',
    new Schema(
        {
            email: String,
            dateScanned: Date,
            hibpw: Object
        },
        { collection: 'leaked_accounts' }
    )
)

export { BadooModel, EmailSplitModel }
