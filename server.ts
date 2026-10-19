import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Garante que o diretório de uploads exista
const uploadsDir = path.resolve('public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer para armazenamento de fotos e vídeos no disco
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safeName = file.originalname
      .replace(ext, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${uniqueSuffix}_${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024, // Limite de 150MB para suportar vídeos gravados no celular
  },
});

// Middleware para JSON com limite ampliado
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Servir arquivos estáticos de uploads publicamente
app.use('/uploads', express.static(uploadsDir));
app.use(express.static(path.resolve('public')));

// Endpoint oficial de upload de fotos e vídeos da irmandade
app.post('/api/upload', upload.single('media'), (req, res): any => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const isVideo = req.file.mimetype.startsWith('video/') ||
    req.file.originalname.toLowerCase().endsWith('.mp4') ||
    req.file.originalname.toLowerCase().endsWith('.mov') ||
    req.file.originalname.toLowerCase().endsWith('.webm');

  const fileUrl = `/uploads/${req.file.filename}`;

  return res.json({
    success: true,
    url: fileUrl,
    mediaType: isVideo ? 'video' : 'photo',
    originalName: req.file.originalname,
    size: req.file.size,
  });
});

// Tratamento de erros do Multer (ex: tamanho de arquivo excedido)
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction): any => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'O vídeo ou foto excede o tamanho máximo suportado (150MB).' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }
  if (err) {
    return res.status(500).json({ error: err.message || 'Erro interno no upload de mídia.' });
  }
  next();
});

// Inicia servidor com Vite em desenvolvimento ou estático em produção
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Los Motokas MC] Servidor ativo em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
