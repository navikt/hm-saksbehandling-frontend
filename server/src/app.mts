import { logger, requestMeta } from './logging.mjs'
import { ipAddressFromRequest } from './ipAddressFromRequest.mjs'
import { reverseProxy } from './reverseProxy.mjs'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { getToken, validateAzureToken } from '@navikt/oasis'
import { tryDecodeJwt } from './tryDecodeJwt.mjs'

const app = express()

app.use(/\/((?!api).)*/, express.json())
app.use(/\/((?!api).)*/, express.urlencoded({ extended: false }))

app.get('/isalive', (_, res) => {
  res.type('text/plain')
  res.send('ALIVE')
})

app.get('/isready', (_, res) => {
  res.type('text/plain')
  res.send('READY')
})

app.get('/settings.js', (_, res) => {
  const appSettings = {
    USE_MSW: process.env.USE_MSW === 'true',
    MILJO: process.env.NAIS_CLUSTER_NAME,
    FARO_URL: process.env.FARO_URL,
  }
  res.type('.js')
  res.send(`window.appSettings = ${JSON.stringify(appSettings)}`)
})

// Protected routes
app.use('/*', async (req, res, next) => {
  const token = getToken(req)
  if (!token) {
    return res.redirect('/oauth2/login')
  }

  const validation = await validateAzureToken(token)
  if (validation.ok) {
    return next()
  }

  const navIdent = tryDecodeJwt(token).NAVident || 'ukjent'
  const message = `Ugyldig token for navIdent: ${navIdent}, koblet til via: ${ipAddressFromRequest(req)}, validationError: ${validation?.error?.message}`
  logger.info(message)
  logger.sikker.info(message, requestMeta(req), validation.error)

  res.sendStatus(401)
})

reverseProxy(app)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = __dirname + '/../../client/dist'
const htmlPath = path.join(distPath, 'index.html')

app.use(express.static(distPath))
app.use('/*', express.static(htmlPath))

export { app }
