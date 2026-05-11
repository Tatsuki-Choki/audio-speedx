## アイコン生成（GPTimage2 / ローカル）

この拡張機能は `manifest.json` で以下のアイコンを参照します。

- `icons/icon-16.png`
- `icons/icon-32.png`
- `icons/icon-48.png`
- `icons/icon-128.png`

### 1) いま入っているアイコン（ローカル生成）

現状の `icons/icon-*.png` はローカルで描画したシンプルなベクター風アイコンです（アクセント: `#3b82f6`）。

### 2) GPTimage2（OpenAI Images API）で再生成したい場合

このリポジトリ内には画像生成CLIは同梱していないため、手元の環境で `OPENAI_API_KEY` を設定した上で、Codexの `imagegen` スキル同梱CLIを呼び出してください。

```bash
export OPENAI_API_KEY="(設定済みのキーを環境変数に)"
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export IMAGE_GEN="$CODEX_HOME/skills/imagegen/scripts/image_gen.py"

mkdir -p tmp/imagegen

python "$IMAGE_GEN" generate \
  --model gpt-image-2 \
  --size 1024x1024 \
  --background transparent \
  --output-format png \
  --prompt "A simple modern app icon for a Chrome extension that controls audio/video playback speed. Minimal flat vector style. Blue accent color #3b82f6. Centered play triangle with subtle motion lines suggesting speed change. No text, no watermark, transparent background."
```

生成した `png` を 128/48/32/16 に縮小して `icons/icon-*.png` として配置してください。
