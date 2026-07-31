import express from 'express'
import "dotenv/config"
import cors from 'cors'
import membroRoutes from './routes/membroRoutes';
import escalaFixaRoutes from './routes/escalaFixaRoutes'
import excecoesRoutes from './routes/excecoesRoutes'
import escalaVocalRoutes from './routes/escalaVocalRoutes'
import repertorioRoutes from './routes/repertorioRoutes'
import cultoRoutes from './routes/cultoRoutes'
import escalaAvulsaRoutes from './routes/escalaAvulsaRoutes'
import notificacaoRoutes from './routes/notificacaoRoutes'

const app = express()

const allowedOrigins = [
    'https://deep-scales.vercel.app',
    'http://localhost:8081',
    'http://localhost:19006',
]
app.use(cors({
    origin: allowedOrigins,
}))
app.use(express.json());

app.use('/membros', membroRoutes)
app.use('/escala-fixa', escalaFixaRoutes)
app.use('/excecoes', excecoesRoutes)
app.use('/escala-vocal', escalaVocalRoutes)
app.use('/repertorio', repertorioRoutes)
app.use('/cultos', cultoRoutes)
app.use('/escala-avulsa', escalaAvulsaRoutes)
app.use('/notificacoes', notificacaoRoutes)
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})