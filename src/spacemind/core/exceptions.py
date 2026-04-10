"""
SpaceMind OS — Custom Exception Hierarchy
All domain exceptions inherit from SpaceMindError.
Never let raw AI output or internal stack traces leak through to API responses.
"""


class SpaceMindError(Exception):
    """Base exception for all SpaceMind OS errors."""
    http_status: int = 500
    default_message: str = "An unexpected error occurred in SpaceMind OS."

    def __init__(self, message: str | None = None):
        self.message = message or self.default_message
        super().__init__(self.message)


class AIError(SpaceMindError):
    """Raised when the Claude AI call fails or returns unusable output."""
    http_status = 502
    default_message = "The AI engine failed to generate a plan. Please try again."


class AIParseError(AIError):
    """Raised when AI output cannot be parsed into the expected schema."""
    default_message = "The AI returned a response that could not be parsed. Please rephrase your request."


class DecompositionError(SpaceMindError):
    """Raised when the decomposition pipeline fails."""
    http_status = 422
    default_message = "Unable to decompose this request. Please provide more detail."


class ValidationError(SpaceMindError):
    """Raised when the generated plan fails quality validation."""
    http_status = 422
    default_message = "The generated plan did not pass quality checks. Please rephrase your request."


class TemplateError(SpaceMindError):
    """Raised when a knowledge template cannot be loaded."""
    http_status = 500
    default_message = "A required knowledge template could not be loaded."


class LocationError(SpaceMindError):
    """Raised for unknown or invalid location IDs."""
    http_status = 400
    default_message = "The specified location is not recognised."


class StorageError(SpaceMindError):
    """Raised when a database operation fails."""
    http_status = 500
    default_message = "A storage error occurred. Your result was not saved."


class RateLimitError(SpaceMindError):
    """Raised when a client exceeds the request rate limit."""
    http_status = 429
    default_message = "Too many requests. Please wait before submitting again."
