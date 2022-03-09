import proxy from 'express-http-proxy'
import * as core from 'express-serve-static-core'
import { AppConfig, OnBehalfOf, HotsakRequest } from './types'

const envProperties = {
  API_URL: process.env.API_URL || `http://localhost:7070`,
  GRUNNDATA_API_URL: process.env.GRUNNDATA_API_URL || ''
}
let onBehalfOf: OnBehalfOf
let spesialistId: string

const options = () => ({
  parseReqBody: false,
  proxyReqOptDecorator: (options: any, req: HotsakRequest) => {
    if (process.env.NAIS_CLUSTER_NAME !== 'labs-gcp') {
      return new Promise((resolve, reject) => {
        const hotsakToken = req.session.hotsakToken

        if (hotsakToken !== '') {
          onBehalfOf.hentFor(spesialistId, hotsakToken).then(
            (onBehalfOfToken) => {
              // @ts-ignore
              options.headers.Authorization = `Bearer ${onBehalfOfToken}`
              resolve(options)
            },
            (error) => reject(error)
          )
        } else {
          return resolve(options)
        }
      })
    } else {
      return options
    }
  },
  proxyReqPathResolver: (req: HotsakRequest) => {
    return pathRewriteBasedOnEnvironment(req)
  },
})

const pathRewriteBasedOnEnvironment = (req: HotsakRequest) => {
  return req.originalUrl
}

const setupProxy = (server: core.Express, _onBehaldOf: OnBehalfOf, config: AppConfig) => {
  onBehalfOf = _onBehaldOf
  spesialistId = config.oidc.clientIDHotsakApi
  server.use('/api/', proxy(envProperties.API_URL + '/api', options()))
  server.use('/grunndata-api', proxy(envProperties.GRUNNDATA_API_URL))
}

export default setupProxy
