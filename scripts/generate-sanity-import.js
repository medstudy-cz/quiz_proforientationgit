/**
 * Скрипт для генерации NDJSON файлов из локальных словарей для импорта в Sanity
 */

const fs = require('fs');
const path = require('path');

// Импортируем данные (используем require для TypeScript файлов через ts-node или просто скопируем структуру)
const questionsData = require('../dictionaries/quizDictionary.ts');
const promptsData = require('../dictionaries/promptsDictionary.ts');
const institutionsData = require('../dictionaries/educationalInstitutionsDictionary.ts');

// Но так как это TypeScript, лучше создать временный JS файл или использовать другой подход
// Вместо этого, я создам скрипт который будет работать с данными напрямую

// Функция для генерации ID
function generateId(prefix, index) {
  return `${prefix}-${index.toString().padStart(4, '0')}`;
}

// Функция для конвертации вопросов
function convertQuestionsToNDJSON() {
  const questions = [];
  const questionMap = new Map(); // Для отслеживания ID вопросов по ключу (lang-role-level-index)
  
  const locales = ['uk', 'ru', 'en'];
  const roles = {
    student: ['grade_9', 'grade_11', 'bachelor'],
    parent: ['all']
  };

  locales.forEach(locale => {
    const localeData = questionsData.questions[locale];
    
    // Student questions
    Object.keys(roles.student).forEach(roleKey => {
      const level = roles.student[roleKey];
      const roleQuestions = localeData.student[level] || [];
      
      roleQuestions.forEach((q, idx) => {
        const questionId = generateId(`question-${locale}-student-${level}`, idx);
        const questionType = q.type === 'multiple-choice' ? 'single' : 'text';
        
        const sanityQuestion = {
          _type: 'simpleQuestion',
          _id: questionId,
          title: q.question,
          language: locale,
          type: questionType,
          required: true
        };
        
        if (q.options && q.options.length > 0) {
          sanityQuestion.answers = q.options.map(opt => ({
            text: opt.answers[0], // Берем первый ответ из массива
            tags: opt.tags || []
          }));
        }
        
        questions.push(sanityQuestion);
        questionMap.set(`${locale}-student-${level}-${idx}`, questionId);
      });
    });
    
    // Parent questions
    const parentQuestions = localeData.parent.all || [];
    parentQuestions.forEach((q, idx) => {
      const questionId = generateId(`question-${locale}-parent-all`, idx);
      const questionType = q.type === 'multiple-choice' ? 'single' : 'text';
      
      const sanityQuestion = {
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
      
      questions.push(sanityQuestion);
      questionMap.set(`${locale}-parent-all-${idx}`, questionId);
    });
  });
  
  return { questions, questionMap };
}

// Функция для конвертации университетов
function convertUniversitiesToNDJSON() {
  const universities = [];
  const uniMap = new Map();
  let order = 0;
  
  const directions = ['TECH', 'MED', 'HUM', 'ECO', 'NAT'];
  
  directions.forEach(direction => {
    const directionUnis = institutionsData.educationalInstitutionsDictionary.UNI[direction] || [];
    
    directionUnis.forEach((uni, idx) => {
      const uniId = generateId(`university-${direction}`, order);
      
      // Разделяем название и город если есть дефис
      const nameParts = uni.name.split(' — ');
      const name = nameParts[0] || uni.name;
      const city = nameParts[1] || '';
      
      const sanityUni = {
        _type: 'university',
        _id: uniId,
        name: {
          uk: uni.name,
          ru: uni.name, // Пока дублируем, можно будет перевести позже
          en: uni.name
        },
        direction: direction,
        faculties: {
          uk: uni.faculties,
          ru: uni.faculties,
          en: uni.faculties
        },
        city: city ? {
          uk: city,
          ru: city,
          en: city
        } : undefined,
        order: order++,
        isActive: true
      };
      
      universities.push(sanityUni);
      uniMap.set(`${direction}-${idx}`, uniId);
    });
  });
  
  return { universities, uniMap };
}

// Функция для конвертации школ
function convertSchoolsToNDJSON() {
  const schools = [];
  const schoolMap = new Map();
  let order = 0;
  
  const directions = ['TECH', 'MED', 'HUM', 'ECO', 'NAT'];
  
  directions.forEach(direction => {
    const directionSchools = institutionsData.educationalInstitutionsDictionary.SCHOOL_TYPES[direction] || [];
    
    directionSchools.forEach((schoolName, idx) => {
      const schoolId = generateId(`school-${direction}`, order);
      
      const sanitySchool = {
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
      schoolMap.set(`${direction}-${idx}`, schoolId);
    });
  });
  
  return { schools, schoolMap };
}

// Главная функция
function main() {
  console.log('Генерация NDJSON файлов для импорта в Sanity...\n');
  
  // Конвертируем вопросы
  const { questions, questionMap } = convertQuestionsToNDJSON();
  const questionsNDJSON = questions.map(q => JSON.stringify(q)).join('\n');
  fs.writeFileSync(path.join(__dirname, '../questions.ndjson'), questionsNDJSON);
  console.log(`✓ Создано ${questions.length} вопросов в questions.ndjson`);
  
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

module.exports = { convertQuestionsToNDJSON, convertUniversitiesToNDJSON, convertSchoolsToNDJSON };
