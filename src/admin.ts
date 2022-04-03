import express from 'express';
import multer from 'multer';
import path from 'path';
import { loadImage } from './loadImage';
import { image, io, progress, startTime, totalDraws } from './main';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' })

const app = express();
// app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    const str = `    
<h2>Obecny obrazek:</h2>
<img src='/web/current.png'>
<h2>Postęp: ${(progress * 100).toFixed(2)}%</h2>
<h2>Postawiono ${totalDraws} pikseli w ciągu ${(Date.now() - startTime) / 1000}s</h2>
<h2>Podłączeni użytkownicy: ${io.sockets.sockets.size}</h2>
<h2>Lewy górny punkt: (${image.props.topLeftX}, ${image.props.topLeftY})</h2>
`;
    res.send(str);
});

app.get('/current.png', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../data/image.png'));
})

app.get('/admin', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../../static/admin.html'));
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
 