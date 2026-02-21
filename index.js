import express from 'express'
import cors from 'cors'
import uploadRoute from './routes/uploadRoute.js'

const app = express();
app.use(cors({origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
// Have to write a middleware for access-control-allow-origin, jwt assertion, content-type, origin and accept

app.use('/api/v1', uploadRoute)
app.listen(8000, () => console.log('Server is listening at 3000'))