import { Event } from '../../event-ui/src/models/event';
import eventStatuses from '../../event-ui/src/config/event-statuses.json';
import eventCategories from '../../event-ui/src/config/event-categories.json';
import eventVisibility from '../../event-ui/src/config/event-visibility.json';

/**
 * Validation errors
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * EventValidator - Validates event data before database operations
 */
export class EventValidator {
  private static validStatusIds = new Set(eventStatuses.map((s) => s.id));
  private static validCategoryIds = new Set(eventCategories.map((c) => c.id));
  private static validVisibilityIds = new Set(eventVisibility.map((v) => v.id));

  /**
   * Validate event creation payload
   */
  static validateCreate(event: Partial<Event>): void {
    // Required fields
    if (!event.title || event.title.trim().length === 0) {
      throw new ValidationError('Title is required', 'title');
    }
    if (event.title.length > 200) {
      throw new ValidationError('Title must be 200 characters or less', 'title');
    }

    if (!event.eventDate) {
      throw new ValidationError('Event date is required', 'eventDate');
    }

    if (!event.startAt) {
      throw new ValidationError('Start time is required', 'startAt');
    }

    if (!event.shortDescription || event.shortDescription.trim().length === 0) {
      throw new ValidationError('Short description is required', 'shortDescription');
    }

    if (!event.description || event.description.trim().length === 0) {
      throw new ValidationError('Description is required', 'description');
    }

    if (!event.organizerName || event.organizerName.trim().length === 0) {
      throw new ValidationError('Organizer name is required', 'organizerName');
    }

    // Validate enum IDs
    if (!event.statusId) {
      throw new ValidationError('Status is required', 'statusId');
    }
    if (!this.validStatusIds.has(event.statusId)) {
      throw new ValidationError(
        `Invalid status ID. Must be one of: ${Array.from(this.validStatusIds).join(', ')}`,
        'statusId'
      );
    }

    if (!event.categoryId) {
      throw new ValidationError('Category is required', 'categoryId');
    }
    if (!this.validCategoryIds.has(event.categoryId)) {
      throw new ValidationError(
        `Invalid category ID. Must be one of: ${Array.from(this.validCategoryIds).join(', ')}`,
        'categoryId'
      );
    }

    if (!event.visibilityId) {
      throw new ValidationError('Visibility is required', 'visibilityId');
    }
    if (!this.validVisibilityIds.has(event.visibilityId)) {
      throw new ValidationError(
        `Invalid visibility ID. Must be one of: ${Array.from(this.validVisibilityIds).join(', ')}`,
        'visibilityId'
      );
    }

    // Validate dates
    this.validateDates(event.eventDate, event.startAt, event.endAt);

    // Validate ratings if provided
    if (event.ratingAverage !== undefined) {
      if (event.ratingAverage < 0 || event.ratingAverage > 5) {
        throw new ValidationError('Rating average must be between 0 and 5', 'ratingAverage');
      }
    }

    if (event.ratingCount !== undefined) {
      if (event.ratingCount < 0) {
        throw new ValidationError('Rating count cannot be negative', 'ratingCount');
      }
    }
  }

  /**
   * Validate event update payload
   */
  static validateUpdate(updates: Partial<Event>): void {
    // Only validate provided fields
    if (updates.title !== undefined) {
      if (updates.title.trim().length === 0) {
        throw new ValidationError('Title cannot be empty', 'title');
      }
      if (updates.title.length > 200) {
        throw new ValidationError('Title must be 200 characters or less', 'title');
      }
    }

    if (updates.statusId !== undefined && !this.validStatusIds.has(updates.statusId)) {
      throw new ValidationError(
        `Invalid status ID. Must be one of: ${Array.from(this.validStatusIds).join(', ')}`,
        'statusId'
      );
    }

    if (updates.categoryId !== undefined && !this.validCategoryIds.has(updates.categoryId)) {
      throw new ValidationError(
        `Invalid category ID. Must be one of: ${Array.from(this.validCategoryIds).join(', ')}`,
        'categoryId'
      );
    }

    if (updates.visibilityId !== undefined && !this.validVisibilityIds.has(updates.visibilityId)) {
      throw new ValidationError(
        `Invalid visibility ID. Must be one of: ${Array.from(this.validVisibilityIds).join(', ')}`,
        'visibilityId'
      );
    }

    if (updates.eventDate || updates.startAt || updates.endAt) {
      // If any date field is being updated, validate the combination
      this.validateDates(updates.eventDate, updates.startAt, updates.endAt);
    }

    if (updates.ratingAverage !== undefined) {
      if (updates.ratingAverage < 0 || updates.ratingAverage > 5) {
        throw new ValidationError('Rating average must be between 0 and 5', 'ratingAverage');
      }
    }

    if (updates.ratingCount !== undefined) {
      if (updates.ratingCount < 0) {
        throw new ValidationError('Rating count cannot be negative', 'ratingCount');
      }
    }
  }

  /**
   * Validate date fields
   */
  private static validateDates(eventDate?: string, startAt?: string, endAt?: string): void {
    if (eventDate) {
      const date = new Date(eventDate);
      if (isNaN(date.getTime())) {
        throw new ValidationError('Invalid event date format', 'eventDate');
      }
    }

    if (startAt) {
      const start = new Date(startAt);
      if (isNaN(start.getTime())) {
        throw new ValidationError('Invalid start time format', 'startAt');
      }
    }

    if (endAt) {
      const end = new Date(endAt);
      if (isNaN(end.getTime())) {
        throw new ValidationError('Invalid end time format', 'endAt');
      }

      if (startAt) {
        const start = new Date(startAt);
        if (end <= start) {
          throw new ValidationError('End time must be after start time', 'endAt');
        }
      }
    }
  }

  /**
   * Check if status ID is valid
   */
  static isValidStatusId(statusId: string): boolean {
    return this.validStatusIds.has(statusId);
  }

  /**
   * Check if category ID is valid
   */
  static isValidCategoryId(categoryId: string): boolean {
    return this.validCategoryIds.has(categoryId);
  }

  /**
   * Check if visibility ID is valid
   */
  static isValidVisibilityId(visibilityId: string): boolean {
    return this.validVisibilityIds.has(visibilityId);
  }
}
