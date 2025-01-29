import { createContext, useContext, useState, useCallback } from "react"

const translations = {
  fr: {
    // Navigation & Common
    myTasks: "Mes Tâches",
    list: "Liste",
    kanban: "Kanban",
    calendar: "Calendrier",
    stats: "Statistiques",
    profile: "Profil",
    logout: "Déconnexion",
    welcome: "Bienvenue",
    newTask: "Nouvelle tâche",
    notifications: "Notifications",
    refresh: "Rafraîchir",

    // Task Status
    todo: "À faire",
    inProgress: "En cours",
    done: "Terminé",
    review: "En révision",

    // Priority Levels
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",

    // Filters
    allStatuses: "Tous les statuts",
    allPriorities: "Toutes les priorités",

    // Task List
    taskList: "Liste des tâches",
    loadingTasks: "Chargement des tâches...",
    cannotLoadTasks: "Impossible de charger les tâches",
    taskListUpdated: "Liste des tâches mise à jour",
    statusUpdated: "Statut mis à jour",
    taskMovedTo: "La tâche a été déplacée vers {status}",
    cannotUpdateStatus: "Impossible de mettre à jour le statut",
    taskDeleted: "Tâche supprimée",
    taskDeletedSuccess: "La tâche a été supprimée avec succès",
    cannotDeleteTask: "Impossible de supprimer la tâche",
    taskUpdatedSuccess: "La tâche a été modifiée avec succès",
    noTasksFound: "Aucune tâche trouvée",
    refresh: "Rafraîchir",
    sortBy: "Trier par...",
    filterByStatus: "Filtrer par statut",
    filterByPriority: "Filtrer par priorité",
    allStatuses: "Tous les statuts",
    allPriorities: "Toutes les priorités",
    deadline: "Date limite",
    priority: "Priorité",
    status: "Statut",
    edit: "Modifier",
    delete: "Supprimer",
    advanceStatus: "Avancer le statut",
    estimated: "estimées",
    tryAgain: "Réessayer",

    // Task Status
    todo: "À faire",
    in_progress: "En cours",
    review: "En révision",
    done: "Terminé",

    // Priority Levels
    low: "Basse",
    medium: "Moyenne",
    high: "Haute",

    // Common
    success: "Succès",
    error: "Erreur",

    // Calendar
    taskCalendar: "Calendrier des tâches",
    tasksForDate: "Tâches pour le",
    noTasksForDate: "Aucune tâche pour cette date",

    // Stats
    completedTasks: "Tâches terminées",
    tasksInProgress: "En cours",
    overdueTasks: "En retard",
    averageTime: "Temps moyen",
    completedTasksDesc: "Tâches complétées",
    tasksInProgressDesc: "Tâches en progression",
    overdueTasksDesc: "Tâches dépassant la deadline",
    averageCompletionTimeDesc: "Temps moyen de complétion",
    thisMonth: "Ce mois",
    currently: "Actuellement",
    toProcess: "À traiter",
    perTask: "Par tâche",
    loadingStats: "Chargement des statistiques...",

    // Profile
    userProfile: "Profil Utilisateur",
    name: "Nom",
    email: "Email",
    role: "Rôle",
    memberSince: "Membre depuis",
    loadingProfile: "Chargement du profil...",
    profileNotFound: "Profil non trouvé",
    unauthenticatedUser: "Utilisateur non authentifié",
    cannotLoadProfile: "Impossible de charger le profil",
    retry: "Réessayer",

    // Kanban
    loadingTasks: "Chargement des tâches...",
    errorLoadingTasks: "Une erreur est survenue lors du chargement des tâches",
    cannotLoadTasks: "Impossible de charger les tâches. Veuillez réessayer.",
    statusUpdateSuccess: "Le statut de la tâche a été mis à jour",
    statusUpdateError: "Impossible de mettre à jour le statut de la tâche",
    noTasks: "Aucune tâche",
    dragHint: "Utilisez la souris pour glisser-déposer les tâches entre les colonnes",
    estimated: "estimées",

    // Task Creation Form
    title: "Titre",
    description: "Description",
    priority: "Priorité",
    status: "Statut",
    deadline: "Date limite",
    estimatedTime: "Temps estimé (heures)",
    assignedTo: "Assigné à",
    unassigned: "Non assigné",
    cancel: "Annuler",
    creating: "Création...",
    modifying: "Modification...",
    createTask: "Créer la tâche",
    editTask: "Modifier la tâche",
    taskCreated: "Tâche créée avec succès",
    taskModified: "Tâche modifiée avec succès",
    cannotCreateTask: "Impossible de créer la tâche",
    cannotModifyTask: "Impossible de modifier la tâche",
    errorLoadingUsers: "Erreur lors du chargement des utilisateurs",
    taskAssignedNotification: '{userName} vous a assigné la tâche "{taskTitle}"',

    // Login Form
    login: "Connexion",
    loginDescription: "Connectez-vous à votre compte pour accéder à vos tâches",
    email: "Email",
    emailPlaceholder: "exemple@email.com",
    password: "Mot de passe",
    loggingIn: "Connexion en cours...",
    loginButton: "Se connecter",
    loginError: "Échec de la connexion",

    // Register Form
    createAccount: "Créer un compte",
    registerDescription: "Remplissez le formulaire ci-dessous pour créer votre compte",
    username: "Nom d'utilisateur",
    usernamePlaceholder: "Entrez votre nom d'utilisateur",
    emailPlaceholder: "Entrez votre email",
    passwordPlaceholder: "Créez votre mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    confirmPasswordPlaceholder: "Confirmez votre mot de passe",
    createAccountButton: "Créer mon compte",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    loginLink: "Connectez-vous",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    registrationError: "Une erreur est survenue lors de l'inscription",
  },
  en: {
    // Navigation & Common
    myTasks: "My Tasks",
    list: "List",
    kanban: "Kanban",
    calendar: "Calendar",
    stats: "Statistics",
    profile: "Profile",
    logout: "Logout",
    welcome: "Welcome",
    newTask: "New Task",
    notifications: "Notifications",
    refresh: "Refresh",

    // Task Status
    todo: "To Do",
    inProgress: "In Progress",
    done: "Done",
    review: "In Review",

    // Priority Levels
    low: "Low",
    medium: "Medium",
    high: "High",

    // Filters
    allStatuses: "All Statuses",
    allPriorities: "All Priorities",

    // Task List
    taskList: "Task List",
    loadingTasks: "Loading tasks...",
    cannotLoadTasks: "Cannot load tasks",
    taskListUpdated: "Task list updated",
    statusUpdated: "Status updated",
    taskMovedTo: "Task moved to {status}",
    cannotUpdateStatus: "Cannot update status",
    taskDeleted: "Task deleted",
    taskDeletedSuccess: "Task successfully deleted",
    cannotDeleteTask: "Cannot delete task",
    taskUpdatedSuccess: "Task successfully updated",
    noTasksFound: "No tasks found",
    refresh: "Refresh",
    sortBy: "Sort by...",
    filterByStatus: "Filter by status",
    filterByPriority: "Filter by priority",
    allStatuses: "All statuses",
    allPriorities: "All priorities",
    deadline: "Deadline",
    priority: "Priority",
    status: "Status",
    edit: "Edit",
    delete: "Delete",
    advanceStatus: "Advance status",
    estimated: "estimated",
    tryAgain: "Try again",

    // Task Status
    todo: "To Do",
    in_progress: "In Progress",
    review: "In Review",
    done: "Done",

    // Priority Levels
    low: "Low",
    medium: "Medium",
    high: "High",

    // Common
    success: "Success",
    error: "Error",

    // Calendar
    taskCalendar: "Task Calendar",
    tasksForDate: "Tasks for",
    noTasksForDate: "No tasks for this date",

    // Stats
    completedTasks: "Completed Tasks",
    tasksInProgress: "In Progress",
    overdueTasks: "Overdue",
    averageTime: "Average Time",
    completedTasksDesc: "Completed tasks",
    tasksInProgressDesc: "Tasks in progress",
    overdueTasksDesc: "Tasks past deadline",
    averageCompletionTimeDesc: "Average completion time",
    thisMonth: "This month",
    currently: "Currently",
    toProcess: "To process",
    perTask: "Per task",
    loadingStats: "Loading statistics...",

    // Profile
    userProfile: "User Profile",
    name: "Name",
    email: "Email",
    role: "Role",
    memberSince: "Member since",
    loadingProfile: "Loading profile...",
    profileNotFound: "Profile not found",
    unauthenticatedUser: "Unauthenticated user",
    cannotLoadProfile: "Cannot load profile",
    retry: "Retry",

    // Kanban
    loadingTasks: "Loading tasks...",
    errorLoadingTasks: "An error occurred while loading tasks",
    cannotLoadTasks: "Cannot load tasks. Please try again.",
    statusUpdateSuccess: "Task status has been updated",
    statusUpdateError: "Cannot update task status",
    noTasks: "No tasks",
    dragHint: "Use the mouse to drag and drop tasks between columns",
    estimated: "estimated",

    // Task Creation Form
    title: "Title",
    description: "Description",
    priority: "Priority",
    status: "Status",
    deadline: "Deadline",
    estimatedTime: "Estimated time (hours)",
    assignedTo: "Assigned to",
    unassigned: "Unassigned",
    cancel: "Cancel",
    creating: "Creating...",
    modifying: "Modifying...",
    createTask: "Create task",
    editTask: "Edit task",
    taskCreated: "Task created successfully",
    taskModified: "Task modified successfully",
    cannotCreateTask: "Cannot create task",
    cannotModifyTask: "Cannot modify task",
    errorLoadingUsers: "Error loading users",
    taskAssignedNotification: '{userName} assigned you the task "{taskTitle}"',

    // Login Form
    login: "Login",
    loginDescription: "Sign in to your account to access your tasks",
    email: "Email",
    emailPlaceholder: "example@email.com",
    password: "Password",
    loggingIn: "Logging in...",
    loginButton: "Sign in",
    loginError: "Login failed",

    // Register Form
    createAccount: "Create Account",
    registerDescription: "Fill in the form below to create your account",
    username: "Username",
    usernamePlaceholder: "Enter your username",
    emailPlaceholder: "Enter your email",
    passwordPlaceholder: "Create your password",
    confirmPassword: "Confirm Password",
    confirmPasswordPlaceholder: "Confirm your password",
    createAccountButton: "Create my account",
    alreadyHaveAccount: "Already have an account?",
    loginLink: "Sign in",
    passwordMismatch: "Passwords do not match",
    registrationError: "An error occurred during registration",
  },
  ro: {
    // Navigation & Common
    myTasks: "Sarcinile mele",
    list: "Listă",
    kanban: "Kanban",
    calendar: "Calendar",
    stats: "Statistici",
    profile: "Profil",
    logout: "Deconectare",
    welcome: "Bun venit",
    newTask: "Sarcină nouă",
    notifications: "Notificări",
    refresh: "Reîmprospătare",

    // Task Status
    todo: "De făcut",
    inProgress: "În desfășurare",
    done: "Terminat",
    review: "În revizuire",

    // Priority Levels
    low: "Scăzută",
    medium: "Medie",
    high: "Ridicată",

    // Filters
    allStatuses: "Toate statusurile",
    allPriorities: "Toate prioritățile",

    // Task List
    taskList: "Lista de sarcini",
    loadingTasks: "Se încarcă sarcinile...",
    cannotLoadTasks: "Nu se pot încărca sarcinile",
    taskListUpdated: "Lista de sarcini actualizată",
    statusUpdated: "Status actualizat",
    taskMovedTo: "Sarcina a fost mutată la {status}",
    cannotUpdateStatus: "Nu se poate actualiza statusul",
    taskDeleted: "Sarcină ștearsă",
    taskDeletedSuccess: "Sarcina a fost ștearsă cu succes",
    cannotDeleteTask: "Nu se poate șterge sarcina",
    taskUpdatedSuccess: "Sarcina a fost actualizată cu succes",
    noTasksFound: "Nu s-au găsit sarcini",
    refresh: "Reîmprospătare",
    sortBy: "Sortare după...",
    filterByStatus: "Filtrare după status",
    filterByPriority: "Filtrare după prioritate",
    allStatuses: "Toate statusurile",
    allPriorities: "Toate prioritățile",
    deadline: "Termen limită",
    priority: "Prioritate",
    status: "Status",
    edit: "Editare",
    delete: "Ștergere",
    advanceStatus: "Avansare status",
    estimated: "estimate",
    tryAgain: "Încearcă din nou",

    // Task Status
    todo: "De făcut",
    in_progress: "În desfășurare",
    review: "În revizuire",
    done: "Terminat",

    // Priority Levels
    low: "Scăzută",
    medium: "Medie",
    high: "Ridicată",

    // Common
    success: "Succes",
    error: "Eroare",

    // Calendar
    taskCalendar: "Calendar sarcini",
    tasksForDate: "Sarcini pentru",
    noTasksForDate: "Nu există sarcini pentru această dată",

    // Stats
    completedTasks: "Sarcini finalizate",
    tasksInProgress: "În desfășurare",
    overdueTasks: "Întârziate",
    averageTime: "Timp mediu",
    completedTasksDesc: "Sarcini completate",
    tasksInProgressDesc: "Sarcini în desfășurare",
    overdueTasksDesc: "Sarcini care depășesc termenul limită",
    averageCompletionTimeDesc: "Timp mediu de finalizare",
    thisMonth: "Luna aceasta",
    currently: "În prezent",
    toProcess: "De procesat",
    perTask: "Per sarcină",
    loadingStats: "Se încarcă statisticile...",

    // Profile
    userProfile: "Profil utilizator",
    name: "Nume",
    email: "Email",
    role: "Rol",
    memberSince: "Membru din",
    loadingProfile: "Se încarcă profilul...",
    profileNotFound: "Profilul nu a fost găsit",
    unauthenticatedUser: "Utilizator neautentificat",
    cannotLoadProfile: "Nu se poate încărca profilul",
    retry: "Reîncearcă",

    // Kanban
    loadingTasks: "Se încarcă sarcinile...",
    errorLoadingTasks: "A apărut o eroare la încărcarea sarcinilor",
    cannotLoadTasks: "Nu se pot încărca sarcinile. Vă rugăm să încercați din nou.",
    statusUpdateSuccess: "Statusul sarcinii a fost actualizat",
    statusUpdateError: "Nu se poate actualiza statusul sarcinii",
    noTasks: "Nu există sarcini",
    dragHint: "Folosiți mouse-ul pentru a trage și plasa sarcinile între coloane",
    estimated: "estimate",

    // Task Creation Form
    title: "Titlu",
    description: "Descriere",
    priority: "Prioritate",
    status: "Status",
    deadline: "Termen limită",
    estimatedTime: "Timp estimat (ore)",
    assignedTo: "Atribuit către",
    unassigned: "Neatribuit",
    cancel: "Anulare",
    creating: "Se creează...",
    modifying: "Se modifică...",
    createTask: "Creare sarcină",
    editTask: "Editare sarcină",
    taskCreated: "Sarcina a fost creată cu succes",
    taskModified: "Sarcina a fost modificată cu succes",
    cannotCreateTask: "Nu se poate crea sarcina",
    cannotModifyTask: "Nu se poate modifica sarcina",
    errorLoadingUsers: "Eroare la încărcarea utilizatorilor",
    taskAssignedNotification: '{userName} v-a atribuit sarcina "{taskTitle}"',

    // Login Form
    login: "Autentificare",
    loginDescription: "Conectați-vă la contul dvs. pentru a accesa sarcinile",
    email: "Email",
    emailPlaceholder: "exemplu@email.com",
    password: "Parolă",
    loggingIn: "Autentificare în curs...",
    loginButton: "Autentificare",
    loginError: "Autentificare eșuată",

    // Register Form
    createAccount: "Creare cont",
    registerDescription: "Completați formularul de mai jos pentru a vă crea contul",
    username: "Nume utilizator",
    usernamePlaceholder: "Introduceți numele de utilizator",
    emailPlaceholder: "Introduceți emailul",
    passwordPlaceholder: "Creați parola",
    confirmPassword: "Confirmare parolă",
    confirmPasswordPlaceholder: "Confirmați parola",
    createAccountButton: "Creare cont",
    alreadyHaveAccount: "Aveți deja un cont?",
    loginLink: "Autentificare",
    passwordMismatch: "Parolele nu corespund",
    registrationError: "A apărut o eroare la înregistrare",
  },
}

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("fr")

  const t = useCallback(
    (key) => {
      return translations[language][key] || key
    },
    [language],
  )

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider")
  }
  return context
}

