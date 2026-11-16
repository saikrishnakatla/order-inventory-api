import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(2, 'Product name must be at least 2 characters'),
  category: z
    .string({ required_error: 'Category is required' })
    .trim()
    .min(2, 'Category must be at least 2 characters'),
  price: z
    .number({ required_error: 'Price is required' })
    .positive('Price must be a positive number'),
  stock: z
    .number({ required_error: 'Stock is required' })
    .int('Stock must be an integer')
    .nonnegative('Stock cannot be negative'),
});

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2, 'Product name must be at least 2 characters').optional(),
    category: z.string().trim().min(2, 'Category must be at least 2 characters').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    stock: z.number().int('Stock must be an integer').nonnegative('Stock cannot be negative').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field (name, category, price, stock) must be provided for update',
  });
