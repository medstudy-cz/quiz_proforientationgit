/**
 * Скрипт для генерации NDJSON файлов из локальных словарей для импорта в Sanity
 */

import * as fs from 'fs';
import * as path from 'path';
import { questions } from '../dictionaries/quizDictionary';
import { educationalInstitutionsDictionary } from '../dictionaries/educationalInstitutionsDictionary';

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
      
      // Разделяем название и город если есть дефис
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

// Главная функция
function main() {
  console.log('Генерация NDJSON файлов для импорта в Sanity...\n');
  
  // Конвертируем вопросы
  const { questions: questionsList, questionMap } = convertQuestionsToNDJSON();
  const questionsNDJSON = questionsList.map(q => JSON.stringify(q)).join('\n');
  fs.writeFileSync(path.join(__dirname, '../questions.ndjson'), questionsNDJSON);
  console.log(`✓ Создано ${questionsList.length} вопросов в questions.ndjson`);
  
  // Конвертируем университеты
  const { universities } = convertUniversitiesToNDJSON();
  const universitiesNDJSON = universities.map(u => JSON.stringify(u)).join('\n');
  fs.writeFileSync(path.join(__dirname, '../universities.ndjson'), universitiesNDJSON);
  console.log(`✓ Создано ${universities.length} университетов в universities.ndjson`);
  
  // Конвертируем школы
  const { schools } = convertSchoolsToNDJSON();
  const schoolsNDJSON = schools.map(s => JSON.stringify(s)).join('\n');
  fs.writeFileSync(path.join(__dirname, '../schools.ndjson'), schoolsNDJSON);
  console.log(`✓ Создано ${schools.length} школ в schools.ndjson`);
  
  // Сохраняем маппинг для использования при создании quiz
  const mapping = {
    questions: Object.fromEntries(questionMap),
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(__dirname, '../question-mapping.json'), JSON.stringify(mapping, null, 2));
  console.log(`✓ Сохранен маппинг вопросов в question-mapping.json\n`);
  
  console.log('Готово! Теперь можно импортировать файлы в Sanity.');
}

if (require.main === module) {
  main();
}

export { convertQuestionsToNDJSON, convertUniversitiesToNDJSON, convertSchoolsToNDJSON };
