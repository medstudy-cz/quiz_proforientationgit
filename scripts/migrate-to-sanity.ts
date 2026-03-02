/**
 * Скрипт для миграции локальных словарей в Sanity
 * Использует Sanity Client API для создания документов
 */

import { createClient } from '@sanity/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config({ path: path.join(__dirname, '../.env') });

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
// Для записи нужен токен с правами editor/writer, не только read
const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID не найден в .env');
}

if (!token) {
  throw new Error('SANITY_API_READ_TOKEN или SANITY_API_WRITE_TOKEN не найден в .env. Для записи нужен токен с правами editor/writer');
}

// Создаем клиент Sanity с правами на запись
const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token, // Должен быть токен с правами на запись
});

// Импортируем данные
import { questions } from '../dictionaries/quizDictionary';
import { educationalInstitutionsDictionary } from '../dictionaries/educationalInstitutionsDictionary';
import { promptsData } from '../dictionaries/promptsDictionary';

// Функция для генерации ID
function generateId(prefix: string, index: number): string {
  return `${prefix}-${index.toString().padStart(4, '0')}`;
}

// Функция для создания вопросов
async function createQuestions() {
  console.log('Создание вопросов...');
  const questionMap = new Map<string, string>();
  const locales: ('uk' | 'ru' | 'en')[] = ['uk', 'ru', 'en'];
  const studentLevels = ['grade_9', 'grade_11', 'bachelor'] as const;
  const questionsToCreate: any[] = [];

  locales.forEach(locale => {
    const localeData = questions[locale];
    
    // Student questions
    studentLevels.forEach(level => {
      const roleQuestions = localeData.student[level] || [];
      
      roleQuestions.forEach((q, idx) => {
        const questionId = generateId(`question-${locale}-student-${level}`, idx);
        const questionType = q.type === 'multiple-choice' ? 'single' : 'text';
        
        const sanityQuestion: any = {
          _type: 'simpleQuestion',
          _id: questionId,
          title: q.question,
          language: locale,
          type: questionType,
          required: true
        };
        
        if (q.options && q.options.length > 0) {
          sanityQuestion.answers = q.options.map(opt => ({
            text: opt.answers[0],
            tags: opt.tags || []
          }));
        }
        
        questionsToCreate.push(sanityQuestion);
        questionMap.set(`${locale}-student-${level}-${idx}`, questionId);
      });
    });
    
    // Parent questions
    const parentQuestions = localeData.parent.all || [];
    parentQuestions.forEach((q, idx) => {
      const questionId = generateId(`question-${locale}-parent-all`, idx);
      const questionType = q.type === 'multiple-choice' ? 'single' : 'text';
      
      const sanityQuestion: any = {
        _type: 'simpleQuestion',
        _id: questionId,
        title: q.question,
        language: locale,
        type: questionType,
        required: true
      };
      
      if (q.options && q.options.length > 0) {
        sanityQuestion.answers = q.options.map(opt => ({
          text: opt.answers[0],
          tags: opt.tags || []
        }));
      }
      
      questionsToCreate.push(sanityQuestion);
      questionMap.set(`${locale}-parent-all-${idx}`, questionId);
    });
  });

  // Создаем вопросы батчами по 50
  const batchSize = 50;
  for (let i = 0; i < questionsToCreate.length; i += batchSize) {
    const batch = questionsToCreate.slice(i, i + batchSize);
    await client.mutate({
      mutations: batch.map(q => ({
        createOrReplace: q
      }))
    });
    console.log(`  Создано ${Math.min(i + batchSize, questionsToCreate.length)}/${questionsToCreate.length} вопросов`);
  }

  console.log(`✓ Создано ${questionsToCreate.length} вопросов\n`);
  return questionMap;
}

// Функция для создания университетов
async function createUniversities() {
  console.log('Создание университетов...');
  const universities: any[] = [];
  let order = 0;
  
  const directions = ['TECH', 'MED', 'HUM', 'ECO', 'NAT'] as const;
  
  directions.forEach(direction => {
    const directionUnis = educationalInstitutionsDictionary.UNI[direction] || [];
    
    directionUnis.forEach((uni) => {
      const uniId = generateId(`university-${direction}`, order);
      
      const nameParts = uni.name.split(' — ');
      const name = nameParts[0] || uni.name;
      const city = nameParts[1] || '';
      
      const sanityUni: any = {
        _type: 'university',
        _id: uniId,
        name: {
          uk: uni.name,
          ru: uni.name,
          en: uni.name
        },
        direction: direction,
        faculties: {
          uk: uni.faculties,
          ru: uni.faculties,
          en: uni.faculties
        },
        order: order++,
        isActive: true
      };
      
      if (city) {
        sanityUni.city = {
          uk: city,
          ru: city,
          en: city
        };
      }
      
      universities.push(sanityUni);
    });
  });

  // Создаем университеты
  await client.mutate({
    mutations: universities.map(u => ({
      createOrReplace: u
    }))
  });

  console.log(`✓ Создано ${universities.length} университетов\n`);
}

