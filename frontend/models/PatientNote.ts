import { Model } from '@nozbe/watermelondb';
import { field, text, readonly, date, relation } from '@nozbe/watermelondb/decorators';

export default class PatientNote extends Model {
  static table = 'patient_notes';

  static associations = {
    patients: { type: 'belongs_to', key: 'patient_id' },
  };

  @field('patient_id') patientId!: string;
  @text('content') content!: string;
  @date('timestamp') timestamp!: Date;
  @text('visit_type') visitType!: string;
  @text('created_by') createdBy!: string;

  @relation('patients', 'patient_id') patient;
}