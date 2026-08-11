# Fish Audio｜粤见 Demo 生成清单

> 音色：统一女声  
> 音色 ID：`be60c03139d94dc7b0c26d83f66550db`  
> 音色页面：<https://fish.audio/zh-CN/app/m/be60c03139d94dc7b0c26d83f66550db/>  
> 机器可读清单：`content/audio/fish-audio.demo.json`

## 生成规则

- 输入使用下表的香港繁体文字；
- 语速保持自然、清楚，不刻意放慢；
- 字词独立读一次，不附加解释；
- 例句和对话保留正常停顿和问句语气；
- 下载 MP3 后严格改为表中文件名；
- 先试生成前 3 条并试听，音色、语速没问题后再生成剩余内容。

## A. 核心字词（6 条）

| 状态 | 生成文本 | 文件名 | 放置目录 |
|---|---|---|---|
| [ ] | 唔該 | `m4-goi1.mp3` | `public/audio/words/` |
| [ ] | 凍 | `dung3.mp3` | `public/audio/words/` |
| [ ] | 熱 | `jit6.mp3` | `public/audio/words/` |
| [ ] | 少甜 | `siu2-tim4.mp3` | `public/audio/words/` |
| [ ] | 走冰 | `zau2-bing1.mp3` | `public/audio/words/` |
| [ ] | 杯 | `bui1.mp3` | `public/audio/words/` |

## B. 课程例句（4 条）

| 状态 | 生成文本 | 文件名 | 放置目录 |
|---|---|---|---|
| [ ] | 我要杯凍奶茶。 | `order-milk-tea.mp3` | `public/audio/examples/` |
| [ ] | 凍檸茶少甜，唔該。 | `lemon-tea-less-sugar.mp3` | `public/audio/examples/` |
| [ ] | 我想要杯熱咖啡。 | `hot-coffee.mp3` | `public/audio/examples/` |
| [ ] | 杯凍奶茶走冰，唔該。 | `no-ice.mp3` | `public/audio/examples/` |

## C. 情景对话（5 条）

| 状态 | 角色 | 生成文本 | 文件名 | 放置目录 |
|---|---|---|---|---|
| [ ] | 店员 | 想飲啲咩啊？ | `order-drink-01.mp3` | `public/audio/dialogue/` |
| [ ] | 顾客 | 唔該，我想要杯凍檸茶，少甜。 | `order-drink-02.mp3` | `public/audio/dialogue/` |
| [ ] | 店员 | 要唔要走冰啊？ | `order-drink-03.mp3` | `public/audio/dialogue/` |
| [ ] | 顾客 | 唔使啦，少冰可以。 | `order-drink-04.mp3` | `public/audio/dialogue/` |
| [ ] | 店员 | 好，馬上來。 | `order-drink-05.mp3` | `public/audio/dialogue/` |

## 导入后验收

把 15 个 MP3 文件放入指定目录后，在项目根目录运行：

```bash
pnpm content:check:audio
```

检查通过后再接入课程页，避免页面引用缺失或放错目录的音频。

## 如果使用 API 批量生成

不要在对话中粘贴 API Key。确认 Fish Audio 账号已开通 API 后，把密钥写入本机未提交的环境文件，再根据机器可读 manifest 运行批处理脚本。会员权益与 API 额度可能分开，未确认前不假定会员一定包含 API 调用。
