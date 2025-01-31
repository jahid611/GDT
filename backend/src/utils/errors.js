export class ApiError extends Error {
    constructor(status, message) {
      super(message)
      this.status = status
      this.name = "ApiError"
    }
  }
  
  export class ValidationError extends ApiError {
    constructor(message) {
      super(400, message)
      this.name = "ValidationError"
    }
  }
  
  export class AuthenticationError extends ApiError {
    constructor(message = "Non authentifié") {
      super(401, message)
      this.name = "AuthenticationError"
    }
  }
  
  export class AuthorizationError extends ApiError {
    constructor(message = "Non autorisé") {
      super(403, message)
      this.name = "AuthorizationError"
    }
  }
  
  export class NotFoundError extends ApiError {
    constructor(message = "Ressource non trouvée") {
      super(404, message)
      this.name = "NotFoundError"
    }
  }
  
  