// Функция для создания школ
async function createSchools() {
  console.log('Создание школ...');
  const schools: any[] = [];
  let order = 0;
  
  const directions = ['TECH', 'MED', 'HUM', 'ECO', 'NAT'] as const;
  
  directions.forEach(direction => {
    const directionSchools = educationalInstitutionsDictionary.SCHOOL_TYPES[direction] || [];
    
    directionSchools.forEach((schoolName) => {
      const schoolId = generateId(`school-${direction}`, order);
      
      const sanitySchool: any = {
        _type: 'school',
        _id: schoolId,
        name: {
          uk: schoolName,
          ru: schoolName,
          en: schoolName
        },
        direction: direction,
        order: order++,
        isActive: true
      };
      
      schools.push(sanitySchool);
    });
  });

  // Создаем школы
  await client.mutate({
    mutations: schools.map(s => ({
      createOrReplace: s
    }))
  });

  console.log(`✓ Создано ${schools.length} школ\n`);
}

// Функция для создания промптов из promptsData
function buildPromptText(locale: 'uk' | 'ru' | 'en', role: 'student_grade_9' | 'student_grade_11' | 'student_bachelor' | 'parent'): string {
  const roleData = promptsData[locale].reportGeneration[role];
  const common = promptsData[locale].reportGeneration.common;
  
  let prompt = `${common.persona}\n\n`;
  prompt += `${roleData.context}\n\n`;
  prompt += `${roleData.task}\n\n`;
  prompt += `${roleData.personalization}\n\n`;
  prompt += `${roleData.structure}\n\n`;
  if (roleData.knowledgeBase) {
    prompt += `${roleData.knowledgeBase}\n\n`;
  }
  prompt += `${common.cta}`;
  
  return prompt;
}

// Функция для создания quiz документа
async function createQuiz(questionMap: Map<string, string>) {
  console.log('Создание документа Quiz...');
  
  // Получаем все ID вопросов для каждой роли и языка
  const locales: ('uk' | 'ru' | 'en')[] = ['uk', 'ru', 'en'];
  const studentLevels = ['grade_9', 'grade_11', 'bachelor'] as const;
  
  const questionsStructure: any = {};
  
  // Student questions
  studentLevels.forEach(level => {
    questionsStructure[`student_${level}`] = {};
    locales.forEach(locale => {
      const localeData = questions[locale];
      const roleQuestions = localeData.student[level] || [];
      questionsStructure[`student_${level}`][locale] = roleQuestions.map((_, idx) => ({
        _type: 'reference',
        _ref: questionMap.get(`${locale}-student-${level}-${idx}`)
      })).filter(ref => ref._ref);
    });
  });
  
  // Parent questions
  questionsStructure.parent = {};
  locales.forEach(locale => {
    const localeData = questions[locale];
    const parentQuestions = localeData.parent.all || [];
    questionsStructure.parent[locale] = parentQuestions.map((_, idx) => ({
      _type: 'reference',
      _ref: questionMap.get(`${locale}-parent-all-${idx}`)
    })).filter(ref => ref._ref);
  });
  
  // Создаем промпты
  const aiPrompts: any = {};
  const roles: Array<'student_grade_9' | 'student_grade_11' | 'student_bachelor' | 'parent'> = 
    ['student_grade_9', 'student_grade_11', 'student_bachelor', 'parent'];
  
  roles.forEach(role => {
    aiPrompts[role] = {};
    locales.forEach(locale => {
      aiPrompts[role][locale] = buildPromptText(locale, role);
    });
  });
  
  const quiz = {
    _type: 'quiz',
    _id: 'quiz-main',
    slug: {
      _type: 'slug',
      current: 'medstudy-quiz'
    },
    title: {
      en: 'MedStudy Career Orientation Quiz',
      ru: 'Квиз по профориентации MedStudy',
      uk: 'Квіз з профорієнтації MedStudy'
    },
    description: {
      en: 'Discover your ideal career path and educational opportunities in the Czech Republic',
      ru: 'Откройте для себя идеальный карьерный путь и образовательные возможности в Чехии',
      uk: 'Відкрийте для себе ідеальний кар\'єрний шлях та освітні можливості в Чехії'
    },
    isActive: true,
    aiPrompts,
    questions: questionsStructure,
    emailSettings: {
      subject: {
        en: 'Your Career Orientation Report',
        ru: 'Ваш отчет по профориентации',
        uk: 'Ваш звіт з профорієнтації'
      },
      includeAnswers: true
    },
    metaData: {
      estimatedTime: 5,
      category: 'professional'
    },
    analytics: {
      enableFacebookPixel: true,
      enableTikTokPixel: true
    }
  };
  
  await client.createOrReplace(quiz);
  console.log('✓ Создан документ Quiz\n');
}

// Главная функция
async function main() {
  try {
    console.log('Начало миграции в Sanity...\n');
    console.log(`Project ID: ${projectId}`);
    console.log(`Dataset: ${dataset}\n`);
    
    const questionMap = await createQuestions();
    await createUniversities();
    await createSchools();
    await createQuiz(questionMap);
    
    console.log('✓ Миграция завершена успешно!');
    console.log('\nТеперь можно переключить NEXT_PUBLIC_QUIZ_SOURCE=sanity в .env');
  } catch (error) {
    console.error('Ошибка при миграции:', error);
    process.exit(1);
  }
}

main();
