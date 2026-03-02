/**
 * Тестовый скрипт для проверки подключения к Sanity
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { getQuizzes, getQuizBySlug } from '../sanity/lib/api';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function test() {
  try {
    console.log('Проверка подключения к Sanity...\n');
    
    // Проверяем список квизов
    const quizzes = await getQuizzes();
    console.log(`✓ Найдено квизов: ${quizzes.length}`);
    
    if (quizzes.length > 0) {
      console.log('\nСписок квизов:');
      quizzes.forEach(q => {
        console.log(`  - ${q.slug.current}: ${q.title.en || q.title.uk || q.title.ru} (${q.isActive ? 'активен' : 'неактивен'})`);
      });
      
      // Проверяем загрузку первого квиза
      const firstQuiz = quizzes[0];
      console.log(`\nЗагрузка квиза "${firstQuiz.slug.current}"...`);
      const fullQuiz = await getQuizBySlug(firstQuiz.slug.current);
      
      if (fullQuiz) {
        console.log(`✓ Квиз загружен успешно`);
        console.log(`  - Вопросов для student_grade_9: ${fullQuiz.questions?.student_grade_9?.uk?.length || 0} (uk), ${fullQuiz.questions?.student_grade_9?.ru?.length || 0} (ru), ${fullQuiz.questions?.student_grade_9?.en?.length || 0} (en)`);
        console.log(`  - Промпты: ${fullQuiz.aiPrompts ? 'есть' : 'нет'}`);
      } else {
        console.log('❌ Не удалось загрузить квиз');
      }
    } else {
      console.log('⚠️  Квизы не найдены');
    }
    
    console.log('\n✓ Проверка завершена');
  } catch (error: any) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

test();
