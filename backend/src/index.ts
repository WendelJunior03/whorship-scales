import express from 'express'
import "dotenv/config"
import membroRoutes from './routes/membroRoutes';

const app = express()
app.use(express.json());

app.use('/membros', membroRoutes)

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})