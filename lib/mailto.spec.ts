import { expect } from 'chai'
import * as _ from 'lodash'
import { mailto } from './mailto'

describe('mailto', () => {
    it('check mailto', () => {
        expect(mailto({ cc: 'checkme@a.com' })).to.equal(
            'mailto:?cc=checkme@a.com'
        )
        expect(mailto({ to: 'a@a.com', cc: 'checkme@a.com' })).to.equal(
            'mailto:a@a.com?cc=checkme@a.com'
        )
    })
})
