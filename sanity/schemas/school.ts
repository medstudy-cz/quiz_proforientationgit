import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'school',
  title: 'School / Gymnasium',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'School Name',
      type: 'object',
      fields: [
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ru', title: 'Russian', type: 'string' },
        { name: 'ua', title: 'Ukrainian', type: 'string' },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'direction',
      title: 'Direction',
      type: 'string',
      options: {
        list: [
          { title: 'Medical', value: 'MED' },
          { title: 'Technical', value: 'TECH' },
          { title: 'Humanities', value: 'HUM' },
          { title: 'Economics', value: 'ECO' },
          { title: 'Natural Sciences', value: 'NAT' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'School Type',
      type: 'string',
      options: {
        list: [
          { title: 'Gymnasium', value: 'gymnasium' },
          { title: 'Technical School', value: 'technical' },
          { title: 'Specialized School', value: 'specialized' },
          { title: 'International School', value: 'international' },
        ],
      },
    }),
    defineField({
      name: 'city',
      title: 'City',
      type: 'object',
      fields: [
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ru', title: 'Russian', type: 'string' },
        { name: 'ua', title: 'Ukrainian', type: 'string' },
      ],
    }),
    defineField({
      name: 'website',
      title: 'Website',
      type: 'url',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which schools are displayed (lower numbers first)',
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Enable/disable this school',
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: 'name.en',
      direction: 'direction',
      city: 'city.en',
      isActive: 'isActive',
    },
    prepare({ title, direction, city, isActive }) {
      return {
        title: title,
        subtitle: `${direction} - ${city || 'No city'} ${isActive ? '✓' : '✗'}`,
      }
    },
  },
})
