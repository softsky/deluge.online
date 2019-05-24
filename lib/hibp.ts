import * as request from 'request-promise'
import { mailto } from './mailto'

const _ = require('lodash')

let BREACHES = require('../breaches.json')
BREACHES = BREACHES.map((it: any) =>
    _.extend(it, {
        mailto_remove: mailto({
            to: 'support@' + it.Domain,
            subject: encodeURIComponent('Please, remove my account permanently')
        })
    })
) // making mailto for every record

const BreachesForAccount = (emailToCheck: string) =>
    new Promise((resolve, reject) => {
        const options = {
            uri: `https://haveibeenpwned.com/api/v2/breachedaccount/${emailToCheck}`,
            headers: {
                'User-Agent': 'Request-Promise'
            },
            json: true // Automatically parses the JSON string in the response
        }

        request
            .get(options)
            .then((breaches: any) => {
                let x
                const decoratedBreaches = breaches.map((it: any) =>
                    _.extend(it, {
                        mailto_remove:
                            ((x = _.find(BREACHES, { Name: it.Name })) &&
                                x.mailto_remove) ||
                            null
                    })
                )
                console.log('User has %d breaches', breaches.length)
                resolve(decoratedBreaches)
            })
            .catch((err: any) => {
                if (err.statusCode === 404) {
                    resolve([]) // no breaches found for account
                } else {
                    console.error(err)
                    reject(err)
                }
            })
    })

export { BREACHES, BreachesForAccount }
