# Sanity CMS Integration Guide

## Overview

Цей проект використовує Sanity CMS для управління контентом квізу. Всі питання, AI промпти, університети та школи зберігаються в Sanity і можуть бути змінені через Sanity Studio.

## Quick Start

### 1. Доступ до Sanity Studio

```bash
npm run dev
```

Відкрийте: http://localhost:3000/studio

### 2. Змінити джерело даних

В `.env`:
```bash
# Використовувати Sanity CMS
NEXT_PUBLIC_QUIZ_SOURCE=sanity

# Або локальні файли (для розробки)
NEXT_PUBLIC_QUIZ_SOURCE=local
```

## Структура даних

### Quiz
Головний документ, який містить:
- `slug` — ідентифікатор у URL: `/{locale}/{slug}` (наприклад `/ru/medstudy-quiz`). Якщо відкрито лише `/{locale}`, підвантажується перший активний квіз зі списку.
- `title`, `description` (мультимовні)
- `startScreen` (опційно) — тексти першого екрана квізу для кожної мови (`en` / `ru` / `uk`): заголовок над карткою, опис, кнопка «Почати», підпис під фічами, три короткі фічі. Порожні поля = брати дефолти з файлів локалізації (`locales/*/common.json`, ключі `StartScreen.*`).
- `aiPrompts` - AI промпти для кожної ролі/мови
- `student_grade_9`, `student_grade_11`, `student_bachelor`, `parent` - масиви посилань на питання
- `emailSettings` - налаштування email
- `metaData` - час проходження, категорія

### SimpleQuestion
Питання квізу:
- `title` - текст питання
- `language` - мова (uk/ru/en)
- `type` - тип: single/multiple/text
- `answers` - варіанти відповідей з тегами
- `required` - обов'язкове питання

### University / School
Освітні заклади:
- `name` (мультимовний)
- `direction` - напрямок (MED/TECH/HUM/ECO/NAT)
- `faculties` - список факультетів (мультимовний масив)
- `city`, `website`, `order`

## AI Prompts - Написання промптів

### Placeholder'и

У промптах можна використовувати наступні placeholder'и:

**Базові:**
- `{languagePreference}` - мова навчання (з відповідей користувача)
- `{topDirection}` - топ напрямок на основі тегів (MED/TECH/HUM/ECO/NAT)
- `{openAnswers}` - текст відповідей на відкриті питання
- `{educationLevel}` - рівень освіти (для батьків)

**Контекст про користувача:**
Промпт автоматично отримує:
- Роль користувача (student_grade_9, student_grade_11, student_bachelor, parent)
- Всі відповіді користувача у форматі: `Питання: Відповідь`
- Списки університетів та шкіл для обраного напрямку

### Структура промпту

```
[Персона та стиль]
Ти — провідний експерт з освіти в Чехії...

[Контекст користувача]
Проаналізуй дані про користувача: Роль: {role}.
Бажана мова навчання: {languagePreference}.
Основний профіль — {topDirection}.

[Задача]
Створи персоналізований звіт у форматі HTML...

[Структура відповіді]
1. Звернутися до користувача...
2. Структурувати інформацію:
   - <h2>Заголовок</h2>
   - <h3>Підзаголовок</h3>

3. Завершити CTA з кнопками:
   <a href='...' class='btn btn-primary'>...</a>

[База знань]
ВАЖЛИВО: Всі університети обирай з цього списку...
[Тут буде автоматично підставлений список]

[Інструкція по мові]
Напиши звіт українською/російською/англійською мовою.
```

### Приклад використання в коді

```typescript
// Промпт автоматично збирається з Quiz.aiPrompts
const prompt = await buildSanityPrompt(
  quiz,
  'student',      // роль
  'grade_9',      // рівень
  answers,        // відповіді користувача
  'uk',           // мова
  true            // використовувати Sanity для університетів
);
```

### Додавання custom placeholder'ів

```typescript
const prompt = await buildSanityPrompt(
  quiz, role, level, answers, locale, true,
  {
    customField: 'Custom value',
    anotherField: 'Another value'
  }
);
```

У промпті використовуйте: `{customField}`, `{anotherField}`

## Environment Variables

```bash
# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=sk...

# Джерело даних
NEXT_PUBLIC_QUIZ_SOURCE=sanity  # або local
```
