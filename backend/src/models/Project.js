import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [3, "Project name must be at least 3 characters"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Project description cannot exceed 500 characters"],
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Project owner is required"],
      index: true,
    },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["OWNER", "MANAGER", "MEMBER"],
          default: "MEMBER",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["ACTIVE", "ARCHIVED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

// Compound index for efficient filtering
projectSchema.index({ ownerId: 1, status: 1 });

// Virtuals for task count
projectSchema.virtual("taskCount", {
  ref: "Task",
  localField: "_id",
  foreignField: "projectId",
  count: true,
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
