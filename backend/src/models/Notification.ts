// backend/src/models/Notification.ts
import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
  type: { type: String, enum: ["booking_confirmed", "chat_message"], required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: "Booking", index: true },
  messageId: { type: Schema.Types.ObjectId, ref: "Message" },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default model("Notification", notificationSchema);
