let _packageManager = null

function ensureFetch() {
    if (globalThis.fetch) return
    const { net } = require('electron')
    globalThis.fetch = (url, opts = {}) => new Promise((resolve, reject) => {
        const req = net.request({ url, redirect: 'follow' })
        if (opts.signal) opts.signal.addEventListener('abort', () => req.abort())
        req.on('response', (res) => {
            const chunks = []
            res.on('data', c => chunks.push(c))
            resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                statusText: res.statusMessage || '',
                body: res,
                text: () => new Promise((ok, fail) => {
                    res.on('end', () => ok(Buffer.concat(chunks).toString()))
                    res.on('error', fail)
                }),
                json: () => new Promise((ok, fail) => {
                    res.on('end', () => { try { ok(JSON.parse(Buffer.concat(chunks).toString())) } catch(e) { fail(e) } })
                    res.on('error', fail)
                }),
            })
        })
        req.on('error', reject)
        req.end()
    })
}

async function getPackageManager() {
    ensureFetch()
    if (!_packageManager) {
        const { pathToFileURL } = require('url')
        const { PackageManager } = await import(pathToFileURL(require.resolve('upy-package/logic/package-manager.js').replace(/app\.asar([/\\])/, 'app.asar.unpacked$1')).href)
        _packageManager = new PackageManager()
    }
    return _packageManager
}

async function searchPackages(pattern) {
    const pm = await getPackageManager()
    const packages = await pm.findPackages(pattern || '')
    return packages.map(p => ({
        name: p.name || '',
        url: p.url || null,
        description: p.description || null,
        tags: p.tags || [],
        author: p.author || null,
        version: p.version || null,
        license: p.license || null,
        docs: p.docs || null,
    }))
}

module.exports = { searchPackages }
