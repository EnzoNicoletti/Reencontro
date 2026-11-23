import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const ALLOWED_IMAGE_HOSTS = new Set([
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
]);

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

async function loadImagePart(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  // Local generated assets or static assets inside src/assets/images or dist/src/assets/images
  if (imageUrl.startsWith('/src/assets/images/')) {
    const filename = path.basename(imageUrl);
    if (!/^[a-zA-Z0-9_.\-]+$/.test(filename)) {
      throw new Error('Caminho de imagem inválido.');
    }

    const candidateDirs = [
      path.resolve(__dirname, 'src', 'assets', 'images'),
      path.resolve(__dirname, 'dist', 'src', 'assets', 'images'),
    ];

    for (const baseDir of candidateDirs) {
      const resolvedPath = path.resolve(baseDir, filename);
      if (!resolvedPath.startsWith(baseDir + path.sep)) {
        continue;
      }
      try {
        const buffer = await fs.readFile(resolvedPath);
        const ext = path.extname(filename).toLowerCase();
        const mimeType = MIME_BY_EXT[ext] || 'image/jpeg';
        return {
          inlineData: {
            mimeType,
            data: buffer.toString('base64'),
          },
        };
      } catch {
        // Try next candidate directory
      }
    }
    return null;
  }

  // Remote Firebase Storage HTTPS URLs with strict host allowlist
  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    throw new Error('URL de imagem inválida.');
  }

  if (parsedUrl.protocol !== 'https:' || !ALLOWED_IMAGE_HOSTS.has(parsedUrl.hostname)) {
    throw new Error('Origem de imagem não permitida para análise.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(parsedUrl.toString(), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Falha ao carregar imagem (${response.status}).`);
    }
    const contentType = (response.headers.get('content-type') || 'image/jpeg').split(';')[0].trim();
    if (!contentType.startsWith('image/')) {
      throw new Error('O arquivo informado não é uma imagem válida.');
    }
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > 6 * 1024 * 1024) {
      throw new Error('A imagem excede o limite de 6 MB para comparação.');
    }
    return {
      inlineData: {
        mimeType: contentType,
        data: Buffer.from(arrayBuffer).toString('base64'),
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  app.post('/api/ai/compare-pets', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error:
          'A comparação visual por IA requer a configuração de GEMINI_API_KEY no servidor (Settings > Secrets). A busca por proximidade e características continua funcionando normalmente.',
      });
    }

    const { reportA, reportB } = req.body || {};
    if (!reportA || !reportB || typeof reportA !== 'object' || typeof reportB !== 'object') {
      return res.status(400).json({ error: 'Informe dois relatos válidos para comparar.' });
    }

    const photoUrlA = Array.isArray(reportA.photoUrls) ? reportA.photoUrls[0] : null;
    const photoUrlB = Array.isArray(reportB.photoUrls) ? reportB.photoUrls[0] : null;

    if (!photoUrlA || !photoUrlB) {
      return res.status(400).json({
        error: 'Ambos os relatos precisam ter pelo menos uma fotografia para a comparação visual.',
      });
    }

    try {
      const [partA, partB] = await Promise.all([loadImagePart(photoUrlA), loadImagePart(photoUrlB)]);
      if (!partA || !partB) {
        return res.status(422).json({
          error: 'Não foi possível carregar uma ou ambas as imagens para análise visual.',
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptText = `Você está auxiliando tutores e voluntários da plataforma Reencontro a comparar visualmente duas fotografias de animais (um relato de animal perdido e um de animal encontrado/avistado).

Relato 1 (${reportA.type === 'lost' ? 'Perdido' : 'Encontrado'}):
- Nome/Título: ${String(reportA.animalName || 'Não informado').slice(0, 80)}
- Espécie: ${String(reportA.species || '').slice(0, 40)}
- Porte informado: ${String(reportA.size || '').slice(0, 40)}
- Cores informadas: ${Array.isArray(reportA.colors) ? reportA.colors.join(', ').slice(0, 120) : ''}
- Características informadas: ${String(reportA.characteristics || '').slice(0, 400)}

Relato 2 (${reportB.type === 'lost' ? 'Perdido' : 'Encontrado'}):
- Nome/Título: ${String(reportB.animalName || 'Não informado').slice(0, 80)}
- Espécie: ${String(reportB.species || '').slice(0, 40)}
- Porte informado: ${String(reportB.size || '').slice(0, 40)}
- Cores informadas: ${Array.isArray(reportB.colors) ? reportB.colors.join(', ').slice(0, 120) : ''}
- Características informadas: ${String(reportB.characteristics || '').slice(0, 400)}

Regras obrigatórias de resposta:
1. Escreva exclusivamente em Português do Brasil, com tom acolhedor, objetivo e cauteloso.
2. Nunca afirme que os animais são definitivamente o mesmo animal e nunca gere porcentagens de compatibilidade.
3. Considere que iluminação, ângulo da câmera, sujeira ou tempo na rua podem alterar levemente a aparência.
4. Descreva: semelhanças na cor da pelagem, semelhanças em manchas/marcações visíveis, semelhanças na aparência física (orelhas, focinho, porte, expressão) e diferenças visíveis relevantes (ou limitações da foto).
5. Inclua uma nota de cautela reforçando que a verificação presencial e o contato entre os envolvidos são indispensáveis.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            { text: 'Fotografia do Relato 1:' },
            partA,
            { text: 'Fotografia do Relato 2:' },
            partB,
            { text: promptText },
          ],
        },
        config: {
          systemInstruction:
            'Você é um assistente de observação visual cauteloso para comparação de fotografias de animais perdidos e encontrados. Nunca dê certezas absolutas nem porcentagens.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Resumo cauteloso em 2 frases sobre a comparação visual.',
              },
              coatSimilarities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Semelhanças observadas na cor e textura da pelagem.',
              },
              markingSimilarities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Semelhanças em manchas, marcações, coleira ou sinais visíveis.',
              },
              physicalSimilarities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Semelhanças na estrutura física, orelhas, focinho e porte.',
              },
              relevantDifferences: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Diferenças visíveis ou pontos de atenção (como ângulo ou iluminação).',
              },
              cautionNote: {
                type: Type.STRING,
                description: 'Nota de cautela lembrando que a análise não substitui verificação humana.',
              },
            },
            required: [
              'summary',
              'coatSimilarities',
              'markingSimilarities',
              'physicalSimilarities',
              'relevantDifferences',
              'cautionNote',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      return res.json({ analysis: parsed });
    } catch (err) {
      console.error('Erro na comparação visual Gemini:', err);
      const message = err instanceof Error ? err.message : 'Erro ao analisar as fotografias.';
      return res.status(500).json({
        error: `Não foi possível concluir a comparação visual neste momento: ${message}`,
      });
    }
  });

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Reencontro em execução na porta ${PORT}`);
  });
}

createApp();
