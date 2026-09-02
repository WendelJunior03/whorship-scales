import express from 'express'
import "dotenv/config"
import cors from 'cors'
import membroRoutes from './routes/membroRoutes';
import escalaVocalRoutes from './routes/escalaVocalRoutes'
import repertorioRoutes from './routes/repertorioRoutes'
import cultoRoutes from './routes/cultoRoutes'
import escalaAvulsaRoutes from './routes/escalaAvulsaRoutes'
import notificacaoRoutes from './routes/notificacaoRoutes'
import organizacaoRoutes from './routes/organizacaoRoutes'
import musicaRoutes from './routes/musicaRoutes'
import videoRoutes from './routes/videoRoutes'
import ministerioRoutes from './routes/ministerioRoutes'
import panoramaRoutes from './routes/panoramaRoutes'
import ensaioRoutes from './routes/ensaioRoutes'
import comentarioRoutes from './routes/comentarioRoutes'
import historicoRoutes from './routes/historicoRoutes'
import roteiroRoutes from './routes/roteiroRoutes'
import indisponibilidadeRoutes from './routes/indisponibilidadeRoutes'
import avisoRoutes from './routes/avisoRoutes'
import pastaRoutes from './routes/pastaRoutes'
import assinaturaRoutes from './routes/assinaturaRoutes'
import integracaoRoutes from './routes/integracaoRoutes'
import billingRoutes from './routes/billingRoutes'
import { webhookController } from './controllers/billingController'

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

// Webhook do Stripe: precisa do corpo CRU (Buffer) pra validar a assinatura HMAC,
// então é montado ANTES do express.json() e com o parser raw só nesta rota.
app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookController)

app.use(express.json());

app.use('/organizacoes', organizacaoRoutes)
app.use('/membros', membroRoutes)
app.use('/escala-vocal', escalaVocalRoutes)
app.use('/repertorio', repertorioRoutes)
app.use('/cultos', cultoRoutes)
app.use('/escala-avulsa', escalaAvulsaRoutes)
app.use('/notificacoes', notificacaoRoutes)
app.use('/musicas', musicaRoutes)
app.use('/videos', videoRoutes)
app.use('/ministerios', ministerioRoutes)
app.use('/panorama', panoramaRoutes)
app.use('/ensaios', ensaioRoutes)
app.use('/comentarios', comentarioRoutes)
app.use('/historico', historicoRoutes)
app.use('/roteiro', roteiroRoutes)
app.use('/indisponibilidades', indisponibilidadeRoutes)
app.use('/avisos', avisoRoutes)
app.use('/pastas', pastaRoutes)
app.use('/assinaturas', assinaturaRoutes)
app.use('/integracoes', integracaoRoutes)
app.use('/billing', billingRoutes)

export default app
