# Claude Code Agents and Skills

[English](README.md) · Українська · [Русский](README.ru.md)

Знімок локального налаштування Claude Code автора на **2026-10-15**, який містить **18 інженерних навичок, 14 спеціалізованих агентів, стиль виводу Brief і 2 моди**, а також переносимі налаштування.

Навички охоплюють чистий і безпечний код, тестування, документацію, архітектуру, шаблони проєктування, плани реалізації, HTTP API, бази даних, інтерфейси, 3D, спостережуваність, стійкість сервісів, залежності та CI, випуск ПЗ, повідомлення комітів і безпеку LLM. Агенти призначені для дослідження коду, планування, пошуку в інтернеті, діагностики, реалізації, рев'ю, аудиту безпеки, аналізу баз даних, документації, запуску тестів і перевірки. Стиль виводу Brief зводить кожну підсумкову відповідь до одного короткого простого абзацу.

Обидва моди є плагінами Claude Code з модулем хуків:

- **brief-guard** замінює блоки промпту Claude Code, які суперечать стилю Brief. Він підставляє замість розділів системного промпту й нагадувань тексти зі своєї папки `instructions`, додає постійні правила автора, доповнює описи інструментів, зберігає правила під час стиснення контексту й додає нагадування після помилок інструментів, результатів агентів, команд оболонки, які читають або змінюють локальні файли, і змін, зроблених до читання довідкових файлів навички чи вебджерел. У режимі `bypassPermissions` він також дозволяє всі запити дозволів, які все ще доходять до вас, крім `AskUserQuestion`, `EnterPlanMode` і `ExitPlanMode`.
- **usage-line** показує над полем введення ліміти плану, вартість і кількість токенів: 5-годинний і 7-денний ліміти у вигляді шкал, які змінюють колір у міру заповнення, вартість сесії в доларах США та токени введення, виведення, читання й запису кешу.

Це особиста конфігурація, а не офіційний продукт Anthropic. Облікові дані, стан облікового запису, історія чатів, проєкти, сесії, плагіни, синхронізовані навички, кеші та локальні шляхи не публікуються.

> [!WARNING]
> Якщо у ваших налаштуваннях їх немає, інсталятор додає `"permissions": { "defaultMode": "bypassPermissions" }` і `"skipDangerousModePermissionPrompt": true`. Тоді Claude Code виконує будь-які виклики інструментів без запитань і не показує вікно підтвердження цього режиму, а brief-guard дозволяє решту запитів дозволів. [Документація режимів дозволів](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) радить цей режим лише для ізольованих середовищ, наприклад контейнерів і віртуальних машин без доступу до інтернету. Перед встановленням перевірте [налаштування](claude/settings.json) або спершу задайте власний `permissions.defaultMode`, бо інсталятор зберігає наявні значення.

## Встановлення та заміна старої версії

Завантажте й розпакуйте [ZIP-архів](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/archive/refs/heads/main.zip) або клонуйте репозиторій:

```sh
git clone https://github.com/dayfinggg/anthropic-claude-code-agent-skills.git
cd anthropic-claude-code-agent-skills
```

Із розпакованої або клонованої папки запустіть інсталятор. Він використовує включені файли без повторного завантаження.

### Windows

Потрібен Windows PowerShell 5.1 або PowerShell 7.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

### macOS і Linux

Потрібна POSIX-сумісна оболонка, `python3` для об'єднання налаштувань і утиліта SHA-256, наприклад `sha256sum`, `shasum` або `openssl`.

```sh
sh scripts/install.sh
```

Перезапустіть Claude Code після встановлення. Моди підключаються через `CLAUDE_CODE_PLUGIN_DIRS`, для цього потрібен Claude Code v2.1.280 або новіший.

**За замовчуванням виконується повна заміна.** Інсталятор створює резервну копію й замінює всі навички, крім `skills/synced`, усіх агентів, папку `output-styles` і папку `mods`, видаляючи старий набір. Синхронізовані навички, облікові дані, сесії, проєкти, плагіни й сторонні файли зберігаються. Наявні значення налаштувань не замінюються й відсутні ключі додаються, крім `outputStyle`, який отримує значення `Brief`, і `env.CLAUDE_CODE_PLUGIN_DIRS`, де перелічуються встановлені папки модів.

## Оновлення

Щоб завантажити й встановити актуальну версію з GitHub без оновлення робочої копії:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\update.ps1
```

```sh
sh scripts/update.sh
```

Потрібен інтернет, для оболонки додатково потрібні `curl` і `tar`. Оновлення зберігає вибраний режим встановлення. Для Git-клону можна натомість виконати `git pull --ff-only` і повторно запустити інсталятор.

## Склад

- [18 навичок із довідниками](claude/skills)
- [14 агентів](claude/agents)
- [Стиль виводу Brief](claude/output-styles/brief.md)
- Моди [brief-guard](claude/mods/brief-guard) і [usage-line](claude/mods/usage-line)
- [Переносимі налаштування](claude/settings.json)
- [Режими встановлення, резервні копії та інші шляхи](docs/installation.md)

Файли перенесені з локального налаштування байт у байт. У копії налаштувань немає `env.CLAUDE_CODE_PLUGIN_DIRS`, бо інсталятор записує це значення для кожної платформи, а папку `.claude-plugin/types` кожного мода не включено, бо [Claude Code створює ці визначення типів](https://code.claude.com/docs/en/plugins/mods/create#get-the-types-for-your-build) для своєї версії.

Claude Code зберігає конфігурацію в `~/.claude` або в папці зі змінної `CLAUDE_CONFIG_DIR`, як описано в [Environment variables](https://code.claude.com/docs/en/env-vars) і [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory). Особисті субагенти завантажуються з її папки `agents` ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)), навички зі `skills/<skill-name>/SKILL.md` ([Extend Claude with skills](https://code.claude.com/docs/en/skills)), стилі виводу з `output-styles` ([Output styles](https://code.claude.com/docs/en/output-styles)). `CLAUDE_CODE_PLUGIN_DIRS` завантажує кожну вказану папку так само, як `--plugin-dir`, а абсолютні шляхи розділяються `;` у Windows і `:` в інших системах ([Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)).

## Перевірка інсталяторів

Потрібен Python 3.11 або новіший:

```sh
python -m unittest discover -s tests -v
```

Тести працюють у тимчасових папках і не зачіпають справжнє налаштування Claude Code. Відсутні оболонки позначаються як пропущені перевірки.

Повідомлення про помилки приймаються в [GitHub issues](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/issues). Ліцензія інструкцій і програм репозиторію — [MIT](LICENSE).
