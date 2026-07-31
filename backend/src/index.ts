import express from 'express'
import "dotenv/config"
import membroRoutes from './routes/membroRoutes';
import escalaFixaRoutes from './routes/escalaFixaRoutes'
import excecoesRoutes from './routes/excecoesRoutes'
import escalaVocalRoutes from './routes/escalaVocalRoutes'
import repertorioRoutes from './routes/repertorioRoutes'
import cultoRoutes from './routes/cultoRoutes'
import escalaAvulsaRoutes from './routes/escalaAvulsaRoutes'

const app = express()
app.use(express.json());

app.use('/membros', membroRoutes)
app.use('/escala-fixa', escalaFixaRoutes)
app.use('/excecoes', excecoesRoutes)
app.use('/escala-vocal', escalaVocalRoutes)
app.use('/repertorio', repertorioRoutes)
app.use('/cultos', cultoRoutes)
app.use('/escala-avulsa', escalaAvulsaRoutes)
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})