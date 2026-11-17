import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import apiRoutes from './routes/index.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

const app = express()

const PORT = process.env.PORT || 9000

// Requests arrive through the Next.js /api proxy, so trust its X-Forwarded-For
// (needed for per-IP rate limiting). Override with TRUST_PROXY in production.
app.set('trust proxy', process.env.TRUST_PROXY ?? 'loopback')

// The browser normally talks to this API through the Next.js proxy (same origin).
// CORS only matters for direct calls; CLIENT_URL can be a comma-separated list.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map((o) => o.trim())
app.use(cors({ origin: allowedOrigins, credentials: true }))

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get('/', (req, res) => {
    res.json({
        message: 'API IS WORKING'
    })
})

app.use('/api', apiRoutes)

app.use(notFound)
app.use(errorHandler)

app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING ON ${PORT}`)
})
