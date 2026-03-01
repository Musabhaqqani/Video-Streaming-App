import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url';
import uploadRoute from './routes/uploadRoute.js'

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Have to write a middleware for access-control-allow-origin, jwt assertion, content-type, origin and accept

app.use('/api/v1', uploadRoute)
app.listen(8000, () => console.log('Server is listening at 3000'))