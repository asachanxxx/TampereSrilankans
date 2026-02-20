import { ValidationError } from './EventValidator';

/**
 * RegistrationValidator - Validates registration requests
 */
export class RegistrationValidator {
  /**
   * Validate registration request
   */
  static validateRegistration(userId: string, eventId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new ValidationError('User ID is required', 'userId');
    }

    if (!eventId || eventId.trim().length === 0) {
      throw new ValidationError('Event ID is required', 'eventId');
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(userId)) {
      throw new ValidationError('Invalid user ID format', 'userId');
    }

    if (!uuidRegex.test(eventId)) {
      throw new ValidationError('Invalid event ID format', 'eventId');
    }
  }

  /**
   * Validate ticket generation parameters
   */
  static validateTicketGeneration(
    userId: string,
    eventId: string,
    issuedToName: string,
    issuedToEmail: string
  ): void {
    this.validateRegistration(userId, eventId);

    if (!issuedToName || issuedToName.trim().length === 0) {
      throw new ValidationError('Name is required for ticket', 'issuedToName');
    }

    if (!issuedToEmail || issuedToEmail.trim().length === 0) {
      throw new ValidationError('Email is required for ticket', 'issuedToEmail');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(issuedToEmail)) {
      throw new ValidationError('Invalid email format', 'issuedToEmail');
    }
  }
}
