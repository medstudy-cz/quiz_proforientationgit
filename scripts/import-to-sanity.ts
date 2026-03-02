/**
 * Скрипт для импорта NDJSON файлов в Sanity через Client API
 * Требует токен с правами на запись (editor/writer)
 */

import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../.env') });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
// Пробуем разные варианты названий токена
const token = process.env.SANITY_API_WRITE_TOKEN 
  || process.env.SANITY_API_EDITOR_TOKEN
  || process.env.SANITY_API_READ_TOKEN
  || process.env.SANITY_STUDIO_API_TOKEN;

if (!projectId) {
  console.error('❌ NEXT_PUBLIC_SANITY_PROJECT_ID не найден в .env');
  process.exit(1);
}

if (!token) {
  console.error('❌ Токен с правами на запись не найден в .env');
  console.error('   Попробуйте создать токен в Sanity Studio: https://sanity.io/manage');
  console.error('   И добавьте его как SANITY_API_WRITE_TOKEN в .env');
  process.exit(1);
}

// Создаем клиент Sanity с правами на запись
const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
});

// Функция для импорта NDJSON файла
async function importNDJSON(filePath: string, type: string) {
  console.log(`\nИмпорт ${type}...`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Файл ${filePath} не найден`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());
  const documents = lines.map(line => JSON.parse(line));
  
  console.log(`  Найдено ${documents.length} документов`);
  
  // Импортируем батчами через транзакции
  const batchSize = 50;
  let imported = 0;
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    
    try {
      // Создаем транзакцию для батча
      const transaction = client.transaction();
      
      batch.forEach(doc => {
        transaction.createOrReplace(doc);
      });
      
      await transaction.commit();
      imported += batch.length;
      console.log(`  Импортировано ${imported}/${documents.length}`);
    } catch (error: any) {
      console.error(`  ❌ Ошибка при импорте батча ${i}-${i + batch.length}:`, error.message);
      // Продолжаем с следующим батчем
    }
  }
  
  console.log(`✓ Импортировано ${imported} ${type}`);
}

// Главная функция
async function main() {
  try {
    console.log('Начало импорта в Sanity...\n');
    console.log(`Project ID: ${projectId}`);
    console.log(`Dataset: ${dataset}\n`);
    
    const baseDir = path.join(__dirname, '..');
    
    // Импортируем в правильном порядке (сначала вопросы, потом ссылки на них)
    await importNDJSON(path.join(baseDir, 'questions.ndjson'), 'вопросов');
    await importNDJSON(path.join(baseDir, 'universities.ndjson'), 'университетов');
    await importNDJSON(path.join(baseDir, 'schools.ndjson'), 'школ');
    await importNDJSON(path.join(baseDir, 'quiz.ndjson'), 'квиза');
    
    console.log('\n✓ Импорт завершен успешно!');
    console.log('\nТеперь можно переключить NEXT_PUBLIC_QUIZ_SOURCE=sanity в .env');
  } catch (error: any) {
    console.error('\n❌ Ошибка при импорте:', error.message);
    if (error.response) {
      console.error('Детали:', JSON.stringify(error.response.body, null, 2));
    }
    process.exit(1);
  }
}

main();
