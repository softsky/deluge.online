import * as _ from 'lodash'

const mailto = (mobj: any) =>
    (mobj.to ? `mailto:${mobj.to}?` : 'mailto:?') +
    ['cc', 'bcc', 'subject', 'body']
        .filter(it => _.isEmpty(mobj[it]) === false)
        .map(it => `${it}=${mobj[it]}`)
        .join('&')

export { mailto }
