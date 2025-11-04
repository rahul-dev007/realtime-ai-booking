import { Schema, model, Types, Document } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface BookingParticipant {
  userId: Types.ObjectId;
  unread: number;
}

export interface BookingAttrs {
  userId: Types.ObjectId;
  title: string;
  time: Date;
  status?: BookingStatus;
  confirmedAt?: Date | null;
  confirmedBy?: Types.ObjectId | null;   // ✅ important
  participants?: BookingParticipant[];
  lastMessageAt?: Date | null;
}

export interface BookingDoc extends Document, BookingAttrs {}

const ParticipantSchema = new Schema<BookingParticipant>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  unread: { type: Number, default: 0 }
}, { _id: false });

const BookingSchema = new Schema<BookingDoc>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  time: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending', index: true },
  confirmedAt: { type: Date, default: null },
  confirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }, // ✅
  participants: { type: [ParticipantSchema], default: [] },
  lastMessageAt: { type: Date, default: null }
}, { timestamps: true });

BookingSchema.index({ userId: 1, status: 1, createdAt: -1 });
BookingSchema.index({ lastMessageAt: -1 });

export default model<BookingDoc>('Booking', BookingSchema);
