import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import cors from 'cors'
const app = express()

const PORT = process.env.PORT | 9000

app.use(cors({

}))


app.get('/', (req, res) => {
    res.json({
        message: 'API IS WORKING'
    })
})


app.listen(PORT, () => {
    console.log(`SERVER IS RUNNING ON ${PORT}`)
})