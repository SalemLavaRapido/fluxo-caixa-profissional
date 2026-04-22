# Como Criar GIF Guia Rápido para Deploy

## Ferramentas Recomendadas

### Windows:
1. **ScreenToGif** (gratuito)
   - Baixe em: https://www.screentogif.com/
   - Grave, edite e otimize GIFs

2. **LICEcap** (gratuito)
   - Baixe em: https://www.cockos.com/licecap/
   - Simples e rápido

3. **OBS Studio + FFmpeg** (gratuito)
   - Grave com OBS
   - Converta para GIF com FFmpeg

## Passos para Gravar

### 1. Preparar a Tela
- Limpe seu desktop
- Abra apenas as janelas necessárias
- Ajuste o tamanho da área de gravação

### 2. Cenário para Gravar
1. **Login no Supabase**
2. **SQL Editor** 
3. **Colar e executar setup-supabase.sql**
4. **Abrir Netlify**
5. **Drag and drop dos arquivos**
6. **Configurar variáveis de ambiente**
7. **Testar aplicação online**

### 3. Configurações de Gravação
- **Duração**: 20-30 segundos
- **FPS**: 15-20 (para arquivo menor)
- **Qualidade**: Média (legível mas compacto)
- **Tamanho**: 800x600 ou 1024x768

### 4. Edição
- Corte partes desnecessárias
- Adicione texto explicativo
- Ajuste velocidade se necessário

### 5. Otimização
- Use ezgif.com para otimizar
- Reduza cores se possível
- Comprima sem perder qualidade

## Script FFmpeg (se usar OBS)

```bash
# Converter MP4 para GIF
ffmpeg -i video.mp4 -vf "fps=15,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 output.gif
```

## Resultado Final

O GIF deve mostrar:
- Processo completo de deploy
- Ser curto e direto
- Ter boa legibilidade
- Arquivo < 5MB

Salve como `deploy-guia-rapido.gif` na pasta do projeto.
