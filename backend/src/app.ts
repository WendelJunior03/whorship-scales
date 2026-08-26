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
import organizacaoRoutes from './routes/organizacaoRoutes'
import musicaRoutes from './routes/musicaRoutes'
import videoRoutes from './routes/videoRoutes'
import ministerioRoutes from './routes/ministerioRoutes'
import comentarioRoutes from './routes/comentarioRoutes'

// App Express montado (sem escutar porta) — index.ts faz o listen; os testes de
// integração importam este `app` direto (supertest), sem subir servidor.
export const app = express()

const allowedOrigins = [
    'https://deep-scales.vercel.app',
    'http://localhost:8081',
    'http://localhost:19006',
]
app.use(cors({
    origin: allowedOrigins,
}))
app.use(express.json());

app.use('/organizacoes', organizacaoRoutes)
app.use('/membros', membroRoutes)
app.use('/escala-fixa', escalaFixaRoutes)
app.use('/excecoes', excecoesRoutes)
app.use('/escala-vocal', escalaVocalRoutes)
app.use('/repertorio', repertorioRoutes)
app.use('/cultos', cultoRoutes)
app.use('/escala-avulsa', escalaAvulsaRoutes)
app.use('/notificacoes', notificacaoRoutes)
app.use('/musicas', musicaRoutes)
app.use('/videos', videoRoutes)
app.use('/ministerios', ministerioRoutes)
app.use('/comentarios', comentarioRoutes)

export default app
