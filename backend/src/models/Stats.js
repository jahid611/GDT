import mongoose from "mongoose";

const statsSchema = new mongoose.Schema({
  completed: {
    type: Number,
    default: 0
  },
  inProgress: {
    type: Number,
    default: 0
  },
  overdue: {
    type: Number,
    default: 0
  },
  averageCompletionTime: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Stats = mongoose.model("Stats", statsSchema);

export default Stats;