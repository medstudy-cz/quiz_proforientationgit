import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'university',
  title: 'University',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'University Name',
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
      name: 'faculties',
      title: 'Faculties',
      type: 'object',
      fields: [
        {
          name: 'en',
          title: 'English',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'ru',
          title: 'Russian',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'ua',
          title: 'Ukrainian',
          type: 'array',
          of: [{ type: 'string' }],
        },
      ],
      description: 'List of faculties/programs',
      validation: (Rule) => Rule.required(),
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
      description: 'Order in which universities are displayed (lower numbers first)',
      initialValue: 0,
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      description: 'Enable/disable this university',
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
