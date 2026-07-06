class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationError(AppException):
    def __init__(self, message: str):
        super().__init__(message, 422)


class RateLimitError(AppException):
    def __init__(self, message: str = "Too many requests"):
        super().__init__(message, 429)


class AiServiceError(AppException):
    def __init__(self, message: str = "AI service unavailable"):
        super().__init__(message, 503)


class NavigationError(AppException):
    def __init__(self, message: str = "Navigation error"):
        super().__init__(message, 404)