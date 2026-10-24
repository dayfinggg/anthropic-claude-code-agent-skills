# Claude Code Agents and Skills

[English](README.md) · [Українська](README.uk.md) · Русский

Снимок локальной настройки Claude Code автора на **2026-10-15**, включающий **18 инженерных навыков, 14 специализированных агентов, стиль вывода Brief и 2 мода**, а также переносимые настройки.

Навыки охватывают чистый и безопасный код, тестирование, документацию, архитектуру, шаблоны проектирования, планы реализации, HTTP API, базы данных, интерфейсы, 3D, наблюдаемость, устойчивость сервисов, зависимости и CI, выпуск ПО, сообщения коммитов и безопасность LLM. Агенты предназначены для исследования кода, планирования, поиска в интернете, диагностики, реализации, ревью, аудита безопасности, анализа баз данных, документации, запуска тестов и проверки. Стиль вывода Brief сводит каждый итоговый ответ к одному короткому простому абзацу.

Оба мода являются плагинами Claude Code с модулем хуков:

- **brief-guard** заменяет блоки промпта Claude Code, которые противоречат стилю Brief. Он подставляет вместо разделов системного промпта и напоминаний тексты из своей папки `instructions`, добавляет постоянные правила автора, дополняет описания инструментов, сохраняет правила при сжатии контекста, добавляет короткую заметку к запросу, набранному во время работы, и добавляет напоминания после ошибок инструментов, результатов агентов, команд оболочки, которые читают или меняют локальные файлы, текста рядом с вызовом инструмента, списка задач, который не менялся 30 вызовов, и изменений, сделанных до чтения справочных файлов навыка или документации нового языка. В режиме `bypassPermissions` он также разрешает все запросы разрешений, которые всё ещё доходят до вас, кроме `AskUserQuestion`, `EnterPlanMode` и `ExitPlanMode`.
- **usage-line** показывает над полем ввода лимиты плана, стоимость и количество токенов: 5-часовой и 7-дневный лимиты в виде шкал, которые меняют цвет по мере заполнения, стоимость сессии в долларах США и токены ввода, вывода, чтения и записи кеша.

Это личная конфигурация, а не официальный продукт Anthropic. Учётные данные, состояние аккаунта, история чатов, проекты, сессии, плагины, синхронизированные навыки, кеши и локальные пути не публикуются.

> [!WARNING]
> Если в ваших настройках их нет, установщик добавляет `"permissions": { "defaultMode": "bypassPermissions" }` и `"skipDangerousModePermissionPrompt": true`. Тогда Claude Code выполняет любые вызовы инструментов без вопросов и не показывает окно подтверждения этого режима, а brief-guard разрешает оставшиеся запросы разрешений. [Документация режимов разрешений](https://code.claude.com/docs/en/permission-modes#skip-all-checks-with-bypasspermissions-mode) рекомендует этот режим только для изолированных сред, например контейнеров и виртуальных машин без доступа в интернет. Перед установкой проверьте [настройки](claude/settings.json) или сначала задайте собственный `permissions.defaultMode`, потому что установщик сохраняет существующие значения.

## Установка и замена старой версии

Скачайте и распакуйте [ZIP-архив](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/archive/refs/heads/main.zip) или клонируйте репозиторий:

```sh
git clone https://github.com/dayfinggg/anthropic-claude-code-agent-skills.git
cd anthropic-claude-code-agent-skills
```

Из распакованной или клонированной папки запустите установщик. Он использует включенные файлы без повторного скачивания.

### Windows

Требуется Windows PowerShell 5.1 или PowerShell 7.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

### macOS и Linux

Требуется POSIX-совместимая оболочка, `python3` для объединения настроек и утилита SHA-256, например `sha256sum`, `shasum` или `openssl`.

```sh
sh scripts/install.sh
```

Перезапустите Claude Code после установки. Моды подключаются через `CLAUDE_CODE_PLUGIN_DIRS`, для этого нужен Claude Code v2.1.280 или новее.

**По умолчанию выполняется полная замена.** Установщик сохраняет резервную копию и заменяет все навыки, кроме `skills/synced`, всех агентов, папку `output-styles` и папку `mods`, удаляя старый набор. Синхронизированные навыки, учётные данные, сессии, проекты, плагины и посторонние файлы сохраняются. Значения существующих настроек не заменяются и недостающие ключи добавляются, кроме `outputStyle`, который получает значение `Brief`, и `env.CLAUDE_CODE_PLUGIN_DIRS`, где перечисляются установленные папки модов.

## Обновление

Чтобы скачать и установить актуальную версию с GitHub без обновления рабочей копии:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\update.ps1
```

```sh
sh scripts/update.sh
```

Нужен интернет, для оболочки дополнительно нужны `curl` и `tar`. Обновление сохраняет выбранный режим установки. Для Git-клона можно вместо этого выполнить `git pull --ff-only` и повторно запустить установщик.

## Состав

- [18 навыков со справочниками](claude/skills)
- [14 агентов](claude/agents)
- [Стиль вывода Brief](claude/output-styles/brief.md)
- Моды [brief-guard](claude/mods/brief-guard) и [usage-line](claude/mods/usage-line)
- [Переносимые настройки](claude/settings.json)
- [Режимы установки, резервные копии и другие пути](docs/installation.md)

Файлы перенесены из локальной настройки байт в байт. В копии настроек нет `env.CLAUDE_CODE_PLUGIN_DIRS`, потому что установщик записывает это значение для каждой платформы, а папка `.claude-plugin/types` каждого мода не включена, потому что [Claude Code создаёт эти определения типов](https://code.claude.com/docs/en/plugins/mods/create#get-the-types-for-your-build) для своей версии.

Claude Code хранит конфигурацию в `~/.claude` или в папке из переменной `CLAUDE_CONFIG_DIR`, как описано в [Environment variables](https://code.claude.com/docs/en/env-vars) и [Explore the .claude directory](https://code.claude.com/docs/en/claude-directory). Личные субагенты загружаются из её папки `agents` ([Create custom subagents](https://code.claude.com/docs/en/sub-agents)), навыки из `skills/<skill-name>/SKILL.md` ([Extend Claude with skills](https://code.claude.com/docs/en/skills)), стили вывода из `output-styles` ([Output styles](https://code.claude.com/docs/en/output-styles)). `CLAUDE_CODE_PLUGIN_DIRS` загружает каждую указанную папку так же, как `--plugin-dir`, а абсолютные пути разделяются `;` в Windows и `:` в других системах ([Mods reference](https://code.claude.com/docs/en/plugins/mods/reference)).

## Проверка установщиков

Требуется Python 3.11 или новее:

```sh
python -m unittest discover -s tests -v
```

Тесты работают во временных папках и не затрагивают настоящую настройку Claude Code. Отсутствующие оболочки отмечаются как пропущенные проверки.

Сообщения об ошибках принимаются в [GitHub issues](https://github.com/dayfinggg/anthropic-claude-code-agent-skills/issues). Лицензия инструкций и программ репозитория — [MIT](LICENSE).
