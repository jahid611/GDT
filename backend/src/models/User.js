import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Le nom d'utilisateur est requis"],
    unique: true,
    trim: true,
    minlength: [3, "Le nom d'utilisateur doit contenir au moins 3 caractères"],
  },
  email: {
    type: String,
    required: [true, "L'email est requis"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Veuillez fournir un email valide"],
  },
  password: {
    type: String,
    required: [true, "Le mot de passe est requis"],
    minlength: [6, "Le mot de passe doit contenir au moins 6 caractères"],
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  teams: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  ],
  avatar: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Middleware pour générer l'avatar par défaut
userSchema.pre("save", function (next) {
  if (!this.avatar) {
    this.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${this.username}&backgroundColor=52,53,65,255`
  }
  next()
})

const User = mongoose.model("User", userSchema)

export default User

