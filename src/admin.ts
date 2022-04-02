import express from 'express';
import multer from 'multer';
import path from 'path';
import { loadImage } from './loadImage';
import { image, progress } from './main';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' })

const app = express();
// app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send(`Postęp: ${Math.round(progress * 100)}%`);
});

app.get('/current.png', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../data/image.png'));
})

app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../static/index.html'));
});

app.post('/admin', upload.single('file'), async (req, res) => {
    let data = await loadImage(req.file.path, req.body.topLeftXY);
    image.props = data.props;
    image.pixels = data.pixels;

    console.log(path.resolve('data/image.json'));
    fs.writeFileSync(path.resolve('data/image.json'), JSON.stringify(data));
    fs.renameSync(path.resolve(req.file.path), path.resolve('data/image.png'));

    console.log('new image template loaded');

    res.redirect('/web/admin');
});

const port = process.env.ADMIN_PORT || 3001;
app.listen(port, () => console.log('admin listening on :'+port));
 