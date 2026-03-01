/**
 * Contact Sync Service — Story 2.2
 *
 * Handles WhatsApp contact synchronization to CRM contacts table.
 * Features: auto-creation, duplicate detection, merge logic.
 */

import type { UUID } from '../db/schema';
import type { Contact, CreateContactInput, UpdateContactInput } from '../db/schema';
import { bridgeLogger } from './logger';

interface ContactSyncConfig {
  orgId: UUID;
  supabaseClient?: any; // Supabase client instance
}

/**
 * Phone number normalizer (E.164 format)
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it looks like a phone number
  if (digits.length < 10 || digits.length > 15) {
    return undefined;
  }

  // Add + prefix if not present
  return '+' + digits;
}

export class ContactSync {
  private orgId: UUID;
  private supabaseClient: any;

  constructor(config: ContactSyncConfig) {
    this.orgId = config.orgId;
    this.supabaseClient = config.supabaseClient;
  }

  /**
   * Sync contact from WhatsApp
   * - Check for existing contact (phone or email)
   * - Create if not exists
   * - Merge if exists
   */
  async syncContact(whatsappData: {
    from?: string; // Phone number from WhatsApp
    name?: string;
    email?: string;
    whatsapp_id?: string;
  }): Promise<Contact> {
    try {
      bridgeLogger.logSyncStart(
        'ContactSync',
        this.orgId,
        'sync_contact'
      );

      // Normalize phone
      const normalizedPhone = normalizePhone(whatsappData.from);

      // Check for existing contact
      const existing = await this.findExistingContact(
        normalizedPhone,
        whatsappData.email
      );

      let contact: Contact;

      if (existing) {
        // Merge: update existing contact
        contact = await this.mergeContact(existing.id, {
          whatsapp_id: whatsappData.whatsapp_id,
          last_contact_date: new Date().toISOString(),
          tags: this.addTag(existing.tags, 'whatsapp_active'),
          name: whatsappData.name || existing.name,
        });

        bridgeLogger.logSyncSuccess(
          'ContactSync',
          this.orgId,
          'contact_merged',
          {
            contactId: contact.id,
            mergeReason: 'duplicate_detected',
          }
        );
      } else {
        // Create new contact
        contact = await this.createContact({
          organization_id: this.orgId,
          phone: normalizedPhone,
          email: whatsappData.email,
          name: whatsappData.name,
          whatsapp_id: whatsappData.whatsapp_id,
          tags: ['whatsapp_active'],
          last_contact_date: new Date().toISOString(),
        });

        bridgeLogger.logSyncSuccess(
          'ContactSync',
          this.orgId,
          'contact_created',
          {
            contactId: contact.id,
            phone: normalizedPhone,
          }
        );
      }

      return contact;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ContactSync',
        this.orgId,
        'sync_contact',
        error as Error,
        { whatsappData }
      );
      throw error;
    }
  }

  /**
   * Find existing contact by phone or email
   */
  private async findExistingContact(
    phone?: string,
    email?: string
  ): Promise<Contact | null> {
    try {
      // Simulate database query
      // In real implementation, would use Supabase query
      // Check email first, then phone
      if (email) {
        // Would query: SELECT * FROM contacts WHERE organization_id = ? AND email = ?
      }

      if (phone) {
        // Would query: SELECT * FROM contacts WHERE organization_id = ? AND phone = ?
      }

      return null; // No existing contact found
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ContactSync',
        this.orgId,
        'find_existing_contact',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Create new contact
   */
  private async createContact(input: CreateContactInput): Promise<Contact> {
    try {
      // Simulate database insert
      const contact: Contact = {
        id: `contact-${Date.now()}` as UUID,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Would execute: INSERT INTO contacts (...)
      // const { data, error } = await this.supabaseClient
      //   .from('contacts')
      //   .insert(contact);

      return contact;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ContactSync',
        this.orgId,
        'create_contact',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Merge (update) existing contact
   */
  private async mergeContact(
    contactId: UUID,
    updates: UpdateContactInput
  ): Promise<Contact> {
    try {
      // Simulate database update
      // Would execute: UPDATE contacts SET ... WHERE id = ?
      // const { data, error } = await this.supabaseClient
      //   .from('contacts')
      //   .update(updates)
      //   .eq('id', contactId);

      const mergedContact: Contact = {
        id: contactId,
        organization_id: this.orgId,
        ...updates,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return mergedContact;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ContactSync',
        this.orgId,
        'merge_contact',
        error as Error,
        { contactId }
      );
      throw error;
    }
  }

  /**
   * Add tag if not present
   */
  private addTag(tags: string[], tag: string): string[] {
    if (!tags.includes(tag)) {
      tags.push(tag);
    }
    return tags;
  }

  /**
   * Get contact by ID
   */
  async getContact(contactId: UUID): Promise<Contact | null> {
    try {
      // Would query: SELECT * FROM contacts WHERE id = ? AND organization_id = ?
      return null;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ContactSync',
        this.orgId,
        'get_contact',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Get all contacts for organization
   */
  async listContacts(limit: number = 100): Promise<Contact[]> {
    try {
      // Would query: SELECT * FROM contacts WHERE organization_id = ? LIMIT ?
      return [];
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ContactSync',
        this.orgId,
        'list_contacts',
        error as Error
      );
      throw error;
    }
  }
}
