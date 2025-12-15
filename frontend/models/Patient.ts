import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class Patient extends Model {
  static table = 'patients';

  static associations = {
    clinical_notes: { type: 'has_many', foreignKey: 'patient_id' },
  };

  @field('patient_id') patientId;
  @text('name') name;
  @text('phone') phone;
  @text('email') email;
  @text('address') address;
  @text('location') location;
  @text('initial_complaint') initialComplaint;
  @text('initial_diagnosis') initialDiagnosis;
  @text('photo') photo;
  @text('group') group;
  @field('is_favorite') isFavorite;
  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @relation('clinical_notes', 'patient_id') notes;
}