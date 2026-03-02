/**
 * Скрипт для генерации NDJSON файлов из локальных словарей
 */

import * as fs from 'fs';
import * as path from 'path';
import { questions } from '../dictionaries/quizDictionary';
import { educationalInstitutionsDictionary } from '../dictionaries/educationalInstitutionsDictionary';
import { promptsData } from '../dictionaries/promptsDictionary';

// Функция для генерации ID
function generateId(prefix: string, index: number): string {
  return `${prefix}-${index.toString().padStart(4, '0')}`;
}

// Функция для конвертации вопросов
function convertQuestionsToNDJSON() {
  const questionsList: any[] = [];
  const questionMap = new Map<string, string>();
  
  const locales: ('uk' | 'ru' | 'en')[] = ['uk', 'ru', 'en'];
  const studentLevels = ['grade_9', 'grade_11', 'bachelor'] as const;

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
        
        questionsList.push(sanityQuestion);
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
      
      questionsList.push(sanityQuestion);
      questionMap.set(`${locale}-parent-all-${idx}`, questionId);
    });
  });
  
  return { questions: questionsList, questionMap };
}

// Функция для конвертации университетов
function convertUniversitiesToNDJSON() {
  const universities: any[] = [];
  let order = 0;
  
  const directions = ['TECH', 'MED', 'HUM', 'ECO', 'NAT'] as const;
  
  directions.forEach(direction => {
    const directionUnis = educationalInstitutionsDictionary.UNI[direction] || [];
    
    directionUnis.forEach((uni) => {
      const uniId = generateId(`university-${direction}`, order);
      
      const nameParts = uni.name.split(' — ');
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
  
  return { universities };
}

// Функция для конвертации школ
function convertSchoolsToNDJSON() {
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
  
  return { schools };
}

// Функция для создания промптов
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
function createQuizDocument(questionMap: Map<string, string>) {
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
      })).filter((ref: any) => ref._ref);
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
    })).filter((ref: any) => ref._ref);
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
  
  return quiz;
}

// Главная функция
function main() {
  console.log('Генерация NDJSON файлов для импорта в Sanity...\n');
  
  const outputDir = path.join(__dirname, '..');
  
  // Конвертируем вопросы
  const { questions: questionsList, questionMap } = convertQuestionsToNDJSON();
  const questionsNDJSON = questionsList.map(q => JSON.stringify(q)).join('\n');
  fs.writeFileSync(path.join(outputDir, 'questions.ndjson'), questionsNDJSON);
  console.log(`✓ Создано ${questionsList.length} вопросов в questions.ndjson`);
  
  // Конвертируем университеты
  const { universities } = convertUniversitiesToNDJSON();
  const universitiesNDJSON = universities.map(u => JSON.stringify(u)).join('\n');
  fs.writeFileSync(path.join(outputDir, 'universities.ndjson'), universitiesNDJSON);
  console.log(`✓ Создано ${universities.length} университетов в universities.ndjson`);
  
  // Конвертируем школы
  const { schools } = convertSchoolsToNDJSON();
  const schoolsNDJSON = schools.map(s => JSON.stringify(s)).join('\n');
  fs.writeFileSync(path.join(outputDir, 'schools.ndjson'), schoolsNDJSON);
  console.log(`✓ Создано ${schools.length} школ в schools.ndjson`);
  
  // Создаем quiz документ
  const quiz = createQuizDocument(questionMap);
  const quizNDJSON = JSON.stringify(quiz);
  fs.writeFileSync(path.join(outputDir, 'quiz.ndjson'), quizNDJSON);
  console.log(`✓ Создан документ quiz в quiz.ndjson`);
  
  // Сохраняем маппинг для справки
  const mapping = {
    questions: Object.fromEntries(questionMap),
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(outputDir, 'question-mapping.json'), JSON.stringify(mapping, null, 2));
  console.log(`✓ Сохранен маппинг вопросов в question-mapping.json\n`);
  
  console.log('Готово! Теперь можно импортировать файлы в Sanity через CLI:');
  console.log('  npx sanity@latest documents import questions.ndjson <dataset> --project <projectId>');
  console.log('  npx sanity@latest documents import universities.ndjson <dataset> --project <projectId>');
  console.log('  npx sanity@latest documents import schools.ndjson <dataset> --project <projectId>');
  console.log('  npx sanity@latest documents import quiz.ndjson <dataset> --project <projectId>');
}

main();
