import assert from 'assert'
import { expect } from 'chai'
import * as _ from 'lodash'
import { processDatabase } from '../checker'
import { log } from '../logger'
import { extractRecipients, searchAndFetch } from './checkme'

describe('emailChecker', () => {
    it('check valid user', done => {
        return checkAsync('gutsal.arsen@softsky.com.ua')
            .then((res: any) => {
                assert(res, 'checkAsync should return true')
                done()
            })
            .catch((err: any) => done.fail(`Should not be called: ${err}`))
    })
})
