import { Schema, model, Types, Document } from 'mongoose';

export type MessageKind = 'text' | 'system';

export interface MessageDoc extends Document {
  bookingId: Types.ObjectId;
  senderId: Types.ObjectId | null; // system হলে null হতে পারে
  content: string;
  kind: MessageKind;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<MessageDoc>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', index: true, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  content: { type: String, required: true },
  kind: { type: String, enum: ['text', 'system'], default: 'text' },
}, { timestamps: true });

MessageSchema.index({ bookingId: 1, createdAt: 1 });

export default model<MessageDoc>('Message', MessageSchema);
