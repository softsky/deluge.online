import { expect } from 'chai'
import * as _ from 'lodash'
// import { mailto } from './index'

describe('index.ts', () => {
    const mailto = (mobj: any) =>
        (mobj.to ? `mailto:${mobj.to}?` : 'mailto:?') +
        ['cc', 'bcc', 'subject', 'body']
            .filter(it => _.isEmpty(mobj[it]) === false)
            .map(it => `${it}=${mobj[it]}`)
            .join('&')

    it('check mailto', () => {
        expect(mailto({ cc: 'checkme@a.com' })).to.equal(
            'mailto:?cc=checkme@a.com'
        )
        expect(mailto({ to: 'a@a.com', cc: 'checkme@a.com' })).to.equal(
            'mailto:a@a.com?cc=checkme@a.com'
        )
    })
})
