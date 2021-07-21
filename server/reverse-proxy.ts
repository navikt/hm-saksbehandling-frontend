import proxy from 'express-http-proxy'
import * as core from 'express-serve-static-core'
import { AppConfig, OnBehalfOf, SpeilRequest } from './types'

const envProperties = {
  API_URL: process.env.API_URL || `http://localhost:7070`,
}
let onBehalfOf: OnBehalfOf;
let spesialistId: string;

const options = () => (
  {
  parseReqBody: false,
    proxyReqOptDecorator: (options: any, req: SpeilRequest) => {
      if (process.env.NAIS_CLUSTER_NAME !== 'labs-gcp') {
        return new Promise((resolve, reject) => {
          const speilToken = req.session.speilToken

          if (speilToken !== '') {
            onBehalfOf
              .hentFor(spesialistId, req.session!.speilToken).then(
              (onBehalfOfToken) => {
                // @ts-ignore
                options.headers.Authorization = `Bearer ${onBehalfOfTokenn}`
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
  proxyReqPathResolver: (req: SpeilRequest) => {
    return pathRewriteBasedOnEnvironment(req)
  },
})

const pathRewriteBasedOnEnvironment = (req: SpeilRequest) => {
  return req.originalUrl
}

const setupProxy = (server: core.Express, _onBehaldOf: OnBehalfOf, config: AppConfig) => {
  onBehalfOf = _onBehaldOf
  spesialistId = config.oidc.clientIDSpesialist;
  server.use('/api/', proxy(envProperties.API_URL + '/api', options()))
}

export default setupProxy
