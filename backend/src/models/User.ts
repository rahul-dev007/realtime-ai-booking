import { Schema, model, type Document } from 'mongoose';

export interface UserDoc extends Document {
  email: string;
  password: string;
  name?: string;
  role: 'user' | 'admin';
}

const userSchema = new Schema<UserDoc>({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// ✅ default export দিতে হবে — না দিলে "Cannot find name 'User'" / red mark আসে
export default model<UserDoc>('User', userSchema);
