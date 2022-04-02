import express from 'express';
import multer from 'multer';
import path from 'path';
import { loadImage } from './loadImage';
import { image } from './main';

const upload = multer({ dest: 'uploads/' })

const app = express();
// app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../static/index.html'));
});

app.post('/', upload.single('file'), async (req, res) => {
    let data = await loadImage(req.file.path, req.body.topLeftXY);
    image.props = data.props;
    image.pixels = data.pixels;

    console.log('new image template loaded');

    res.redirect(req.path);
});

const port = process.env.ADMIN_PORT || 3001;
app.listen(port, () => console.log('admin listening on :'+port));