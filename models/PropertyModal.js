import mongoose, { Schema, Document } from 'mongoose';



const PropertySchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Building name is required'],
    trim: true
  },
  type: { 
    type: String, 
    required: [true, 'Building type is required'],
    enum: ['Commercial', 'Residential', 'Mixed Use']
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true
  },
  area: { 
    type: String,
    trim: true
  },
  floors: { 
    type: Number, 
    required: [true, 'Number of floors is required'],
    min: [1, 'Floors must be at least 1']
  },
  image: { 
    type: String 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PropertySchema.index({ name: 1, user: 1 }, { unique: true });
PropertySchema.index({ user: 1 });

export default mongoose.model<IProperty>('Property', PropertySchema);