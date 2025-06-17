// test-env.js
import dotenv from 'dotenv';
dotenv.config();

console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY);
