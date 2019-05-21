console.log(`Connected to ${domain}:${mx}`)

let dialog = [`HELO ${mx}`, `MAIL FROM:<${doc.email}>`]

const results = [{ email: 'trap@softsky.company' }]
dialog = dialog.concat(
    results.map((it: any) => `RCPT TO:<${it.email}>`),
    'QUIT'
)

const queue = new PQueue({ concurrency: 1, autoStart: false })

socket.on('data', (line: string) => {
    queue.add(() => console.log(line.toString()))
    queue.start()
})

socket.on('error', (err: any) => console.error('Error', err))
socket.on('end', (line: string) => console.log('Client disconnected'))

let response: any

while (dialog.length > 0) {
    await new Promise((resolve, reject) => {
        const it = dialog.shift()
        queue.add(() => socket.write(it + '\r\n', 'UTF-8', () => resolve(it)))
    })
        .then((it: any) => console.log(it))
        .then(() => queue.pause())
}

// let s = new SMTPClient({socket});

// await Promise.resolve(200)
//     .then(() => s.greet({hostname: mx}))
//     .then(() => s.mail({from: doc.email}))
//     .then(() => s.rcpt({to: 'trap@softsky.company'}))
//     .then(() => {
//         console.log(`Connected`, domain, mx)
//         return s
//             .data('test email')
//             .then(() => s.quit())
//     })
