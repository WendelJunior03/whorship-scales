import "dotenv/config"
import { app } from './app'

// Render (e a maioria dos PaaS) injeta a porta via env PORT; cai para 3000 em dev.
const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
