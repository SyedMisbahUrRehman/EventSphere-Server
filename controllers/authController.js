import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, agreedToTerms, subscribeNewsletter } = req.body;
    if (!agreedToTerms) {
      return res.status(400).json({ message: 'You must agree to the Terms of Service and Privacy Policy.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      agreedToTerms,
      subscribeNewsletter: !!subscribeNewsletter
    });
    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        agreedToTerms: newUser.agreedToTerms,
        subscribeNewsletter: newUser.subscribeNewsletter
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      success: true,
      message: 'Login successful',
      token
    });
  } catch (error) {
    next(error);
  }
};

