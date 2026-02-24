import { ValidationError } from './EventValidator';
import { RegistrationFormData } from '../../event-ui/src/models/registration';

/**
 * RegistrationValidator - Validates registration requests
 */
export class RegistrationValidator {
  /**
   * Validate registration request
   */
  static validateRegistration(userId: string | null, eventId: string): void {
    // userId may be null for guest registrations
    if (userId !== null) {
      if (!userId || userId.trim().length === 0) {
        throw new ValidationError('User ID is required', 'userId');
      }
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new ValidationError('Invalid user ID format', 'userId');
      }
    }

    if (!eventId || eventId.trim().length === 0) {
      throw new ValidationError('Event ID is required', 'eventId');
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(eventId)) {
      throw new ValidationError('Invalid event ID format', 'eventId');
    }
  }

  /**
   * Validate ticket generation parameters
   */
  static validateTicketGeneration(
    userId: string | null,
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

  /**
   * Validate registration form data fields
   */
  static validateRegistrationData(data: RegistrationFormData): void {
    if (!data.fullName || data.fullName.trim().length === 0) {
      throw new ValidationError('Full name is required', 'fullName');
    }

    if (!data.email || data.email.trim().length === 0) {
      throw new ValidationError('Email is required', 'email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format', 'email');
    }

    if (data.childrenUnder7Count !== undefined && (data.childrenUnder7Count < 0 || !Number.isInteger(data.childrenUnder7Count))) {
      throw new ValidationError('Children under 7 count must be a non-negative integer', 'childrenUnder7Count');
    }

    if (data.childrenOver7Count !== undefined && (data.childrenOver7Count < 0 || !Number.isInteger(data.childrenOver7Count))) {
      throw new ValidationError('Children over 7 count must be a non-negative integer', 'childrenOver7Count');
    }

    if (data.vegetarianMealCount !== undefined && (data.vegetarianMealCount < 0 || !Number.isInteger(data.vegetarianMealCount))) {
      throw new ValidationError('Vegetarian meal count must be a non-negative integer', 'vegetarianMealCount');
    }

    if (data.nonVegetarianMealCount !== undefined && (data.nonVegetarianMealCount < 0 || !Number.isInteger(data.nonVegetarianMealCount))) {
      throw new ValidationError('Non-vegetarian meal count must be a non-negative integer', 'nonVegetarianMealCount');
    }

    if (!data.consentToStorePersonalData) {
      throw new ValidationError('You must consent to storing personal data to register', 'consentToStorePersonalData');
    }
  }
}
