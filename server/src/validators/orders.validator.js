import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z
          .number({ required_error: 'productId is required' })
          .int('productId must be an integer')
          .positive('productId must be a positive integer'),
        quantity: z
          .number({ required_error: 'quantity is required' })
          .int('quantity must be an integer')
          .positive('quantity must be at least 1'),
      })
    )
    .min(1, 'Order must contain at least one item'),
});
